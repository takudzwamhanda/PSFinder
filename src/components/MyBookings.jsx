import React, { useEffect, useState, useContext } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../main';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#ffd740', marginBottom: '16px' }}>Something went wrong</h3>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#ffd740',
              color: '#23201d',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [parkingSpots, setParkingSpots] = useState({}); // Store parking spot details
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const paymentSuccess = params.get('success') === '1';
  
  // Get user from AuthContext
  const authContext = useContext(AuthContext);
const user = authContext?.user;

  useEffect(() => {
    const getUserName = async (user) => {
      if (!user) {
        setUserName("");
        return;
      }
      if (user.displayName) {
        setUserName(user.displayName);
        return;
      }
      // Try to fetch from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().name) {
          setUserName(userDoc.data().name);
        } else {
          setUserName(user.email || "");
        }
      } catch (e) {
        setUserName(user.email || "");
      }
    };
    getUserName(user);
  }, [user]);

  // Fetch parking spot details
  const fetchParkingSpotDetails = async (spotId) => {
    try {
      const spotDoc = await getDoc(doc(db, 'parkingSpots', spotId));
      if (spotDoc.exists()) {
        return spotDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching parking spot details:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings(user);
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [user]);

  const deleteTestBookings = async () => {
    if (!user) return;
    
    try {
      console.log('Deleting test bookings for user:', user.uid);
      
      // Get all bookings for this user
      const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      let deletedCount = 0;
      for (const doc of querySnapshot.docs) {
        const bookingData = doc.data();
        
        // Check if this is a test booking
        if (bookingData.spotId?.toLowerCase().includes('test')) {
          console.log('Deleting test booking:', doc.id, bookingData);
          await deleteDoc(doc.ref);
          deletedCount++;
        }
      }
      
      console.log(`Deleted ${deletedCount} test bookings`);
      alert(`Deleted ${deletedCount} test bookings. Refresh the page to see changes.`);
      
      // Refresh bookings
      fetchBookings(user);
    } catch (error) {
      console.error('Error deleting test bookings:', error);
      alert('Error deleting test bookings: ' + error.message);
    }
  };

  const fetchBookings = async (currentUser) => {
    setLoading(true);
    setError(null);
    console.log('Fetching bookings for user:', currentUser);
    console.log('User UID:', currentUser?.uid);
    
    try {
      const q = query(collection(db, "bookings"), where("userId", "==", currentUser.uid));
      console.log('Query created for user:', currentUser.uid);
      
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);
      console.log('Query snapshot empty:', querySnapshot.empty);
      
      let data = querySnapshot.docs.map(doc => {
        const bookingData = { id: doc.id, ...doc.data() };
        console.log('Booking data:', bookingData);
        return bookingData;
      });
      
      // Fetch parking spot details for each booking
      const spotsData = {};
      for (const booking of data) {
        if (booking.spotId) {
          const spotDetails = await fetchParkingSpotDetails(booking.spotId);
          if (spotDetails) {
            spotsData[booking.spotId] = spotDetails;
          }
        }
      }
      setParkingSpots(spotsData);

      // Filter out bookings for test spots
      data = data.filter(b => {
        console.log('Filtering booking:', b.spotId, b);
        
        // First check if the booking itself is a test booking
        if (b.spotId?.toLowerCase().includes('test')) {
          console.log('Filtered out - spotId contains test:', b.spotId);
          return false;
        }
        
        const spot = spotsData[b.spotId];
        // If spot details not found, it might be a test spot that was deleted
        if (!spot) {
          console.log('Filtered out - spot not found:', b.spotId);
          return false; // Hide bookings for non-existent spots
        }
        
        if (spot.isTest) {
          console.log('Filtered out - spot isTest flag:', b.spotId);
          return false;
        }
        if (spot.name?.toLowerCase().includes('test')) {
          console.log('Filtered out - spot name contains test:', spot.name);
          return false;
        }
        if (spot.address?.toLowerCase().includes('test')) {
          console.log('Filtered out - spot address contains test:', spot.address);
          return false;
        }
        
        // Filter out cancelled bookings
        if (b.status === 'cancelled') {
          console.log('Filtered out - booking is cancelled:', b.id);
          return false;
        }
        
        console.log('Keeping booking:', b.spotId);
        return true;
      });
      
      console.log('All bookings data (filtered):', data);
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to fetch bookings. Please try again.');
      setBookings([]);
    }
    setLoading(false);
  };

  const handlePay = async (booking) => {
    try {
      // For demo, use a fixed amount or booking.price if available
      const amount = booking.price ? booking.price : 200; // $2.00 default
      const response = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          bookingId: booking.id,
          userId: booking.userId,
        })
      });
      const data = await response.json();
      if (data.url) {
        // Save payment record to Firestore before redirecting
        try {
          const paymentRef = await addDoc(collection(db, "payments"), {
            bookingId: booking.id,
            userId: booking.userId,
            amount: amount / 100, // Convert from cents to dollars
            method: 'Card', // Default method, can be updated based on actual payment method
            transactionId: `TXN_${Date.now()}`, // Generate a transaction ID
            status: 'pending', // Will be updated to 'successful' after payment confirmation
            date: new Date(),
            createdAt: new Date(),
          });
          
          // Store payment ID in sessionStorage for later status update
          sessionStorage.setItem('pendingPaymentId', paymentRef.id);
          sessionStorage.setItem('pendingBookingId', booking.id);
          
        } catch (paymentSaveError) {
          console.error('Error saving payment record:', paymentSaveError);
          // Continue with payment even if saving to Firestore fails
        }
        window.location.href = data.url;
      } else {
        alert('Failed to create payment session.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment error. Please try again.');
    }
  };

  // Function to update payment status after successful payment
  const updatePaymentStatus = async (paymentId, status) => {
    try {
      await updateDoc(doc(db, 'payments', paymentId), { status });
      sessionStorage.removeItem('pendingPaymentId');
      // Refresh bookings to show updated status
      if (user) {
        fetchBookings(user);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Cancelling booking:', bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), { 
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
      console.log('Booking cancelled successfully');
      alert('Booking cancelled successfully!');
      
      // Refresh bookings to show updated status
      if (user) {
        fetchBookings(user);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking: ' + error.message);
    }
  };

  const [userLocation, setUserLocation] = useState(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, []);

  const handleDirections = (lat, lng) => {
    if (userLocation) {
      // Use real-time user location as origin
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`;
      window.open(url, '_blank');
      
      // Provide feedback about location accuracy
      if (userLocation.accuracy > 100) {
        alert(`Directions opened! Note: Your location accuracy is ${userLocation.accuracy} meters. For more precise directions, try refreshing your location from an open area.`);
      } else {
        alert('Directions opened with your current location!');
      }
    } else {
      // Fallback to destination-only if user location not available
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
      alert('Directions opened! Since your location is not available, you may need to set your starting point manually in Google Maps.');
    }
  };

  // Check for pending payment status on component mount
  useEffect(() => {
    const pendingPaymentId = sessionStorage.getItem('pendingPaymentId');
    if (pendingPaymentId && paymentSuccess) {
      updatePaymentStatus(pendingPaymentId, 'successful');
    }
  }, [paymentSuccess]);

  return (
    <ErrorBoundary>
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        padding: '20px',
        fontFamily: "'Segoe UI', Arial, sans-serif"
      }}>
      <div style={{ 
        maxWidth: 800, 
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
            {userName && (
              <h3 style={{
                color: '#ffd740',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '12px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                Welcome, {userName}!
              </h3>
            )}
            <h2 style={{ 
              color: '#ffd740', 
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '8px',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
              letterSpacing: '1px'
            }}> My Bookings</h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1.1rem',
              margin: 0,
              fontWeight: '400'
            }}>Manage your parking reservations</p>
            

          </div>

          {paymentSuccess && (
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
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                Payment successful! Your booking is now confirmed.
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'inline-block',
                width: '60px',
                height: '60px',
                border: '3px solid rgba(255, 215, 64, 0.3)',
                borderTop: '3px solid #ffd740',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{
                color: '#ffd740',
                fontSize: '1.2rem',
                fontWeight: '600',
                marginTop: '20px',
                marginBottom: 0
              }}>Loading your bookings...</p>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '20px',
                opacity: 0.6
              }}>❌</div>
              <h3 style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '12px'
              }}>Error: {error}</h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '1rem',
                margin: 0,
                marginBottom: '20px'
              }}>Please try again later or contact support.</p>
              
              {/* Debug button for testing */}
              {user && (
                <button 
                  onClick={async () => {
                    try {
                      console.log('Creating test booking for user:', user.uid);
                      const testBooking = await addDoc(collection(db, "bookings"), {
                        userId: user.uid,
                        spotId: "test-spot-123",
                        date: new Date().toISOString().split('T')[0],
                        time: "14:00",
                        status: "pending",
                        createdAt: new Date(),
                        actualEndTime: null,
                        totalCost: null,
                      });
                      console.log('Test booking created with ID:', testBooking.id);
                      alert('Test booking created! Refresh the page to see it.');
                    } catch (error) {
                      console.error('Error creating test booking:', error);
                      alert('Error creating test booking: ' + error.message);
                    }
                  }}
                  style={{
                    background: 'rgba(255, 215, 64, 0.2)',
                    color: '#ffd740',
                    border: '1px solid rgba(255, 215, 64, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Create Test Booking
                </button>
              )}
              
              {/* Debug button to delete test bookings */}
              {user && (
                <button 
                  onClick={deleteTestBookings}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    marginLeft: '8px'
                  }}
                >
                   Delete Test Bookings
                </button>
              )}
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '20px',
                opacity: 0.6
              }}></div>
              <h3 style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '12px'
              }}>No bookings yet</h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '1rem',
                margin: 0,
                marginBottom: '20px'
              }}>Your parking reservations will appear here</p>
              
              {/* Debug button for testing */}
              {user && (
                <button 
                  onClick={async () => {
                    try {
                      console.log('Creating test booking for user:', user.uid);
                      const testBooking = await addDoc(collection(db, "bookings"), {
                        userId: user.uid,
                        spotId: "test-spot-123",
                        date: new Date().toISOString().split('T')[0],
                        time: "14:00",
                        status: "pending",
                        createdAt: new Date(),
                        actualEndTime: null,
                        totalCost: null,
                      });
                      console.log('Test booking created with ID:', testBooking.id);
                      alert('Test booking created! Refresh the page to see it.');
                    } catch (error) {
                      console.error('Error creating test booking:', error);
                      alert('Error creating test booking: ' + error.message);
                    }
                  }}
                  style={{
                    background: 'rgba(255, 215, 64, 0.2)',
                    color: '#ffd740',
                    border: '1px solid rgba(255, 215, 64, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                   Create Test Booking
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {bookings.map((b, index) => (
                <div key={`booking-${b.id}-${index}`} style={{ 
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
                  e.target.style.borderColor = 'rgba(255, 215, 64, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                >
                  {/* Status indicator */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: b.status === 'pending' 
                      ? 'linear-gradient(90deg, #ff9800, #ffb74d)' 
                      : b.status === 'confirmed' 
                      ? 'linear-gradient(90deg, #4caf50, #66bb6a)' 
                      : 'linear-gradient(90deg, #f44336, #ef5350)'
                  }} />

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: 'linear-gradient(135deg, #ffd740, #ffe082)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          color: '#23201d',
                          fontWeight: 'bold'
                        }}>
                          🅿️
                        </div>
                        <div>
                          <h3 style={{
                            color: '#ffffff',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            margin: '0 0 4px 0'
                          }}>{parkingSpots[b.spotId]?.name || b.spotId}</h3>
                          <p style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.9rem',
                            margin: '0 0 8px 0'
                          }}>{parkingSpots[b.spotId]?.address || 'Address not available'}</p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              background: b.status === 'pending' 
                                ? 'rgba(255, 152, 0, 0.2)' 
                                : b.status === 'confirmed' 
                                ? 'rgba(76, 175, 80, 0.2)' 
                                : 'rgba(244, 67, 54, 0.2)',
                              color: b.status === 'pending' 
                                ? '#ff9800' 
                                : b.status === 'confirmed' 
                                ? '#4caf50' 
                                : '#f44336',
                              border: `1px solid ${b.status === 'pending' 
                                ? 'rgba(255, 152, 0, 0.3)' 
                                : b.status === 'confirmed' 
                                ? 'rgba(76, 175, 80, 0.3)' 
                                : 'rgba(244, 67, 54, 0.3)'}`
                            }}>
                              {b.status === 'pending' ? '⏳ Pending' : 
                               b.status === 'confirmed' ? '✅ Confirmed' : '❌ Cancelled'}
                            </span>
                            {parkingSpots[b.spotId]?.price && (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                background: 'rgba(255, 215, 64, 0.2)',
                                color: '#ffd740',
                                border: '1px solid rgba(255, 215, 64, 0.3)'
                              }}>
                                ${parkingSpots[b.spotId].price}/hr
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                      }}>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{
                            color: '#ffd740',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}> Date</div>
                          <div style={{
                            color: '#ffffff',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}>{b.bookingDate || b.date}</div>
                        </div>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{
                            color: '#ffd740',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}> Time</div>
                          <div style={{
                            color: '#ffffff',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}>{b.bookingTime || b.time}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons - now below the booking info */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      {b.status === 'pending' && (
                        <button style={{ 
                          background: 'linear-gradient(135deg, #ffd740 0%, #ffe082 100%)',
                          color: '#23201d',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '16px 24px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          boxShadow: '0 8px 24px rgba(255, 215, 64, 0.3)',
                          transition: 'all 0.3s ease',
                          minWidth: '140px'
                        }} 
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.02)';
                          e.target.style.boxShadow = '0 12px 32px rgba(255, 215, 64, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 8px 24px rgba(255, 215, 64, 0.3)';
                        }}
                        onClick={() => handlePay(b)}>
                          Pay Now
                        </button>
                      )}
                      
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <button style={{ 
                          background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 20px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          boxShadow: '0 6px 20px rgba(244, 67, 54, 0.3)',
                          transition: 'all 0.3s ease',
                          minWidth: '140px'
                        }} 
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.02)';
                          e.target.style.boxShadow = '0 10px 28px rgba(244, 67, 54, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 6px 20px rgba(244, 67, 54, 0.3)';
                        }}
                        onClick={() => cancelBooking(b.id)}>
                          Cancel Booking
                        </button>
                      )}
                      
                      {b.status === 'confirmed' && (
                        <button style={{ 
                          background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 20px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          boxShadow: '0 6px 20px rgba(76, 175, 80, 0.3)',
                          transition: 'all 0.3s ease',
                          minWidth: '140px'
                        }} 
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.02)';
                          e.target.style.boxShadow = '0 10px 28px rgba(76, 175, 80, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.3)';
                        }}
                        onClick={() => window.location.href = '/reviews'}>
                           Write Review
                        </button>
                      )}
                      
                      {/* Directions button - available for all booking statuses if location data exists */}
                      {parkingSpots[b.spotId]?.lat && parkingSpots[b.spotId]?.lng && (
                        <button style={{ 
                          background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 20px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          boxShadow: '0 6px 20px rgba(33, 150, 243, 0.3)',
                          transition: 'all 0.3s ease',
                          minWidth: '140px'
                        }} 
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.02)';
                          e.target.style.boxShadow = '0 10px 28px rgba(33, 150, 243, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.3)';
                        }}
                        onClick={() => handleDirections(parkingSpots[b.spotId].lat, parkingSpots[b.spotId].lng)}>
                          Get Directions
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default MyBookings; 