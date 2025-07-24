import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCreditCard, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import config, { buildURL } from '../Modals/api';
import './CardPayment.css';

const CardPayment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: ''
  });
  const [errors, setErrors] = useState({});
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear error when user types
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cardholderName.trim()) newErrors.cardholderName = 'Cardholder name is required';
    if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'Valid card number required';
    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(formData.expiryDate)) newErrors.expiryDate = 'MM/YY format required';
    if (!/^\d{3,4}$/.test(formData.cvc)) newErrors.cvc = 'Valid CVC required';
    if (!formData.addressLine.trim()) newErrors.addressLine = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  // Fetch CSRF token helper function
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
      throw new Error('Failed to establish secure connection');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      console.log('Starting payment process...');
      
      // 1. Get CSRF token
      const csrfToken = await fetchCsrfToken();
      console.log('CSRF token obtained');
      
      // 2. Validate payment (simulated for now)
      console.log('Validating payment...');
      const validationResponse = await fetch(buildURL(config.endpoints.VALIDATE_PAYMENT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          card_last_four: formData.cardNumber.slice(-4),
          amount: 29.00,
          cardholder_name: formData.cardholderName,
          billing_address: {
            address_line: formData.addressLine,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode
          }
        })
      });

      if (!validationResponse.ok) {
        const errorData = await validationResponse.json().catch(() => ({}));
        console.error('Validation failed:', errorData);
        throw new Error(errorData.message || `Validation failed with status ${validationResponse.status}`);
      }

      const validationResult = await validationResponse.json();
      console.log('Validation result:', validationResult);

      // Check if validation was successful
      if (!validationResult.success) {
        throw new Error(validationResult.message || 'Payment validation failed');
      }

      // Since we're doing combined validation and processing, skip separate processing
      console.log('Payment validation and processing completed');
      
      // 4. Update payment status in user account
      console.log('Updating payment status...');
      const updateResponse = await fetch(buildURL(config.endpoints.UPDATE_PAYMENT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          payment_successful: true,
          payment_amount: 29.00,
          payment_date: new Date().toISOString()
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update payment status with status ${updateResponse.status}`);
      }

      const updateResult = await updateResponse.json();
      console.log('Update result:', updateResult);

      // 5. Set localStorage to remember payment success
      localStorage.setItem('paymentSuccessful', 'true');
      
      // 6. Show success message and redirect
      setPaymentStatus('Payment successful! Redirecting to app selection...');
      
      setTimeout(() => {
        navigate('/payment-success');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus(`Payment failed: ${error.message}`);
      
      // Clear any existing payment status
      localStorage.removeItem('paymentSuccessful');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container className="payment-container">
      {paymentStatus && (
        <Row className="justify-content-center mb-3">
          <Col md={8}>
            <Alert 
              variant={paymentStatus.includes('failed') ? 'danger' : paymentStatus.includes('successful') ? 'success' : 'info'}
              onClose={() => setPaymentStatus(null)} 
              dismissible
            >
              {paymentStatus}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="justify-content-center mb-4">
        <Col md={8}>
          <Card className="shadow-sm pricing-card">
            <Card.Body>
              <h2 className="mb-4 text-primary">
                <FaCreditCard className="me-2" />
                Pricing Details
              </h2>
              <Card className="mb-3 feature-card">
                <Card.Body>
                  <h5 className="text-success">$29/m</h5>
                  <p className="text-muted">Billed annually or $29 billed monthly</p>
                  <div className="d-flex align-items-center mb-2">
                    <FaCheck className="text-success me-2" />
                    <span>App Ratings Over Time</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaCheck className="text-success me-2" />
                    <span>App Review Sentiment</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <FaCheck className="text-success me-2" />
                    <span>Topics, Tags & Custom Topics</span>
                  </div>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        <Row className="justify-content-center mb-4">
          <Col md={8}>
            <Card className="shadow-sm payment-methods-card">
              <Card.Body>
                <h2 className="mb-4 text-primary">Payment Methods</h2>
                <Card className="mb-3 payment-card">
                  <Card.Body>
                    <h5 className="text-info">VISA</h5>
                    <Form.Group className="mb-3" controlId="cardholderName">
                      <Form.Label>Cardholder's Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="John Smith"
                        value={formData.cardholderName}
                        onChange={handleChange}
                        isInvalid={!!errors.cardholderName}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.cardholderName}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="cardNumber">
                      <Form.Label>Card Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={formatCardNumber(formData.cardNumber)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 16) {
                            handleChange({
                              target: { id: 'cardNumber', value }
                            });
                          }
                        }}
                        isInvalid={!!errors.cardNumber}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.cardNumber}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="expiryDate">
                          <Form.Label>Expiry Date</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="MM/YY"
                            value={formData.expiryDate}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length > 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              if (value.length <= 5) {
                                handleChange({
                                  target: { id: 'expiryDate', value }
                                });
                              }
                            }}
                            isInvalid={!!errors.expiryDate}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.expiryDate}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="cvc">
                          <Form.Label>CVC</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="123"
                            value={formData.cvc}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 4) {
                                handleChange({
                                  target: { id: 'cvc', value }
                                });
                              }
                            }}
                            isInvalid={!!errors.cvc}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.cvc}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center mb-4">
          <Col md={8}>
            <Card className="shadow-sm payment-details-card">
              <Card.Body>
                <h2 className="mb-4 text-primary">
                  <FaMapMarkerAlt className="me-2" />
                  Billing Address
                </h2>
                <Card className="mb-3 address-card">
                  <Card.Body>
                    <Form.Group className="mb-3" controlId="addressLine">
                      <Form.Label>Address Line</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="123 Main St"
                        value={formData.addressLine}
                        onChange={handleChange}
                        isInvalid={!!errors.addressLine}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.addressLine}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="city">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="New York"
                        value={formData.city}
                        onChange={handleChange}
                        isInvalid={!!errors.city}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.city}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="state">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="NY"
                            value={formData.state}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="postalCode">
                          <Form.Label>Postal Code</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="10001"
                            value={formData.postalCode}
                            onChange={handleChange}
                            isInvalid={!!errors.postalCode}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.postalCode}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center mb-4">
          <Col md={8} className="text-center">
            <Button 
              variant="primary" 
              size="lg" 
              type="submit"
              disabled={isProcessing}
              className="next-button"
            >
              {isProcessing ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Processing Payment...
                </>
              ) : (
                'Complete Payment'
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default CardPayment;