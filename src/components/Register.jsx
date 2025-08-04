import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";

const Register = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send email verification with better configuration
      try {
        await sendEmailVerification(user, {
          url: window.location.origin + '/login',
          handleCodeInApp: false
        });
      } catch (verificationError) {
        console.error('Email verification error:', verificationError);
        // Continue with registration even if verification fails
        setSuccess(
          <>
            Registration successful! Please check your email ({email}) and click the verification link before logging in.
            <br />
            <span style={{ fontSize: '14px', opacity: '0.8' }}>
              If you don't receive the email, check your spam folder or try logging in directly.
            </span>
          </>
        );
        setTimeout(() => {
          navigate('/verify-email');
        }, 2000);
        return;
      }
      
      setSuccess(
        <>
          Registration successful! Please check your email ({email}) and click the verification link before logging in.
          <br />
          <span style={{ fontSize: '14px', opacity: '0.8' }}>
            Didn't receive the email? Check your spam folder.
          </span>
        </>
      );
      
      setTimeout(() => {
        navigate('/verify-email');
      }, 5000);
      
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(
          <>This email is already registered. <span className="register-link" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Log in?</span></>
        );
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    try {
      navigate('/login');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">P</div>
      <h2 className="login-title">Register to find and manage<br/>parking spaces</h2>
      <form className="login-form" onSubmit={handleRegister}>
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
          minLength={6}
        />
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
        {error && <div style={{ color: '#ffd740', marginTop: 10, textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: '#4caf50', marginTop: 10, textAlign: 'center' }}>{success}</div>}
      </form>
      <div style={{ color: '#fff', textAlign: 'center', marginTop: '18px', fontSize: '16px', fontWeight: 'bold' }}>
        By registering, you agree to our terms and conditions.
      </div>
      <div style={{ color: '#fff', textAlign: 'center', marginTop: '24px', fontSize: '18px' }}>
        Already have an account?{' '}
        <span
          className="register-link"
          style={{ cursor: 'pointer' }}
          onClick={handleLoginClick}
        >
          Log in
        </span>
      </div>
    </div>
  );
};

export default Register; 