import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiX,
  FiArrowRight
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import './SignInModal.css';

// Import the config correctly
import config, { buildURL } from './api';

const SignInModal = ({ show, handleClose, handleShowSignUp }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [csrfReady, setCsrfReady] = useState(false);
  const navigate = useNavigate();

  // Debug logging to check if imports work
  console.log('Config loaded:', config);
  console.log('buildURL function:', buildURL);

  // Helper function to get CSRF token from cookies
  const getCsrfTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        console.log('✅ Found CSRF token in cookie:', value.substring(0, 10) + '...');
        return value;
      }
    }
    console.log('❌ No CSRF token found in cookies');
    console.log('Current cookies:', document.cookie);
    return null;
  };

  // Enhanced CSRF token fetching
  const fetchCsrfToken = async () => {
    try {
      console.log('🔒 Fetching CSRF token...');
      
      // First check if we already have a token in cookies
      let existingToken = getCsrfTokenFromCookie();
      if (existingToken) {
        console.log('✅ Using existing CSRF token from cookie');
        return existingToken;
      }

      // Build the CSRF URL
      const csrfUrl = buildURL(config.endpoints.CSRF);
      console.log('🌐 CSRF URL:', csrfUrl);
      
      const response = await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include', // CRITICAL for cross-origin cookies
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-cache' // Ensure fresh request
      });
      
      console.log('📡 CSRF Response status:', response.status);
      console.log('📋 CSRF Response headers:', [...response.headers.entries()]);
        
      if (!response.ok) {
        throw new Error(`CSRF fetch failed: ${response.status} ${response.statusText}`);
      }

      // Try to get token from response body first
      let token = null;
      try {
        const data = await response.json();
        console.log('📦 CSRF Response data:', data);
        token = data.csrfToken;
      } catch (jsonError) {
        console.log('⚠ Could not parse CSRF response as JSON:', jsonError);
      }

      // If not in body, try response headers
      if (!token) {
        token = response.headers.get('X-CSRFToken');
        console.log('🔍 Token from X-CSRFToken header:', token ? token.substring(0, 10) + '...' : 'none');
      }

      // Wait a moment and check cookies again
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 200));
        token = getCsrfTokenFromCookie();
      }

      if (!token) {
        throw new Error('CSRF token not found in response body, headers, or cookies');
      }
        
      console.log('✅ CSRF token obtained successfully');
      return token;
      
    } catch (error) {
      console.error('❌ CSRF token fetch error:', error);
      setErrors({ nonFieldError: 'Failed to establish secure connection. Please refresh the page.' });
      throw error;
    }
  };

  // Pre-fetch CSRF token when modal opens
  useEffect(() => {
    if (show && !csrfReady) {
      const initializeCsrf = async () => {
        try {
          const token = await fetchCsrfToken();
          setCsrfToken(token);
          setCsrfReady(true);
        } catch (error) {
          console.error('Failed to initialize CSRF token:', error);
          setCsrfReady(false);
        }
      };
      
      initializeCsrf();
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username || !formData.username.includes('@')) {
      newErrors.username = 'Please enter a valid email address';
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🚀 Starting login process...');
      
      // Ensure we have a fresh CSRF token
      let token = csrfToken;
      if (!token || !csrfReady) {
        console.log('🔄 Fetching fresh CSRF token for login...');
        token = await fetchCsrfToken();
        setCsrfToken(token);
      }

      console.log('🔐 Attempting login with:', formData.username);

      // Build login URL
      const loginUrl = buildURL(config.endpoints.LOGIN);
      console.log('🌐 Login URL:', loginUrl);

      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-CSRFToken': token,
        'Accept': 'application/json',
      };

      console.log('📋 Request headers:', requestHeaders);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: requestHeaders,
        credentials: 'include', // CRITICAL for cross-origin cookies
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      console.log('📡 Login response status:', response.status);
      console.log('📋 Login response headers:', [...response.headers.entries()]);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error('Invalid server response. Please try again.');
      }

      const data = await response.json();
      console.log('📦 Login response data:', data);

      if (response.ok) {
        console.log('✅ Login successful, checking payment status...');
        
        // Check payment status
        await handlePaymentCheck(token);
        
      } else {
        console.error('❌ Login failed:', data);
        handleBackendErrors(data);
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle specific error types
      if (error.message.includes('CSRF')) {
        setErrors({ 
          nonFieldError: 'Security token expired. Please refresh the page and try again.' 
        });
        // Reset CSRF state
        setCsrfReady(false);
        setCsrfToken('');
      } else if (error.message.includes('Network')) {
        setErrors({ 
          nonFieldError: 'Network error. Please check your connection and try again.' 
        });
      } else {
        setErrors({ 
          nonFieldError: error.message || 'Login failed. Please try again.' 
        });
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentCheck = async (token) => {
    try {
      const paymentUrl = buildURL(config.endpoints.PAYMENT_STATUS);
      console.log('💳 Payment check URL:', paymentUrl);
      
      const paymentCheckResponse = await fetch(paymentUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-CSRFToken': token,
        }
      });

      console.log('📡 Payment check status:', paymentCheckResponse.status);

      if (!paymentCheckResponse.ok) {
        console.error('❌ Payment check failed with status:', paymentCheckResponse.status);
        throw new Error('Payment verification failed');
      }

      const paymentData = await paymentCheckResponse.json();
      console.log('📦 Payment status response:', paymentData);
      
      const { payment_successful } = paymentData;
      
      // Close modal first
      handleClose();
      
      if (payment_successful) {
        console.log('✅ Payment verified, navigating to add-sources');
        navigate('/add-sources');
      } else {
        console.log('💳 Payment not completed, navigating to card-payment');
        navigate('/card-payment');
      }
      
    } catch (paymentError) {
      console.error('❌ Payment check failed:', paymentError);
      // Close modal and default to payment page if check fails
      handleClose();
      navigate('/card-payment');
    }
  };

  const handleBackendErrors = (data) => {
    if (data.error) {
      setErrors({ nonFieldError: data.error });
    } else if (data.non_field_errors) {
      setErrors({ nonFieldError: data.non_field_errors.join(' ') });
    } else if (data.detail) {
      setErrors({ nonFieldError: data.detail });
    } else {
      setErrors({ nonFieldError: 'Login failed. Please check your credentials and try again.' });
    }
  };

  const handleModalClose = () => {
    setFormData({
      username: '',
      password: ''
    });
    setErrors({});
    setCsrfReady(false);
    setCsrfToken('');
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleModalClose} centered className="auth-modal">
      <Modal.Header className="border-0 position-relative">
        <div className="w-100 text-center">
          <h3 className="auth-title mb-0">Welcome Back</h3>
          <p className="auth-subtitle">Sign in to continue to Smart Upgrades</p>
        </div>
        <Button 
          variant="link" 
          onClick={handleModalClose}
          className="close-button position-absolute"
        >
          <FiX size={24} />
        </Button>
      </Modal.Header>
      
      <Modal.Body className="pt-0">
        {errors.nonFieldError && (
          <Alert variant="danger" className="d-flex align-items-center">
            <div className="flex-grow-1">{errors.nonFieldError}</div>
          </Alert>
        )}

        {/* Show loading state while CSRF is being fetched */}
        {show && !csrfReady && !errors.nonFieldError && (
          <Alert variant="info" className="d-flex align-items-center">
            <Spinner size="sm" className="me-2" />
            <div className="flex-grow-1">Establishing secure connection...</div>
          </Alert>
        )}
        
        <Form onSubmit={handleSignIn}>
          <Form.Group className="mb-4 form-group-custom">
            <Form.Label className="form-label">Email Address</Form.Label>
            <div className="input-group-custom">
              <FiMail className="input-icon" />
              <Form.Control
                type="email"
                name="username"
                placeholder="Enter your email"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
                className="form-control-custom"
                disabled={!csrfReady}
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3 form-group-custom">
            <Form.Label className="form-label">Password</Form.Label>
            <div className="input-group-custom">
              <FiLock className="input-icon" />
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                className="form-control-custom"
                disabled={!csrfReady}
              />
              <Button 
                variant="link" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!csrfReady}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </div>
            <div className="text-end mt-2">
              <Button 
                variant="link" 
                className="forgot-password"
                onClick={() => alert('Forgot Password clicked!')}
                disabled={!csrfReady}
              >
                Forgot Password?
              </Button>
            </div>
          </Form.Group>
          
          <Button 
            variant="primary" 
            className="auth-btn w-100 py-3"
            type="submit"
            disabled={isLoading || !csrfReady}
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
                Signing In...
              </>
            ) : !csrfReady ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Connecting...
              </>
            ) : (
              <>
                Sign In <FiArrowRight className="ms-2" />
              </>
            )}
          </Button>
        </Form>
      </Modal.Body>
      
      <Modal.Footer className="border-0 justify-content-center">
        <p className="auth-footer-text">
          Don't have an account?{' '}
          <Button 
            variant="link" 
            className="auth-footer-link p-0"
            onClick={() => {
              handleModalClose();
              handleShowSignUp();
            }}
            disabled={!csrfReady}
          >
            Sign Up
          </Button>
        </p>
      </Modal.Footer>
    </Modal>
  );
};

export default SignInModal;