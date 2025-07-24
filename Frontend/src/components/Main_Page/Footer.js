import React from 'react';
import { Row, Col, Container } from 'react-bootstrap';
import { 
  FiFacebook, 
  FiTwitter, 
  FiLinkedin, 
  FiInstagram,
  FiMail,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';
import Logo from '../images/Logo.png';
import './Footer.css'; // Create this new CSS file

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-custom bg-dark text-white pt-5 pb-4">
      <Container>
        <Row className="g-4">
          {/* Company Info */}
          <Col lg={4} className="mb-4">
            <div className="footer-brand d-flex align-items-center mb-3">
              <img
                src={Logo}
                alt="Smart Upgrades Logo"
                className="footer-logo me-2"
              />
              <h4 className="mb-0">
                <span className="text-primary">Smart</span>Upgrades
              </h4>
            </div>
            <p className="text-muted">
              Transforming user feedback into actionable insights with our AI-powered analytics platform.
            </p>
            
            <div className="social-icons mt-4">
              <a href="#" className="text-white me-3"><FiFacebook size={20} /></a>
              <a href="#" className="text-white me-3"><FiTwitter size={20} /></a>
              <a href="#" className="text-white me-3"><FiLinkedin size={20} /></a>
              <a href="#" className="text-white"><FiInstagram size={20} /></a>
            </div>
          </Col>

          {/* Quick Links */}
          <Col md={4} lg={2} className="mb-4">
            <h5 className="footer-heading mb-4">Company</h5>
            <ul className="footer-links list-unstyled">
              <li className="mb-2"><a href="#" className="text-muted">About Us</a></li>
              <li className="mb-2"><a href="#" className="text-muted">Careers</a></li>
              <li className="mb-2"><a href="#" className="text-muted">Pricing</a></li>
              <li className="mb-2"><a href="#" className="text-muted">Blog</a></li>
            </ul>
          </Col>

          {/* Resources */}
          <Col md={4} lg={2} className="mb-4">
            <h5 className="footer-heading mb-4">Resources</h5>
            <ul className="footer-links list-unstyled">
              <li className="mb-2"><a href="#" className="text-muted">Documentation</a></li>
              <li className="mb-2"><a href="#" className="text-muted">Help Center</a></li>
              <li className="mb-2"><a href="#" className="text-muted">API Status</a></li>
              <li className="mb-2"><a href="#" className="text-muted">Guides</a></li>
            </ul>
          </Col>

          {/* Contact */}
          <Col md={4} lg={4} className="mb-4">
            <h5 className="footer-heading mb-4">Contact Us</h5>
            <ul className="footer-contact list-unstyled">
              <li className="mb-3 d-flex align-items-start">
                <FiMail className="me-2 mt-1" />
                <span className="text-muted">contact@smartupgrades.com</span>
              </li>
              <li className="mb-3 d-flex align-items-start">
                <FiPhone className="me-2 mt-1" />
                <span className="text-muted">+1 (555) 123-4567</span>
              </li>
              <li className="d-flex align-items-start">
                <FiMapPin className="me-2 mt-1" />
                <span className="text-muted">123 Tech Street, Silicon Valley, CA 94025</span>
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="my-4 bg-secondary" />

        <Row>
          <Col md={6} className="text-center text-md-start">
            <p className="text-muted small mb-0">
              &copy; {currentYear} Smart Upgrades. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <ul className="list-inline small mb-0">
              <li className="list-inline-item"><a href="#" className="text-muted">Privacy Policy</a></li>
              <li className="list-inline-item mx-2">·</li>
              <li className="list-inline-item"><a href="#" className="text-muted">Terms of Service</a></li>
              <li className="list-inline-item mx-2">·</li>
              <li className="list-inline-item"><a href="#" className="text-muted">Cookies</a></li>
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;