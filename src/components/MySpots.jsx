import React, { useState, useEffect, useContext } from 'react';
import './MySpots.css';
import { useNavigate } from 'react-router-dom';
import LeafletMapView from './LeafletMapView';
import BottomNavOnly from './BottomNavOnly';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, updateDoc, doc } from 'firebase/firestore';
import { AuthContext } from '../main';
import ReactDOM from 'react-dom';

// Parking Spot List Component
const ParkingSpotList = ({ spots, searchQuery, priceFilter, availabilityFilter, onBookSpot, activeBookings }) => {
  const navigate = useNavigate();
  
  // Filter spots based on search and filters
  const filteredSpots = spots.filter(spot => {
    const matchesSearch = !searchQuery || 
      spot.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = priceFilter === 'all' || 
      (priceFilter === 'free' && (!spot.price || spot.price === 0)) ||
      (priceFilter === 'low' && spot.price && spot.price <= 5) ||
      (priceFilter === 'medium' && spot.price && spot.price > 5 && spot.price <= 10) ||
      (priceFilter === 'high' && spot.price && spot.price > 10);
    
    const isAvailable = activeBookings[spot.id] !== false; // Default to available if not checked yet
    const matchesAvailability = availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && isAvailable) ||
      (availabilityFilter === 'unavailable' && !isAvailable);
    
    return matchesSearch && matchesPrice && matchesAvailability;
  });

  const handleBook = (spot) => {
    const isAvailable = activeBookings[spot.id] !== false;
    if (isAvailable) {
      onBookSpot(spot);
    } else {
      alert('This parking spot is currently occupied. Please try another spot.');
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

  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      height: '100%',
      overflowY: 'auto'
    }}>
      {filteredSpots.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}></div>
          <h3 style={{ margin: '0 0 8px 0', color: '#ffffff' }}>No parking spots found</h3>
          <p style={{ margin: 0 }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredSpots.map((spot) => {
            const isAvailable = activeBookings[spot.id] !== false; // Default to available if not checked yet
            return (
              <div key={spot.id} style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                e.target.style.borderColor = 'rgba(255, 215, 64, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              >
                {/* Availability indicator */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: isAvailable 
                    ? 'linear-gradient(90deg, #4caf50, #66bb6a)' 
                    : 'linear-gradient(90deg, #f44336, #ef5350)'
                }} />

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  {/* Parking icon */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #ffd740, #ffe082)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: '#23201d',
                    fontWeight: 'bold'
                  }}>
                    
                  </div>

                  {/* Spot info */}
                  <div>
                    <h3 style={{
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      margin: '0 0 4px 0'
                    }}>{spot.name || 'Parking Spot'}</h3>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.9rem',
                      margin: '0 0 8px 0'
                    }}>{spot.address}</p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      {spot.price && (
                        <span style={{
                          background: 'rgba(255, 215, 64, 0.2)',
                          color: '#ffd740',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                           ${spot.price}/hr
                        </span>
                      )}
                      <span style={{
                        background: isAvailable 
                          ? 'rgba(76, 175, 80, 0.2)' 
                          : 'rgba(244, 67, 54, 0.2)',
                        color: isAvailable ? '#4caf50' : '#f44336',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {isAvailable ? '✅ Available' : '❌ Currently Occupied'}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <button style={{
                      background: isAvailable ? '#ffd740' : '#ccc',
                      color: isAvailable ? '#23201d' : '#666',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: '600',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease'
                    }} onClick={() => handleBook(spot)}>
                       {isAvailable ? 'Book Now' : 'Occupied'}
                    </button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease'
                    }} onClick={() => handleDirections(spot.lat, spot.lng)}>
                       Directions
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MySpots = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  // Booking modal state
  const [bookingSpot, setBookingSpot] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeBookings, setActiveBookings] = useState({}); // Track active bookings per spot
  
  // Get user from AuthContext with comprehensive safety checks
  let user = null;
  try {
    const authContext = useContext(AuthContext);
    if (authContext && typeof authContext === 'object' && 'user' in authContext) {
      user = authContext.user;
    }
  } catch (error) {
    console.warn('AuthContext not available or invalid:', error);
    user = null;
  }

  useEffect(() => {
    const fetchSpotsWithAvailability = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const querySnapshot = await getDocs(collection(db, "parkingSpots"));
        const spots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Check availability for each spot
        const spotsWithAvailability = await Promise.all(
          spots.map(async (spot) => {
            const isAvailable = await checkSpotAvailability(spot.id);
            return { ...spot, availability: isAvailable };
          })
        );
        
        setParkingSpots(spotsWithAvailability);
        setLastFetchTime(new Date());
      } catch (error) {
        console.error('Error fetching spots:', error);
        setError('Failed to load parking spots. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch spots once on component mount
    fetchSpotsWithAvailability();
  }, []); // Empty dependency array to run only once

  // Remove the separate availability checking useEffect since we now do it in one query

  const handleBookSpot = (spot) => {
    setBookingSpot(spot);
    setBookingDate("");
    setBookingTime("");
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.uid) {
      alert('Please log in to book a spot.');
      return;
    }

    if (!bookingDate || !bookingTime) {
      alert('Please select both date and time.');
      return;
    }

    // Validate that the selected date and time are in the future
    const selectedDateTime = new Date(`${bookingDate}T${bookingTime}`);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      alert('Please select a future date and time.');
      return;
    }

    // Check if spot is currently available
    const isAvailable = await checkSpotAvailability(bookingSpot.id);
    if (!isAvailable) {
      alert('This parking spot is currently occupied. Please try another spot or time.');
      return;
    }

    const bookingUserId = user.uid;
    
    // Validate payment method
    if (!selectedPaymentMethod) {
      alert('Please select a payment method.');
      return;
    }

    if (selectedPaymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCVV)) {
      alert('Please fill in all card details.');
      return;
    }

    if (selectedPaymentMethod === 'mobile' && !mobileNumber) {
      alert('Please enter your mobile number.');
      return;
    }

    if (selectedPaymentMethod === 'bank' && !bankAccount) {
      alert('Please enter your bank account number.');
      return;
    }

    const bookingData = {
      userId: bookingUserId,
      spotId: bookingSpot.id,
      spotName: bookingSpot.name,
      spotAddress: bookingSpot.address,
      spotPrice: bookingSpot.price,
      bookingDate: bookingDate,
      bookingTime: bookingTime,
      bookingDateTime: selectedDateTime.toISOString(),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    try {
      // Create booking
      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Create payment record
      const paymentData = {
        userId: bookingUserId,
        userName: user.displayName || user.email,
        bookingId: bookingRef.id,
        spotId: bookingSpot.id,
        spotName: bookingSpot.name,
        amount: bookingSpot.price || 2.00, // Default $2.00 if no price set
        description: `Parking fee for ${bookingSpot.name}`,
        method: selectedPaymentMethod,
        status: 'successful',
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        // Additional method-specific data
        cardNumber: selectedPaymentMethod === 'card' ? cardNumber.slice(-4) : null,
        mobileNumber: selectedPaymentMethod === 'mobile' ? mobileNumber : null,
        bankAccount: selectedPaymentMethod === 'bank' ? bankAccount : null
      };
      
      await addDoc(collection(db, 'payments'), paymentData);
      alert('Booking confirmed and payment processed! Check your bookings page.');
      setShowBookingModal(false);
      setBookingSpot(null);
      setBookingDate("");
      setBookingTime("");
      setSelectedPaymentMethod("");
      setCardNumber("");
      setCardExpiry("");
      setCardCVV("");
      setMobileNumber("");
      setBankAccount("");
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert(`Error booking spot: ${error.message}`);
    }
  };

  const handleHomeClick = () => {
    try {
      navigate('/');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  const handleViewModeToggle = () => {
    try {
      setViewMode(viewMode === 'map' ? 'list' : 'map');
    } catch (error) {
      console.error('View mode toggle error:', error);
      alert('Failed to switch view mode. Please try again.');
    }
  };

  const handleRefresh = () => {
    try {
      setLastFetchTime(null);
      setError(null);
      // Force a fresh fetch of spots
      fetchSpotsWithAvailability();
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Failed to refresh data. Please try again.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    try {
      // The search is already handled by the filteredSpots logic
      // This just provides visual feedback that search was triggered
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    }
  };

  return (
    <div className="myspots-root">
      {/* Modern Header */}
      <header className="myspots-header">
        <div className="header-content">
          <div className="header-left">
            {/* Header content without logo since LogoOnlyNavbar handles it */}
          </div>
          <div className="header-actions">
            <button 
              type="button"
              onClick={handleViewModeToggle}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #ffd740, #ffe082)',
                color: '#23201d',
                border: 'none',
                boxShadow: '0 4px 12px rgba(255, 215, 64, 0.3)',
                position: 'relative',
                zIndex: 10,
                minWidth: '120px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(255, 215, 64, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 64, 0.3)';
              }}
            >
              {viewMode === 'map' ? '📋 List View' : '🗺️ Map View'}
            </button>
            <button 
              type="button"
              onClick={handleRefresh}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                position: 'relative',
                zIndex: 10,
                minWidth: '120px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
              }}
            >
              🔄 Refresh
            </button>
            <button 
              type="button"
              onClick={handleHomeClick}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #f44336, #e57373)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                position: 'relative',
                zIndex: 10,
                minWidth: '120px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(244, 67, 54, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)';
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Search and Filters Section */}
      <section className="search-filters-section">
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search for parking spots, addresses, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
            />
            <button 
              type="button"
              onClick={handleSearch}
              style={{
                background: 'linear-gradient(135deg, #ffd740, #ffe082)',
                color: '#23201d',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 20px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(255, 215, 64, 0.3)',
                position: 'relative',
                zIndex: 10,
                minWidth: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(255, 215, 64, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 64, 0.3)';
              }}
            >
              🔍 Search
            </button>
          </div>
          
          <div className="filters-container">
            <select 
              value={priceFilter} 
              onChange={(e) => setPriceFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="low">$1-5/hr</option>
              <option value="medium">$6-10/hr</option>
              <option value="high">$10+/hr</option>
            </select>
            
            <select 
              value={availabilityFilter} 
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Availability</option>
              <option value="available">Available Now</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{parkingSpots.filter(spot => spot.availability).length}</div>
            <div className="stat-label">Available Spots</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{parkingSpots.length}</div>
            <div className="stat-label">Total Spots</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              ${parkingSpots.length > 0 
                ? (parkingSpots.reduce((sum, spot) => sum + (spot.price || 0), 0) / parkingSpots.length).toFixed(2)
                : '0.00'
              }
            </div>
            <div className="stat-label">Avg. Price/hr</div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          <div className="map-container">
            {loading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#ffd740',
                fontSize: '1.2rem',
                fontWeight: '600',
                gap: '16px'
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(255, 215, 64, 0.3)',
                  borderTop: '3px solid #ffd740',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <div>Loading parking spots...</div>
                <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>
                  Optimized loading for faster results
                </div>
              </div>
            ) : error ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#ff6b6b',
                fontSize: '1.1rem',
                gap: '16px'
              }}>
                <div>⚠️ {error}</div>
                <button 
                  onClick={() => {
                    setError(null);
                    setLastFetchTime(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ffd740',
                    color: '#23201d',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <LeafletMapView />
            ) : (
              <ParkingSpotList 
                spots={parkingSpots}
                searchQuery={searchQuery}
                priceFilter={priceFilter}
                availabilityFilter={availabilityFilter}
                onBookSpot={handleBookSpot}
                activeBookings={activeBookings}
              />
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavOnly />
      
      {/* Custom CSS for dark theme inputs */}
      <style>{`
        /* Dark theme for select dropdowns */
        select option {
          background-color: #2d2d2d !important;
          color: #ffffff !important;
          padding: 8px 12px;
        }
        
        select option:hover {
          background-color: #ffd740 !important;
          color: #23201d !important;
        }
        
        select option:checked {
          background-color: #ffd740 !important;
          color: #23201d !important;
        }
        
        /* Dark theme for date/time inputs */
        input[type="date"], input[type="time"] {
          color-scheme: dark !important;
        }
        
        /* Dark theme for text inputs */
        input[type="text"], input[type="tel"] {
          color-scheme: dark !important;
        }
        
        /* Force dark theme for all form elements */
        input, select, textarea {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        /* Calendar popup dark theme */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
        
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
      `}</style>
      
      {showBookingModal && bookingSpot && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <form key={bookingSpot.id}
            onSubmit={handleBookingSubmit}
            style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              borderRadius: '12px',
              padding: '32px',
              minWidth: '400px',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              border: '1px solid rgba(255, 215, 64, 0.3)',
              backdropFilter: 'blur(20px)'
            }}>
            <h3 style={{margin: 0, color: '#ffd740', textAlign: 'center', fontWeight: '700'}}>Book: {bookingSpot.name || bookingSpot.address}</h3>
            
            {/* Price Display */}
            {bookingSpot.price && (
              <div style={{
                background: 'linear-gradient(135deg, #ffd740, #ffe082)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#23201d',
                fontWeight: '600'
              }}>
                💰 Price: ${bookingSpot.price}/hour
              </div>
            )}
            
            {/* Date and Time */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ flex: 1, color: '#ffffff' }}>
                Date:
                <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }} />
              </label>
              <label style={{ flex: 1, color: '#ffffff' }}>
                Time:
                <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }} />
              </label>
            </div>
            
            {/* Payment Method Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#ffffff' }}>
                Payment Method:
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ffd740';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 64, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
                required
              >
                <option value="">Select payment method...</option>
                <option value="card"> Credit/Debit Card</option>
                <option value="mobile"> Mobile Money</option>
                <option value="bank"> Bank Transfer</option>
                <option value="cash"> Cash Payment</option>
              </select>
            </div>
            
            {/* Card Details */}
            {selectedPaymentMethod === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Card Number (1234 5678 9012 3456)"
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255, 255, 255, 0.3)', 
                    background: 'rgba(0, 0, 0, 0.3)', 
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ffd740';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 64, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }}
                  required
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    style={{ 
                      flex: 1, 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(255, 255, 255, 0.3)', 
                      background: 'rgba(0, 0, 0, 0.3)', 
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#ffd740';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 64, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                    }}
                    required
                  />
                  <input
                    type="text"
                    value={cardCVV}
                    onChange={(e) => setCardCVV(e.target.value)}
                    placeholder="CVV"
                    style={{ 
                      flex: 1, 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(255, 255, 255, 0.3)', 
                      background: 'rgba(0, 0, 0, 0.3)', 
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#ffd740';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 64, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                    }}
                    required
                  />
                </div>
              </div>
            )}
            
            {/* Mobile Money */}
            {selectedPaymentMethod === 'mobile' && (
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Mobile Number (+263 77 123 4567)"
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(255, 255, 255, 0.3)', 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ffd740';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 64, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
                required
              />
            )}
            
            {/* Bank Transfer */}
            {selectedPaymentMethod === 'bank' && (
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Bank Account Number"
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(255, 255, 255, 0.3)', 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ffd740';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 64, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
                required
              />
            )}
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" disabled={bookingLoading} style={{ flex: 1, background: '#23201d', color: '#ffd740', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: '600', cursor: bookingLoading ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: bookingLoading ? 0.6 : 1 }}>
                {bookingLoading ? '⏳ Processing...' : '✅ Book & Pay'}
              </button>
              <button type="button" onClick={() => { 
                setShowBookingModal(false); 
                setBookingSpot(null); 
                setSelectedPaymentMethod("");
                setCardNumber("");
                setCardExpiry("");
                setCardCVV("");
                setMobileNumber("");
                setBankAccount("");
              }} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '15px', opacity: 0.9 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MySpots; 