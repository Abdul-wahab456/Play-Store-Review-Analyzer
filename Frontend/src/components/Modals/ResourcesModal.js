import React, { useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { 
  FaQuestionCircle, 
  FaFileAlt, 
  FaPlay,
  FaBook,
  FaUsers,
  FaCode,
  FaLifeRing,
  FaGraduationCap
} from 'react-icons/fa';
import { 
  FiX, 
  FiExternalLink, 
  FiDownload,
  FiMessageCircle,
  FiBookOpen,
  FiHelpCircle,
  FiZap,
  FiClock,
  FiStar,
  FiArrowRight,
  FiUsers
} from 'react-icons/fi';
import './ResourcesModal.css';

const ResourcesModal = ({ show, handleClose }) => {
  const [hoveredResource, setHoveredResource] = useState(null);

  const resources = [
    {
      id: 'help-center',
      title: 'Help Center',
      category: 'Support',
      icon: <FaQuestionCircle size={24} />,
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      description: 'Videos and guides to help you get the most out of Smart Upgrades.',
      items: [
        'Getting started guide',
        'Video tutorials',
        'Best practices'
      ],
      stats: {
        articles: '150+',
        videos: '25+'
      },
      badge: 'Popular',
      action: 'Browse Help',
      icon2: <FiHelpCircle />
    },
    {
      id: 'faqs',
      title: 'FAQs',
      category: 'Quick Answers',
      icon: <FaFileAlt size={24} />,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      description: 'The answers to all your burning questions about Smart Upgrades!',
      items: [
        'Common questions',
        'Setup & configuration',
        'Billing & pricing'
      ],
      stats: {
        questions: '75+',
        categories: '8'
      },
      badge: 'Quick',
      action: 'View FAQs',
      icon2: <FiMessageCircle />
    },
    {
      id: 'video-tutorials',
      title: 'Video Tutorials',
      category: 'Learn Visually',
      icon: <FaPlay size={24} />,
      color: '#EF4444',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      description: 'Step-by-step video guides to master every feature of our platform.',
      items: [
        'Platform overview',
        'Advanced features',
        'Integration guides'
      ],
      stats: {
        videos: '40+',
        hours: '12+'
      },
      badge: 'Interactive',
      action: 'Watch Now',
      icon2: <FaPlay />
    },
    {
      id: 'documentation',
      title: 'Documentation',
      category: 'Technical Reference',
      icon: <FaBook size={24} />,
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      description: 'Comprehensive technical documentation for developers and power users.',
      items: [
        'API reference',
        'SDK documentation',
        'Integration examples'
      ],
      stats: {
        pages: '200+',
        endpoints: '50+'
      },
      badge: 'Technical',
      action: 'Read Docs',
      icon2: <FiBookOpen />
    },
    {
      id: 'community',
      title: 'Community',
      category: 'Connect & Share',
      icon: <FaUsers size={24} />,
      color: '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      description: 'Join our vibrant community of users sharing tips, tricks, and experiences.',
      items: [
        'Discussion forums',
        'User groups',
        'Feature requests'
      ],
      stats: {
        members: '10K+',
        posts: '5K+'
      },
      badge: 'Active',
      action: 'Join Community',
      icon2: <FiUsers />
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      category: 'Developer Tools',
      icon: <FaCode size={24} />,
      color: '#1F2937',
      gradient: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
      description: 'Complete API documentation with examples and interactive testing tools.',
      items: [
        'REST API endpoints',
        'Authentication guide',
        'Code examples'
      ],
      stats: {
        endpoints: '45+',
        examples: '100+'
      },
      badge: 'Developer',
      action: 'Explore API',
      icon2: <FaCode />
    }
  ];

  const handleResourceClick = (resource) => {
    console.log('Opening resource:', resource.title);
    // Add your resource navigation logic here
  };

  const handleDownloadResource = () => {
    console.log('Downloading resource pack');
    // Add download logic here
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      size="lg"
      className="resources-modal-enhanced"
      backdrop="static"
    >
      <div className="modal-overlay">
        <Modal.Header className="resources-header border-0">
          <div className="header-content">
            <div className="header-badge">
              <FiZap className="badge-icon" />
              <span>Resources</span>
            </div>
            <h2 className="resources-title">
              Everything You Need to 
              <span className="gradient-text"> Succeed</span>
            </h2>
            <p className="resources-subtitle">
              Comprehensive resources to help you master Smart Upgrades and get the most out of our platform.
            </p>
          </div>
          <button 
            className="close-button-enhanced"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </Modal.Header>

        <Modal.Body className="resources-body">
          <div className="resources-grid">
            <Row className="g-3">
              {resources.map((resource) => (
                <Col lg={6} xl={4} key={resource.id}>
                  <div 
                    className="resource-card"
                    onMouseEnter={() => setHoveredResource(resource.id)}
                    onMouseLeave={() => setHoveredResource(null)}
                    onClick={() => handleResourceClick(resource)}
                  >
                    <div className="card-header">
                      <div 
                        className="resource-icon-wrapper"
                        style={{ background: resource.gradient }}
                      >
                        {resource.icon}
                      </div>
                      <div className="resource-badge" style={{ background: resource.gradient }}>
                        {resource.badge}
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="resource-category">{resource.category}</div>
                      <h4 className="resource-title">{resource.title}</h4>
                      <p className="resource-description">{resource.description}</p>
                      
                      <div className="resource-stats">
                        {Object.entries(resource.stats).map(([key, value]) => (
                          <div key={key} className="stat-item">
                            <span className="stat-value" style={{ color: resource.color }}>{value}</span>
                            <span className="stat-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="resource-items">
                        {resource.items.map((item, idx) => (
                          <div key={idx} className="item-check">
                            <span className="check-dot" style={{ backgroundColor: resource.color }}></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        className="resource-action-btn"
                        style={{ 
                          background: hoveredResource === resource.id ? resource.gradient : 'transparent',
                          borderColor: resource.color,
                          color: hoveredResource === resource.id ? 'white' : resource.color
                        }}
                      >
                        <span>{resource.action}</span>
                        <FiArrowRight className="action-arrow" />
                      </button>
                    </div>
                    
                    <div className="card-glow" style={{ background: resource.gradient }}></div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <div className="quick-stats">
            <div className="stats-grid">
              <div className="quick-stat">
                <FiBookOpen className="stat-icon" />
                <div>
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Articles & Guides</span>
                </div>
              </div>
              <div className="quick-stat">
                <FiClock className="stat-icon" />
                <div>
                  <span className="stat-number">1hr</span>
                  <span className="stat-label">Avg Response</span>
                </div>
              </div>
              <div className="quick-stat">
                <FiStar className="stat-icon" />
                <div>
                  <span className="stat-number">4.9/5</span>
                  <span className="stat-label">Satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="resources-footer border-0">
          <div className="footer-content">
            <div className="footer-info">
              <div className="info-text">
                <h6>Need immediate help?</h6>
                <p>Our support team is available 24/7 to assist you.</p>
              </div>
            </div>
            
            <div className="footer-actions">
              <Button 
                variant="outline-primary" 
                onClick={handleDownloadResource}
                className="btn-secondary-enhanced"
                size="sm"
              >
                <FiDownload className="btn-icon" />
                Download
              </Button>
              <Button 
                variant="primary" 
                onClick={handleClose}
                className="btn-primary-enhanced"
                size="sm"
              >
                <FiExternalLink className="btn-icon" />
                Help Center
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default ResourcesModal;