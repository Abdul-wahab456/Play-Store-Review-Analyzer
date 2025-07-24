import React, { createContext, useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import CustomNavbar from './components/Main_Page/Navbar';
import MainContent from './components/Main_Page/MainContent';
import Footer from './components/Main_Page/Footer';
import CardPayment from './components/Card_Payment/CardPayment';
import PaymentSuccess from './components/Card_Payment/PaymentSuccess';
import AddSources from './components/Add_sources/AddSources';
import Dashboard from './components/Main_Dashboard/Dashboard';
import SentimentAnalysis from './components/Sentiment_Analysis/SentimentAnalysis';
import FeatureIdentification from './components/Feature_Identification/feature-identification';
import CompetitorAnalysis from './components/Competitor_Analysis/CompetitorAnalysis';
import LoadingSpinner from './components/Common/LoadingSpinner'; // Create this component
import ErrorBoundary from './components/Common/ErrorBoundary'; // Create this component
import './App.css';

// Create context for global state
const AppContext = createContext();

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New feature request', read: false },
    { id: 2, title: 'Bug report', read: false },
    { id: 3, title: 'System update', read: true }
  ]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize dark mode from localStorage FIRST
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      const isDark = JSON.parse(savedMode);
      setDarkMode(isDark);
      document.body.classList.toggle('dark-mode', isDark);
    }
  }, []);

  // Check auth status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status', { credentials: 'include' });
        setIsAuthenticated(response.ok);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.body.classList.toggle('dark-mode', newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    console.log('Dark mode toggled to:', newMode); // Debug log
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Update body class whenever darkMode changes
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <AppContext.Provider value={{ 
      darkMode, 
      toggleDarkMode, 
      notifications, 
      markAllAsRead,
      isAuthenticated,
      setIsAuthenticated
    }}>
      <Router>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Router>
    </AppContext.Provider>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, isAuthenticated } = useContext(AppContext);
  const [showNavbar, setShowNavbar] = useState(true);

  // Routes where navbar should be hidden
  const noNavbarRoutes = [
    '/card-payment',
    '/payment-success',
    '/add-sources',
    '/dashboard',
    '/sentiment-analysis',
    '/feature-identification',
    '/competitor-analysis'
  ];

  // Check auth state on route change
  useEffect(() => {
    const protectedRoutes = ['/dashboard', '/add-sources', '/sentiment-analysis', '/feature-identification', '/competitor-analysis'];
    if (protectedRoutes.includes(location.pathname) && !isAuthenticated) {
      navigate('/');
    }
    setShowNavbar(!noNavbarRoutes.includes(location.pathname));
  }, [location, isAuthenticated, navigate]);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      {showNavbar && <CustomNavbar />}
      <Routes>
        <Route path="/" element={
          <>
            <MainContent />
            <Footer />
          </>
        } />
        <Route path="/card-payment" element={<CardPayment />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/add-sources" element={
          <ProtectedRoute>
            <AddSources />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/feature-identification" element={
          <ProtectedRoute>
            <FeatureIdentification />
          </ProtectedRoute>
        } />
        <Route path="/competitor-analysis" element={
          <ProtectedRoute>
            <CompetitorAnalysis />
          </ProtectedRoute>
        } />
        <Route path="/sentiment-analysis" element={
          <ProtectedRoute>
            <SentimentAnalysis />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

// Protected route component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
}

// Export the context to be used in other components
export { AppContext };
export default App;