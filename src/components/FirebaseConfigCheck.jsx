import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { sendEmailVerification, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import "./Login.css";

const FirebaseConfigCheck = () => {
  const [config, setConfig] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState([]);

  useEffect(() => {
    // Get Firebase config
    const app = auth.app;
    const config = app.options;
    setConfig(config);
    
    // Run initial diagnostics
    runDiagnostics();
  }, []);

  const runDiagnostics = () => {
    const checks = [];
    
    // Check if we're in development mode
    checks.push({
      name: "Development Mode",
      status: window.location.hostname === 'localhost' ? '✅' : '⚠️',
      message: window.location.hostname === 'localhost' 
        ? 'Running on localhost (development)' 
        : 'Not on localhost - may need domain configuration'
    });

    // Check Firebase config
    if (config) {
      checks.push({
        name: "Firebase Config",
        status: '✅',
        message: `Project: ${config.projectId}`
      });
      
      checks.push({
        name: "API Key",
        status: config.apiKey ? '✅' : '❌',
        message: config.apiKey ? 'API Key is set' : 'API Key is missing'
      });
      
      checks.push({
        name: "Auth Domain",
        status: config.authDomain ? '✅' : '❌',
        message: config.authDomain ? `Domain: ${config.authDomain}` : 'Auth domain is missing'
      });
    }

    // Check if user is logged in
    const currentUser = auth.currentUser;
    checks.push({
      name: "Current User",
      status: currentUser ? '✅' : '⚠️',
      message: currentUser ? `Logged in as: ${currentUser.email}` : 'No user logged in'
    });

    setDiagnostics(checks);
  };

  const testEmailVerification = async () => {
    if (!testEmail) {
      setMessage("Please enter a test email address");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Create a temporary user for testing
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, "TestPassword123!");
      const user = userCredential.user;

      setMessage("✅ User created successfully. Sending verification email...");

      // Try to send verification email
      await sendEmailVerification(user, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });

      setMessage("✅ Email verification test successful! Check your email inbox and spam folder.");
      
      // Clean up - delete the test user
      try {
        await user.delete();
        setMessage(prev => prev + " Test user cleaned up.");
      } catch (deleteError) {
        console.error('Cleanup error:', deleteError);
        setMessage(prev => prev + " (Note: Test user may still exist in Firebase)");
      }
      
    } catch (error) {
      console.error('Test error:', error);
      
      let errorMessage = "❌ Email verification test failed: ";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage += "Email already exists. Try a different email.";
          break;
        case 'auth/invalid-email':
          errorMessage += "Invalid email format.";
          break;
        case 'auth/weak-password':
          errorMessage += "Password too weak.";
          break;
        case 'auth/network-request-failed':
          errorMessage += "Network error. Check your internet connection.";
          break;
        case 'auth/too-many-requests':
          errorMessage += "Too many requests. Try again later.";
          break;
        default:
          errorMessage += error.message;
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleRegistration = async () => {
    if (!testEmail) {
      setMessage("Please enter a test email address");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Test basic registration without verification
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, "TestPassword123!");
      const user = userCredential.user;

      setMessage("✅ Basic registration successful! User created without email verification.");
      
      // Clean up
      try {
        await user.delete();
        setMessage(prev => prev + " Test user cleaned up.");
      } catch (deleteError) {
        console.error('Cleanup error:', deleteError);
      }
      
    } catch (error) {
      console.error('Registration test error:', error);
      setMessage(`❌ Registration test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">P</div>
      <h2 className="login-title">Firebase Diagnostics</h2>
      
      <div style={{
        background: 'rgba(255, 215, 64, 0.1)',
        border: '1px solid rgba(255, 215, 64, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'left'
      }}>
        <div style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#ffd740' }}>
          🔧 System Diagnostics
        </div>
        {diagnostics.map((check, index) => (
          <div key={index} style={{ 
            fontSize: '12px', 
            opacity: '0.8', 
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{check.status}</span>
            <span><strong>{check.name}:</strong></span>
            <span>{check.message}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="email"
          placeholder="Enter test email address"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="login-input"
          style={{ marginBottom: '12px' }}
        />
        
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button
            className="login-btn"
            onClick={testEmailVerification}
            disabled={loading}
            style={{ marginBottom: '8px' }}
          >
            {loading ? "Testing..." : "Test Email Verification"}
          </button>
          
          <button
            className="login-btn"
            onClick={testSimpleRegistration}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {loading ? "Testing..." : "Test Basic Registration"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          color: message.includes('✅') ? '#4caf50' : message.includes('❌') ? '#ffd740' : '#ffffff',
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '14px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          whiteSpace: 'pre-line'
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
          onClick={() => window.history.back()}
        >
          Go Back
        </span>
      </div>
    </div>
  );
};

export default FirebaseConfigCheck; 