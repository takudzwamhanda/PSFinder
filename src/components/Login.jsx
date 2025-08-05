import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        setError(
          <>
            Please verify your email address before logging in. 
            <br />
            <span style={{ fontSize: '14px', opacity: '0.8' }}>
              Check your email ({email}) for the verification link.
            </span>
            <br />
            <span 
              className="register-link" 
              style={{ cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
              onClick={async () => {
                try {
                  await sendEmailVerification(user, {
                    url: window.location.origin + '/login',
                    handleCodeInApp: false
                  });
                  setError("Verification email sent! Please check your inbox and spam folder.");
                } catch (err) {
                  console.error('Verification error:', err);
                  setError("Email verification service temporarily unavailable. Please try logging in directly or contact support.");
                }
              }}
            >
              Resend verification email
            </span>
          </>
        );
        setLoading(false);
        return;
      }
      
      setLoading(false);
      navigate('/landing2');
    } catch (err) {
      setLoading(false);
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email. Please register first.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password. Please try again.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to log in.");
      }
    }
  };

  const handleForgotPassword = () => {
    try {
      navigate('/forgot-password');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  const handleRegisterClick = () => {
    try {
      navigate('/register');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">P</div>
      <h2 className="login-title">Log in to Parking Space Finder</h2>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />
        <button type="submit" className="login-btn">
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        {error && <div style={{ color: '#ffd740', marginTop: 10, textAlign: 'center' }}>{error}</div>}
      </form>
      <div className="login-links">
        <button 
          type="button"
          className="forgot-password-btn" 
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </button>
      </div>
      <div className="register-section">
        <button 
          type="button"
          className="register-btn" 
          onClick={handleRegisterClick}
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default Login; 