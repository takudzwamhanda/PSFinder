import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(
          <>This email is already registered. <span className="register-link" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Log in?</span></>
        );
      } else {
        setError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
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
          onClick={() => navigate('/login')}
        >
          Log in
        </span>
      </div>
    </div>
  );
};

export default Register; 