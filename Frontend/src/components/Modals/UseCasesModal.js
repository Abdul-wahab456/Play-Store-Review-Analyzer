import React, { useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { 
  FaCode, 
  FaChartLine, 
  FaHeadset, 
  FaBullhorn,
  FaUserTie,
  FaCog,
  FaRocket,
  FaShieldAlt
} from 'react-icons/fa';
import { 
  FiX, 
  FiCheck, 
  FiStar, 
  FiTarget,
  FiUsers,
  FiTrendingUp,
  FiZap,
  FiArrowRight,
  FiShield,
  FiHeart,
  FiDollarSign,
  FiClock
} from 'react-icons/fi';
import './UseCasesModal.css';

const UseCasesModal = ({ show, handleClose }) => {
  const [selectedUseCase, setSelectedUseCase] = useState(null);

  const useCases = [
    {
      id: 'developers',
      title: 'For Developers',
      role: 'Development Teams',
      icon: <FaCode size={28} />,  // Reduced from 32 to 28
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Close the feedback loop to spot bugs faster and improve app stability.',
      mainBenefit: 'Reduce Bug Resolution Time by 75%',
      features: [
        'Automated bug detection from reviews',
        'Crash report correlation',
        'Performance issue identification',
        'Feature request prioritization'
      ],
      metrics: {
        timeReduction: '75%',
        bugDetection: '3x Faster',
        satisfaction: '92%'
      },
      challenges: [
        'Manually reading thousands of reviews',
        'Missing critical bug reports',
        'Delayed issue resolution'
      ],
      solutions: [
        'AI-powered issue categorization',
        'Real-time bug alerts',
        'Automated priority scoring'
      ],
      badge: 'Tech Favorite',
      icon2: <FiShield />
    },
    {
      id: 'product-managers',
      title: 'For Product Managers',
      role: 'Product Strategy',
      icon: <FaChartLine size={28} />,  // Reduced from 32 to 28
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      description: 'Make data-driven decisions with comprehensive user feedback insights.',
      mainBenefit: 'Increase Feature Adoption by 60%',
      features: [
        'Feature request analytics',
        'User journey mapping',
        'Competitive analysis',
        'Market trend identification'
      ],
      metrics: {
        featureSuccess: '60%',
        decisionSpeed: '2x Faster',
        accuracy: '89%'
      },
      challenges: [
        'Unclear user priorities',
        'Feature request chaos',
        'Market trend blindness'
      ],
      solutions: [
        'Smart feature request grouping',
        'Trend visualization dashboards',
        'Competitor sentiment tracking'
      ],
      badge: 'Strategic',
      icon2: <FiTarget />
    },
    {
      id: 'customer-support',
      title: 'For Customer Support',
      role: 'Support Teams',
      icon: <FaHeadset size={28} />,  // Reduced from 32 to 28
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      description: 'Proactively address customer concerns and improve satisfaction scores.',
      mainBenefit: 'Boost Customer Satisfaction by 45%',
      features: [
        'Sentiment trend monitoring',
        'Response template suggestions',
        'Escalation priority alerts',
        'Customer emotion tracking'
      ],
      metrics: {
        satisfaction: '45%',
        responseTime: '80%',
        resolution: '65%'
      },
      challenges: [
        'Reactive support approach',
        'Missing customer sentiment',
        'Inconsistent responses'
      ],
      solutions: [
        'Proactive issue detection',
        'AI-powered response suggestions',
        'Sentiment-based prioritization'
      ],
      badge: 'Customer First',
      icon2: <FiHeart />
    },
    {
      id: 'marketing',
      title: 'For Marketing Teams',
      role: 'Growth & Marketing',
      icon: <FaBullhorn size={28} />,  // Reduced from 32 to 28
      color: '#EF4444',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      description: 'Leverage user feedback for compelling marketing campaigns and messaging.',
      mainBenefit: 'Improve Campaign ROI by 85%',
      features: [
        'User testimonial mining',
        'Messaging optimization',
        'Campaign impact tracking',
        'Competitor positioning'
      ],
      metrics: {
        roi: '85%',
        engagement: '70%',
        conversion: '55%'
      },
      challenges: [
        'Generic marketing messages',
        'Unclear value propositions',
        'Low campaign engagement'
      ],
      solutions: [
        'User-voice driven messaging',
        'Testimonial automation',
        'Sentiment-based campaigns'
      ],
      badge: 'Growth Driver',
      icon2: <FiTrendingUp />
    },
    {
      id: 'executives',
      title: 'For Executives',
      role: 'Leadership',
      icon: <FaUserTie size={28} />,  // Reduced from 32 to 28
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      description: 'Strategic insights for informed decision-making and business growth.',
      mainBenefit: 'Drive Revenue Growth by 40%',
      features: [
        'Executive dashboard views',
        'Market position analysis',
        'ROI impact tracking',
        'Strategic recommendations'
      ],
      metrics: {
        revenue: '40%',
        insights: '5x More',
        decisions: '3x Faster'
      },
      challenges: [
        'Lack of user insights',
        'Slow strategic decisions',
        'Market position uncertainty'
      ],
      solutions: [
        'Executive-level dashboards',
        'Strategic insight reports',
        'Market intelligence alerts'
      ],
      badge: 'Executive',
      icon2: <FiDollarSign />
    },
    {
      id: 'devops',
      title: 'For DevOps Teams',
      role: 'Operations',
      icon: <FaCog size={28} />,  // Reduced from 32 to 28
      color: '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      description: 'Monitor app performance and reliability through user feedback patterns.',
      mainBenefit: 'Reduce Downtime by 90%',
      features: [
        'Performance issue alerts',
        'Release impact monitoring',
        'Infrastructure correlation',
        'Automated incident detection'
      ],
      metrics: {
        uptime: '90%',
        detection: '5x Faster',
        resolution: '70%'
      },
      challenges: [
        'Silent performance issues',
        'Delayed incident detection',
        'User impact blindness'
      ],
      solutions: [
        'User-reported issue tracking',
        'Performance sentiment analysis',
        'Release quality monitoring'
      ],
      badge: 'Reliability',
      icon2: <FaShieldAlt />
    }
  ];

  const handleLearnMore = (useCaseId) => {
    setSelectedUseCase(selectedUseCase === useCaseId ? null : useCaseId);
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      size="lg"  // Changed from "xl" to "lg" for smaller size
      className="usecases-modal-enhanced"
      backdrop="static"
    >
      {/* Rest of the component remains the same */}
      <div className="modal-overlay">
        <Modal.Header className="usecases-header border-0">
          <div className="header-content">
            <div className="header-badge">
              <FiUsers className="badge-icon" />
              <span>Use Cases</span>
            </div>
            <h2 className="usecases-title">
              Transform Every 
              <span className="gradient-text"> Team's Workflow</span>
            </h2>
            <p className="usecases-subtitle">
              See how Smart Upgrades empowers different teams to make data-driven decisions, 
              improve user experience, and drive business growth through intelligent review analytics.
            </p>
          </div>
          <button 
            className="close-button-enhanced"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <FiX size={20} />  {/* Reduced from 24 to 20 */}
          </button>
        </Modal.Header>

        <Modal.Body className="usecases-body">
          <div className="usecases-grid">
            <Row className="g-3">  {/* Reduced gap from g-4 to g-3 */}
              {useCases.map((useCase) => (
                <Col lg={6} key={useCase.id}>
                  <div 
                    className={`usecase-card ${selectedUseCase === useCase.id ? 'expanded' : ''}`}
                    onClick={() => handleLearnMore(useCase.id)}
                  >
                    <div className="card-header">
                      <div 
                        className="usecase-icon-wrapper"
                        style={{ background: useCase.gradient }}
                      >
                        {useCase.icon}
                      </div>
                      <div className="usecase-badge" style={{ background: useCase.gradient }}>
                        {useCase.badge}
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="usecase-role">{useCase.role}</div>
                      <h4 className="usecase-title">{useCase.title}</h4>
                      <p className="usecase-description">{useCase.description}</p>
                      
                      <div className="main-benefit">
                        <div className="benefit-icon" style={{ color: useCase.color }}>
                          {useCase.icon2}
                        </div>
                        <span className="benefit-text">{useCase.mainBenefit}</span>
                      </div>
                      
                      <div className="usecase-metrics">
                        {Object.entries(useCase.metrics).map(([key, value]) => (
                          <div key={key} className="metric-item">
                            <span className="metric-value" style={{ color: useCase.color }}>{value}</span>
                            <span className="metric-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button className="learn-more-btn">
                        <span>{selectedUseCase === useCase.id ? 'Show Less' : 'Learn More'}</span>
                        <FiArrowRight className={`arrow-icon ${selectedUseCase === useCase.id ? 'rotated' : ''}`} />
                      </button>
                    </div>

                    {selectedUseCase === useCase.id && (
                      <div className="expanded-content">
                        <div className="content-section">
                          <h5 className="section-title">Key Features</h5>
                          <div className="features-list">
                            {useCase.features.map((feature, idx) => (
                              <div key={idx} className="feature-item">
                                <FiCheck className="feature-check" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="challenge-solution">
                          <div className="challenges">
                            <h6>Challenges We Solve</h6>
                            {useCase.challenges.map((challenge, idx) => (
                              <div key={idx} className="challenge-item">
                                <span className="challenge-dot"></span>
                                <span>{challenge}</span>
                              </div>
                            ))}
                          </div>
                          <div className="solutions">
                            <h6>Our Solutions</h6>
                            {useCase.solutions.map((solution, idx) => (
                              <div key={idx} className="solution-item">
                                <FiCheck className="solution-check" />
                                <span>{solution}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="card-glow" style={{ background: useCase.gradient }}></div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Modal.Body>

        <Modal.Footer className="usecases-footer border-0">
          <div className="footer-content">
            <div className="footer-stats">
              <div className="stat-item">
                <FiUsers className="stat-icon" />
                <div>
                  <span className="stat-number">50K+</span>
                  <span className="stat-label">Teams Empowered</span>
                </div>
              </div>
              <div className="stat-item">
                <FiClock className="stat-icon" />
                <div>
                  <span className="stat-number">10hrs</span>
                  <span className="stat-label">Saved Per Week</span>
                </div>
              </div>
              <div className="stat-item">
                <FiTrendingUp className="stat-icon" />
                <div>
                  <span className="stat-number">85%</span>
                  <span className="stat-label">Faster Decisions</span>
                </div>
              </div>
            </div>
            
            <div className="footer-actions">
              <Button 
                variant="outline-primary" 
                onClick={handleClose}
                className="btn-secondary-enhanced"
              >
                Explore Later
              </Button>
              <Button 
                variant="primary" 
                onClick={handleClose}
                className="btn-primary-enhanced"
              >
                <FaRocket className="btn-icon" />
                Start Your Journey
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default UseCasesModal;