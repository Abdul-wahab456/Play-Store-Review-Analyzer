import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Alert } from 'react-bootstrap';
import { FaCheckCircle } from 'react-icons/fa';
import './PaymentSuccess.css'; // Optional styling file

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/add-sources'); }, 5000);
       return () => clearTimeout(timer);
        }, [navigate]);

  return (
    <Container className="payment-success-container text-center py-5">
      <FaCheckCircle size={80} className="text-success mb-4" />
      <h1 className="mb-3">Payment Successful!</h1>
      <Alert variant="success" className="mb-4">
        Your subscription has been activated successfully.
      </Alert>
      <p className="mb-4">You'll be redirected to Add Sources in 5 seconds...</p>
      <Button 
        variant="primary" 
        size="lg"
        onClick={() => navigate('/add-sources')}
        className="px-4"
      >
        Go to Add Sources Now
      </Button>
    </Container>
  );
};

export default PaymentSuccess;