import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { 
  FiMessageSquare, 
  FiBarChart2, 
  FiStar, 
  FiFileText, 
  FiMonitor, 
  FiPieChart,
  FiX,
  FiArrowRight,
  FiZap,
  FiCheck
} from 'react-icons/fi';
import './FeaturesModal.css';

const FeaturesModal = ({ show, handleClose }) => {
  const features = [
    {
      icon: <FiMessageSquare size={24} className="feature-icon" />,
      title: "Reply to Reviews",
      badge: "New ✨",
      description: "Automated, AI-generated & canned reply tools for Google Play app reviews.",
      color: "#667eea",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      benefits: ["Save 80% time", "AI-powered responses", "Multi-platform support"]
    },
    {
      icon: <FiBarChart2 size={24} className="feature-icon" />,
      title: "Sentiment Analysis",
      badge: "Popular 🔥",
      description: "Visualize trends in sentiment across all your app reviews with advanced AI.",
      color: "#10B981",
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      benefits: ["Real-time insights", "Trend visualization", "Actionable data"]
    },
    {
      icon: <FiStar size={24} className="feature-icon" />,
      title: "App Ratings Analytics",
      badge: "Pro 💎",
      description: "Map changes in your app ratings from your apps over time with detailed insights.",
      color: "#F59E0B",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      benefits: ["Rating trends", "Historical data", "Performance metrics"]
    },
    {
      icon: <FiFileText size={24} className="feature-icon" />,
      title: "Text Analysis Tools",
      badge: "Advanced 🚀",
      description: "See which words, phrases, and topics are driving your 1 and 5-star reviews.",
      color: "#EF4444",
      gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      benefits: ["Keyword insights", "Topic modeling", "Review categorization"]
    },
    {
      icon: <FiMonitor size={24} className="feature-icon" />,
      title: "Multi-Platform Monitor",
      badge: "Essential 📱",
      description: "Monitor and analyze iOS, Google Play, and Windows app reviews from one dashboard.",
      color: "#06B6D4",
      gradient: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
      benefits: ["Cross-platform", "Real-time monitoring", "Unified dashboard"]
    },
    {
      icon: <FiPieChart size={24} className="feature-icon" />,
      title: "Smart Dashboards",
      badge: "Premium ⭐",
      description: "Create reports that show all your review & ratings data points on one customizable page.",
      color: "#8B5CF6",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
      benefits: ["Custom reports", "Data visualization", "Export options"]
    }
  ];

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      size="xl"
      className="features-modal-enhanced"
      backdrop="static"
    >
      <div className="modal-overlay">
        <Modal.Header className="modal-header-enhanced border-0">
          <div className="header-content">
            <div className="header-badge">
              <FiZap className="badge-icon" />
              <span>Features Overview</span>
            </div>
            <h2 className="modal-title-enhanced">
              Powerful Tools for 
              <span className="gradient-text"> App Success</span>
            </h2>
            <p className="modal-subtitle">
              Smart Upgrades offers cutting-edge tools to save product managers, technical teams, 
              and customer support teams hours every week with AI-powered insights.
            </p>
          </div>
          <button 
            className="close-button-enhanced"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <FiX size={24} />
          </button>
        </Modal.Header>

        <Modal.Body className="modal-body-enhanced">
          <div className="features-grid">
            <Row className="g-4">
              {features.map((feature, index) => (
                <Col lg={6} key={index}>
                  <div className="feature-card-enhanced">
                    <div className="card-header">
                      <div 
                        className="feature-icon-wrapper"
                        style={{ background: feature.gradient }}
                      >
                        {feature.icon}
                      </div>
                      <div className="feature-badge" style={{ background: feature.gradient }}>
                        {feature.badge}
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <h4 className="feature-title-enhanced">{feature.title}</h4>
                      <p className="feature-description-enhanced">{feature.description}</p>
                      
                      <div className="feature-benefits">
                        {feature.benefits.map((benefit, idx) => (
                          <div key={idx} className="benefit-item">
                            <FiCheck size={16} className="check-icon" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="card-footer">
                        <button className="learn-more-btn">
                          <span>Learn More</span>
                          <FiArrowRight className="arrow-icon" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-glow" style={{ background: feature.gradient }}></div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Modal.Body>

        <Modal.Footer className="modal-footer-enhanced border-0">
          <div className="footer-content">
            <div className="footer-stats">
              <div className="stat-item">
                <span className="stat-number">10M+</span>
                <span className="stat-label">Reviews Analyzed</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">5K+</span>
                <span className="stat-label">Apps Enhanced</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
            </div>
            
            <div className="footer-actions">
              <Button 
                variant="outline-primary" 
                onClick={handleClose}
                className="btn-secondary-enhanced"
              >
                Maybe Later
              </Button>
              <Button 
                variant="primary" 
                onClick={handleClose}
                className="btn-primary-enhanced"
              >
                <FiZap className="btn-icon" />
                Get Started Free
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default FeaturesModal;