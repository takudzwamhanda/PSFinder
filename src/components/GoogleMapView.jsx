import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: -17.8252, // Harare, Zimbabwe latitude
  lng: 31.0335, // Harare, Zimbabwe longitude
};

const parkingSpots = [
  {
    id: 1,
    name: "Joina City Parking",
    address: "Jason Moyo Ave, Harare",
    lat: -17.8292,
    lng: 31.0496,
  },
  {
    id: 2,
    name: "Eastgate Parking",
    address: "Robert Mugabe Rd, Harare",
    lat: -17.8296,
    lng: 31.0534,
  },
  {
    id: 3,
    name: "Avondale Shopping Centre Parking",
    address: "King George Rd, Harare",
    lat: -17.8005,
    lng: 31.0346,
  },
  {
    id: 4,
    name: "Sam Levy's Village Parking",
    address: "Borrowdale Rd, Harare",
    lat: -17.7676,
    lng: 31.0877,
  },
];

// Optimized marker icons
const createOptimizedMarkerIcon = (color = "#ffd740") => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="${color}" stroke="white" stroke-width="1"/>
      <circle cx="8" cy="8" r="2" fill="white"/>
    </svg>
  `),
  scaledSize: { width: 16, height: 16 },
  anchor: { x: 8, y: 8 }
});

const createUserLocationIcon = () => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="7" fill="#4285f4" stroke="white" stroke-width="1.5"/>
      <circle cx="9" cy="9" r="2" fill="white"/>
    </svg>
  `),
  scaledSize: { width: 18, height: 18 },
  anchor: { x: 9, y: 9 }
});

const GoogleMapView = () => {
  const [selectedSpot, setSelectedSpot] = React.useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [center, setCenter] = useState({
    lat: -17.8252, // Harare, Zimbabwe latitude
    lng: 31.0335, // Harare, Zimbabwe longitude
  });

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newUserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newUserLocation);
          setCenter(newUserLocation);
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

  return (
    <LoadScript googleMapsApiKey="a4d59c42-b127-409e-ad31-bf11e229bbbe">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={userLocation ? 15 : 12}
        options={{
          // Performance optimizations
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative'
        }}
      >
        {/* User's current location marker - optimized */}
        {userLocation && (
          <Marker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            icon={createUserLocationIcon()}
            title="Your Location"
          />
        )}
        
        {/* Parking spots markers - optimized */}
        {parkingSpots.map((spot) => (
          <Marker
            key={spot.id}
            position={{ lat: spot.lat, lng: spot.lng }}
            onClick={() => setSelectedSpot(spot)}
            icon={createOptimizedMarkerIcon()}
            title={spot.name}
            // Remove label to improve performance
          />
        ))}
        
        {selectedSpot && (
          <InfoWindow
            position={{ lat: selectedSpot.lat, lng: selectedSpot.lng }}
            onCloseClick={() => setSelectedSpot(null)}
            options={{
              pixelOffset: { width: 0, height: -10 }
            }}
          >
            <div style={{ padding: '8px', minWidth: '200px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#23201d', fontSize: '14px' }}>
                {selectedSpot.name}
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                {selectedSpot.address}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapView; 