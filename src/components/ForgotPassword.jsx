import React, { useState } from "react";
import "./ForgotPassword.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Configure password reset with action code settings
      const actionCodeSettings = {
        url: window.location.origin + '/login', // Redirect to login page after reset
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setLoading(false);
      setMessage("Password reset email sent! Check your inbox and spam folder. Follow the instructions to reset your password.");
    } catch (err) {
      setLoading(false);
      console.error('Password reset error:', err);
      
      switch (err.code) {
        case 'auth/user-not-found':
          setError("No account found with this email address.");
          break;
        case 'auth/too-many-requests':
          setError("Too many requests. Please wait a few minutes before trying again.");
          break;
        case 'auth/invalid-email':
          setError("Please enter a valid email address.");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your internet connection and try again.");
          break;
        case 'auth/operation-not-allowed':
          setError("Password reset is not enabled for this app. Please contact support.");
          break;
        default:
          setError("Failed to send password reset email. Please try again or contact support.");
      }
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-logo">P</div>
      <h2 className="forgot-password-title">Reset Your Password</h2>
      <div className="forgot-password-subtitle login-register" style={{ marginBottom: 30 }}>
        Enter your email address and we'll send you a link to reset your password.
      </div>
      <form className="forgot-password-form" onSubmit={handleResetPassword}>
        <input
          type="email"
          id="forgot-password-email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="forgot-password-input login-input"
          required
        />
        <button className="forgot-password-btn login-btn" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </form>
      <div className="login-register" style={{ marginTop: 20 }}>
        <span>Remember your password?</span>
        <br />
        <span 
          className="register-link"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/login')}
        >
          Back to Login
        </span>
      </div>
    </div>
  );
};

export default ForgotPassword;
