import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Form, Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { FiSearch, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import config, { buildURL } from '../Modals/api';
import Logo from './Logo.png';
import './AddSources.css';

// Helper function to generate consistent colors for placeholders
const getPlaceholderColor = (appName) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];
  
  // Generate a consistent index based on app name
  const charSum = appName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charSum % colors.length];
};

const AddSources = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // NEW: Get context from navigation state
  const selectionContext = location.state?.selectionContext || 'myApp'; // 'myApp' or 'competitor'
  const returnPage = location.state?.returnPage || '/dashboard';
  const existingApps = location.state?.selectedApps || [];

  // Payment verification
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Check if payment was already marked successful
        const paymentStatus = localStorage.getItem('paymentSuccessful');
        if (paymentStatus === 'true') {
          setPaymentVerified(true);
          setIsVerifyingPayment(false);
          return;
        }

        // If not, verify with backend
        const response = await fetch(buildURL(config.endpoints.PAYMENT_STATUS), {
          credentials: 'include'
        });

        if (response.ok) {
          const { payment_successful } = await response.json();
          setPaymentVerified(payment_successful);
          if (payment_successful) {
            localStorage.setItem('paymentSuccessful', 'true');
          } else {
            setError('Payment verification failed. Please complete payment.');
            setTimeout(() => navigate('/card-payment'), 2000);
          }
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (err) {
        console.error('Payment check error:', err);
        setError('Payment verification failed. Redirecting...');
        setTimeout(() => navigate('/card-payment'), 2000);
      } finally {
        setIsVerifyingPayment(false);
      }
    };

    checkPaymentStatus();
  }, [navigate]);

  // Get CSRF token helper function
  const getCSRFToken = () => {
    // Try to get CSRF token from cookie
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
      
    return cookieValue || '';
  };

  // Fetch CSRF token from server
  const fetchCSRFToken = async () => {
    try {
      const response = await fetch(buildURL(config.endpoints.CSRF), {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get token from both possible locations
      const token = response.headers.get('X-CSRFToken') || 
                  document.cookie.match(/csrftoken=([^;]+)/)?.[1];

      if (!token) {
        throw new Error('CSRF token not found in headers or cookies');
      }
        
      return token;
    } catch (error) {
      console.error('CSRF token error:', error);
      throw new Error('Failed to establish secure connection');
    }
  };

  // Handle search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    if (!query) {
      setError('Please enter an app name');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Build search URL with query parameters
      const searchUrl = `${buildURL(config.endpoints.PLAYSTORE_SEARCH)}?q=${encodeURIComponent(query)}&_=${Date.now()}`;
      
      const response = await fetch(searchUrl, {
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Search request failed');
      }

      const results = await response.json();
      
      // Debug logging to see what we're getting
      console.log('Search results:', results);
      
      // Log icon information for each app
      results.forEach((app, index) => {
        console.log(`App ${index + 1}: ${app.name}`);
        console.log(`- ID: ${app.id}`);
        console.log(`- Publisher: ${app.publisher}`);
        console.log(`- Icon: ${app.icon || 'NO ICON'}`);
        console.log(`- Icon URL valid: ${!!(app.icon && app.icon.trim() !== '')}`);
      });
      
      setSearchResults(results || []);
      
      if (results.length === 0) {
        setError('No apps found. Try a different search term.');
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message.includes('Failed to fetch') 
        ? 'Network error - check backend server'
        : 'Search temporarily unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATED: Handle adding/removing apps with context awareness
  const handleAddApp = async (app) => {
    try {
      // Check if this app is already the selected one
      const isCurrentlySelected = selectedApps.length > 0 && selectedApps[0].id === app.id;
      
      if (isCurrentlySelected) {
        // Remove the currently selected app
        setSelectedApps([]);
        
        // For competitor selection, just clear local state (don't need backend for competitors)
        if (selectionContext === 'competitor') {
          return;
        }

        // For myApp selection, remove from backend as well
        try {
          const csrfToken = await fetchCSRFToken();
          await fetch(buildURL(config.endpoints.USER_APPS), {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
              appId: app.id
            })
          });
        } catch (deleteError) {
          console.log('Note: Could not remove app from backend:', deleteError);
        }
        
        return;
      }

      // Log what we're doing
      if (selectedApps.length > 0) {
        console.log(`Replacing ${selectedApps[0].name} with ${app.name} (context: ${selectionContext})`);
      } else {
        console.log(`Selecting ${app.name} as ${selectionContext === 'competitor' ? 'competitor' : 'main app'}`);
      }

      // For competitor selection, we don't need to save to backend - just update local state
      if (selectionContext === 'competitor') {
        setSelectedApps([app]);
        console.log('Competitor app selected locally');
        return;
      }

      // For myApp selection, save to backend
      const csrfToken = await fetchCSRFToken();

      const response = await fetch(buildURL(config.endpoints.USER_APPS), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
          appId: app.id,
          name: app.name,
          icon: app.icon,
          publisher: app.publisher,
          replace_previous: true // ALWAYS replace to ensure single app selection
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If it's a "already exists" error, try to force replace by deleting first
        if (errorData.error && errorData.error.includes('already exists')) {
          console.log('App already exists, trying to delete all and re-add...');
          
          // First delete all existing apps
          try {
            // Try to delete the specific app first
            if (selectedApps.length > 0) {
              await fetch(buildURL(config.endpoints.USER_APPS), {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                  appId: selectedApps[0].id
                })
              });
            }
            
            // Also try to delete the current app if it exists
            await fetch(buildURL(config.endpoints.USER_APPS), {
              method: 'DELETE',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
              },
              body: JSON.stringify({
                appId: app.id
              })
            });
            
            // Now try to add the new app again
            const retryResponse = await fetch(buildURL(config.endpoints.USER_APPS), {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
              },
              body: JSON.stringify({
                appId: app.id,
                name: app.name,
                icon: app.icon,
                publisher: app.publisher,
                replace_previous: true
              })
            });
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}));
              throw new Error(retryErrorData.error || retryErrorData.message || 'Failed to add app after retry');
            }
            
            console.log('Successfully added app after retry');
            
          } catch (retryError) {
            throw new Error(`Failed to replace app: ${retryError.message}`);
          }
        } else {
          throw new Error(errorData.error || errorData.message || 'Failed to save app');
        }
      }

      console.log('App saved successfully');

      // Update UI state - replace the array with just this one app
      setSelectedApps([app]);
      
    } catch (err) {
      console.error('Add app error:', err);
      
      if (err.message.includes('Login required') || 
          err.message.includes('CSRF') ||
          err.message.includes('Authentication')) {
        // Force full page reload to reset auth state
        window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
      } else {
        setError(`Failed to select ${app.name}: ${err.message}`);
        // Clear the error after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  // UPDATED: Handle finishing with proper context and navigation
  const handleFinish = async () => {
    if (selectedApps.length === 0) {
      setError('Please select an app');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const selectedApp = selectedApps[0];
      
      if (selectionContext === 'competitor') {
        // For competitor selection, save to localStorage and navigate back to competitor analysis
        localStorage.setItem('selectedCompetitor', selectedApp.name);
        
        // Create state for competitor analysis with both existing apps and new competitor
        const navigationState = {
          selectedApps: existingApps, // Keep existing "My App" data
          selectedApp: existingApps[0]?.name || 'My App',
          competitorSelected: true,
          competitorApp: {
            id: selectedApp.id,
            name: selectedApp.name,
            publisher: selectedApp.publisher,
            icon: selectedApp.icon || '🏆'
          },
          message: `Successfully selected ${selectedApp.name} as competitor!`
        };
        
        console.log('Navigating back to competitor analysis with state:', navigationState);
        navigate('/competitor-analysis', { state: navigationState });
        
      } else {
        // For myApp selection, navigate to dashboard with selected app data
        navigate('/dashboard', {
          state: { 
            success: true,
            message: `Successfully selected ${selectedApp.name}!`,
            selectedApps: [{
              id: selectedApp.id,
              name: selectedApp.name,
              publisher: selectedApp.publisher,
              icon: selectedApp.icon || '📱'
            }]
          }
        });
      }
      
    } catch (err) {
      console.error('Navigation error:', err);
      setError('Failed to navigate back');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state during initial verification
  if (isVerifyingPayment) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Checking payment status...</p>
      </Container>
    );
  }

  // Show error state if verification failed but navigation didn't occur
  if (!paymentVerified && error) {
    return (
      <Container className="text-center py-5">
        <Alert variant="danger">
          <Alert.Heading>Subscription Required</Alert.Heading>
          <p>{error}</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/card-payment')}
          >
            Complete Payment
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="add-sources-container">
      {/* Header Section */}
      <Row className="header-section align-items-center">
        <Col xs={6} className="d-flex align-items-center">
          <img 
            src={Logo} 
            alt="Smart Upgrades Logo" 
            className="brand-logo"
          />
          <h1 className="brand-title mb-0">Smart Upgrades</h1>
        </Col>
        <Col xs={6} className="text-end">
          <Button 
            variant="success" 
            onClick={handleFinish}
            className="finish-button"
            disabled={selectedApps.length === 0 || isLoading}
          >
            <FiCheck className="me-1" /> 
            {selectedApps.length > 0 
              ? `Finish with ${selectedApps[0].name}` 
              : `Select ${selectionContext === 'competitor' ? 'Competitor' : 'an App'}`
            }
          </Button>
        </Col>
      </Row>

      {/* Main Content */}
      <Row className="justify-content-center main-content">
        <Col md={10} lg={8}>
          <Card className="search-card shadow">
            <Card.Body>
              <h2 className="search-title mb-3">
                {selectionContext === 'competitor' ? 'Select Competitor App' : 'Add App Sources'}
              </h2>
              <p className="text-muted text-center mb-4">
                {selectionContext === 'competitor' 
                  ? 'Search for a competitor app to compare against your app'
                  : 'Search for Google Play apps to monitor reviews and ratings'
                }
              </p>

              {error && (
                <Alert 
                  variant="danger" 
                  className="mb-4"
                  dismissible
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSearch} className="search-form">
                <div className="search-input-group">
                  <FiSearch className="search-icon" />
                  <Form.Control
                    type="text"
                    placeholder={
                      selectionContext === 'competitor' 
                        ? "Enter competitor app name..." 
                        : "Enter app or publisher name..."
                    }
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setError(null);
                    }}
                    className="search-input"
                  />
                  {searchQuery && (
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setError(null);
                      }}
                      className="clear-search"
                    >
                      <FiX />
                    </Button>
                  )}
                </div>
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="search-button"
                  disabled={!searchQuery.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </Form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="search-results">
                  <h5 className="results-title">Search Results ({searchResults.length})</h5>
                  <div className="search-results-container">
                    {searchResults.map((app) => (
                      <Card key={app.id} className="result-card mb-2">
                        <Card.Body className="py-2">
                          <Row className="align-items-center">
                            <Col xs={1}>
                              <div className="app-icon-container">
                                {app.icon && app.icon !== '' && app.icon !== 'null' && !app.icon.includes('via.placeholder') ? (
                                  <img 
                                    src={app.icon} 
                                    alt={app.name}
                                    className="app-icon"
                                    onError={(e) => {
                                      console.log(`Failed to load icon for ${app.name}: ${app.icon}`);
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                    onLoad={(e) => {
                                      console.log(`Successfully loaded icon for ${app.name}`);
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="app-icon-placeholder" 
                                  style={{ 
                                    display: (!app.icon || app.icon === '' || app.icon === 'null' || app.icon.includes('via.placeholder')) ? 'flex' : 'none',
                                    background: getPlaceholderColor(app.name)
                                  }}
                                >
                                  {app.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                            </Col>
                            <Col xs={7}>
                              <h6 className="app-name mb-1">{app.name}</h6>
                              <p className="app-publisher mb-0">{app.publisher}</p>
                              <small className="text-muted">{app.id}</small>
                            </Col>
                            <Col xs={4} className="text-end">
                              <Button 
                                variant={
                                  selectedApps.length > 0 && selectedApps[0].id === app.id 
                                    ? 'success' 
                                    : 'outline-primary'
                                }
                                size="sm"
                                onClick={() => handleAddApp(app)}
                                disabled={isLoading}
                              >
                                <FiPlus className="me-1" />
                                {selectedApps.length > 0 && selectedApps[0].id === app.id 
                                  ? 'Selected' 
                                  : selectedApps.length > 0 
                                    ? 'Select' 
                                    : 'Add'
                                }
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Apps Summary */}
              {selectedApps.length > 0 && (
                <div className="mt-4 p-3 bg-light rounded">
                  <h6 className="text-success">
                    <FiCheck className="me-2" />
                    Selected {selectionContext === 'competitor' ? 'Competitor' : 'App'}: {selectedApps[0].name}
                  </h6>
                  <div className="d-flex align-items-center mt-2">
                    <div className="app-icon-container me-2">
                      {selectedApps[0].icon && selectedApps[0].icon !== '' && selectedApps[0].icon !== 'null' && !selectedApps[0].icon.includes('via.placeholder') ? (
                        <img 
                          src={selectedApps[0].icon} 
                          alt={selectedApps[0].name}
                          className="app-icon"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="app-icon-placeholder" 
                        style={{ 
                          display: (!selectedApps[0].icon || selectedApps[0].icon === '' || selectedApps[0].icon === 'null' || selectedApps[0].icon.includes('via.placeholder')) ? 'flex' : 'none',
                          background: getPlaceholderColor(selectedApps[0].name)
                        }}
                      >
                        {selectedApps[0].name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <strong>{selectedApps[0].name}</strong>
                      <br />
                      <small className="text-muted">{selectedApps[0].publisher}</small>
                    </div>
                  </div>
                  <small className="text-muted mt-2 d-block">
                    💡 {selectionContext === 'competitor' 
                      ? 'This app will be used for competitor comparison'
                      : 'Selecting a different app will replace your current selection'
                    }
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddSources;