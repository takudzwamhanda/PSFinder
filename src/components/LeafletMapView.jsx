import React, { useState, useEffect, useRef, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "../firebase";
import { collection, getDocs, addDoc, collection as firestoreCollection, query, where, onSnapshot } from "firebase/firestore";
import { AuthContext } from '../main';
import ReactDOM from 'react-dom';

// Fix default icon issue in Leaflet when using with React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const containerStyle = {
  width: "100%",
  height: "100%",
  position: "relative",
  zIndex: 1,
};

const center = {
  lat: -17.8252, // Harare, Zimbabwe latitude
  lng: 31.0335, // Harare, Zimbabwe longitude
};

// Error Boundary Component
class LeafletMapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LeafletMapView Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#ffd740', marginBottom: '16px' }}>Map Loading Error</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
            There was an issue loading the map. Please refresh the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#ffd740',
              color: '#23201d',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LeafletMapView = () => {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookingSpot, setBookingSpot] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeBookings, setActiveBookings] = useState({}); // Track active bookings per spot
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const mapRef = useRef(null);
  const center = { lat: -17.813, lng: 31.008 }; // Harare, Zimbabwe
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Get user from AuthContext with comprehensive safety checks
  let user = null;
  try {
    const authContext = useContext(AuthContext);
    console.log('LeafletMapView - AuthContext:', authContext);
    if (authContext && typeof authContext === 'object' && 'user' in authContext) {
      user = authContext.user;
      console.log('LeafletMapView - User from context:', user);
    } else {
      console.log('LeafletMapView - No valid user in context');
    }
  } catch (error) {
    console.warn('AuthContext not available or invalid:', error);
    user = null;
  }



  // Get user's real-time location on mount with better accuracy
  useEffect(() => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 0 // Always get fresh location
      };

      const successCallback = (position) => {
        console.log('Location accuracy:', position.coords.accuracy, 'meters');
        
        // Only use location if accuracy is good enough (within 50 meters)
        if (position.coords.accuracy <= 50) {
          const newUserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setUserLocation(newUserLocation);
          console.log('Location set with accuracy:', position.coords.accuracy, 'meters');
        } else {
          console.warn('Location accuracy too low:', position.coords.accuracy, 'meters');
          alert('Location accuracy is low (' + position.coords.accuracy + ' meters). Please ensure GPS is enabled and try again.');
        }
      };

      const errorCallback = (error) => {
        console.warn('Geolocation error:', error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            alert('Location permission denied. Please enable location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information unavailable. Please check your GPS settings.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out. Please try again.');
            break;
          default:
            alert('Location error occurred. Please try again.');
        }
      };

      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }, []);

  useEffect(() => {
    const fetchSpots = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "parkingSpots"));
        const spots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setParkingSpots(spots);
      } catch (error) {
        console.error("Error fetching parking spots:", error);
      }
      setLoading(false);
    };
    fetchSpots();
  }, []);

  // Real-time availability checking
  useEffect(() => {
    const checkAllSpotsAvailability = async () => {
      const availabilityMap = {};
      
      for (const spot of parkingSpots) {
        const isAvailable = await checkSpotAvailability(spot.id);
        availabilityMap[spot.id] = isAvailable;
      }
      
      setActiveBookings(availabilityMap);
    };
    
    if (parkingSpots.length > 0) {
      checkAllSpotsAvailability();
    }
  }, [parkingSpots]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "parkingSpots"), (snapshot) => {
      const updatedSpots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParkingSpots(updatedSpots);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setSearchResult({ lat: parseFloat(lat), lng: parseFloat(lon), display_name });
        if (mapRef.current) {
          mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 15);
        }
      } else {
        setSearchResult(null);
        alert("Location not found.");
      }
    } catch (err) {
      setSearchResult(null);
      alert("Error searching location.");
    }
  };

  const handleBook = (spot) => {
    console.log('handleBook called with spot:', spot);
    console.log('Setting booking spot and opening modal...');
    setBookingSpot(spot);
    setBookingDate("");
    setBookingTime("");
    setShowBookingModal(true);
    console.log('Booking spot set to:', spot);
    console.log('Modal should now be visible');
  };

    const checkSpotAvailability = async (spotId) => {
    try {
      const now = new Date();
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('spotId', '==', spotId),
        where('status', 'in', ['pending', 'confirmed'])
      );
      
      const querySnapshot = await getDocs(bookingsQuery);
      const activeBookings = [];
      
      querySnapshot.forEach(doc => {
        const booking = doc.data();
        const bookingDateTime = new Date(booking.bookingDateTime);
        const endTime = new Date(bookingDateTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours duration
        
        // Check if booking is currently active
        if (now >= bookingDateTime && now <= endTime) {
          activeBookings.push(booking);
        }
      });
      
      return activeBookings.length === 0; // Available if no active bookings
    } catch (error) {
      console.error('Error checking spot availability:', error);
      return true; // Assume available if error
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    console.log('=== BOOKING SUBMISSION DEBUG ===');
    console.log('handleBookingSubmit called');
    console.log('Current user:', user);
    console.log('User UID:', user?.uid);
    console.log('Booking spot:', bookingSpot);
    console.log('Booking date:', bookingDate);
    console.log('Booking time:', bookingTime);
    
    if (!user || !user.uid) {
      console.error('No user or user.uid found!');
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
    console.log('Booking userId:', bookingUserId);
    
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
    
    console.log('Full booking data object:', bookingData);
    console.log('About to call addDoc with collection:', collection(db, 'bookings'));
    console.log('=== END DEBUG ===');

    try {
      // Create booking
      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      console.log('Booking created successfully with ID:', bookingRef.id);
      
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
      console.log('Payment created successfully');
      
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

  const [locationLoading, setLocationLoading] = useState(false);

  const refreshLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      const successCallback = (position) => {
        console.log('Location accuracy:', position.coords.accuracy, 'meters');
        
        if (position.coords.accuracy <= 50) {
          const newUserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setUserLocation(newUserLocation);
          setLocationLoading(false);
          alert('Location updated! Accuracy: ' + position.coords.accuracy + ' meters');
        } else {
          setLocationLoading(false);
          alert('Location accuracy is low (' + position.coords.accuracy + ' meters). Please move to an open area and try again.');
        }
      };

      const errorCallback = (error) => {
        setLocationLoading(false);
        console.warn('Geolocation error:', error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            alert('Location permission denied. Please enable location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information unavailable. Please check your GPS settings.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out. Please try again.');
            break;
          default:
            alert('Location error occurred. Please try again.');
        }
      };

      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    }
  };

  const handleDirections = (lat, lng) => {
    if (userLocation) {
      // Use real-time user location as origin
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      // Fallback to destination-only if user location not available
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  // Only use spots with valid lat/lng and exclude test spots
  const validSpots = parkingSpots.filter(
    spot => 
      typeof spot.lat === 'number' && 
      typeof spot.lng === 'number' && 
      !isNaN(spot.lat) && 
      !isNaN(spot.lng) &&
      !spot.isTest && // Exclude test spots
      !spot.name?.toLowerCase().includes('test') && // Exclude spots with "test" in name
      !spot.address?.toLowerCase().includes('test') // Exclude spots with "test" in address
  );

  return (
    <LeafletMapErrorBoundary>
    <div style={containerStyle}>
      <form onSubmit={handleSearch} style={{ 
        marginBottom: 12, 
        display: 'flex', 
        gap: 8,
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        margin: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search for a place or address..."
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            fontSize: '14px'
          }}
        />
        <button type="submit" style={{ 
          padding: '12px 20px', 
          borderRadius: '8px', 
          background: '#ffd740', 
          color: '#23201d', 
          border: 'none', 
          fontWeight: 600, 
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.3s ease'
        }}>Search</button>
        <button 
          type="button"
          onClick={refreshLocation}
          disabled={locationLoading}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            background: locationLoading ? '#666' : '#4caf50', 
            color: '#ffffff', 
            border: 'none', 
            fontWeight: 600, 
            cursor: locationLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {locationLoading ? '⏳' : '📍'}
          {locationLoading ? 'Updating...' : 'My Location'}
        </button>
      </form>
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : [searchResult ? searchResult.lat : center.lat, searchResult ? searchResult.lng : center.lng]}
        zoom={12}
        style={{ 
          width: "100%", 
          height: "calc(100% - 100px)",
          position: "relative",
          zIndex: 1
        }}
        scrollWheelZoom={true}
        whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        // Performance optimizations
        preferCanvas={true}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {searchResult && (
          <Marker position={[searchResult.lat, searchResult.lng]}>
            <Popup>
              <div style={{ padding: '8px', minWidth: '200px' }}>
                <strong style={{ color: '#23201d', fontSize: '16px' }}>📍 Searched Location</strong>
                <br />
                <span style={{ color: '#666', fontSize: '14px' }}>{searchResult.display_name}</span>
              </div>
            </Popup>
          </Marker>
        )}
        {loading ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            padding: '16px 24px',
            borderRadius: '8px',
            zIndex: 1000
          }}>
            Loading parking spots...
          </div>
        ) : validSpots.map((spot) => {
          const isAvailable = activeBookings[spot.id] !== false; // Default to available if not checked yet
          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              eventHandlers={{
                click: () => setSelectedSpot(spot),
              }}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="
                    width: 18px; 
                    height: 18px; 
                    background: ${isAvailable ? '#4caf50' : '#f44336'}; 
                    border: 2px solid white; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-weight: bold; 
                    font-size: 10px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
                  ">
                    ${isAvailable ? 'P' : 'O'}
                  </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })}
            >
                          {selectedSpot && selectedSpot.id === spot.id && (
              <Popup
                position={[spot.lat, spot.lng]}
                onClose={() => setSelectedSpot(null)}
                className="custom-popup"
              >
                <div style={{ 
                  padding: '16px', 
                  minWidth: '280px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      color: '#23201d', 
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>{spot.name}</h4>
                    <p style={{ 
                      margin: 0, 
                      color: '#666', 
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}>{spot.address}</p>
                    {spot.price && (
                      <p style={{ 
                        margin: 0, 
                        color: '#ffd740', 
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}> ${spot.price}/hr</p>
                    )}
                    <p style={{ 
                      margin: 0, 
                      color: isAvailable ? '#4caf50' : '#f44336', 
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '12px'
                    }}>
                      {isAvailable ? '✅ Available' : '❌ Currently Occupied'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button 
                      style={{ 
                        flex: 1,
                        background: isAvailable ? '#ffd740' : '#ccc', 
                        color: isAvailable ? '#23201d' : '#666', 
                        border: 'none', 
                        borderRadius: '6px', 
                        padding: '8px 12px', 
                        fontWeight: '600', 
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        transition: 'all 0.3s ease'
                      }} 
                      onClick={() => isAvailable && handleBook(spot)}
                      disabled={!isAvailable}
                    >
                       {isAvailable ? 'Book Now' : 'Occupied'}
                    </button>
                    <button style={{ 
                      flex: 1,
                      background: '#23201d', 
                      color: '#ffd740', 
                      border: 'none', 
                      borderRadius: '6px', 
                      padding: '8px 12px', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.3s ease'
                    }} onClick={() => handleDirections(spot.lat, spot.lng)}>
                       Directions
                    </button>
                  </div>
                  
                  {/* Removed booking form from here */}
                </div>
              </Popup>
            )}
          </Marker>
        );
        })}
      </MapContainer>
      
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
    </LeafletMapErrorBoundary>
  );
};

export default LeafletMapView; 