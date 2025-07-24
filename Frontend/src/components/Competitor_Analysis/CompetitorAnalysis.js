import { useState, useEffect } from 'react';
import { AppContext } from '../../App';
import { useContext } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Dropdown, 
  Badge, Stack, ListGroup, Overlay, Popover ,Alert
} from 'react-bootstrap';
import { 
  FiSun, FiMoon, FiBell, FiUser, FiHome, FiSmile, 
  FiTag, FiBarChart2, FiPlus, FiTrendingUp, FiLogOut, FiX, FiChevronDown,FiCheck
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import './CompetitorAnalysis.css';

const CompetitorAnalysis = () => {
  const { darkMode, toggleDarkMode } = useContext(AppContext);
  const [target, setTarget] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current route
  const activeTab = location.pathname.split('/')[1] || 'dashboard';

  // Selected apps state - My App comes from Dashboard, Competitor A is selected here
  const [selectedApps, setSelectedApps] = useState([
    { 
      id: 1, 
      name: 'My App', 
      publisher: 'My Company', 
      icon: 'https://play-lh.googleusercontent.com/PCpXdqvUWfCW1mXhH1Y_98yBpgsWxuTSjjz5-h_kTDYnn4KIulG_wg7y3vdNNxQc5A' 
    },
    { 
      id: 2, 
      name: 'Premium App', 
      publisher: 'Test Company', 
      icon: 'https://play-lh.googleusercontent.com/9ASiwrOdFitngzWErJZP0CszlPdITUdOCvBXgi3N1b2hTrZpHlh0DfK-zs5IQNvCGX4'
    }
  ]);
  
  const [myApp, setMyApp] = useState('My App');
  const [competitorA, setCompetitorA] = useState(''); // Will be selected from available apps

  // Available apps for competitor selection (excluding My App)
  const [availableCompetitors, setAvailableCompetitors] = useState([

    { 
      id: 5, 
      name: 'None', 
      publisher: 'Signal Foundation', 
      icon: 'https://play-lh.googleusercontent.com/jCln_XT8Rh-X9fnJZp_NLQsqlQ4g-fTYV_Wt1F5P7_Lr2-6f-YD_LePtBqGp4s0ZmIw'
    }
  ]);

  // Load selected apps and competitor on component mount
  useEffect(() => {
    // Load My App from localStorage (set from Dashboard)
    const savedApps = localStorage.getItem('selectedApps');
    const savedSelectedApp = localStorage.getItem('selectedApp');
    
    // Load saved competitor selection
    const savedCompetitor = localStorage.getItem('selectedCompetitor');
    
    // If apps are passed via navigation state, use those
    if (location.state?.selectedApps && location.state.selectedApps.length > 0) {
      setSelectedApps(location.state.selectedApps);
      if (location.state.selectedApp) {
        setMyApp(location.state.selectedApp);
      }
      console.log('Loaded apps from navigation state');
    }
    // Otherwise, try to load from localStorage
    else if (savedApps) {
      try {
        const parsedApps = JSON.parse(savedApps);
        setSelectedApps(parsedApps);
        if (savedSelectedApp) {
          setMyApp(savedSelectedApp);
        }
        console.log('Loaded apps from localStorage');
      } catch (error) {
        console.error('Error loading saved apps:', error);
      }
    }

    // Handle competitor selection from AddSources return
    if (location.state?.competitorSelected && location.state?.competitorApp) {
      const competitor = location.state.competitorApp;
      setCompetitorA(competitor.name);
      
      // Add to available competitors if not already there
      setAvailableCompetitors(prev => {
        const exists = prev.find(app => app.id === competitor.id);
        if (!exists) {
          return [...prev, competitor];
        }
        return prev;
      });
      
      console.log('Loaded competitor from AddSources:', competitor);
    }
    // Load competitor selection from localStorage
    else if (savedCompetitor) {
      setCompetitorA(savedCompetitor);
    }
  }, [location.state]);

  // Function to navigate with app data
  const navigateWithApps = (path) => {
    navigate(path, {
      state: {
        selectedApps: selectedApps,
        selectedApp: myApp
      }
    });
  };

  // Function to get current app details
  const getCurrentApp = () => {
    return selectedApps.find(app => app.name === myApp) || selectedApps[0];
  };

  // Function to get competitor app details
  const getCompetitorApp = () => {
    return availableCompetitors.find(app => app.name === competitorA);
  };

  // Function to render app icon (handles both URLs and emojis)
  const renderAppIcon = (iconSrc, appName, size = '32px') => {
    if (!iconSrc) return <div className="app-icon-placeholder" style={{ width: size, height: size }}>📱</div>;
    
    // Check if it's a URL
    if (typeof iconSrc === 'string' && (iconSrc.startsWith('http') || iconSrc.startsWith('data:'))) {
      return (
        <img 
          src={iconSrc} 
          alt={`${appName} icon`}
          className="app-icon-image"
          style={{ 
            width: size, 
            height: size, 
            borderRadius: '8px',
            objectFit: 'cover',
            backgroundColor: '#f3f4f6'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    } else {
      // It's an emoji or text
      return <span className="app-icon" style={{ fontSize: '1.5rem' }}>{iconSrc}</span>;
    }
  };

  // Function to handle competitor selection
  const handleCompetitorSelect = (competitorName) => {
    setCompetitorA(competitorName);
    localStorage.setItem('selectedCompetitor', competitorName);
  };


  // Updated competitor data (removed Competitor B)
  const competitorData = {
    ratingComparison: [
      { name: myApp, rating: 4.5 },
      { name: competitorA || 'Competitor A', rating: 4.2 }
    ],
    featureComparison: [
      { feature: 'Dark Mode', myApp: true, competitorA: true },
      { feature: 'Offline Support', myApp: true, competitorA: false },
      { feature: 'Export Data', myApp: true, competitorA: true },
      { feature: 'AI Features', myApp: false, competitorA: true },
      { feature: 'Cloud Sync', myApp: true, competitorA: false }
    ],
    downloadTrends: [
      { month: 'Jan', myApp: 1200, competitorA: 1800 },
      { month: 'Feb', myApp: 1900, competitorA: 2100 },
      { month: 'Mar', myApp: 2100, competitorA: 1900 },
      { month: 'Apr', myApp: 2400, competitorA: 2200 },
      { month: 'May', myApp: 2600, competitorA: 2300 },
      { month: 'Jun', myApp: 2800, competitorA: 2400 }
    ]
  };

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('selectedApps');
    localStorage.removeItem('selectedApp');
    localStorage.removeItem('selectedCompetitor');
    navigate('/');
  };

  const navigateToAddSources = () => {
    // Pass context to AddSources about what we're selecting
    navigate('/add-sources', {
      state: {
        selectionContext: 'competitor', // Indicate we're selecting a competitor
        returnPage: '/competitor-analysis',
        selectedApps: selectedApps, // Pass existing app data
        selectedApp: myApp
      }
    });
  };

  return (
    <Container fluid className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Top Navigation Bar */}
      <Row className="top-navbar align-items-center">
        <Col className="d-flex justify-content-between align-items-center py-3">
          <div className="d-flex align-items-center">
            <h4 className="mb-0 brand-title">
              <FiTrendingUp className="me-2" />
              Competitor Analysis Dashboard
            </h4>
          </div>
          <Stack direction="horizontal" gap={3}>
            <Button 
              variant="link" 
              onClick={toggleDarkMode} 
              className="nav-icon"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </Button>

            {/* User Dropdown */}
            <Dropdown>
              <Dropdown.Toggle variant="link" className="nav-icon p-0">
                <FiUser />
              </Dropdown.Toggle>
              <Dropdown.Menu className={darkMode ? 'dropdown-menu-dark' : ''}>
                <Dropdown.Item>Profile</Dropdown.Item>
                <Dropdown.Item>Settings</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FiLogOut className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Stack>
        </Col>
      </Row>

      <Row className="g-0">
        {/* Sidebar */}
        <Col md={3} className="sidebar py-3">
          <nav className="d-flex flex-column">
            <Button 
              variant={activeTab === 'dashboard' ? 'primary' : 'light'} 
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigateWithApps('/dashboard')}
            >
              <FiHome className="me-2" /> Dashboard
            </Button>
            <Button 
              variant={activeTab === 'sentiment-analysis' ? 'primary' : 'light'} 
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigateWithApps('/sentiment-analysis')}
            >
              <FiSmile className="me-2" /> Sentiment Analysis
            </Button>
            <Button 
              variant={activeTab === 'feature-identification' ? 'primary' : 'light'} 
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigateWithApps('/feature-identification')}
            >
              <FiTag className="me-2" /> Feature Identification
            </Button>
            <Button 
              variant={activeTab === 'competitor-analysis' ? 'primary' : 'light'} 
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigateWithApps('/competitor-analysis')}
            >
              <FiBarChart2 className="me-2" /> Competitor Analysis
            </Button>
          </nav>
        </Col>

        {/* Main Content */}
        <Col md={9} className="main-content py-3 px-4">
          {/* Show success message if competitor was just selected */}
          {location.state?.message && (
            <Row className="mb-3">
              <Col>
                <Alert variant="success" dismissible>
                  <FiCheck className="me-2" />
                  {location.state.message}
                </Alert>
              </Col>
            </Row>
          )}

          {/* Beautiful App Selection Interface */}
          <Row className="mb-4">
            <Col>
              <Card className={`app-selection-card shadow-sm ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
                <Card.Body className="py-3 px-4">
                  <Row className="g-3">
                    {/* My App Display */}
                    <Col lg={5}>
                      <div className="app-display-section">
                        <h6 className={`section-title mb-2 ${darkMode ? 'text-light' : 'text-muted'}`}>
                          My App
                        </h6>
                        <div className={`selected-app-display ${darkMode ? 'bg-secondary' : 'bg-light'}`}>
                          <div className="app-info">
                            <div className="app-icon-container me-2">
                              {renderAppIcon(getCurrentApp()?.icon, getCurrentApp()?.name)}
                              <div className="app-icon-fallback" style={{ display: 'none', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                📱
                              </div>
                            </div>
                            <div>
                              <div className="app-name">{getCurrentApp()?.name}</div>
                              <small className={`app-publisher ${darkMode ? 'text-muted' : 'text-secondary'}`}>
                                by {getCurrentApp()?.publisher}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>

                    {/* VS Divider */}
                    <Col lg={2} className="d-flex align-items-center justify-content-center">
                      <div className="vs-divider">
                        <Badge bg="primary" className="vs-badge">VS</Badge>
                      </div>
                    </Col>

                    {/* Competitor Selection */}
                    <Col lg={5}>
                      <div className="app-display-section">
                        <h6 className={`section-title mb-2 ${darkMode ? 'text-light' : 'text-muted'}`}>
                          Competitor
                        </h6>
                        <Dropdown className="competitor-dropdown">
                          <Dropdown.Toggle 
                            variant={darkMode ? 'outline-light' : 'outline-primary'} 
                            id="competitor-dropdown"
                            className="competitor-dropdown-toggle w-100"
                          >
                            <div className="dropdown-content">
                              {competitorA ? (
                                <div className="app-info">
                                  <div className="app-icon-container me-2">
                                    {renderAppIcon(getCompetitorApp()?.icon, getCompetitorApp()?.name)}
                                    <div className="app-icon-fallback" style={{ display: 'none', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                      🏆
                                    </div>
                                  </div>
                                  <div className="text-start">
                                    <div className="app-name">{competitorA}</div>
                                    <small className="app-publisher">
                                      by {getCompetitorApp()?.publisher}
                                    </small>
                                  </div>
                                </div>
                              ) : (
                                <span>Select Competitor App</span>
                              )}
                              <FiChevronDown className="dropdown-arrow ms-auto" />
                            </div>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className={`competitor-dropdown-menu ${darkMode ? 'dropdown-menu-dark' : ''}`}>
                            {availableCompetitors.map((app) => (
                              <Dropdown.Item 
                                key={app.id} 
                                active={competitorA === app.name}
                                onClick={() => handleCompetitorSelect(app.name)}
                                className="competitor-dropdown-item"
                              >
                                <div className="app-info">
                                  <div className="app-icon-container me-2">
                                    {renderAppIcon(app.icon, app.name, '28px')}
                                    <div className="app-icon-fallback" style={{ display: 'none', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                      🏆
                                    </div>
                                  </div>
                                  <div>
                                    <div className="app-name">{app.name}</div>
                                    <small className="app-publisher">by {app.publisher}</small>
                                  </div>
                                </div>
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </Col>
                  </Row>

                  {/* Add Sources Button */}
                  <Row className="mt-3">
                    <Col className="text-end">
                      <Button 
                        variant="success" 
                        size="sm"
                        className="d-flex align-items-center ms-auto"
                        onClick={navigateToAddSources}
                        style={{ width: 'fit-content' }}
                      >
                        <FiPlus className="me-1" /> Add Sources
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Rating Comparison Chart */}
          <Row className="mb-4">
            <Col>
              <Card className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
                <Card.Header className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
                  <h5 className="mb-0">Rating Comparison</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={competitorData.ratingComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip 
                        contentStyle={darkMode ? {
                          backgroundColor: '#1e293b',
                          borderColor: '#334155'
                        } : {}} 
                      />
                      <Legend />
                      <Bar dataKey="rating" fill="#8884d8" name="Average Rating" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Feature Comparison Table */}
          <Row className="mb-4">
            <Col>
              <Card className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
                <Card.Header className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
                  <h5 className="mb-0">Feature Comparison</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className={`mb-0 ${darkMode ? 'table-dark' : ''}`} style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }} className={darkMode ? 'text-white' : ''}>Feature</th>
                          <th style={{ width: '30%', textAlign: 'center' }} className={darkMode ? 'text-white' : ''}>
                            {getCurrentApp()?.name}
                          </th>
                          <th style={{ width: '30%', textAlign: 'center' }} className={darkMode ? 'text-white' : ''}>
                            {competitorA || 'Competitor'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitorData.featureComparison.map((feature, index) => (
                          <tr key={index}>
                            <td className={darkMode ? 'text-white' : ''}>{feature.feature}</td>
                            <td style={{ textAlign: 'center' }}>
                              <Badge 
                                bg={feature.myApp ? 'success' : 'secondary'}
                                className="feature-comparison-badge"
                              >
                                {feature.myApp ? '✓ Available' : '✗ Missing'}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <Badge 
                                bg={feature.competitorA ? 'success' : 'secondary'}
                                className="feature-comparison-badge"
                              >
                                {feature.competitorA ? '✓ Available' : '✗ Missing'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Download Trends Chart */}
          <Row>
            <Col>
              <Card className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
                <Card.Header className={darkMode ? 'bg-dark text-white border-secondary' : ''}>
                  <h5 className="mb-0">Download Trends (Last 6 Months)</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={competitorData.downloadTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={darkMode ? {
                          backgroundColor: '#1e293b',
                          borderColor: '#334155'
                        } : {}} 
                      />
                      <Legend />
                      <Bar dataKey="myApp" fill="#8884d8" name={getCurrentApp()?.name || "My App"} />
                      <Bar dataKey="competitorA" fill="#82ca9d" name={competitorA || "Competitor A"} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default CompetitorAnalysis;