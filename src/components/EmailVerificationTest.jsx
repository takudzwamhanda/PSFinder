import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { sendEmailVerification, onAuthStateChanged, signOut } from "firebase/auth";
import "./Login.css";

const EmailVerificationTest = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const testEmailVerification = async () => {
    if (!user) {
      setTestResult({ success: false, message: "No user logged in" });
      return;
    }

    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      await sendEmailVerification(user, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });
      setTestResult({ 
        success: true, 
        message: "✅ Email verification test successful! Check your inbox." 
      });
    } catch (error) {
      console.error('Email verification test failed:', error);
      setError(error);
      setTestResult({ 
        success: false, 
        message: `❌ Email verification failed: ${error.code} - ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorSolution = (errorCode) => {
    switch (errorCode) {
      case 'auth/too-many-requests':
        return "Wait 5-10 minutes before trying again";
      case 'auth/quota-exceeded':
        return "Firebase quota exceeded. Check billing or wait for reset";
      case 'auth/network-request-failed':
        return "Check internet connection and try again";
      case 'auth/operation-not-allowed':
        return "Email verification not enabled in Firebase Console";
      default:
        return "Check Firebase Console configuration";
    }
  };

  const handleSkipVerification = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
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
      <h2 className="login-title">Email Verification Test</h2>
      
      {user ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#4caf50', fontWeight: '600', marginBottom: '8px' }}>
            👤 Logged in as: {user.email}
          </div>
          <div style={{ fontSize: '14px', opacity: '0.8' }}>
            Email Verified: {user.emailVerified ? '✅ Yes' : '❌ No'}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ff9800', fontWeight: '600' }}>
            ⚠️ No user logged in
          </div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            Please log in first to test email verification
          </div>
        </div>
      )}

      {user && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={testEmailVerification}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #ffd740, #ffe082)',
              color: '#23201d',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(255, 215, 64, 0.3)',
              width: '100%',
              marginBottom: '12px'
            }}
          >
            {loading ? 'Testing...' : '🧪 Test Email Verification'}
          </button>
        </div>
      )}

      {testResult && (
        <div style={{
          background: testResult.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          border: `1px solid ${testResult.success ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            color: testResult.success ? '#4caf50' : '#f44336',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            {testResult.message}
          </div>
          {error && !testResult.success && (
            <div style={{ 
              fontSize: '14px', 
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(255, 152, 0, 0.1)',
              borderRadius: '6px'
            }}>
              💡 Solution: {getErrorSolution(error.code)}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px'
      }}>
        <button
          onClick={handleSkipVerification}
          style={{
            background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 24px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
          }}
        >
          🔄 Try Logging In Directly
        </button>
        
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'transparent',
            color: '#ffd740',
            border: '1px solid rgba(255, 215, 64, 0.3)',
            borderRadius: '12px',
            padding: '16px 24px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          ← Go Back
        </button>
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(255, 215, 64, 0.1)',
        border: '1px solid rgba(255, 215, 64, 0.3)',
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        <div style={{ color: '#ffd740', fontWeight: '600', marginBottom: '8px' }}>
          💡 Quick Fixes:
        </div>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Check your email inbox and spam folder</li>
          <li>Try logging in directly with your email and password</li>
          <li>Wait a few minutes between verification attempts</li>
          <li>Check your internet connection</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailVerificationTest; 