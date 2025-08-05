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
  const [showFallback, setShowFallback] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setShowFallback(false);

    try {
      // Configure password reset with action code settings
      const actionCodeSettings = {
        url: window.location.origin + '/login', // Redirect to login page after reset
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setLoading(false);
      setMessage("✅ Password reset email sent! Check your inbox and spam folder. Follow the instructions to reset your password.");
    } catch (err) {
      setLoading(false);
      console.error('Password reset error:', err);
      
      switch (err.code) {
        case 'auth/user-not-found':
          setError("❌ No account found with this email address. Please check the email or register a new account.");
          break;
        case 'auth/too-many-requests':
          setError("⚠️ Too many requests. Please wait a few minutes before trying again.");
          break;
        case 'auth/invalid-email':
          setError("❌ Please enter a valid email address.");
          break;
        case 'auth/network-request-failed':
          setError("🌐 Network error. Please check your internet connection and try again.");
          break;
        case 'auth/operation-not-allowed':
          setError("⚠️ Password reset is not enabled for this app. Please contact support.");
          setShowFallback(true);
          break;
        case 'auth/quota-exceeded':
          setError("⚠️ Email quota exceeded. Please try again later or contact support.");
          setShowFallback(true);
          break;
        default:
          setError("❌ Failed to send password reset email. Please try again or use the alternative method below.");
          setShowFallback(true);
      }
    }
  };

  const handleBackToLogin = () => {
    try {
      navigate('/login');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  const handleContactSupport = () => {
    // You can replace this with your actual support contact method
    const supportEmail = "support@parkingspacefinder.com";
    const subject = "Password Reset Request";
    const body = `Hello Support Team,\n\nI need help resetting my password for the Parking Space Finder app.\n\nEmail: ${email}\n\nPlease assist me with this request.\n\nThank you.`;
    
    const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleManualReset = () => {
    const manualResetInfo = `
📧 Manual Password Reset Instructions:

1. Contact Support: support@parkingspacefinder.com
2. Include your email: ${email}
3. Request: "Please reset my password"
4. We'll respond within 24 hours

Alternative: Try logging in with a different method or create a new account.
    `;
    
    alert(manualResetInfo);
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
        <button 
          type="submit" 
          className="forgot-password-btn"
          disabled={loading}
        >
          {loading ? '🔄 Sending...' : '📧 Send Reset Link'}
        </button>
        
        {message && (
          <div className="success-message" style={{ 
            color: '#4caf50', 
            textAlign: 'center', 
            marginTop: '15px',
            padding: '10px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            {message}
          </div>
        )}
        
        {error && (
          <div className="error-message" style={{ 
            color: '#ff6b6b', 
            textAlign: 'center', 
            marginTop: '15px',
            padding: '10px',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            {error}
          </div>
        )}
        
        {showFallback && (
          <div className="fallback-options" style={{ 
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(255, 215, 64, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 215, 64, 0.3)'
          }}>
            <h4 style={{ color: '#ffd740', marginBottom: '10px' }}>🔧 Alternative Options:</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleContactSupport}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffd740',
                  color: '#23201d',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                📧 Contact Support
              </button>
              <button
                type="button"
                onClick={handleManualReset}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                📋 Manual Reset
              </button>
            </div>
          </div>
        )}
        
        <div className="forgot-password-back">
          <button
            type="button"
            onClick={handleBackToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffd740',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
              marginTop: '20px'
            }}
          >
            ← Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
