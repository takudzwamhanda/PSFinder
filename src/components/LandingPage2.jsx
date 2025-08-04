import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage2.css';
import homeBackVideo from '../video/home back 1.mp4';
import FooterCTA from './FooterCTA';
import { useAuth } from '../main.jsx';

const LandingPage2 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    try {
      // Check if user is authenticated for protected routes
      const protectedRoutes = ['/my-spots', '/my-bookings', '/payments', '/reviews', '/profile', '/owner-dashboard'];
      
      if (protectedRoutes.includes(path) && !user) {
        alert('Please log in to access this feature.');
        navigate('/login');
        return;
      }
      
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  return (
    <div className="landing2-root">
      <section className="landing2-hero">
        <video className="landing2-video-bg" autoPlay loop muted playsInline>
          <source src={homeBackVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="landing2-video-overlay" />
        <span className="landing2-logo-p">P</span>
        <button className="landing2-logout-btn landing2-logout-btn-top" onClick={() => navigate('/')}>Log Out</button>
        
        {/* How to Use Section as Main Content */}
        <div className="how-to-use-container">
          <h2 className="how-to-use-title">How to Use Our Parking App</h2>
          <p className="how-to-use-subtitle">
            Follow these simple steps to find and reserve your perfect parking spot, or click the "Get Started" button below to begin immediately
          </p>
          
          {/* Get Started Button - Moved to top for immediate access */}
          <div className="how-to-use-cta">
            <button className="how-to-use-btn" onClick={() => navigate('/my-spots')}>
              Get Started Now
            </button>
          </div>
          
          <div className="how-to-use-steps">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Search for Parking</h3>
                <p>Click "Start Now" to access our interactive map. Browse available parking spots in your desired location.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Select Your Spot</h3>
                <p>Choose from available parking spots displayed on the map. View details like price, location, and availability.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Make Reservation</h3>
                <p>Select your preferred time slot and confirm your booking. Our system ensures real-time availability updates.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Secure Payment</h3>
                <p>Complete your payment securely through our integrated payment system. Receive instant confirmation.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Park & Enjoy</h3>
                <p>Arrive at your reserved spot and park hassle-free. Your reservation is guaranteed for your selected time.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">6</div>
              <div className="step-content">
                <h3>Manage Bookings</h3>
                <p>View your current and past bookings in the "My Bookings" section. Cancel or modify reservations as needed.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">7</div>
              <div className="step-content">
                <h3>Read Reviews</h3>
                <p>Check reviews and ratings from other users to make informed decisions about parking spots and locations.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">8</div>
              <div className="step-content">
                <h3>Manage Profile</h3>
                <p>Update your personal information in your profile settings.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">9</div>
              <div className="step-content">
                <h3>List View</h3>
                <p>Switch to list view to see all available parking spots in a detailed list format with filtering options.</p>
              </div>
            </div>
          </div>

          {/* Feature Cards Section */}
          <div className="feature-cards-section">
            <div className="feature-cards-grid">
              <div className="feature-card" onClick={() => handleNavigation('/my-spots')}>
                <h4>Find Parking Spots</h4>
                <p>Browse available parking spots on our interactive map with real-time availability</p>
                <div className="feature-card-arrow">→</div>
              </div>

              <div className="feature-card" onClick={() => handleNavigation('/my-bookings')}>
                <h4>My Bookings</h4>
                <p>Manage your current and past reservations, view booking history and status</p>
                <div className="feature-card-arrow">→</div>
              </div>

              <div className="feature-card" onClick={() => handleNavigation('/payments')}>
                <h4>Payment History</h4>
                <p>View your payment history, receipts, and manage your payment methods</p>
                <div className="feature-card-arrow">→</div>
              </div>

              <div className="feature-card" onClick={() => handleNavigation('/reviews')}>
                <h4>Reviews & Comments</h4>
                <p>Read user reviews, share your experience, and join the community discussion</p>
                <div className="feature-card-arrow">→</div>
              </div>

              <div className="feature-card" onClick={() => handleNavigation('/profile')}>
                <h4>Profile Settings</h4>
                <p>Update your personal information, preferences, and account settings</p>
                <div className="feature-card-arrow">→</div>
              </div>

              <div className="feature-card" onClick={() => handleNavigation('/about')}>
                <h4>About Us</h4>
                <p>Learn more about our mission, team, and how we're revolutionizing parking</p>
                <div className="feature-card-arrow">→</div>
              </div>

              <div className="feature-card" onClick={() => handleNavigation('/owner-dashboard')}>
                <h4>Owner Dashboard</h4>
                <p>For parking spot owners - manage your listings, view earnings, and analytics</p>
                <div className="feature-card-arrow">→</div>
              </div>
            </div>
          </div>

          {/* Remove the duplicate Get Started button from bottom */}
        </div>
      </section>
      
      {/* Footer */}
      <FooterCTA />
    </div>
  );
};

export default LandingPage2; 