import React from 'react';
import './WhyChoose.css';
import { useNavigate } from 'react-router-dom';

const WhyChoose = () => {
  const navigate = useNavigate();

  const handleLearnMoreClick = () => {
    try {
      navigate('/about');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  return (
    <section className="whychoose-section">
      <div className="whychoose-container">
        <h2 className="whychoose-title">Why Choose Parking Space Finder?</h2>
        <div className="whychoose-grid">
          <div className="whychoose-card">
            <div className="whychoose-icon">🚗</div>
            <h3>Real-Time Availability</h3>
            <p>See live parking spot availability and reserve instantly. No more circling blocks looking for parking.</p>
          </div>
          <div className="whychoose-card">
            <div className="whychoose-icon">💳</div>
            <h3>Secure Payments</h3>
            <p>Pay securely with multiple payment options. All transactions are protected and encrypted.</p>
          </div>
          <div className="whychoose-card">
            <div className="whychoose-icon">⏰</div>
            <h3>24/7 Access</h3>
            <p>Find and reserve parking spots anytime, anywhere. Our platform works around the clock.</p>
          </div>
          <div className="whychoose-card">
            <div className="whychoose-icon">📱</div>
            <h3>Mobile Friendly</h3>
            <p>Optimized for mobile devices. Use our app on any smartphone or tablet.</p>
          </div>
          <div className="whychoose-card">
            <div className="whychoose-icon">🏢</div>
            <h3>Support Local Business</h3>
            <p>Help local parking lot owners grow their business while you get convenient parking.</p>
          </div>
          <div className="whychoose-card">
            <div className="whychoose-icon">🛡️</div>
            <h3>Trusted & Safe</h3>
            <p>Verified parking spots and secure reservations. Your safety and convenience are our priority.</p>
          </div>
        </div>
        <button className="whychoose-learn-btn" onClick={handleLearnMoreClick}>Learn More</button>
      </div>
    </section>
  );
};

export default WhyChoose; 