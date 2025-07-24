import React, { useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { 
  FaGooglePlay, 
  FaApple, 
  FaWindows, 
  FaAmazon,
  FaAndroid,
  FaSteam
} from 'react-icons/fa';
import { 
  FiX, 
  FiCheck, 
  FiStar, 
  FiDownload,
  FiUsers,
  FiTrendingUp,
  FiShield,
  FiZap
} from 'react-icons/fi';
import './SourcesModal.css';

const SourcesModal = ({ show, handleClose }) => {
  const [selectedSources, setSelectedSources] = useState([]);

  const sources = [
    {
      id: 'google-play',
      name: 'Google Play Store',
      icon: <FaGooglePlay size={32} />,
      color: '#4285F4',
      gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
      description: 'Track Android app reviews and ratings from the world\'s largest mobile app marketplace.',
      stats: {
        apps: '3.5M+',
        reviews: '1B+',
        users: '2.5B+'
      },
      features: [
        'Real-time review monitoring',
        'Rating trend analysis',
        'Developer response tracking',
        'Keyword sentiment analysis'
      ],
      badge: 'Most Popular',
      connectivity: 'Instant Setup'
    },
    {
      id: 'app-store',
      name: 'Apple App Store',
      icon: <FaApple size={32} />,
      color: '#007AFF',
      gradient: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
      description: 'Monitor iOS app feedback and ratings from Apple\'s premium app ecosystem.',
      stats: {
        apps: '2M+',
        reviews: '500M+',
        users: '1.8B+'
      },
      features: [
        'iOS review analytics',
        'App Store Connect integration',
        'Version-based tracking',
        'Premium user insights'
      ],
      badge: 'Premium Quality',
      connectivity: 'API Integration'
    },
    {
      id: 'microsoft-store',
      name: 'Microsoft Store',
      icon: <FaWindows size={32} />,
      color: '#00BCF2',
      gradient: 'linear-gradient(135deg, #00BCF2 0%, #0078D4 100%)',
      description: 'Analyze Windows and Xbox app reviews across Microsoft\'s unified platform.',
      stats: {
        apps: '669K+',
        reviews: '50M+',
        users: '400M+'
      },
      features: [
        'Windows app monitoring',
        'Xbox game reviews',
        'Cross-device analytics',
        'Enterprise insights'
      ],
      badge: 'Enterprise Ready',
      connectivity: 'Direct API'
    },
    {
      id: 'amazon-appstore',
      name: 'Amazon Appstore',
      icon: <FaAmazon size={32} />,
      color: '#FF9900',
      gradient: 'linear-gradient(135deg, #FF9900 0%, #FF6B00 100%)',
      description: 'Track reviews from Amazon\'s growing Android alternative marketplace.',
      stats: {
        apps: '460K+',
        reviews: '25M+',
        users: '50M+'
      },
      features: [
        'Fire TV app tracking',
        'Alexa skill reviews',
        'Amazon device insights',
        'Prime user analytics'
      ],
      badge: 'Fast Growing',
      connectivity: 'Quick Connect'
    },
    {
      id: 'steam',
      name: 'Steam Store',
      icon: <FaSteam size={32} />,
      color: '#1B2838',
      gradient: 'linear-gradient(135deg, #1B2838 0%, #2A475E 100%)',
      description: 'Monitor PC game reviews and community feedback from Steam\'s massive platform.',
      stats: {
        apps: '50K+',
        reviews: '100M+',
        users: '120M+'
      },
      features: [
        'Game review tracking',
        'Community discussions',
        'User-generated content',
        'Sales impact analysis'
      ],
      badge: 'Gaming Focus',
      connectivity: 'Web API'
    },
    {
      id: 'samsung-galaxy',
      name: 'Galaxy Store',
      icon: <FaAndroid size={32} />,
      color: '#1428A0',
      gradient: 'linear-gradient(135deg, #1428A0 0%, #0066CC 100%)',
      description: 'Access Samsung Galaxy Store reviews and ratings for Android apps.',
      stats: {
        apps: '100K+',
        reviews: '10M+',
        users: '450M+'
      },
      features: [
        'Samsung device focus',
        'Galaxy-specific insights',
        'One UI optimization',
        'Regional analytics'
      ],
      badge: 'Device Specific',
      connectivity: 'Partner API'
    }
  ];

  const toggleSource = (sourceId) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleConnectSources = () => {
    if (selectedSources.length > 0) {
      console.log('Connecting sources:', selectedSources);
      // Add your connection logic here
    }
    handleClose();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      size="xl"
      className="sources-modal-enhanced"
      backdrop="static"
    >
      <div className="modal-overlay">
        <Modal.Header className="sources-header border-0">
          <div className="header-content">
            <div className="header-badge">
              <FiZap className="badge-icon" />
              <span>Data Sources</span>
            </div>
            <h2 className="sources-title">
              Connect Your 
              <span className="gradient-text"> App Stores</span>
            </h2>
            <p className="sources-subtitle">
              Monitor reviews and ratings across all major app marketplaces. 
              Get unified insights from multiple platforms in one dashboard.
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

        <Modal.Body className="sources-body">
          <div className="sources-grid">
            <Row className="g-4">
              {sources.map((source) => (
                <Col lg={6} key={source.id}>
                  <div 
                    className={`source-card ${selectedSources.includes(source.id) ? 'selected' : ''}`}
                    onClick={() => toggleSource(source.id)}
                  >
                    <div className="card-header">
                      <div 
                        className="source-icon-wrapper"
                        style={{ background: source.gradient }}
                      >
                        {source.icon}
                      </div>
                      <div className="source-badge" style={{ background: source.gradient }}>
                        {source.badge}
                      </div>
                      <div className="selection-indicator">
                        <FiCheck className="check-icon" />
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <h4 className="source-title">{source.name}</h4>
                      <p className="source-description">{source.description}</p>
                      
                      <div className="source-stats">
                        <div className="stat-item">
                          <span className="stat-value">{source.stats.apps}</span>
                          <span className="stat-label">Apps</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{source.stats.reviews}</span>
                          <span className="stat-label">Reviews</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{source.stats.users}</span>
                          <span className="stat-label">Users</span>
                        </div>
                      </div>
                      
                      <div className="source-features">
                        {source.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="feature-item">
                            <FiCheck size={14} className="feature-check" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="connectivity-info">
                        <FiShield className="shield-icon" />
                        <span>{source.connectivity}</span>
                      </div>
                    </div>
                    
                    <div className="card-glow" style={{ background: source.gradient }}></div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <div className="selection-summary">
            <div className="summary-content">
              <div className="summary-info">
                <FiUsers className="summary-icon" />
                <div>
                  <h5 className="summary-title">
                    {selectedSources.length} Source{selectedSources.length !== 1 ? 's' : ''} Selected
                  </h5>
                  <p className="summary-description">
                    {selectedSources.length === 0 
                      ? 'Select app stores to monitor your reviews and ratings'
                      : `Ready to connect ${selectedSources.length} platform${selectedSources.length !== 1 ? 's' : ''} for comprehensive analytics`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="sources-footer border-0">
          <div className="footer-content">
            <div className="footer-info">
              <div className="info-item">
                <FiStar className="info-icon" />
                <span>Real-time sync</span>
              </div>
              <div className="info-item">
                <FiShield className="info-icon" />
                <span>Secure connection</span>
              </div>
              <div className="info-item">
                <FiTrendingUp className="info-icon" />
                <span>Advanced analytics</span>
              </div>
            </div>
            
            <div className="footer-actions">
              <Button 
                variant="outline-primary" 
                onClick={handleClose}
                className="btn-secondary-enhanced"
              >
                Configure Later
              </Button>
              <Button 
                variant="primary" 
                onClick={handleConnectSources}
                className="btn-primary-enhanced"
                disabled={selectedSources.length === 0}
              >
                <FiDownload className="btn-icon" />
                Connect {selectedSources.length > 0 ? `${selectedSources.length} ` : ''}Source{selectedSources.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default SourcesModal;