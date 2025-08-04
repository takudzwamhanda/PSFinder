import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ isLoggedIn, onSignOut }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => setMenuOpen((open) => !open);
  const handleLinkClick = () => setMenuOpen(false);

  // Check if we should show back button (not on main pages)
  const shouldShowBackButton = !['/', '/login', '/register', '/about', '/landing2'].includes(location.pathname);

  const handleLogoClick = (e) => {
    if (shouldShowBackButton) {
      e.preventDefault();
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <nav className="navbar-root">
      <div className="navbar-content">
        {/* Logo - acts as back button on mobile when not on main pages */}
        <Link 
          to="/" 
          className="navbar-logo"
          onClick={handleLogoClick}
          style={{
            cursor: shouldShowBackButton ? 'pointer' : 'default'
          }}
        >
          P
        </Link>
        
        <button className="navbar-hamburger" onClick={handleMenuToggle} aria-label="Open menu">
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
        {isLoggedIn ? (
          <div className={`navbar-links${menuOpen ? ' open' : ''}`} style={{ alignItems: 'center' }}>
            <button className="navbar-link navbar-signout" onClick={() => { onSignOut(); setMenuOpen(false); }}>Sign Out</button>
          </div>
        ) : (
          <div className={`navbar-links${menuOpen ? ' open' : ''}`}> 
            <Link to="/" className={location.pathname === "/" ? "navbar-link active" : "navbar-link"} onClick={handleLinkClick}>Home</Link>
            <Link to="/about" className={location.pathname === "/about" ? "navbar-link active" : "navbar-link"} onClick={handleLinkClick}>About</Link>
            <Link to="/login" className={location.pathname === "/login" ? "navbar-link active" : "navbar-link"} onClick={handleLinkClick}>Login</Link>
            <Link to="/register" className={location.pathname === "/register" ? "navbar-link active" : "navbar-link"} onClick={handleLinkClick}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 