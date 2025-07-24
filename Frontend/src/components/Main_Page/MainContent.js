import React, { useRef, useEffect, useState } from 'react';
import { Row, Col, Card, Button, Container } from 'react-bootstrap';
import SignInModal from '../Modals/SignInModal.js';
import './MainContent.css';

const MainContent = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleShowSignIn = () => setShowSignIn(true);
  const handleCloseSignIn = () => setShowSignIn(false);
  const handleShowSignUp = () => setShowSignUp(true);
  const handleCloseSignUp = () => setShowSignUp(false);

  // Custom Icon Components
  const RocketIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
    </svg>
  );

  const ChartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16,11V3H8V7H16M9,8V21H7V8H9M12,14H14V21H12V14Z"/>
    </svg>
  );

  const ShieldIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V14H16V22H8V14H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V14H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
    </svg>
  );

  const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
    </svg>
  );

  const BoltIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11,4H6L10.5,12H7.5L13,20L11,4Z"/>
    </svg>
  );

  const MobileIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z"/>
    </svg>
  );

  const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
    </svg>
  );

  const CommentsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"/>
    </svg>
  );

  const HistoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z"/>
    </svg>
  );

  const PieChartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11,2V22C5.9,21.5 2,17.2 2,12C2,6.8 5.9,2.5 11,2M13,2V11H22C22,6.8 18.1,2.5 13,2M13,13V22C18.1,21.5 22,17.2 22,12H13Z"/>
    </svg>
  );

  const StarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/>
    </svg>
  );

  const SmileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M17,9A1,1 0 0,1 16,8A1,1 0 0,1 17,7A1,1 0 0,1 18,8A1,1 0 0,1 17,9M7,9A1,1 0 0,1 6,8A1,1 0 0,1 7,7A1,1 0 0,1 8,8A1,1 0 0,1 7,9M12,17.5C9.67,17.5 7.69,16.04 6.89,14H17.11C16.31,16.04 14.33,17.5 12,17.5Z"/>
    </svg>
  );

  const LightbulbIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z"/>
    </svg>
  );

  const UsersIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16,4C18.21,4 20,5.79 20,8C20,10.21 18.21,12 16,12C13.79,12 12,10.21 12,8C12,5.79 13.79,4 16,4M16,14C18.67,14 24,15.33 24,18V20H8V18C8,15.33 13.33,14 16,14M8,4C10.21,4 12,5.79 12,8C12,10.21 10.21,12 8,12C5.79,12 4,10.21 4,8C4,5.79 5.79,4 8,4M8,14C10.67,14 16,15.33 16,18V20H0V18C0,15.33 5.33,14 8,14Z"/>
    </svg>
  );

  const featureData = [
    {
      icon: <CommentsIcon />,
      title: "Smart Response Templates",
      content: "AI-powered response suggestions that help you engage meaningfully with user feedback and build stronger relationships.",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      icon: <HistoryIcon />,
      title: "Advanced Trend Analytics",
      content: "Deep historical insights revealing patterns and opportunities in your app's performance evolution over time.",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      icon: <PieChartIcon />,
      title: "Competitive Intelligence",
      content: "Comprehensive competitor analysis with actionable benchmarks to stay ahead in your market segment.",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    }
  ];

  const handleSignIn = () => {
    handleShowSignIn();
  };

  return (
    <div className="main-content-wrapper">
      {/* Hero Section - Better Aligned */}
      <section className="hero-section-compact">
        <div className="hero-background"></div>
        <Container fluid className="hero-container">
          <Row className="justify-content-center align-items-center hero-row-compact">
            <Col xl={5} lg={6} md={12} className="hero-text">
              <div className="text-center text-lg-start">

                <h1 className="hero-title">
                  Turn User Feedback Into 
                  <span className="gradient-text"> Growth Engine</span>
                </h1>
                <p className="hero-subtitle">
                  Harness the power of AI to decode user sentiment, identify opportunities, 
                  and accelerate your app's success with data-driven insights.
                </p>
                <div className="hero-buttons">
                  <Button 
                    className="btn-primary-custom me-3"
                    size="lg" 
                    onClick={handleSignIn}
                  >
                    <BoltIcon />
                    <span className="ms-2">Get Started Free</span>
                  </Button>
                  <Button 
                    className="btn-secondary-custom"
                    size="lg"
                    onClick={handleSignIn}
                  >
                    <EyeIcon />
                    <span className="ms-2">Watch Demo</span>
                  </Button>
                </div>
                <div className="hero-stats">
                  <div className="stat-item">
                    <span className="stat-number">10M+</span>
                    <span className="stat-label">Reviews Analyzed</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">5K+</span>
                    <span className="stat-label">Apps Optimized</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">98%</span>
                    <span className="stat-label">Satisfaction Rate</span>
                  </div>
                </div>
              </div>
            </Col>
            <Col xl={5} lg={6} md={12} className="hero-image d-flex justify-content-center">
              <div className="dashboard-preview">
                <div className="preview-header">
                  <div className="preview-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
                <div className="preview-content">
                  <div className="preview-chart">
                    <div className="chart-bars">
                      <div className="bar bar-1"></div>
                      <div className="bar bar-2"></div>
                      <div className="bar bar-3"></div>
                      <div className="bar bar-4"></div>
                      <div className="bar bar-5"></div>
                    </div>
                  </div>
                  <div className="preview-metrics">
                    <div className="metric">
                      <div className="metric-dot positive"></div>
                      <span>Positive Reviews: 87%</span>
                    </div>
                    <div className="metric">
                      <div className="metric-dot warning"></div>
                      <span>Rating Trend: ↗ 4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Key Metrics Section */}
      <section className="metrics-section py-5 bg-light">
        <Container>
          <Row className="g-4">
            {[
              { value: '4.8★', label: 'Average Rating', icon: <StarIcon />, color: '#F59E0B' },
              { value: '87%', label: 'Positive Sentiment', icon: <SmileIcon />, color: '#10B981' },
              { value: '2.4h', label: 'Avg Response Time', icon: <CommentsIcon />, color: '#3B82F6' },
              { value: '340%', label: 'ROI Improvement', icon: <ChartIcon />, color: '#8B5CF6' }
            ].map((metric, index) => (
              <Col md={3} key={index}>
                <Card className="metric-card border-0 shadow-sm h-100 text-center">
                  <Card.Body>
                    <div 
                      className="metric-icon mx-auto mb-3"
                      style={{backgroundColor: `${metric.color}20`, color: metric.color}}
                    >
                      {metric.icon}
                    </div>
                    <h3 className="metric-value">{metric.value}</h3>
                    <p className="metric-label text-muted">{metric.label}</p>
                    
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Main Features Section */}
      <section className="features-section py-5">
        <Container>
          <div className="section-header text-center mb-5">
            <div className="section-badge">
              <ChartIcon />
              <span className="ms-2">Core Features</span>
            </div>
            <h2 className="section-title mb-3">
              Everything You Need to <span className="gradient-text">Dominate</span> Your Market
            </h2>
            <p className="section-subtitle text-muted">
              Powerful tools designed to transform how you understand and optimize your app's performance
            </p>
          </div>

          <Row className="g-5">
            <Col lg={6}>
              <Card className="feature-card-main border-0 shadow h-100">
                <Card.Body className="p-4">
                  <div className="feature-icon-main mb-4">
                    <MobileIcon />
                  </div>
                  <h3 className="feature-title mb-3">Intelligent Review Analysis</h3>
                  <p className="feature-description text-muted mb-4">
                    Our advanced AI engine processes thousands of reviews instantly, extracting 
                    meaningful insights and identifying critical improvement areas that directly 
                    impact user satisfaction and app store rankings.
                  </p>
                  <div className="feature-highlights">
                    <div className="highlight-item d-flex align-items-center mb-3">
                      <div className="highlight-icon me-3">
                        <BoltIcon />
                      </div>
                      <span>Real-time sentiment detection across 50+ languages</span>
                    </div>
                    <div className="highlight-item d-flex align-items-center mb-3">
                      <div className="highlight-icon me-3">
                        <EyeIcon />
                      </div>
                      <span>Automated issue categorization and priority scoring</span>
                    </div>
                    <div className="highlight-item d-flex align-items-center">
                      <div className="highlight-icon me-3">
                        <ChartIcon />
                      </div>
                      <span>Custom dashboards with actionable recommendations</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="feature-card-main security border-0 shadow h-100">
                <Card.Body className="p-4">
                  <div className="feature-icon-main security mb-4">
                    <ShieldIcon />
                  </div>
                  <h3 className="feature-title mb-3">Bank-Level Security</h3>
                  <p className="feature-description text-muted mb-3">
                    Your sensitive data deserves the highest protection. We implement 
                    enterprise-grade security measures that exceed industry standards, 
                    ensuring complete privacy and compliance with global regulations.
                  </p>
                  <div className="security-badge mb-4">
                    <LockIcon />
                    <span className="ms-2">AES-256 Encryption • SOC 2 Certified • GDPR Compliant</span>
                  </div>
                  <div className="feature-highlights">
                    <div className="highlight-item d-flex align-items-center mb-3">
                      <div className="highlight-icon me-3">
                        <ShieldIcon />
                      </div>
                      <span>Continuous security monitoring and threat detection</span>
                    </div>
                    <div className="highlight-item d-flex align-items-center mb-3">
                      <div className="highlight-icon me-3">
                        <UsersIcon />
                      </div>
                      <span>Granular access controls and team permissions</span>
                    </div>
                    <div className="highlight-item d-flex align-items-center">
                      <div className="highlight-icon me-3">
                        <LockIcon />
                      </div>
                      <span>Zero-knowledge architecture with end-to-end encryption</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Additional Features Section */}
      <section className="more-features py-5 bg-light">
        <Container>
          <div className="section-header text-center mb-5">
            <div className="section-badge">
              <LightbulbIcon />
              <span className="ms-2">Advanced Tools</span>
            </div>
            <h2 className="section-title mb-3">
              Unlock Your App's <span className="gradient-text">Full Potential</span>
            </h2>
            <p className="section-subtitle text-muted">
              Professional-grade features that give you a competitive edge in the app marketplace
            </p>
          </div>

          <Row className="g-4">
            {featureData.map((feature, index) => (
              <Col md={4} key={index}>
                <Card className="feature-card-small border-0 shadow-sm h-100 text-center position-relative">
                  <Card.Body className="p-4">
                    <div 
                      className="feature-icon-small mx-auto mb-4"
                      style={{background: feature.gradient}}
                    >
                      {feature.icon}
                    </div>
                    <h4 className="feature-title-small mb-3">{feature.title}</h4>
                    <p className="feature-description-small text-muted mb-4">{feature.content}</p>
                    <div className="feature-arrow">
                      <ChartIcon />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5">
        <div className="cta-background"></div>
        <Container className="position-relative">
          <Row className="justify-content-center">
            <Col lg={8} className="text-center text-white">
              <h2 className="cta-title mb-4">
                Ready to <span className="gradient-text">Transform</span> Your App's Future?
              </h2>
              <p className="cta-subtitle mb-5">
                Join over 5,000 successful app developers who rely on our platform 
                for game-changing insights and measurable results.
              </p>
              <div className="cta-buttons mb-4">
                <Button 
                  className="btn-primary-custom me-3"
                  size="lg"
                  onClick={handleSignIn}
                >
                  <RocketIcon />
                  <span className="ms-2">Start Free Trial</span>
                </Button>
                <Button 
                  className="btn-secondary-custom"
                  size="lg"
                  onClick={handleSignIn}
                >
                  <CommentsIcon />
                  <span className="ms-2">Schedule Demo</span>
                </Button>
              </div>
              <div className="cta-guarantee">
                <ShieldIcon />
                <span className="ms-2">14-day free trial • No credit card required • Cancel anytime</span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* SignIn Modal */}
      <SignInModal 
        show={showSignIn} 
        handleClose={handleCloseSignIn}
        handleShowSignUp={handleShowSignUp}
      />
    </div>
  );
};

export default MainContent;