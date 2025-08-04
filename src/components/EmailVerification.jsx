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
  const [messageType, setMessageType] = useState(""); // "success" or "error"
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
    setMessageType("");
    
    try {
      await sendEmailVerification(user, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });
      setMessage("✅ Verification email sent successfully! Please check your inbox and spam folder.");
      setMessageType("success");
    } catch (error) {
      console.error('Verification error:', error);
      setMessage("❌ Email verification service temporarily unavailable. Please try logging in directly.");
      setMessageType("error");
    } finally {
      setResendLoading(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBackToLogin = () => {
    try {
      navigate('/login');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
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
        background: 'linear-gradient(135deg, rgba(255, 215, 64, 0.1), rgba(255, 215, 64, 0.05))',
        border: '1px solid rgba(255, 215, 64, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(255, 215, 64, 0.1)'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          marginBottom: '16px', 
          color: '#ffd740',
          fontWeight: '600'
        }}>
          📧 Check your email
        </div>
        <div style={{ 
          opacity: '0.9', 
          marginBottom: '16px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          We've sent a verification link to:
          <br />
          <strong style={{ 
            color: '#ffd740',
            fontSize: '18px',
            wordBreak: 'break-all'
          }}>
            {user?.email}
          </strong>
        </div>
        <div style={{ 
          fontSize: '14px', 
          opacity: '0.8',
          lineHeight: '1.4'
        }}>
          Click the link in your email to verify your account.
          <br />
          <span style={{ color: '#ffd740' }}>💡 Don't forget to check your spam folder!</span>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        marginBottom: '20px'
      }}>
        <button
          onClick={handleResendVerification}
          disabled={resendLoading}
          style={{
            background: 'linear-gradient(135deg, #ffd740, #ffe082)',
            color: '#23201d',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 24px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: resendLoading ? 'not-allowed' : 'pointer',
            opacity: resendLoading ? 0.7 : 1,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(255, 215, 64, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!resendLoading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(255, 215, 64, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 64, 0.3)';
          }}
        >
          {resendLoading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(35, 32, 29, 0.3)',
                borderTop: '2px solid #23201d',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Sending...
            </>
          ) : (
            <>
              📧 Resend Verification Email
            </>
          )}
        </button>
        
        <button
          onClick={handleRefresh}
          style={{
            background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 24px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
          }}
        >
          ✅ I've Verified My Email
        </button>
      </div>

      {message && (
        <div style={{
          color: messageType === "success" ? '#4caf50' : '#ff9800',
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '14px',
          padding: '12px',
          borderRadius: '8px',
          background: messageType === "success" ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
          border: `1px solid ${messageType === "success" ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
          fontWeight: '500'
        }}>
          {message}
        </div>
      )}

      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button 
          type="button"
          onClick={handleBackToLogin}
          style={{
            background: 'transparent',
            color: '#ffd740',
            border: '1px solid rgba(255, 215, 64, 0.3)',
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            opacity: '0.8'
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '1';
            e.target.style.background = 'rgba(255, 215, 64, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '0.8';
            e.target.style.background = 'transparent';
          }}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default EmailVerification; 