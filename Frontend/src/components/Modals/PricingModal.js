import React, { useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { 
  FaCheckCircle, 
  FaCrown,
  FaRocket,
  FaGift,
  FaShield,
  FaHeadset,
  FaUsers,
  FaChartLine
} from 'react-icons/fa';
import { 
  FiX, 
  FiCheck, 
  FiStar,
  FiZap,
  FiTrendingUp,
  FiUsers,
  FiShield,
  FiHelpCircle,
  FiArrowRight
} from 'react-icons/fi';
import './PricingModal.css';

const PricingModal = ({ show, handleClose }) => {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'Perfect for small apps',
      icon: <FaGift size={24} />,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      monthlyPrice: 0,
      annualPrice: 0,
      badge: 'Free Forever',
      description: 'Get started with essential app monitoring features at no cost.',
      features: [
        { name: 'Up to 1 app', included: true },
        { name: 'Basic app ratings tracking', included: true },
        { name: '7-day data retention', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Community support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Custom topics', included: false },
        { name: 'API access', included: false },
        { name: 'Priority support', included: false }
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      id: 'pro',
      name: 'Professional',
      tagline: 'Most popular choice',
      icon: <FaRocket size={24} />,
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      monthlyPrice: 29,
      annualPrice: 24, // $24/month when billed annually
      badge: 'Most Popular',
      description: 'Everything you need to monitor and optimize your app performance.',
      features: [
        { name: 'Up to 5 apps', included: true },
        { name: 'App ratings over time', included: true },
        { name: 'App review sentiment analysis', included: true },
        { name: 'Topics, tags & custom topics', included: true },
        { name: '90-day data retention', included: true },
        { name: 'Advanced analytics dashboard', included: true },
        { name: 'Real-time notifications', included: true },
        { name: 'Export data (CSV/PDF)', included: true },
        { name: 'Priority email support', included: true },
        { name: 'API access', included: true },
        { name: 'Custom integrations', included: false },
        { name: 'Dedicated account manager', included: false }
      ],
      cta: 'Start Pro Trial',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'For growing businesses',
      icon: <FaCrown size={24} />,
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      monthlyPrice: 99,
      annualPrice: 79, // $79/month when billed annually
      badge: 'Best Value',
      description: 'Advanced features and dedicated support for enterprise-level needs.',
      features: [
        { name: 'Unlimited apps', included: true },
        { name: 'Everything in Professional', included: true },
        { name: 'Unlimited data retention', included: true },
        { name: 'Advanced competitor analysis', included: true },
        { name: 'Custom dashboard themes', included: true },
        { name: 'White-label reports', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: '24/7 phone support', included: true },
        { name: 'On-premise deployment', included: true },
        { name: 'SLA guarantee', included: true },
        { name: 'Custom feature development', included: true }
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleUpgrade = (plan) => {
    console.log('Upgrading to:', plan.name, 'billing:', billingCycle);
    // Add your upgrade logic here
    handleClose();
  };

  const calculateSavings = (monthly, annual) => {
    if (monthly === 0) return 0;
    const monthlyCost = monthly * 12;
    const annualCost = annual * 12;
    return Math.round(((monthlyCost - annualCost) / monthlyCost) * 100);
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      size="xl"
      className="pricing-modal-enhanced"
      backdrop="static"
    >
      <div className="modal-overlay">
        <Modal.Header className="pricing-header border-0">
          <div className="header-content">
            <div className="header-badge">
              <FiZap className="badge-icon" />
              <span>Pricing Plans</span>
            </div>
            <h2 className="pricing-title">
              Choose the Perfect 
              <span className="gradient-text"> Plan</span>
            </h2>
            <p className="pricing-subtitle">
              Scale your app monitoring with plans designed for every stage of growth. 
              Start free and upgrade as you grow.
            </p>
            
            <div className="billing-toggle">
              <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
              <div 
                className="toggle-switch"
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              >
                <div className={`toggle-slider ${billingCycle === 'annual' ? 'annual' : 'monthly'}`}></div>
              </div>
              <span className={billingCycle === 'annual' ? 'active' : ''}>
                Annual
                <span className="savings-badge">Save up to 25%</span>
              </span>
            </div>
          </div>
          <button 
            className="close-button-enhanced"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <FiX size={24} />
          </button>
        </Modal.Header>

        <Modal.Body className="pricing-body">
          <div className="pricing-grid">
            <Row className="g-4">
              {plans.map((plan) => (
                <Col lg={4} key={plan.id}>
                  <div 
                    className={`pricing-card ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {plan.popular && (
                      <div className="popular-badge">
                        <FiStar className="star-icon" />
                        <span>Most Popular</span>
                      </div>
                    )}
                    
                    <div className="card-header">
                      <div 
                        className="plan-icon-wrapper"
                        style={{ background: plan.gradient }}
                      >
                        {plan.icon}
                      </div>
                      <div className="plan-badge" style={{ background: plan.gradient }}>
                        {plan.badge}
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <h3 className="plan-name">{plan.name}</h3>
                      <p className="plan-tagline">{plan.tagline}</p>
                      
                      <div className="pricing-section">
                        <div className="price-display">
                          <span className="currency">$</span>
                          <span className="amount">
                            {billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                          </span>
                        </div>
                        {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                          <div className="billing-info">
                            <span className="original-price">${plan.monthlyPrice}/Annual</span>
                            <span className="savings">Save {calculateSavings(plan.monthlyPrice, plan.annualPrice)}%</span>
                          </div>
                        )}
                        {billingCycle === 'annual' && plan.monthlyPrice === 0 && (
                          <div className="billing-info">
                            <span className="free-text">Always free</span>
                          </div>
                        )}
                        {billingCycle === 'monthly' && plan.monthlyPrice === 0 && (
                          <div className="billing-info">
                            <span className="free-text">No credit card required</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="plan-description">{plan.description}</p>
                      
                      <div className="features-list">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className={`feature-item ${feature.included ? 'included' : 'not-included'}`}>
                            {feature.included ? (
                              <FiCheck className="feature-icon included" />
                            ) : (
                              <FiX className="feature-icon not-included" />
                            )}
                            <span className={feature.included ? '' : 'text-muted'}>{feature.name}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        className="plan-cta-btn"
                        style={{ 
                          background: plan.gradient,
                          boxShadow: `0 4px 15px ${plan.color}30`
                        }}
                        onClick={() => handleUpgrade(plan)}
                      >
                        <span>{plan.cta}</span>
                        <FiArrowRight className="cta-arrow" />
                      </button>
                    </div>
                    
                    <div className="card-glow" style={{ background: plan.gradient }}></div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <div className="features-comparison">
            <h4 className="comparison-title">Why choose Smart Upgrades?</h4>
            <div className="comparison-grid">
              <div className="comparison-item">
                <FiTrendingUp className="comparison-icon" />
                <div>
                  <h6>Real-time Analytics</h6>
                  <p>Monitor your app performance with live data updates and instant notifications.</p>
                </div>
              </div>
              <div className="comparison-item">
                <FiShield className="comparison-icon" />
                <div>
                  <h6>Enterprise Security</h6>
                  <p>Bank-level security with SOC 2 compliance and data encryption.</p>
                </div>
              </div>
              <div className="comparison-item">
                <FiUsers className="comparison-icon" />
                <div>
                  <h6>Expert Support</h6>
                  <p>Get help from our team of app store optimization experts.</p>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="pricing-footer border-0">
          <div className="footer-content">
            <div className="footer-info">
              <div className="guarantee-badge">
                <FiShield className="guarantee-icon" />
                <div>
                  <strong>30-day money-back guarantee</strong>
                  <p>Try risk-free with our satisfaction guarantee</p>
                </div>
              </div>
            </div>
            
            <div className="footer-actions">
              <Button 
                variant="outline-primary" 
                onClick={handleClose}
                className="btn-secondary-enhanced"
              >
                <FiHelpCircle className="btn-icon" />
                Have Questions?
              </Button>
              <Button 
                variant="primary" 
                onClick={() => handleUpgrade(plans.find(p => p.id === selectedPlan))}
                className="btn-primary-enhanced"
              >
                <FiZap className="btn-icon" />
                Get Started Now
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default PricingModal;