import React, { useState } from 'react';
import './TopNavbar.css';

const TopNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="top-navbar">
        <div className="navbar-left">
          <button 
            className="menu-btn" 
            aria-label="Open menu"
            onClick={handleMenuToggle}
          >
            <span className="menu-icon">&#9776;</span>
          </button>
          <span className="app-title">Parking Space Finder</span>
        </div>
        <div className="navbar-right">
          <img
            src="https://i.pravatar.cc/32"
            alt="User Avatar"
            className="user-avatar"
          />
        </div>
      </nav>

      {/* Hamburger Menu Overlay */}
      {menuOpen && (
        <div className="menu-overlay">
          {/* Background Image with Underground-Car-Park */}
          <div className="menu-background">
            <div className="menu-bg-image" style={{
              backgroundImage: 'url(/src/imgs/Underground-Car-Park.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }} />
          </div>

          {/* Menu Content */}
          <div className="menu-content">
            <div className="menu-header">
              <button 
                className="menu-close-btn"
                onClick={handleMenuToggle}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            
            <div className="menu-links">
              <a 
                href="/" 
                className="menu-link active"
                onClick={handleLinkClick}
              >
                Home
              </a>
              <a 
                href="/about" 
                className="menu-link"
                onClick={handleLinkClick}
              >
                About
              </a>
              <a 
                href="/login" 
                className="menu-link"
                onClick={handleLinkClick}
              >
                Login
              </a>
              <a 
                href="/register" 
                className="menu-link"
                onClick={handleLinkClick}
              >
                Register
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavbar; 