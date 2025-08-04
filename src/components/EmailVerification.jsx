import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import "./Login.css";

const EmailVerification = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.emailVerified) {
          navigate('/landing2');
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleResendVerification = async () => {
    if (!user) return;
    
    setResendLoading(true);
    setMessage("");
    
    try {
              await sendEmailVerification(user, {
          url: window.location.origin + '/login',
          handleCodeInApp: false
        });
        setMessage("Verification email sent! Please check your inbox and spam folder.");
      } catch (error) {
        console.error('Verification error:', error);
        setMessage("Email verification service temporarily unavailable. Please try logging in directly.");
      } finally {
      setResendLoading(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-logo">P</div>
        <div style={{ textAlign: 'center', color: '#ffd740' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 215, 64, 0.3)',
            borderTop: '3px solid #ffd740',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-logo">P</div>
      <h2 className="login-title">Verify Your Email</h2>
      
      <div style={{
        background: 'rgba(255, 215, 64, 0.1)',
        border: '1px solid rgba(255, 215, 64, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#ffd740' }}>
          📧 Check your email
        </div>
        <div style={{ opacity: '0.8', marginBottom: '16px' }}>
          We've sent a verification link to:
          <br />
          <strong>{user?.email}</strong>
        </div>
        <div style={{ fontSize: '14px', opacity: '0.7' }}>
          Click the link in your email to verify your account.
          <br />
          Don't forget to check your spam folder!
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          className="login-btn"
          onClick={handleResendVerification}
          disabled={resendLoading}
          style={{ marginBottom: '8px' }}
        >
          {resendLoading ? "Sending..." : "Resend Verification Email"}
        </button>
        
        <button
          className="login-btn"
          onClick={handleRefresh}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          I've Verified My Email
        </button>
      </div>

      {message && (
        <div style={{
          color: message.includes('sent') ? '#4caf50' : '#ffd740',
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{
        color: '#fff',
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '14px',
        opacity: '0.7'
      }}>
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

export default EmailVerification; 