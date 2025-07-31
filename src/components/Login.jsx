import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate('/landing2');
    } catch (err) {
      setLoading(false);
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email. Please register first.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password. Please try again.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Failed to log in.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">P</div>
      <h2 className="login-title">Log in to Parking Space Finder</h2>
      <form className="login-form" onSubmit={handleLogin}>
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
        />
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <div style={{ color: '#ffd740', marginTop: 10, textAlign: 'center' }}>{error}</div>}
      </form>
      <div className="forgot-password">
        <span 
          className="forgot-password-link" 
          style={{ cursor: 'pointer' }} 
          onClick={() => navigate('/forgot-password')}
        >
          Forgot Password?
        </span>
      </div>
      <div className="login-register">
        <span>Don't have an account? Register now.</span>
        <br />
        <span className="register-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/register')}>Register</span>
      </div>
    </div>
  );
};

export default Login; 