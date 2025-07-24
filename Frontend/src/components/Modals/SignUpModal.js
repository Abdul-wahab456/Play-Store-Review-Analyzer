import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { 
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiX,
  FiArrowRight,
  FiUser
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import config, { buildURL } from './api';
import './SignupModal.css';

const SignUpModal = ({ show, handleClose, handleShowSignIn = () => {} }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // CSRF token management
  const [csrfToken, setCsrfToken] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }
    
    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get CSRF token using config
  const fetchCsrfToken = async () => {
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
      setErrors({ nonFieldError: 'Failed to establish secure connection' });
      throw error;
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Always get fresh CSRF token for signup
      const token = await fetchCsrfToken();
      setCsrfToken(token);

      // Make signup request
      const response = await fetch(buildURL(config.endpoints.SIGNUP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': token,
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email.toLowerCase(),
          password: formData.password,
          password2: formData.password2
        })
      });

      // Check response content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Invalid server response');
      }

      const data = await response.json();

      if (!response.ok) {
        handleBackendErrors(data);
        return;
      }

      // If signup successful, show success message and redirect
      if (response.ok) {
        setSuccessMessage('Account created successfully! Redirecting to payment...');
        
        setTimeout(() => {
          handleClose();
          navigate('/card-payment');
        }, 2000);
      }

    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ 
        nonFieldError: error.message || 'Network error. Please try again.' 
      });
      
      // Attempt to get new CSRF token on failure
      try {
        const newToken = await fetchCsrfToken();
        setCsrfToken(newToken);
      } catch (csrfError) {
        console.error('Failed to refresh CSRF token:', csrfError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackendErrors = (data) => {
    if (data.errors) {
      setErrors(data.errors);
    } else if (data.non_field_errors) {
      setErrors({ nonFieldError: data.non_field_errors.join(' ') });
    } else if (typeof data === 'object') {
      const backendErrors = {};
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          backendErrors[key] = value.join(' ');
        } else {
          backendErrors[key] = value;
        }
      }
      setErrors(backendErrors);
    } else {
      setErrors({ nonFieldError: 'Registration failed. Please try again.' });
    }
  };

  const handleModalClose = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      password2: ''
    });
    setErrors({});
    setSuccessMessage('');
    handleClose();
  };

  const handleSignInClick = () => {
    handleModalClose();
    if (typeof handleShowSignIn === 'function') {
      handleShowSignIn();
    } else {
      console.warn('handleShowSignIn function not provided to SignUpModal');
    }
  };

  return (
    <Modal show={show} onHide={handleModalClose} centered className="auth-modal">
      <Modal.Header className="border-0 position-relative">
        <div className="w-100 text-center">
          <h3 className="auth-title mb-0">Create Account</h3>
          <p className="auth-subtitle">Get started with Smart Upgrades</p>
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
        
        {successMessage && (
          <Alert variant="success" className="d-flex align-items-center">
            <div className="flex-grow-1">{successMessage}</div>
          </Alert>
        )}
        
        <Form onSubmit={handleSignUp}>
          <Form.Group className="mb-4 form-group-custom">
            <Form.Label className="form-label">Username</Form.Label>
            <div className="input-group-custom">
              <FiUser className="input-icon" />
              <Form.Control
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
                className="form-control-custom"
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
            </div>
          </Form.Group>

          <Form.Group className="mb-4 form-group-custom">
            <Form.Label className="form-label">Email Address</Form.Label>
            <div className="input-group-custom">
              <FiMail className="input-icon" />
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                className="form-control-custom"
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </div>
          </Form.Group>
          
          <Form.Group className="mb-4 form-group-custom">
            <Form.Label className="form-label">Password</Form.Label>
            <div className="input-group-custom">
              <FiLock className="input-icon" />
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password (min 8 chars)"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                className="form-control-custom"
              />
              <Button 
                variant="link" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </div>
          </Form.Group>
          
          <Form.Group className="mb-4 form-group-custom">
            <Form.Label className="form-label">Confirm Password</Form.Label>
            <div className="input-group-custom">
              <FiLock className="input-icon" />
              <Form.Control
                type={showConfirmPassword ? "text" : "password"}
                name="password2"
                placeholder="Confirm your password"
                value={formData.password2}
                onChange={handleChange}
                isInvalid={!!errors.password2}
                className="form-control-custom"
              />
              <Button 
                variant="link" 
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {errors.password2}
              </Form.Control.Feedback>
            </div>
          </Form.Group>
          
          <Button 
            variant="primary" 
            className="auth-btn w-100 py-3"
            type="submit"
            disabled={isLoading}
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
                Creating Account...
              </>
            ) : (
              <>
                Sign Up <FiArrowRight className="ms-2" />
              </>
            )}
          </Button>
        </Form>
      </Modal.Body>
      
      <Modal.Footer className="border-0 justify-content-center">
      </Modal.Footer>
    </Modal>
  );
};

export default SignUpModal;