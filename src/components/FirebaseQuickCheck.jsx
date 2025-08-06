import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";
import "./Login.css";

const FirebaseQuickCheck = () => {
  const [status, setStatus] = useState({
    firebaseConnected: false,
    authDomain: false,
    emailVerification: false,
    networkConnection: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  const checkFirebaseStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check Firebase connection
      if (auth) {
        setStatus(prev => ({ ...prev, firebaseConnected: true }));
      }

      // Check auth domain
      if (auth.config.authDomain) {
        setStatus(prev => ({ ...prev, authDomain: true }));
      }

      // Check network
      try {
        await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
        setStatus(prev => ({ ...prev, networkConnection: true }));
      } catch (networkError) {
        console.error('Network check failed:', networkError);
      }

      // Check current user
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        
        // Test email verification
        try {
          if (!currentUser.emailVerified) {
            await sendEmailVerification(currentUser);
            setStatus(prev => ({ ...prev, emailVerification: true }));
          } else {
            setStatus(prev => ({ ...prev, emailVerification: true }));
          }
        } catch (emailError) {
          console.error('Email verification test failed:', emailError);
          setError(emailError);
          setStatus(prev => ({ ...prev, emailVerification: false }));
        }
      }

    } catch (error) {
      console.error('Firebase check failed:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => status ? '✅' : '❌';
  const getStatusColor = (status) => status ? '#4caf50' : '#f44336';

  const getRecommendations = () => {
    const recommendations = [];
    
    if (!status.networkConnection) {
      recommendations.push("Check your internet connection");
    }
    
    if (!status.authDomain) {
      recommendations.push("Add your domain to Firebase authorized domains");
    }
    
    if (!status.emailVerification) {
      recommendations.push("Enable email verification in Firebase Console");
      recommendations.push("Check if Firebase quota is exceeded");
    }
    
    if (error) {
      recommendations.push(`Error: ${error.code} - ${error.message}`);
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
      <h2 className="login-title">Firebase Quick Check</h2>
      
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 215, 64, 0.1), rgba(255, 215, 64, 0.05))',
        border: '1px solid rgba(255, 215, 64, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        textAlign: 'left'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          marginBottom: '16px', 
          color: '#ffd740',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          🔧 Configuration Status
        </div>
        
        {Object.entries(status).map(([key, statusValue]) => (
          <div key={key} style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px'
          }}>
            <span style={{ marginRight: '8px', fontSize: '16px' }}>
              {getStatusIcon(statusValue)}
            </span>
            <span style={{ 
              color: getStatusColor(statusValue),
              fontWeight: '500',
              fontSize: '14px'
            }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </div>
        ))}
      </div>

      {user && (
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#4caf50', fontWeight: '600', marginBottom: '8px' }}>
            👤 User: {user.email}
          </div>
          <div style={{ fontSize: '14px', opacity: '0.8' }}>
            Email Verified: {user.emailVerified ? '✅ Yes' : '❌ No'}
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
          onClick={checkFirebaseStatus}
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
          onClick={() => window.location.href = '/email-verification-test'}
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
          🧪 Test Email Verification
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

export default FirebaseQuickCheck; 