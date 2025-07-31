import React from 'react';
import './FooterCTA.css';
import { Link } from 'react-router-dom';
import footerBg from '../imgs/footer back.jpg';
import footerImg from '../imgs/footer.jpg';

const FooterCTA = () => (
  <footer className="footer-bg-root" style={{ backgroundImage: `url(${footerBg})` }}>
    <div className="footer-bg-overlay">
      <div className="footer-bg-content">
        <div className="footer-img-col">
          <img src={footerImg} alt="Footer Logo" className="footer-img-main" />
        </div>
        <div className="footer-info-col">
          <div className="footer-logo-circle">P</div>
        <div className="footer-app-name">Parking Space Finder</div>
          <div className="footer-nav-row">
        <Link to="/" className="footer-link">Home</Link>
        <Link to="/about" className="footer-link">About</Link>
        <Link to="/register" className="footer-link">Register</Link>
        <Link to="/login" className="footer-link">Login</Link>
      </div>
          <div className="footer-contact-row">
            <span>Email: info@psfinder.com</span> | <span>Phone: +263 771 830 494</span>
          </div>
          <div className="footer-social-row">
            <a href="#" className="footer-social-icon" aria-label="Twitter">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M22 5.92a8.38 8.38 0 0 1-2.36.65A4.13 4.13 0 0 0 21.4 4.1a8.19 8.19 0 0 1-2.6 1A4.1 4.1 0 0 0 12 8.09c0 .32.04.64.1.94A11.65 11.65 0 0 1 3 4.89a4.07 4.07 0 0 0-.55 2.06c0 1.42.72 2.68 1.82 3.42a4.07 4.07 0 0 1-1.86-.51v.05c0 1.98 1.41 3.63 3.28 4a4.1 4.1 0 0 1-1.85.07 4.11 4.11 0 0 0 3.83 2.85A8.23 8.23 0 0 1 2 19.13a11.62 11.62 0 0 0 6.29 1.84c7.55 0 11.68-6.26 11.68-11.68 0-.18 0-.36-.01-.54A8.18 8.18 0 0 0 22 5.92z" fill="#ffd740"/></svg>
            </a>
            <a href="#" className="footer-social-icon" aria-label="Facebook">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" fill="#ffd740"/></svg>
            </a>
            <a href="#" className="footer-social-icon" aria-label="Instagram">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.775.13 4.602.402 3.635 1.37 2.668 2.337 2.396 3.51 2.338 4.788 2.279 6.068 2.267 6.477 2.267 12c0 5.523.012 5.932.071 7.212.058 1.278.33 2.451 1.297 3.418.967.967 2.14 1.239 3.418 1.297 1.28.059 1.689.071 7.212.071s5.932-.012 7.212-.071c1.278-.058 2.451-.33 3.418-1.297.967-.967 1.239-2.14 1.297-3.418.059-1.28.071-1.689.071-7.212s-.012-5.932-.071-7.212c-.058-1.278-.33-2.451-1.297-3.418C21.451.402 20.278.13 19 .072 17.72.013 17.311 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" fill="#ffd740"/></svg>
            </a>
        </div>
      </div>
    </div>
    <div className="footer-modern-bottom">
      © 2025 Parking Space Finder. All rights reserved.
      </div>
    </div>
  </footer>
);

export default FooterCTA; 