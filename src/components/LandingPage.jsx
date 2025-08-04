import React from 'react';
import './LandingPage.css';
import WhyChoose from './WhyChoose';
import FooterCTA from './FooterCTA';
import homeBackVideo from '../video/home back 1.mp4';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ user }) => {
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    try {
      navigate('/register');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  return (
    <div className="page-decor-right">
      <div className="landing-root">
        {user && (
          <div style={{
            width: '100%',
            background: '#ffd740',
            color: '#23201d',
            fontWeight: 700,
            fontSize: 22,
            textAlign: 'center',
            padding: '18px 0',
            marginBottom: 0
          }}>
            Welcome, {user.email}!
          </div>
        )}
        <section className="landing-hero">
          <video className="hero-video-bg" autoPlay loop muted playsInline>
            <source src={homeBackVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="hero-video-overlay" />
          <div className="hero-content">
            <h1>Find and Reserve Parking Instantly</h1>
            <p className="hero-sub">
              Real-time parking spot search, reservation, and payment. Hassle-free parking for drivers and easy management for lot owners.
            </p>
            <div className="hero-buttons" style={{ justifyContent: 'center' }}>
              <button className="hero-btn yellow" onClick={handleSignUpClick}>Sign Up Free</button>
            </div>
          </div>
        </section>
        <WhyChoose />
        <FooterCTA />
      </div>
    </div>
  );
};

export default LandingPage; 