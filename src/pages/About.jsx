import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import NicoleImg from '../imgs/nicole.jpg';
import AlvisImg from '../imgs/Alvis.jpg';
import DasylynImg from '../imgs/dasylyn.jpg';

const aboutContainer = {
  fontFamily: 'Inter, Poppins, sans-serif',
  background: 'transparent',
  minHeight: '100vh',
  margin: 0,
  padding: 0,
  color: '#23201d',
};
const sectionStyle = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '48px 16px',
  borderRadius: 24,
  background: 'transparent',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  marginTop: 40,
};
const headingStyle = {
  fontWeight: 800,
  fontSize: 38,
  marginBottom: 10,
  letterSpacing: 1,
  color: '#ffd740',
    textAlign: 'center',
};
const subheadingStyle = {
  fontSize: 22,
  color: '#23201d',
  fontWeight: 600,
  marginBottom: 18,
  textAlign: 'center',
  };
const textStyle = {
  fontSize: 18,
  color: '#44413c',
  marginBottom: 18,
        textAlign: 'center',
};
const ctaStyle = {
  display: 'block',
          background: '#ffd740',
          color: '#23201d',
          fontWeight: 700,
          fontSize: 20,
          padding: '16px 40px',
          borderRadius: 12,
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          transition: 'background 0.2s, transform 0.2s',
  margin: '32px auto 0',
  width: 'fit-content',
};

const About = () => (
  <div className="page-decor-right">
    <div className="about-section">
      <h1 className="about-title">About Parking Space Finder</h1>
      <h2 className="about-subtitle">Our Mission</h2>
      <p className="about-text">
        To revolutionize parking in Zimbabwean cities by making it easy, safe, and affordable for everyone. We leverage smart, real-time technology to help drivers find and reserve parking spots instantly, while supporting local businesses and reducing city congestion.
      </p>
      <h2 className="about-subtitle">Our Vision</h2>
      <p className="about-text">
        We envision a future where parking is stress-free, efficient, and accessible to all. Our platform empowers drivers and parking lot owners alike, creating a seamless urban mobility experience.
      </p>
      <hr className="about-divider" />
      <h2 className="about-subtitle">Meet the Team</h2>
      <div className="about-team">
        <div className="about-team-member">
          <img src={NicoleImg} alt="Nicole" className="about-team-img" />
          <div className="about-team-name">Nicole</div>
          <div className="about-team-role">Product Manager</div>
        </div>
        <div className="about-team-member">
          <img src={AlvisImg} alt="Alvis" className="about-team-img" />
          <div className="about-team-name">Alvis</div>
          <div className="about-team-role">Lead Developer</div>
        </div>
        <div className="about-team-member">
          <img src={DasylynImg} alt="Dasvlyn" className="about-team-img" />
          <div className="about-team-name">Dasylyn</div>
          <div className="about-team-role">UI/UX Designer</div>
        </div>
      </div>
      <h2 className="about-subtitle">Why Choose Us?</h2>
      <ul style={{maxWidth: 700, margin: '0 auto', fontSize: 18, color: '#23201d', lineHeight: 1.7, paddingLeft: 0, listStyle: 'none'}}>
        <li>• Real-time parking spot search and reservation</li>
        <li>• Secure, cashless payments</li>
        <li>• Support for local businesses</li>
        <li>• User-friendly, modern interface</li>
        <li>• Trusted by drivers and lot owners</li>
      </ul>
      <Link to="/register" style={ctaStyle}>Join Us & Find Parking Now</Link>
    </div>
  </div>
);

export default About; 