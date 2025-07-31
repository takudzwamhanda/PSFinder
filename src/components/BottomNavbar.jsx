import React from 'react';
import './BottomNavbar.css';

const navItems = [
  { label: 'Spots', icon: '🅿️' },
  { label: 'Lots', icon: '🏢' },
  { label: 'Reservations', icon: '📅' },
  { label: 'Payments', icon: '💳' },
  { label: 'Reviews', icon: '⭐' },
];

const BottomNavbar = () => {
  return (
    <nav className="bottom-navbar">
      {navItems.map((item) => (
        <div className="nav-item" key={item.label}>
          <div className="nav-icon">{item.icon}</div>
          <div className="nav-label">{item.label}</div>
        </div>
      ))}
    </nav>
  );
};

export default BottomNavbar; 