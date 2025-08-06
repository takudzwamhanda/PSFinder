import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";
import "./Login.css";

const FirebaseConfigCheck = () => {
  const [configStatus, setConfigStatus] = useState({
    firebaseConfig: false,
    authDomain: false,
    emailVerification: false,
    networkConnection: false,
    userAuthenticated: false,
    emailVerified: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkFirebaseConfiguration();
  }, []);

  const checkFirebaseConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Firebase is initialized
      if (auth) {
        setConfigStatus(prev => ({ ...prev, firebaseConfig: true }));
      }

      // Check auth domain
      if (auth.config.authDomain && auth.config.authDomain !== 'localhost') {
        setConfigStatus(prev => ({ ...prev, authDomain: true }));
      }

      // Check network connection
      try {
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        setConfigStatus(prev => ({ ...prev, networkConnection: true }));
      } catch (networkError) {
        console.error('Network check failed:', networkError);
        setConfigStatus(prev => ({ ...prev, networkConnection: false }));
      }

      // Check current user
      const user = auth.currentUser;
      if (user) {
        setCurrentUser(user);
        setConfigStatus(prev => ({ 
          ...prev, 
          userAuthenticated: true,
          emailVerified: user.emailVerified
        }));
      }

      // Test email verification (this will fail if not configured properly)
      try {
        if (user && !user.emailVerified) {
          await sendEmailVerification(user);
          setConfigStatus(prev => ({ ...prev, emailVerification: true }));
        } else if (user && user.emailVerified) {
          setConfigStatus(prev => ({ ...prev, emailVerification: true }));
        } else {
          setConfigStatus(prev => ({ ...prev, emailVerification: false }));
        }
      } catch (emailError) {
        console.error('Email verification test failed:', emailError);
        setConfigStatus(prev => ({ ...prev, emailVerification: false }));
        setError(emailError);
      }

    } catch (error) {
      console.error('Configuration check failed:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    return status ? '✅' : '❌';
  };

  const getStatusColor = (status) => {
    return status ? '#4caf50' : '#f44336';
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (!configStatus.networkConnection) {
      recommendations.push("Check your internet connection and try again");
    }
    
    if (!configStatus.authDomain) {
      recommendations.push("Add your domain to Firebase authorized domains");
    }
    
    if (!configStatus.emailVerification) {
      recommendations.push("Enable email verification in Firebase Console");
      recommendations.push("Check if your Firebase project has reached its quota");
    }
    
    if (!configStatus.userAuthenticated) {
      recommendations.push("You need to be logged in to test email verification");
    }
    
    if (configStatus.userAuthenticated && !configStatus.emailVerified) {
      recommendations.push("Your email is not verified. Check your inbox and spam folder");
    }
    
    return recommendations;
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
          <div>Checking Firebase configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-logo">P</div>
      <h2 className="login-title">Firebase Configuration Status</h2>
      
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 215, 64, 0.1), rgba(255, 215, 64, 0.05))',
        border: '1px solid rgba(255, 215, 64, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        textAlign: 'left',
        boxShadow: '0 4px 12px rgba(255, 215, 64, 0.1)'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          marginBottom: '16px', 
          color: '#ffd740',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          🔧 System Diagnostics
        </div>
        
        {Object.entries(configStatus).map(([key, status]) => (
          <div key={key} style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px'
          }}>
            <span style={{ marginRight: '8px', fontSize: '16px' }}>
              {getStatusIcon(status)}
            </span>
            <span style={{ 
              color: getStatusColor(status),
              fontWeight: '500',
              fontSize: '14px'
            }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </div>
        ))}
      </div>

      {currentUser && (
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#4caf50', fontWeight: '600', marginBottom: '8px' }}>
            👤 Current User: {currentUser.email}
          </div>
          <div style={{ fontSize: '14px', opacity: '0.8' }}>
            Email Verified: {currentUser.emailVerified ? '✅ Yes' : '❌ No'}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ color: '#f44336', fontWeight: '600', marginBottom: '8px' }}>
            ❌ Error Details:
          </div>
          <div style={{ fontSize: '14px', color: '#f44336' }}>
            {error.code && <div>Code: {error.code}</div>}
            {error.message && <div>Message: {error.message}</div>}
          </div>
        </div>
      )}

      {getRecommendations().length > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{ color: '#ff9800', fontWeight: '600', marginBottom: '8px' }}>
            💡 Recommendations:
          </div>
          <ul style={{ 
            fontSize: '14px', 
            lineHeight: '1.5',
            margin: '0',
            paddingLeft: '20px',
            color: '#ff9800'
          }}>
            {getRecommendations().map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        marginTop: '20px'
      }}>
        <button
          onClick={checkFirebaseConfiguration}
          style={{
            background: 'linear-gradient(135deg, #ffd740, #ffe082)',
            color: '#23201d',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 24px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(255, 215, 64, 0.3)'
          }}
        >
          🔄 Recheck Configuration
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
    </div>
  );
};

export default FirebaseConfigCheck; 