import React from 'react';
import './TopNavbar.css';

const TopNavbar = () => {
  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <button className="menu-btn" aria-label="Open menu">
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
  );
};

export default TopNavbar; 