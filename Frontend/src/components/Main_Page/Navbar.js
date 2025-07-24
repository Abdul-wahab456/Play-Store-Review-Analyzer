import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { 
  FiChevronDown,
  FiUser,
  FiLogIn,
  FiZap,
  FiStar
} from 'react-icons/fi';
import FeaturesModal from '../Modals/FeaturesModal';
import SourcesModal from '../Modals/SourcesModal';
import UseCasesModal from '../Modals/UseCasesModal';
import ResourcesModal from '../Modals/ResourcesModal';
import PricingModal from '../Modals/PricingModal';
import SignInModal from '../Modals/SignInModal';
import SignUpModal from '../Modals/SignUpModal';
import Logo from '../Logo.png'; // Updated import path
import './Navbar.css';

const CustomNavbar = () => {
  const [showFeatures, setShowFeatures] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showUseCases, setShowUseCases] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Navbar 
        expand="lg" 
        className={`navbar-custom ${scrolled ? 'navbar-scrolled' : ''}`}
        fixed="top"
      >
        <Container>
          {/* Enhanced Brand Logo - Updated with your logo */}
          <Navbar.Brand href="#home" className="brand-container">
            <div className="logo-wrapper">
              <div className="logo-background">
                <img
                  src={Logo}
                  alt="Smart Upgrades Logo"
                  className="brand-logo"
                />
              </div>
              <div className="logo-glow"></div>
            </div>
            <div className="brand-text-container">
              <span className="brand-text">
                <span className="text-gradient">Smart</span>
                <span className="text-dark">Upgrades</span>
              </span>
              <div className="brand-tagline">Analytics Platform</div>
            </div>
          </Navbar.Brand>

          {/* Navigation - Always Visible */}
          <Nav className="navbar-nav-center mx-auto">
            <div className="nav-item-wrapper">
              <button 
                onClick={() => setShowFeatures(true)}
                className="nav-link-modern"
              >
                <span className="nav-text">Features</span>
                <FiChevronDown className="nav-icon" />
                <div className="nav-hover-effect"></div>
              </button>
            </div>

            <div className="nav-item-wrapper">
              <button 
                onClick={() => setShowSources(true)}
                className="nav-link-modern"
              >
                <span className="nav-text">Sources</span>
                <FiChevronDown className="nav-icon" />
                <div className="nav-hover-effect"></div>
              </button>
            </div>

            <div className="nav-item-wrapper">
              <button 
                onClick={() => setShowUseCases(true)}
                className="nav-link-modern"
              >
                <span className="nav-text">Use Cases</span>
                <FiChevronDown className="nav-icon" />
                <div className="nav-hover-effect"></div>
              </button>
            </div>

            <div className="nav-item-wrapper">
              <button 
                onClick={() => setShowResources(true)}
                className="nav-link-modern"
              >
                <span className="nav-text">Resources</span>
                <FiChevronDown className="nav-icon" />
                <div className="nav-hover-effect"></div>
              </button>
            </div>

            <div className="nav-item-wrapper">
              <button 
                onClick={() => setShowPricing(true)}
                className="nav-link-modern pricing-highlight"
              >
                <span className="nav-text">Pricing</span>
                <FiStar className="nav-icon" />
                <div className="nav-hover-effect"></div>
                <div className="pricing-badge">New</div>
              </button>
            </div>
          </Nav>

          {/* Auth Buttons */}
          <Nav className="navbar-auth-buttons">
            <Button 
              className="btn-signin"
              onClick={() => setShowSignIn(true)}
            >
              <FiLogIn className="btn-icon" />
              <span>Sign In</span>
            </Button>
            
            <Button 
              className="btn-signup"
              onClick={() => {
                setShowSignIn(false);
                setShowSignUp(true);
              }}
            >
              <FiZap className="btn-icon" />
              <span>Get Started</span>
              <div className="btn-glow"></div>
            </Button>
          </Nav>
        </Container>

        {/* Navbar bottom border animation */}
        <div className="navbar-border"></div>
      </Navbar>

      {/* Modals */}
      <FeaturesModal show={showFeatures} handleClose={() => setShowFeatures(false)} />
      <SourcesModal show={showSources} handleClose={() => setShowSources(false)} />
      <UseCasesModal show={showUseCases} handleClose={() => setShowUseCases(false)} />
      <ResourcesModal show={showResources} handleClose={() => setShowResources(false)} />
      <PricingModal show={showPricing} handleClose={() => setShowPricing(false)} />
      <SignInModal 
        show={showSignIn} 
        handleClose={() => setShowSignIn(false)} 
        handleShowSignUp={() => {
          setShowSignIn(false);
          setShowSignUp(true);
        }}
      />
      <SignUpModal show={showSignUp} handleClose={() => setShowSignUp(false)} />
    </>
  );
};

export default CustomNavbar;