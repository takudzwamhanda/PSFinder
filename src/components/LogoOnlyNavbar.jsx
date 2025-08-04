import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LogoOnlyNavbar.css';

const LogoOnlyNavbar = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate(-1);
  };

  return (
    <nav className="logo-only-navbar">
      <div className="logo-only-navbar-content">
        <div 
          className="logo-only-navbar-logo"
          onClick={handleLogoClick}
        >
          P
        </div>
      </div>
    </nav>
  );
};

export default LogoOnlyNavbar; 