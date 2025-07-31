import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailLink, signOut } from 'firebase/auth';

const LoginLink = () => {
  const [message, setMessage] = useState('Signing you in...');
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      setMessage('No email found. Please try logging in again.');
      return;
    }
    setUserEmail(email);
    signInWithEmailLink(auth, email, window.location.href)
      .then((result) => {
        setMessage('Sign-in successful!');
        setSuccess(true);
        window.localStorage.removeItem('emailForSignIn');
      })
      .catch((error) => {
        setMessage('Sign-in failed: ' + (error.message || 'Invalid or expired link.'));
        setSuccess(false);
      });
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2>{message}</h2>
      {success && (
        <>
          <button style={{ padding: '10px 24px', fontSize: '1rem', background: '#23201d', color: '#ffd740', border: '1px solid #ffd740', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }} onClick={handleLogout}>
            Log Out
          </button>
        </>
      )}
    </div>
  );
};

export default LoginLink; 