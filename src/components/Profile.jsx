import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// Profile Component v4.0 - Clean Basic Info Only
const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', joined: '' });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setTimeoutReached(true);
    }, 5000);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(currentUser);
      let userProfile = {
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: '',
        joined: currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : '',
      };
      // Try to get extra info from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        userProfile = { ...userProfile, ...data };
      }
      setProfile(userProfile);
      setLoading(false);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: profile.name,
        phone: profile.phone,
      }, { merge: true });
      
      // Update Firebase Auth display name
      await updateProfile(user, {
        displayName: profile.name
      });
      
      setEditMode(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError("Failed to save profile. Please check your connection and permissions.");
    }
    setSaving(false);
  };

  const handleLoginClick = () => {
    try {
      navigate('/login');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  if (loading && !timeoutReached) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading profile...</div>;
  if (timeoutReached && !user) return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      Unable to load profile. You may not be logged in.<br />
      <button onClick={handleLoginClick} style={{ marginTop: 16, background: '#ffd740', color: '#23201d', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, fontSize: 16 }}>
        Go to Login
      </button>
    </div>
  );
  if (!user) return <div style={{ textAlign: 'center', marginTop: 40 }}>You are not logged in.</div>;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Arial, sans-serif"
    }}>
      <div style={{ 
        maxWidth: 700, 
        margin: '0 auto', 
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)', 
        borderRadius: 24, 
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(255, 215, 64, 0.1)', 
        padding: '40px',
        border: '1px solid rgba(255, 215, 64, 0.15)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(255, 215, 64, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'radial-gradient(circle, rgba(255, 215, 64, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '40px',
            position: 'relative'
          }}>
            <h2 style={{ 
              color: '#ffd740', 
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '8px',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
              letterSpacing: '1px'
            }}>Profile</h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1.1rem',
              margin: 0,
              fontWeight: '400'
            }}>Manage your account information</p>
          </div>

          {error && (
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(244, 67, 54, 0.05) 100%)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '30px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(244, 67, 54, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #f44336, #ef5350)'
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#f44336'
              }}>
                <span style={{ fontSize: '1.5rem' }}></span>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '30px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #4caf50, #66bb6a)'
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4caf50'
              }}>
                <span style={{ fontSize: '1.5rem' }}></span>
                {success}
              </div>
            </div>
          )}

          <div style={{ 
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '30px'
          }}>
            <div style={{
              display: 'grid',
              gap: '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #ffd740, #ffe082)'
                  }} />
                  <div style={{
                    color: '#ffd740',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                     Name
                  </div>
                  {editMode ? (
                    <input 
                      name="name" 
                      value={profile.name} 
                      onChange={handleChange} 
                      style={{ 
                        fontSize: '1.1rem', 
                        padding: '12px 16px', 
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: '#ffffff',
                        outline: 'none',
                        width: '100%',
                        transition: 'all 0.3s ease'
                      }} 
                      onFocus={(e) => {
                        e.target.style.borderColor = '#ffd740';
                        e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 64, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      color: '#ffffff',
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      padding: '12px 0'
                    }}>{profile.name}</div>
                  )}
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #ffd740, #ffe082)'
                  }} />
                  <div style={{
                    color: '#ffd740',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                     Email
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    padding: '12px 0'
                  }}>{profile.email}</div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #ffd740, #ffe082)'
                  }} />
                  <div style={{
                    color: '#ffd740',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                     Phone
                  </div>
                  {editMode ? (
                    <input 
                      name="phone" 
                      value={profile.phone} 
                      onChange={handleChange} 
                      style={{ 
                        fontSize: '1.1rem', 
                        padding: '12px 16px', 
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: '#ffffff',
                        outline: 'none',
                        width: '100%',
                        transition: 'all 0.3s ease'
                      }} 
                      onFocus={(e) => {
                        e.target.style.borderColor = '#ffd740';
                        e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 64, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      color: '#ffffff',
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      padding: '12px 0'
                    }}>{profile.phone}</div>
                  )}
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #ffd740, #ffe082)'
                  }} />
                  <div style={{
                    color: '#ffd740',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                     Joined
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    padding: '12px 0'
                  }}>{profile.joined}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Info panel or debug section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '16px',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div>User: {profile.name ? profile.name : 'No name set'}</div>
            <div>Email: {profile.email}</div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {editMode ? (
              <button 
                onClick={handleSave} 
                disabled={saving} 
                style={{ 
                  background: 'linear-gradient(135deg, #ffd740 0%, #ffe082 100%)',
                  color: '#23201d',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  boxShadow: '0 8px 24px rgba(255, 215, 64, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '180px'
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                    e.target.style.boxShadow = '0 12px 32px rgba(255, 215, 64, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 24px rgba(255, 215, 64, 0.3)';
                }}
              >
                {saving ? ' Saving...' : ' Save Changes'}
              </button>
            ) : (
              <button 
                onClick={() => setEditMode(true)} 
                style={{ 
                  background: 'linear-gradient(135deg, #23201d 0%, #2a2a2a 100%)',
                  color: '#ffd740',
                  border: '1px solid rgba(255, 215, 64, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '180px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #2a2a2a 0%, #333 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(255, 215, 64, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #23201d 0%, #2a2a2a 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                 Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 