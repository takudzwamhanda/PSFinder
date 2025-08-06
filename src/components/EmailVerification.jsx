import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { sendEmailVerification, onAuthStateChanged, signOut } from "firebase/auth";
import "./Login.css";

const EmailVerification = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
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
      setShowFallbackOptions(false);
    } catch (error) {
      console.error('Verification error:', error);
      
      // Provide more specific error messages based on the error code
      let errorMessage = "❌ Email verification service temporarily unavailable. Please try logging in directly.";
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = "❌ Too many verification attempts. Please wait a few minutes before trying again.";
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = "❌ Email service quota exceeded. Please try again later or contact support.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "❌ Network connection failed. Please check your internet connection and try again.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "❌ Email verification is not enabled for this project. Please contact support.";
      }
      
      setMessage(errorMessage);
      setMessageType("error");
      setShowFallbackOptions(true);
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

  const handleSkipVerification = async () => {
    try {
      // Sign out the user and redirect to login
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const handleContactSupport = () => {
    // You can customize this to open your support contact method
    const supportEmail = "support@ps-finder.com"; // Replace with your actual support email
    const subject = "Email Verification Issue";
    const body = `Hello, I'm having trouble with email verification for my account: ${user?.email}`;
    
    const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
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

      {showFallbackOptions && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#ff9800',
            marginBottom: '12px'
          }}>
            🔧 Having trouble? Try these options:
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px'
          }}>
            <button
              onClick={handleSkipVerification}
              style={{
                background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🔄 Try Logging In Directly
            </button>
            <button
              onClick={handleContactSupport}
              style={{
                background: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📧 Contact Support
            </button>
          </div>
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