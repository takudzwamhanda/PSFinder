import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNavbar.css';

const navItems = [
  { label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', route: '/' },
  { label: 'Find Parking', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', route: '/my-spots' },
  { label: 'My Bookings', icon: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z', route: '/my-bookings' },
  { label: 'Payments', icon: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z', route: '/payments' },
  { label: 'Reviews', icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z', route: '/reviews' },
  { label: 'Profile', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', route: '/profile' },
];

const BottomNavOnly = () => {
  return (
    <nav className="bottom-navbar">
      {navItems.map((item) => (
        <NavLink
          to={item.route}
          key={item.label}
          className={({ isActive }) =>
            'nav-item' + (isActive ? ' nav-item-active' : '')
          }
          style={{ textDecoration: 'none' }}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d={item.icon} />
          </svg>
          <div className="nav-label">{item.label}</div>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavOnly; 