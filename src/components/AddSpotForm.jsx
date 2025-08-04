import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const initialForm = {
  name: '',
  address: '',
  lat: '',
  lng: '',
  price: '',
  availability: true,
  type: '',
  description: '',
};

const AddSpotForm = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'number' ? value : value,
    });
  };

  const handleSelectChange = e => {
    setForm({ ...form, availability: e.target.value === 'true' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess('');
    setError('');
    // Validate lat/lng
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    const price = parseFloat(form.price);
    if (isNaN(lat) || isNaN(lng)) {
      setError('Latitude and Longitude must be valid numbers.');
      return;
    }
    setLoading(true);
    try {
      console.log('Adding parking spot:', { ...form, lat, lng, price: isNaN(price) ? 0 : price });
      const docRef = await addDoc(collection(db, 'parkingSpots'), {
        ...form,
        lat,
        lng,
        price: isNaN(price) ? 0 : price,
        availability: !!form.availability,
        createdAt: new Date(),
      });
      console.log('Successfully added spot with ID:', docRef.id);
      setSuccess('Parking spot added successfully!');
      setTimeout(() => {
        navigate('/my-spots');
      }, 2000);
    } catch (err) {
      console.error('Error adding parking spot:', err);
      setError(`Failed to add spot: ${err.message}`);
    }
    setLoading(false);
  };

  // Test Firebase connection
  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      // Try to write to parkingSpots collection instead of test
      const testDoc = await addDoc(collection(db, 'parkingSpots'), {
        name: 'Test Spot',
        address: 'Test Address',
        lat: -17.8252,
        lng: 31.0335,
        price: 0,
        availability: true,
        type: 'Test',
        description: 'Test parking spot',
        createdAt: new Date(),
        isTest: true
      });
      console.log('Firebase connection successful, test doc ID:', testDoc.id);
      
      // Clean up the test document
      setTimeout(async () => {
        try {
          await deleteDoc(doc(db, 'parkingSpots', testDoc.id));
          console.log('Test document cleaned up');
        } catch (cleanupErr) {
          console.log('Could not clean up test document:', cleanupErr);
        }
      }, 5000);
      
      return true;
    } catch (err) {
      console.error('Firebase connection failed:', err);
      return false;
    }
  };

  // Helper function to add sample parking spots
  const addSampleSpots = async () => {
    setLoading(true);
    const sampleSpots = [
      {
        name: "Joina City Parking",
        address: "Jason Moyo Ave, Harare, Zimbabwe",
        lat: -17.8292,
        lng: 31.0496,
        price: 5.00,
        availability: true,
        type: "Shopping Center",
        description: "Secure parking in the heart of Harare CBD"
      },
      {
        name: "Eastgate Shopping Centre",
        address: "Robert Mugabe Rd, Harare, Zimbabwe",
        lat: -17.8296,
        lng: 31.0534,
        price: 3.50,
        availability: true,
        type: "Shopping Center",
        description: "Convenient parking near major shopping center"
      },
      {
        name: "Avondale Shopping Centre",
        address: "King George Rd, Harare, Zimbabwe",
        lat: -17.8005,
        lng: 31.0346,
        price: 4.00,
        availability: true,
        type: "Shopping Center",
        description: "Spacious parking area with security"
      },
      {
        name: "Sam Levy's Village",
        address: "Borrowdale Rd, Harare, Zimbabwe",
        lat: -17.7676,
        lng: 31.0877,
        price: 6.00,
        availability: true,
        type: "Shopping Center",
        description: "Premium parking in upscale shopping district"
      },
      {
        name: "Central Park Street Parking",
        address: "Central Ave, Harare, Zimbabwe",
        lat: -17.8252,
        lng: 31.0335,
        price: 2.00,
        availability: true,
        type: "Street Parking",
        description: "Affordable street parking in central area"
      }
    ];

    try {
      for (const spot of sampleSpots) {
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess('Sample parking spots added successfully!');
      setTimeout(() => {
        navigate('/my-spots');
      }, 2000);
    } catch (err) {
      setError('Failed to add sample spots. Please try again.');
    }
    setLoading(false);
  };

  // Helper function to add comprehensive Harare parking spots
  const addHarareParkingSpots = async () => {
    setLoading(true);
    setError('');
    const harareSpots = [
      // Shopping Centers
      {
        name: "Joina City Parking",
        address: "Jason Moyo Ave, Harare, Zimbabwe",
        lat: -17.8292,
        lng: 31.0496,
        price: 5.00,
        availability: true,
        type: "Shopping Center",
        description: "Secure parking in the heart of Harare CBD"
      },
      {
        name: "Eastgate Shopping Centre",
        address: "Robert Mugabe Rd, Harare, Zimbabwe",
        lat: -17.8296,
        lng: 31.0534,
        price: 3.50,
        availability: true,
        type: "Shopping Center",
        description: "Convenient parking near major shopping center"
      },
      {
        name: "Avondale Shopping Centre",
        address: "King George Rd, Harare, Zimbabwe",
        lat: -17.8005,
        lng: 31.0346,
        price: 4.00,
        availability: true,
        type: "Shopping Center",
        description: "Spacious parking area with security"
      },
      {
        name: "Sam Levy's Village",
        address: "Borrowdale Rd, Harare, Zimbabwe",
        lat: -17.7676,
        lng: 31.0877,
        price: 6.00,
        availability: true,
        type: "Shopping Center",
        description: "Premium parking in upscale shopping district"
      },
      {
        name: "Westgate Shopping Centre",
        address: "Westgate, Harare, Zimbabwe",
        lat: -17.8100,
        lng: 31.0200,
        price: 4.50,
        availability: true,
        type: "Shopping Center",
        description: "Modern shopping center with ample parking"
      },
      {
        name: "Highlands Shopping Centre",
        address: "Highlands, Harare, Zimbabwe",
        lat: -17.7900,
        lng: 31.0500,
        price: 3.00,
        availability: true,
        type: "Shopping Center",
        description: "Local shopping center parking"
      },
      {
        name: "Belgravia Shopping Centre",
        address: "Belgravia, Harare, Zimbabwe",
        lat: -17.8200,
        lng: 31.0400,
        price: 2.50,
        availability: true,
        type: "Shopping Center",
        description: "Convenient neighborhood shopping parking"
      },
      
      // Hospitals & Medical Centers
      {
        name: "Parirenyatwa Hospital Parking",
        address: "Mazoe St, Harare, Zimbabwe",
        lat: -17.8167,
        lng: 31.0333,
        price: 1.50,
        availability: true,
        type: "Hospital",
        description: "Parking for hospital visitors"
      },
      {
        name: "Avenues Clinic Parking",
        address: "Baines Ave, Harare, Zimbabwe",
        lat: -17.8201,
        lng: 31.0412,
        price: 3.00,
        availability: true,
        type: "Hospital",
        description: "Medical center parking"
      },
      {
        name: "Mater Dei Hospital Parking",
        address: "Mater Dei Hospital, Harare, Zimbabwe",
        lat: -17.8150,
        lng: 31.0350,
        price: 2.00,
        availability: true,
        type: "Hospital",
        description: "Private hospital parking"
      },
      {
        name: "St Anne's Hospital Parking",
        address: "St Anne's Hospital, Harare, Zimbabwe",
        lat: -17.8180,
        lng: 31.0380,
        price: 2.50,
        availability: true,
        type: "Hospital",
        description: "Private medical facility parking"
      },
      
      // Universities & Educational
      {
        name: "University of Zimbabwe Parking",
        address: "Mount Pleasant, Harare, Zimbabwe",
        lat: -17.7833,
        lng: 31.0333,
        price: 2.00,
        availability: true,
        type: "University",
        description: "Student and staff parking"
      },
      {
        name: "Harare Polytechnic Parking",
        address: "Harare Polytechnic, Harare, Zimbabwe",
        lat: -17.8200,
        lng: 31.0300,
        price: 1.50,
        availability: true,
        type: "University",
        description: "Technical college parking"
      },
      
      // Transport & Bus Stations
      {
        name: "Mbare Bus Station Parking",
        address: "Mbare, Harare, Zimbabwe",
        lat: -17.8500,
        lng: 31.0200,
        price: 1.00,
        availability: true,
        type: "Transport",
        description: "Bus station parking for travelers"
      },
      {
        name: "Coventry Road Transport Hub",
        address: "Coventry Road, Harare, Zimbabwe",
        lat: -17.8400,
        lng: 31.0300,
        price: 1.50,
        availability: true,
        type: "Transport",
        description: "Transport hub parking"
      },
      
      // Government & Offices
      {
        name: "Parliament Building Parking",
        address: "Parliament Building, Harare, Zimbabwe",
        lat: -17.8250,
        lng: 31.0450,
        price: 3.00,
        availability: true,
        type: "Government",
        description: "Government building parking"
      },
      {
        name: "City Hall Parking",
        address: "City Hall, Harare, Zimbabwe",
        lat: -17.8300,
        lng: 31.0500,
        price: 2.50,
        availability: true,
        type: "Government",
        description: "Municipal building parking"
      },
      
      // Entertainment & Recreation
      {
        name: "Harare Gardens Parking",
        address: "Harare Gardens, Harare, Zimbabwe",
        lat: -17.8250,
        lng: 31.0400,
        price: 2.00,
        availability: true,
        type: "Entertainment",
        description: "Public garden parking"
      },
      {
        name: "National Gallery Parking",
        address: "National Gallery, Harare, Zimbabwe",
        lat: -17.8280,
        lng: 31.0420,
        price: 2.50,
        availability: true,
        type: "Entertainment",
        description: "Art gallery parking"
      },
      {
        name: "Zimbabwe Museum Parking",
        address: "Zimbabwe Museum, Harare, Zimbabwe",
        lat: -17.8270,
        lng: 31.0430,
        price: 2.00,
        availability: true,
        type: "Entertainment",
        description: "Museum parking"
      },
      
      // Hotels & Accommodation
      {
        name: "Meikles Hotel Parking",
        address: "Meikles Hotel, Harare, Zimbabwe",
        lat: -17.8290,
        lng: 31.0480,
        price: 5.00,
        availability: true,
        type: "Hotel",
        description: "Luxury hotel parking"
      },
      {
        name: "Rainbow Towers Parking",
        address: "Rainbow Towers, Harare, Zimbabwe",
        lat: -17.8200,
        lng: 31.0350,
        price: 4.50,
        availability: true,
        type: "Hotel",
        description: "Hotel parking"
      },
      
      // Residential Areas
      {
        name: "Highlands Residential Parking",
        address: "Highlands, Harare, Zimbabwe",
        lat: -17.7900,
        lng: 31.0500,
        price: 1.50,
        availability: true,
        type: "Residential",
        description: "Residential area parking"
      },
      {
        name: "Mount Pleasant Parking",
        address: "Mount Pleasant, Harare, Zimbabwe",
        lat: -17.7850,
        lng: 31.0350,
        price: 2.00,
        availability: true,
        type: "Residential",
        description: "University area residential parking"
      },
      
      // Your Specific Spots
      {
        name: "Central Business District Parking",
        address: "Central Business District, Harare, Zimbabwe",
        lat: -17.822664669242965,
        lng: 31.037030056762877,
        price: 4.50,
        availability: true,
        type: "Street Parking",
        description: "Convenient parking in the heart of CBD"
      },
      {
        name: "Downtown Harare Parking",
        address: "Downtown Harare, Zimbabwe",
        lat: -17.830102724151764,
        lng: 31.04616448466622,
        price: 3.75,
        availability: true,
        type: "Street Parking",
        description: "Affordable parking in downtown area"
      }
    ];

    try {
      console.log('Starting to add Harare parking spots...');
      for (let i = 0; i < harareSpots.length; i++) {
        const spot = harareSpots[i];
        console.log(`Adding spot ${i + 1}/${harareSpots.length}:`, spot.name);
        
        const docRef = await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
        
        console.log(`Successfully added ${spot.name} with ID:`, docRef.id);
      }
      setSuccess(`${harareSpots.length} Harare parking spots added successfully!`);
      setTimeout(() => {
        navigate('/my-spots');
      }, 2000);
    } catch (err) {
      console.error('Error adding Harare parking spots:', err);
      setError(`Failed to add Harare spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add even more Harare parking spots
  const addMoreHarareSpots = async () => {
    setLoading(true);
    setError('');
    const moreSpots = [
      // Additional Shopping Centers
      {
        name: "Longcheng Plaza Parking",
        address: "Longcheng Plaza, Harare, Zimbabwe",
        lat: -17.8100,
        lng: 31.0250,
        price: 3.00,
        availability: true,
        type: "Shopping Center",
        description: "Chinese shopping plaza parking"
      },
      {
        name: "Trafalgar Plaza Parking",
        address: "Trafalgar Plaza, Harare, Zimbabwe",
        lat: -17.8150,
        lng: 31.0300,
        price: 3.50,
        availability: true,
        type: "Shopping Center",
        description: "Modern plaza parking"
      },
      {
        name: "Alexandra Park Parking",
        address: "Alexandra Park, Harare, Zimbabwe",
        lat: -17.8000,
        lng: 31.0400,
        price: 2.50,
        availability: true,
        type: "Shopping Center",
        description: "Local shopping center parking"
      },
      
      // Additional Hospitals
      {
        name: "Harare Central Hospital Parking",
        address: "Harare Central Hospital, Harare, Zimbabwe",
        lat: -17.8250,
        lng: 31.0350,
        price: 1.50,
        availability: true,
        type: "Hospital",
        description: "Central hospital parking"
      },
      {
        name: "Borrowdale Medical Centre Parking",
        address: "Borrowdale Medical Centre, Harare, Zimbabwe",
        lat: -17.7700,
        lng: 31.0900,
        price: 3.00,
        availability: true,
        type: "Hospital",
        description: "Private medical center parking"
      },
      
      // Additional Universities
      {
        name: "Zimbabwe Open University Parking",
        address: "Zimbabwe Open University, Harare, Zimbabwe",
        lat: -17.8200,
        lng: 31.0250,
        price: 1.50,
        availability: true,
        type: "University",
        description: "Open university parking"
      },
      {
        name: "Women's University Parking",
        address: "Women's University, Harare, Zimbabwe",
        lat: -17.7800,
        lng: 31.0400,
        price: 2.00,
        availability: true,
        type: "University",
        description: "Women's university parking"
      },
      
      // Additional Transport
      {
        name: "Harare International Airport Parking",
        address: "Harare International Airport, Harare, Zimbabwe",
        lat: -17.9300,
        lng: 31.0900,
        price: 8.00,
        availability: true,
        type: "Transport",
        description: "Airport parking for travelers"
      },
      {
        name: "Railway Station Parking",
        address: "Harare Railway Station, Harare, Zimbabwe",
        lat: -17.8350,
        lng: 31.0250,
        price: 2.00,
        availability: true,
        type: "Transport",
        description: "Train station parking"
      },
      
      // Additional Government
      {
        name: "Supreme Court Parking",
        address: "Supreme Court, Harare, Zimbabwe",
        lat: -17.8250,
        lng: 31.0450,
        price: 3.50,
        availability: true,
        type: "Government",
        description: "Supreme court parking"
      },
      {
        name: "Ministry Buildings Parking",
        address: "Ministry Buildings, Harare, Zimbabwe",
        lat: -17.8300,
        lng: 31.0400,
        price: 3.00,
        availability: true,
        type: "Government",
        description: "Government ministry parking"
      },
      
      // Additional Entertainment
      {
        name: "National Sports Stadium Parking",
        address: "National Sports Stadium, Harare, Zimbabwe",
        lat: -17.8200,
        lng: 31.0200,
        price: 4.00,
        availability: true,
        type: "Entertainment",
        description: "Sports stadium parking"
      },
      {
        name: "Hippo Valley Golf Club Parking",
        address: "Hippo Valley Golf Club, Harare, Zimbabwe",
        lat: -17.7800,
        lng: 31.0800,
        price: 5.00,
        availability: true,
        type: "Entertainment",
        description: "Golf club parking"
      },
      
      // Additional Hotels
      {
        name: "Crowne Plaza Parking",
        address: "Crowne Plaza, Harare, Zimbabwe",
        lat: -17.8250,
        lng: 31.0350,
        price: 6.00,
        availability: true,
        type: "Hotel",
        description: "International hotel parking"
      },
      {
        name: "Holiday Inn Parking",
        address: "Holiday Inn, Harare, Zimbabwe",
        lat: -17.8200,
        lng: 31.0400,
        price: 5.50,
        availability: true,
        type: "Hotel",
        description: "Hotel chain parking"
      },
      
      // Additional Residential
      {
        name: "Borrowdale Residential Parking",
        address: "Borrowdale, Harare, Zimbabwe",
        lat: -17.7700,
        lng: 31.0900,
        price: 2.50,
        availability: true,
        type: "Residential",
        description: "Upscale residential parking"
      },
      {
        name: "Glen Lorne Parking",
        address: "Glen Lorne, Harare, Zimbabwe",
        lat: -17.7900,
        lng: 31.0600,
        price: 2.00,
        availability: true,
        type: "Residential",
        description: "Residential area parking"
      },
      {
        name: "Avondale West Parking",
        address: "Avondale West, Harare, Zimbabwe",
        lat: -17.8000,
        lng: 31.0200,
        price: 1.50,
        availability: true,
        type: "Residential",
        description: "Avondale West residential parking"
      },
      {
        name: "Greystone Park Parking",
        address: "Greystone Park, Harare, Zimbabwe",
        lat: -17.7600,
        lng: 31.1000,
        price: 2.00,
        availability: true,
        type: "Residential",
        description: "Greystone Park residential parking"
      },
      {
        name: "Borrowdale Racecourse Parking",
        address: "Borrowdale Racecourse, Harare, Zimbabwe",
        lat: -17.7700,
        lng: 31.0900,
        price: 2.00,
        availability: true,
        type: "Entertainment",
        description: "Racecourse and event parking"
      }
    ];

    try {
      console.log('Starting to add more Harare parking spots...');
      for (let i = 0; i < moreSpots.length; i++) {
        const spot = moreSpots[i];
        console.log(`Adding spot ${i + 1}/${moreSpots.length}:`, spot.name);
        
        const docRef = await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
        
        console.log(`Successfully added ${spot.name} with ID:`, docRef.id);
      }
      setSuccess(`${moreSpots.length} more Harare parking spots added successfully!`);
      setTimeout(() => {
        navigate('/my-spots');
      }, 2000);
    } catch (err) {
      console.error('Error adding more Harare parking spots:', err);
      setError(`Failed to add more Harare spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add CBD Zone 1 parking spots (First Avenue to Tenth Avenue)
  const addCBDZone1Spots = async () => {
    setLoading(true);
    setError('');
    const cbdZone1Spots = [];
    
    // First Avenue to Tenth Avenue CBD spots
    for (let avenue = 1; avenue <= 10; avenue++) {
      for (let street = 1; street <= 20; street++) {
        cbdZone1Spots.push({
          name: `${getAvenueName(avenue)} & ${getStreetName(street)} Parking`,
          address: `${getAvenueName(avenue)} & ${getStreetName(street)}, Harare CBD, Zimbabwe`,
          lat: -17.8250 + (avenue * 0.001),
          lng: 31.0500 + (street * 0.001),
          price: 1.50 + (avenue * 0.25),
          availability: true,
          type: "Street Parking",
          description: `CBD street parking at ${getAvenueName(avenue)} & ${getStreetName(street)}`
        });
      }
    }

    try {
      console.log('Adding CBD Zone 1 parking spots...');
      for (let i = 0; i < cbdZone1Spots.length; i++) {
        const spot = cbdZone1Spots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${cbdZone1Spots.length} CBD Zone 1 parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding CBD Zone 1 spots:', err);
      setError(`Failed to add CBD Zone 1 spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add CBD Zone 2 parking spots (Eleventh Avenue to Twentieth Avenue)
  const addCBDZone2Spots = async () => {
    setLoading(true);
    setError('');
    const cbdZone2Spots = [];
    
    // Eleventh Avenue to Twentieth Avenue CBD spots
    for (let avenue = 11; avenue <= 20; avenue++) {
      for (let street = 1; street <= 20; street++) {
        cbdZone2Spots.push({
          name: `${getAvenueName(avenue)} & ${getStreetName(street)} Parking`,
          address: `${getAvenueName(avenue)} & ${getStreetName(street)}, Harare CBD, Zimbabwe`,
          lat: -17.8250 + (avenue * 0.001),
          lng: 31.0500 + (street * 0.001),
          price: 1.25 + (avenue * 0.20),
          availability: true,
          type: "Street Parking",
          description: `CBD street parking at ${getAvenueName(avenue)} & ${getStreetName(street)}`
        });
      }
    }

    try {
      console.log('Adding CBD Zone 2 parking spots...');
      for (let i = 0; i < cbdZone2Spots.length; i++) {
        const spot = cbdZone2Spots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${cbdZone2Spots.length} CBD Zone 2 parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding CBD Zone 2 spots:', err);
      setError(`Failed to add CBD Zone 2 spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Northern Suburbs parking spots
  const addNorthernSuburbsSpots = async () => {
    setLoading(true);
    setError('');
    const northernSpots = [];
    
    const northernAreas = [
      'Borrowdale', 'Borrowdale Brook', 'Borrowdale Park', 'Ballantyne Park',
      'Glen Lorne', 'Glen Lorne North', 'Glen Lorne South', 'Highlands',
      'Highlands North', 'Highlands South', 'Mount Pleasant', 'Mount Pleasant Heights',
      'Newlands', 'Newlands North', 'Newlands South', 'Arundel', 'Arundel North',
      'Arundel South', 'Arcadia', 'Arcadia North', 'Arcadia South'
    ];

    northernAreas.forEach((area, areaIndex) => {
      for (let block = 1; block <= 15; block++) {
        for (let street = 1; street <= 10; street++) {
          northernSpots.push({
            name: `${area} Block ${block} Street ${street} Parking`,
            address: `${area} Block ${block} Street ${street}, Harare, Zimbabwe`,
            lat: -17.7600 + (areaIndex * 0.002),
            lng: 31.0800 + (block * 0.001) + (street * 0.0005),
            price: 2.00 + (areaIndex * 0.25),
            availability: true,
            type: "Residential Parking",
            description: `${area} residential parking`
          });
        }
      }
    });

    try {
      console.log('Adding Northern Suburbs parking spots...');
      for (let i = 0; i < northernSpots.length; i++) {
        const spot = northernSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${northernSpots.length} Northern Suburbs parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Northern Suburbs spots:', err);
      setError(`Failed to add Northern Suburbs spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Eastern Suburbs parking spots
  const addEasternSuburbsSpots = async () => {
    setLoading(true);
    setError('');
    const easternSpots = [];
    
    const easternAreas = [
      'Avondale', 'Avondale West', 'Avondale East', 'Belgravia',
      'Belgravia North', 'Belgravia South', 'Alexandra Park', 'Alexandra Park North',
      'Alexandra Park South', 'Mabelreign', 'Mabelreign North', 'Mabelreign South',
      'Waterfalls', 'Waterfalls North', 'Waterfalls South', 'Chisipite',
      'Chisipite North', 'Chisipite South'
    ];

    easternAreas.forEach((area, areaIndex) => {
      for (let block = 1; block <= 15; block++) {
        for (let street = 1; street <= 8; street++) {
          easternSpots.push({
            name: `${area} Block ${block} Street ${street} Parking`,
            address: `${area} Block ${block} Street ${street}, Harare, Zimbabwe`,
            lat: -17.7800 + (areaIndex * 0.002),
            lng: 31.1200 + (block * 0.001) + (street * 0.0005),
            price: 1.75 + (areaIndex * 0.20),
            availability: true,
            type: "Residential Parking",
            description: `${area} residential parking`
          });
        }
      }
    });

    try {
      console.log('Adding Eastern Suburbs parking spots...');
      for (let i = 0; i < easternSpots.length; i++) {
        const spot = easternSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${easternSpots.length} Eastern Suburbs parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Eastern Suburbs spots:', err);
      setError(`Failed to add Eastern Suburbs spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Western Suburbs parking spots
  const addWesternSuburbsSpots = async () => {
    setLoading(true);
    setError('');
    const westernSpots = [];
    
    const westernAreas = [
      'Westgate', 'Westgate North', 'Westgate South', 'Budiriro',
      'Budiriro North', 'Budiriro South', 'Glen View', 'Glen View North',
      'Glen View South', 'Warren Park', 'Warren Park North', 'Warren Park South'
    ];

    westernAreas.forEach((area, areaIndex) => {
      for (let block = 1; block <= 15; block++) {
        for (let street = 1; street <= 8; street++) {
          westernSpots.push({
            name: `${area} Block ${block} Street ${street} Parking`,
            address: `${area} Block ${block} Street ${street}, Harare, Zimbabwe`,
            lat: -17.8000 + (areaIndex * 0.002),
            lng: 30.9500 + (block * 0.001) + (street * 0.0005),
            price: 1.50 + (areaIndex * 0.15),
            availability: true,
            type: "Residential Parking",
            description: `${area} residential parking`
          });
        }
      }
    });

    try {
      console.log('Adding Western Suburbs parking spots...');
      for (let i = 0; i < westernSpots.length; i++) {
        const spot = westernSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${westernSpots.length} Western Suburbs parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Western Suburbs spots:', err);
      setError(`Failed to add Western Suburbs spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Southern Suburbs parking spots
  const addSouthernSuburbsSpots = async () => {
    setLoading(true);
    setError('');
    const southernSpots = [];
    
    const southernAreas = [
      'Hatcliffe', 'Hatcliffe North', 'Hatcliffe South', 'Hatcliffe Extension',
      'Hatcliffe Extension North', 'Hatcliffe Extension South', 'Crowborough',
      'Crowborough North', 'Crowborough South', 'Epworth', 'Epworth North',
      'Epworth South', 'Epworth Extension'
    ];

    southernAreas.forEach((area, areaIndex) => {
      for (let block = 1; block <= 15; block++) {
        for (let street = 1; street <= 10; street++) {
          southernSpots.push({
            name: `${area} Block ${block} Street ${street} Parking`,
            address: `${area} Block ${block} Street ${street}, Harare, Zimbabwe`,
            lat: -17.8500 + (areaIndex * 0.002),
            lng: 31.1000 + (block * 0.001) + (street * 0.0005),
            price: 1.25 + (areaIndex * 0.10),
            availability: true,
            type: "Residential Parking",
            description: `${area} residential parking`
          });
        }
      }
    });

    try {
      console.log('Adding Southern Suburbs parking spots...');
      for (let i = 0; i < southernSpots.length; i++) {
        const spot = southernSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${southernSpots.length} Southern Suburbs parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Southern Suburbs spots:', err);
      setError(`Failed to add Southern Suburbs spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Shopping Centers parking spots
  const addShoppingCentersSpots = async () => {
    setLoading(true);
    setError('');
    const shoppingSpots = [];
    
    const shoppingCenters = [
      'Sam Levy Village', 'Borrowdale Village', 'Highlands Shopping Centre',
      'Avondale Shopping Centre', 'Belgravia Shopping Centre', 'Alexandra Park Shopping Centre',
      'Mabelreign Shopping Centre', 'Waterfalls Shopping Centre', 'Chisipite Shopping Centre',
      'Westgate Shopping Centre', 'Budiriro Shopping Centre', 'Glen View Shopping Centre',
      'Warren Park Shopping Centre', 'Hatcliffe Shopping Centre', 'Crowborough Shopping Centre',
      'Epworth Shopping Centre', 'Eastgate Shopping Centre', 'Westgate Shopping Centre',
      'Avondale Shopping Centre', 'Belgravia Shopping Centre', 'Alexandra Park Shopping Centre',
      'Mabelreign Shopping Centre', 'Waterfalls Shopping Centre', 'Chisipite Shopping Centre',
      'Westgate Shopping Centre', 'Budiriro Shopping Centre', 'Glen View Shopping Centre',
      'Warren Park Shopping Centre', 'Hatcliffe Shopping Centre', 'Crowborough Shopping Centre',
      'Epworth Shopping Centre'
    ];

    shoppingCenters.forEach((center, centerIndex) => {
      for (let section = 1; section <= 30; section++) {
        shoppingSpots.push({
          name: `${center} Section ${section} Parking`,
          address: `${center}, Harare, Zimbabwe`,
          lat: -17.8000 + (centerIndex * 0.002),
          lng: 31.0500 + (centerIndex * 0.001),
          price: 3.00 + (centerIndex * 0.25),
          availability: true,
          type: "Shopping Center",
          description: `${center} shopping center parking`
        });
      }
    });

    try {
      console.log('Adding Shopping Centers parking spots...');
      for (let i = 0; i < shoppingSpots.length; i++) {
        const spot = shoppingSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${shoppingSpots.length} Shopping Centers parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Shopping Centers spots:', err);
      setError(`Failed to add Shopping Centers spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Medical Centers parking spots
  const addMedicalCentersSpots = async () => {
    setLoading(true);
    setError('');
    const medicalSpots = [];
    
    const medicalCenters = [
      'Parirenyatwa Hospital', 'Harare Central Hospital', 'Avenues Clinic',
      'Borrowdale Medical Centre', 'Highlands Medical Centre', 'Mount Pleasant Medical Centre',
      'Newlands Medical Centre', 'Avondale Medical Centre', 'Belgravia Medical Centre',
      'Alexandra Park Medical Centre', 'Mabelreign Medical Centre', 'Waterfalls Medical Centre',
      'Chisipite Medical Centre', 'Arcadia Medical Centre', 'Arundel Medical Centre',
      'Ballantyne Park Medical Centre', 'Glen Lorne Medical Centre'
    ];

    medicalCenters.forEach((center, centerIndex) => {
      for (let section = 1; section <= 15; section++) {
        medicalSpots.push({
          name: `${center} Section ${section} Parking`,
          address: `${center}, Harare, Zimbabwe`,
          lat: -17.8000 + (centerIndex * 0.002),
          lng: 31.0500 + (centerIndex * 0.001),
          price: 2.00 + (centerIndex * 0.25),
          availability: true,
          type: "Hospital",
          description: `${center} medical facility parking`
        });
      }
    });

    try {
      console.log('Adding Medical Centers parking spots...');
      for (let i = 0; i < medicalSpots.length; i++) {
        const spot = medicalSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${medicalSpots.length} Medical Centers parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Medical Centers spots:', err);
      setError(`Failed to add Medical Centers spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Universities parking spots
  const addUniversitiesSpots = async () => {
    setLoading(true);
    setError('');
    const universitySpots = [];
    
    const universities = [
      'University of Zimbabwe', 'Harare Institute of Technology', 'Zimbabwe Open University',
      'National University of Science and Technology', 'Bindura University of Science Education',
      'Midlands State University', 'Great Zimbabwe University', 'Lupane State University',
      'Chinhoyi University of Technology', 'Marondera University of Agricultural Sciences',
      'Manicaland State University of Applied Sciences', 'Gwanda State University',
      'Zimbabwe Ezekiel Guti University', 'Catholic University in Zimbabwe',
      'Africa University', 'Solusi University', 'Zimbabwe Theological College',
      'Harare Theological College', 'Baptist Theological Seminary', 'Methodist Theological College'
    ];

    universities.forEach((university, uniIndex) => {
      for (let section = 1; section <= 100; section++) {
        universitySpots.push({
          name: `${university} Section ${section} Parking`,
          address: `${university}, Harare, Zimbabwe`,
          lat: -17.8000 + (uniIndex * 0.002),
          lng: 31.0500 + (uniIndex * 0.001),
          price: 1.50 + (uniIndex * 0.10),
          availability: true,
          type: "University",
          description: `${university} campus parking`
        });
      }
    });

    try {
      console.log('Adding Universities parking spots...');
      for (let i = 0; i < universitySpots.length; i++) {
        const spot = universitySpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${universitySpots.length} Universities parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Universities spots:', err);
      setError(`Failed to add Universities spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Transport Hubs parking spots
  const addTransportHubsSpots = async () => {
    setLoading(true);
    setError('');
    const transportSpots = [];
    
    const transportHubs = [
      'Harare Central Bus Station', 'Mbare Bus Station', 'Coventry Road Bus Station',
      'Harare International Airport', 'Robert Gabriel Mugabe International Airport',
      'Harare Railway Station', 'Bulawayo Road Bus Station', 'Chitungwiza Bus Station',
      'Ruwa Bus Station', 'Norton Bus Station', 'Marondera Bus Station',
      'Chinhoyi Bus Station', 'Bindura Bus Station', 'Kadoma Bus Station',
      'Chegutu Bus Station', 'Banket Bus Station', 'Raffingora Bus Station',
      'Chirundu Bus Station', 'Kariba Bus Station', 'Karoi Bus Station',
      'Chinhoyi Bus Station', 'Bindura Bus Station', 'Kadoma Bus Station',
      'Chegutu Bus Station', 'Banket Bus Station', 'Raffingora Bus Station',
      'Chirundu Bus Station', 'Kariba Bus Station', 'Karoi Bus Station'
    ];

    transportHubs.forEach((hub, hubIndex) => {
      for (let section = 1; section <= 15; section++) {
        transportSpots.push({
          name: `${hub} Section ${section} Parking`,
          address: `${hub}, Harare, Zimbabwe`,
          lat: -17.8000 + (hubIndex * 0.002),
          lng: 31.0500 + (hubIndex * 0.001),
          price: 2.50 + (hubIndex * 0.20),
          availability: true,
          type: "Transport Hub",
          description: `${hub} transport facility parking`
        });
      }
    });

    try {
      console.log('Adding Transport Hubs parking spots...');
      for (let i = 0; i < transportSpots.length; i++) {
        const spot = transportSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${transportSpots.length} Transport Hubs parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Transport Hubs spots:', err);
      setError(`Failed to add Transport Hubs spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Government Offices parking spots
  const addGovernmentOfficesSpots = async () => {
    setLoading(true);
    setError('');
    const governmentSpots = [];
    
    const governmentOffices = [
      'Parliament of Zimbabwe', 'Supreme Court of Zimbabwe', 'High Court of Zimbabwe',
      'Ministry of Finance', 'Ministry of Health', 'Ministry of Education',
      'Ministry of Transport', 'Ministry of Agriculture', 'Ministry of Defence',
      'Ministry of Foreign Affairs', 'Ministry of Home Affairs', 'Ministry of Justice',
      'Ministry of Information', 'Ministry of Tourism', 'Ministry of Environment',
      'Ministry of Energy', 'Ministry of Mines', 'Ministry of Industry',
      'Ministry of Commerce', 'Ministry of Labour', 'Ministry of Youth',
      'Ministry of Women Affairs', 'Ministry of Local Government', 'Ministry of Rural Development'
    ];

    governmentOffices.forEach((office, officeIndex) => {
      for (let section = 1; section <= 15; section++) {
        governmentSpots.push({
          name: `${office} Section ${section} Parking`,
          address: `${office}, Harare, Zimbabwe`,
          lat: -17.8000 + (officeIndex * 0.002),
          lng: 31.0500 + (officeIndex * 0.001),
          price: 2.00 + (officeIndex * 0.15),
          availability: true,
          type: "Government Office",
          description: `${office} government facility parking`
        });
      }
    });

    try {
      console.log('Adding Government Offices parking spots...');
      for (let i = 0; i < governmentSpots.length; i++) {
        const spot = governmentSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${governmentSpots.length} Government Offices parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Government Offices spots:', err);
      setError(`Failed to add Government Offices spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Hotels parking spots
  const addHotelsSpots = async () => {
    setLoading(true);
    setError('');
    const hotelSpots = [];
    
    const hotels = [
      'Meikles Hotel', 'Rainbow Towers Hotel', 'Crowne Plaza Harare',
      'Holiday Inn Harare', 'Sheraton Harare', 'Monomotapa Hotel',
      'Bronte Hotel', 'York Lodge', 'Amanzi Lodge', 'Lion and Cheetah Lodge',
      'Borrowdale Brooke Hotel', 'Highlands House Hotel', 'Mount Pleasant Hotel',
      'Newlands Hotel', 'Avondale Hotel', 'Belgravia Hotel', 'Alexandra Park Hotel',
      'Mabelreign Hotel', 'Waterfalls Hotel', 'Chisipite Hotel', 'Arcadia Hotel',
      'Arundel Hotel', 'Ballantyne Park Hotel', 'Glen Lorne Hotel', 'Westgate Hotel',
      'Budiriro Hotel', 'Glen View Hotel', 'Warren Park Hotel', 'Hatcliffe Hotel',
      'Crowborough Hotel', 'Epworth Hotel', 'Eastgate Hotel', 'Westgate Hotel',
      'Avondale Hotel', 'Belgravia Hotel', 'Alexandra Park Hotel', 'Mabelreign Hotel',
      'Waterfalls Hotel', 'Chisipite Hotel', 'Arcadia Hotel', 'Arundel Hotel',
      'Ballantyne Park Hotel', 'Glen Lorne Hotel', 'Westgate Hotel', 'Budiriro Hotel',
      'Glen View Hotel', 'Warren Park Hotel', 'Hatcliffe Hotel', 'Crowborough Hotel',
      'Epworth Hotel', 'Eastgate Hotel', 'Westgate Hotel', 'Avondale Hotel'
    ];

    hotels.forEach((hotel, hotelIndex) => {
      for (let section = 1; section <= 35; section++) {
        hotelSpots.push({
          name: `${hotel} Section ${section} Parking`,
          address: `${hotel}, Harare, Zimbabwe`,
          lat: -17.8000 + (hotelIndex * 0.002),
          lng: 31.0500 + (hotelIndex * 0.001),
          price: 4.00 + (hotelIndex * 0.30),
          availability: true,
          type: "Hotel",
          description: `${hotel} hotel parking`
        });
      }
    });

    try {
      console.log('Adding Hotels parking spots...');
      for (let i = 0; i < hotelSpots.length; i++) {
        const spot = hotelSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${hotelSpots.length} Hotels parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Hotels spots:', err);
      setError(`Failed to add Hotels spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to add Entertainment parking spots
  const addEntertainmentSpots = async () => {
    setLoading(true);
    setError('');
    const entertainmentSpots = [];
    
    const entertainmentVenues = [
      '7 Arts Theatre', 'Reps Theatre', 'Harare International Festival of the Arts',
      'National Gallery of Zimbabwe', 'National Archives of Zimbabwe', 'National Museum',
      'Queen Victoria Museum', 'Chapungu Sculpture Park', 'National Botanic Gardens',
      'Lion and Cheetah Park', 'Mukuvisi Woodlands', 'Hwange National Park',
      'Victoria Falls', 'Great Zimbabwe Ruins', 'Matobo Hills', 'Eastern Highlands',
      'Lake Kariba', 'Mana Pools', 'Gonarezhou National Park', 'Chimanimani Mountains',
      'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
      'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
      'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
      'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
      'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
      'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
      'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains'
    ];

    entertainmentVenues.forEach((venue, venueIndex) => {
      for (let section = 1; section <= 15; section++) {
        entertainmentSpots.push({
          name: `${venue} Section ${section} Parking`,
          address: `${venue}, Harare, Zimbabwe`,
          lat: -17.8000 + (venueIndex * 0.002),
          lng: 31.0500 + (venueIndex * 0.001),
          price: 3.50 + (venueIndex * 0.25),
          availability: true,
          type: "Entertainment",
          description: `${venue} entertainment venue parking`
        });
      }
    });

    try {
      console.log('Adding Entertainment parking spots...');
      for (let i = 0; i < entertainmentSpots.length; i++) {
        const spot = entertainmentSpots[i];
        await addDoc(collection(db, 'parkingSpots'), {
          ...spot,
          createdAt: new Date(),
        });
      }
      setSuccess(`${entertainmentSpots.length} Entertainment parking spots added successfully!`);
    } catch (err) {
      console.error('Error adding Entertainment spots:', err);
      setError(`Failed to add Entertainment spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Smart function to add all Harare spots with duplicate checking
  const addAllHarareSpots = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting to add ALL Harare parking spots with duplicate checking...');
      
      // Get existing spots to check for duplicates
      const existingSpotsSnapshot = await getDocs(collection(db, 'parkingSpots'));
      const existingSpots = existingSpotsSnapshot.docs.map(doc => doc.data().name);
      console.log(`Found ${existingSpots.length} existing spots`);
      
      let totalAdded = 0;
      let totalSkipped = 0;
      
      // Function to add spots with duplicate checking
      const addSpotsWithCheck = async (spots, categoryName) => {
        let added = 0;
        let skipped = 0;
        
        for (let i = 0; i < spots.length; i++) {
          const spot = spots[i];
          if (!existingSpots.includes(spot.name)) {
            await addDoc(collection(db, 'parkingSpots'), {
              ...spot,
              createdAt: new Date(),
            });
            added++;
            existingSpots.push(spot.name); // Add to existing list to prevent duplicates within same batch
          } else {
            skipped++;
          }
        }
        
        console.log(`${categoryName}: Added ${added}, Skipped ${skipped} (already exist)`);
        return { added, skipped };
      };
      
      // CBD Zone 1
      const cbdZone1Spots = [];
      for (let avenue = 1; avenue <= 10; avenue++) {
        for (let street = 1; street <= 20; street++) {
          cbdZone1Spots.push({
            name: `${getAvenueName(avenue)} & ${getStreetName(street)} Parking`,
            address: `${getAvenueName(avenue)} & ${getStreetName(street)}, Harare CBD, Zimbabwe`,
            lat: -17.8250 + (avenue * 0.001),
            lng: 31.0500 + (street * 0.001),
            price: 1.50 + (avenue * 0.25),
            availability: true,
            type: "Street Parking",
            description: `CBD street parking at ${getAvenueName(avenue)} & ${getStreetName(street)}`
          });
        }
      }
      const cbd1Result = await addSpotsWithCheck(cbdZone1Spots, 'CBD Zone 1');
      totalAdded += cbd1Result.added;
      totalSkipped += cbd1Result.skipped;
      
      // CBD Zone 2
      const cbdZone2Spots = [];
      for (let avenue = 11; avenue <= 20; avenue++) {
        for (let street = 1; street <= 20; street++) {
          cbdZone2Spots.push({
            name: `${getAvenueName(avenue)} & ${getStreetName(street)} Parking`,
            address: `${getAvenueName(avenue)} & ${getStreetName(street)}, Harare CBD, Zimbabwe`,
            lat: -17.8250 + (avenue * 0.001),
            lng: 31.0500 + (street * 0.001),
            price: 1.25 + (avenue * 0.20),
            availability: true,
            type: "Street Parking",
            description: `CBD street parking at ${getAvenueName(avenue)} & ${getStreetName(street)}`
          });
        }
      }
      const cbd2Result = await addSpotsWithCheck(cbdZone2Spots, 'CBD Zone 2');
      totalAdded += cbd2Result.added;
      totalSkipped += cbd2Result.skipped;
      
      // Northern Suburbs
      const northernSpots = [];
      const northernAreas = [
        'Borrowdale', 'Borrowdale Brook', 'Borrowdale Park', 'Ballantyne Park',
        'Glen Lorne', 'Glen Lorne North', 'Glen Lorne South', 'Highlands',
        'Highlands North', 'Highlands South', 'Mount Pleasant', 'Mount Pleasant Heights',
        'Newlands', 'Newlands North', 'Newlands South', 'Arundel', 'Arundel North',
        'Arundel South', 'Arcadia', 'Arcadia North', 'Arcadia South'
      ];
      northernAreas.forEach((area, areaIndex) => {
        for (let block = 1; block <= 15; block++) {
          for (let street = 1; street <= 10; street++) {
            northernSpots.push({
              name: `${area} Block ${block} Street ${street} Parking`,
              address: `${area} Block ${block} Street ${street}, Harare, Zimbabwe`,
              lat: -17.7600 + (areaIndex * 0.002),
              lng: 31.0800 + (block * 0.001) + (street * 0.0005),
              price: 2.00 + (areaIndex * 0.25),
              availability: true,
              type: "Residential Parking",
              description: `${area} residential parking`
            });
          }
        }
      });
      const northResult = await addSpotsWithCheck(northernSpots, 'Northern Suburbs');
      totalAdded += northResult.added;
      totalSkipped += northResult.skipped;
      
      // Eastern Suburbs
      const easternSpots = [];
      const easternAreas = [
        'Avondale', 'Avondale West', 'Avondale East', 'Belgravia',
        'Belgravia North', 'Belgravia South', 'Alexandra Park', 'Alexandra Park North',
        'Alexandra Park South', 'Mabelreign', 'Mabelreign North', 'Mabelreign South',
        'Waterfalls', 'Waterfalls North', 'Waterfalls South', 'Chisipite',
        'Chisipite North', 'Chisipite South'
      ];
      easternAreas.forEach((area, areaIndex) => {
        for (let block = 1; block <= 15; block++) {
          for (let street = 1; street <= 8; street++) {
            easternSpots.push({
              name: `${area} Block ${block} Street ${street} Parking`,
              address: `${area} Block ${block} Street ${street}, Harare, Zimbabwe`,
              lat: -17.7800 + (areaIndex * 0.002),
              lng: 31.1200 + (block * 0.001) + (street * 0.0005),
              price: 1.75 + (areaIndex * 0.20),
              availability: true,
              type: "Residential Parking",
              description: `${area} residential parking`
            });
          }
        }
      });
      const eastResult = await addSpotsWithCheck(easternSpots, 'Eastern Suburbs');
      totalAdded += eastResult.added;
      totalSkipped += eastResult.skipped;
      
      // Western Suburbs
      const westernSpots = [];
      const westernAreas = [
        'Westgate', 'Westgate North', 'Westgate South', 'Budiriro',
        'Budiriro North', 'Budiriro South', 'Glen View', 'Glen View North',
        'Glen View South', 'Warren Park', 'Warren Park North', 'Warren Park South'
      ];
      westernAreas.forEach((area, areaIndex) => {
        for (let block = 1; block <= 15; block++) {
          for (let street = 1; street <= 8; street++) {
            westernSpots.push({
              name: `${area} Block ${block} Street ${street} Parking`,
              address: `${area} Block ${block} Street ${street}, Harare, Zimbabwe`,
              lat: -17.8000 + (areaIndex * 0.002),
              lng: 30.9500 + (block * 0.001) + (street * 0.0005),
              price: 1.50 + (areaIndex * 0.15),
              availability: true,
              type: "Residential Parking",
              description: `${area} residential parking`
            });
          }
        }
      });
      const westResult = await addSpotsWithCheck(westernSpots, 'Western Suburbs');
      totalAdded += westResult.added;
      totalSkipped += westResult.skipped;
      
      // Southern Suburbs
      const southernSpots = [];
      const southernAreas = [
        'Hatcliffe', 'Hatcliffe North', 'Hatcliffe South', 'Hatcliffe Extension',
        'Hatcliffe Extension North', 'Hatcliffe Extension South', 'Crowborough',
        'Crowborough North', 'Crowborough South', 'Epworth', 'Epworth North',
        'Epworth South', 'Epworth Extension'
      ];
      southernAreas.forEach((area, areaIndex) => {
        for (let block = 1; block <= 15; block++) {
          for (let street = 1; street <= 10; street++) {
            southernSpots.push({
              name: `${area} Block ${block} Street ${street} Parking`,
              address: `${area} Block ${block} Street ${street}, Harare, Zimbabwe`,
              lat: -17.8500 + (areaIndex * 0.002),
              lng: 31.1000 + (block * 0.001) + (street * 0.0005),
              price: 1.25 + (areaIndex * 0.10),
              availability: true,
              type: "Residential Parking",
              description: `${area} residential parking`
            });
          }
        }
      });
      const southResult = await addSpotsWithCheck(southernSpots, 'Southern Suburbs');
      totalAdded += southResult.added;
      totalSkipped += southResult.skipped;
      
      // Shopping Centers
      const shoppingSpots = [];
      const shoppingCenters = [
        'Sam Levy Village', 'Borrowdale Village', 'Highlands Shopping Centre',
        'Avondale Shopping Centre', 'Belgravia Shopping Centre', 'Alexandra Park Shopping Centre',
        'Mabelreign Shopping Centre', 'Waterfalls Shopping Centre', 'Chisipite Shopping Centre',
        'Westgate Shopping Centre', 'Budiriro Shopping Centre', 'Glen View Shopping Centre',
        'Warren Park Shopping Centre', 'Hatcliffe Shopping Centre', 'Crowborough Shopping Centre',
        'Epworth Shopping Centre', 'Eastgate Shopping Centre', 'Westgate Shopping Centre',
        'Avondale Shopping Centre', 'Belgravia Shopping Centre', 'Alexandra Park Shopping Centre',
        'Mabelreign Shopping Centre', 'Waterfalls Shopping Centre', 'Chisipite Shopping Centre',
        'Westgate Shopping Centre', 'Budiriro Shopping Centre', 'Glen View Shopping Centre',
        'Warren Park Shopping Centre', 'Hatcliffe Shopping Centre', 'Crowborough Shopping Centre',
        'Epworth Shopping Centre'
      ];
      shoppingCenters.forEach((center, centerIndex) => {
        for (let section = 1; section <= 30; section++) {
          shoppingSpots.push({
            name: `${center} Section ${section} Parking`,
            address: `${center}, Harare, Zimbabwe`,
            lat: -17.8000 + (centerIndex * 0.002),
            lng: 31.0500 + (centerIndex * 0.001),
            price: 3.00 + (centerIndex * 0.25),
            availability: true,
            type: "Shopping Center",
            description: `${center} shopping center parking`
          });
        }
      });
      const shoppingResult = await addSpotsWithCheck(shoppingSpots, 'Shopping Centers');
      totalAdded += shoppingResult.added;
      totalSkipped += shoppingResult.skipped;
      
      // Medical Centers
      const medicalSpots = [];
      const medicalCenters = [
        'Parirenyatwa Hospital', 'Harare Central Hospital', 'Avenues Clinic',
        'Borrowdale Medical Centre', 'Highlands Medical Centre', 'Mount Pleasant Medical Centre',
        'Newlands Medical Centre', 'Avondale Medical Centre', 'Belgravia Medical Centre',
        'Alexandra Park Medical Centre', 'Mabelreign Medical Centre', 'Waterfalls Medical Centre',
        'Chisipite Medical Centre', 'Arcadia Medical Centre', 'Arundel Medical Centre',
        'Ballantyne Park Medical Centre', 'Glen Lorne Medical Centre'
      ];
      medicalCenters.forEach((center, centerIndex) => {
        for (let section = 1; section <= 15; section++) {
          medicalSpots.push({
            name: `${center} Section ${section} Parking`,
            address: `${center}, Harare, Zimbabwe`,
            lat: -17.8000 + (centerIndex * 0.002),
            lng: 31.0500 + (centerIndex * 0.001),
            price: 2.00 + (centerIndex * 0.25),
            availability: true,
            type: "Hospital",
            description: `${center} medical facility parking`
          });
        }
      });
      const medicalResult = await addSpotsWithCheck(medicalSpots, 'Medical Centers');
      totalAdded += medicalResult.added;
      totalSkipped += medicalResult.skipped;
      
      // Universities
      const universitySpots = [];
      const universities = [
        'University of Zimbabwe', 'Harare Institute of Technology', 'Zimbabwe Open University',
        'National University of Science and Technology', 'Bindura University of Science Education',
        'Midlands State University', 'Great Zimbabwe University', 'Lupane State University',
        'Chinhoyi University of Technology', 'Marondera University of Agricultural Sciences',
        'Manicaland State University of Applied Sciences', 'Gwanda State University',
        'Zimbabwe Ezekiel Guti University', 'Catholic University in Zimbabwe',
        'Africa University', 'Solusi University', 'Zimbabwe Theological College',
        'Harare Theological College', 'Baptist Theological Seminary', 'Methodist Theological College'
      ];
      universities.forEach((university, uniIndex) => {
        for (let section = 1; section <= 100; section++) {
          universitySpots.push({
            name: `${university} Section ${section} Parking`,
            address: `${university}, Harare, Zimbabwe`,
            lat: -17.8000 + (uniIndex * 0.002),
            lng: 31.0500 + (uniIndex * 0.001),
            price: 1.50 + (uniIndex * 0.10),
            availability: true,
            type: "University",
            description: `${university} campus parking`
          });
        }
      });
      const uniResult = await addSpotsWithCheck(universitySpots, 'Universities');
      totalAdded += uniResult.added;
      totalSkipped += uniResult.skipped;
      
      // Transport Hubs
      const transportSpots = [];
      const transportHubs = [
        'Harare Central Bus Station', 'Mbare Bus Station', 'Coventry Road Bus Station',
        'Harare International Airport', 'Robert Gabriel Mugabe International Airport',
        'Harare Railway Station', 'Bulawayo Road Bus Station', 'Chitungwiza Bus Station',
        'Ruwa Bus Station', 'Norton Bus Station', 'Marondera Bus Station',
        'Chinhoyi Bus Station', 'Bindura Bus Station', 'Kadoma Bus Station',
        'Chegutu Bus Station', 'Banket Bus Station', 'Raffingora Bus Station',
        'Chirundu Bus Station', 'Kariba Bus Station', 'Karoi Bus Station',
        'Chinhoyi Bus Station', 'Bindura Bus Station', 'Kadoma Bus Station',
        'Chegutu Bus Station', 'Banket Bus Station', 'Raffingora Bus Station',
        'Chirundu Bus Station', 'Kariba Bus Station', 'Karoi Bus Station'
      ];
      transportHubs.forEach((hub, hubIndex) => {
        for (let section = 1; section <= 15; section++) {
          transportSpots.push({
            name: `${hub} Section ${section} Parking`,
            address: `${hub}, Harare, Zimbabwe`,
            lat: -17.8000 + (hubIndex * 0.002),
            lng: 31.0500 + (hubIndex * 0.001),
            price: 2.50 + (hubIndex * 0.20),
            availability: true,
            type: "Transport Hub",
            description: `${hub} transport facility parking`
          });
        }
      });
      const transportResult = await addSpotsWithCheck(transportSpots, 'Transport Hubs');
      totalAdded += transportResult.added;
      totalSkipped += transportResult.skipped;
      
      // Government Offices
      const governmentSpots = [];
      const governmentOffices = [
        'Parliament of Zimbabwe', 'Supreme Court of Zimbabwe', 'High Court of Zimbabwe',
        'Ministry of Finance', 'Ministry of Health', 'Ministry of Education',
        'Ministry of Transport', 'Ministry of Agriculture', 'Ministry of Defence',
        'Ministry of Foreign Affairs', 'Ministry of Home Affairs', 'Ministry of Justice',
        'Ministry of Information', 'Ministry of Tourism', 'Ministry of Environment',
        'Ministry of Energy', 'Ministry of Mines', 'Ministry of Industry',
        'Ministry of Commerce', 'Ministry of Labour', 'Ministry of Youth',
        'Ministry of Women Affairs', 'Ministry of Local Government', 'Ministry of Rural Development'
      ];
      governmentOffices.forEach((office, officeIndex) => {
        for (let section = 1; section <= 15; section++) {
          governmentSpots.push({
            name: `${office} Section ${section} Parking`,
            address: `${office}, Harare, Zimbabwe`,
            lat: -17.8000 + (officeIndex * 0.002),
            lng: 31.0500 + (officeIndex * 0.001),
            price: 2.00 + (officeIndex * 0.15),
            availability: true,
            type: "Government Office",
            description: `${office} government facility parking`
          });
        }
      });
      const govResult = await addSpotsWithCheck(governmentSpots, 'Government Offices');
      totalAdded += govResult.added;
      totalSkipped += govResult.skipped;
      
      // Hotels
      const hotelSpots = [];
      const hotels = [
        'Meikles Hotel', 'Rainbow Towers Hotel', 'Crowne Plaza Harare',
        'Holiday Inn Harare', 'Sheraton Harare', 'Monomotapa Hotel',
        'Bronte Hotel', 'York Lodge', 'Amanzi Lodge', 'Lion and Cheetah Lodge',
        'Borrowdale Brooke Hotel', 'Highlands House Hotel', 'Mount Pleasant Hotel',
        'Newlands Hotel', 'Avondale Hotel', 'Belgravia Hotel', 'Alexandra Park Hotel',
        'Mabelreign Hotel', 'Waterfalls Hotel', 'Chisipite Hotel', 'Arcadia Hotel',
        'Arundel Hotel', 'Ballantyne Park Hotel', 'Glen Lorne Hotel', 'Westgate Hotel',
        'Budiriro Hotel', 'Glen View Hotel', 'Warren Park Hotel', 'Hatcliffe Hotel',
        'Crowborough Hotel', 'Epworth Hotel', 'Eastgate Hotel', 'Westgate Hotel',
        'Avondale Hotel', 'Belgravia Hotel', 'Alexandra Park Hotel', 'Mabelreign Hotel',
        'Waterfalls Hotel', 'Chisipite Hotel', 'Arcadia Hotel', 'Arundel Hotel',
        'Ballantyne Park Hotel', 'Glen Lorne Hotel', 'Westgate Hotel', 'Budiriro Hotel',
        'Glen View Hotel', 'Warren Park Hotel', 'Hatcliffe Hotel', 'Crowborough Hotel',
        'Epworth Hotel', 'Eastgate Hotel', 'Westgate Hotel', 'Avondale Hotel'
      ];
      hotels.forEach((hotel, hotelIndex) => {
        for (let section = 1; section <= 35; section++) {
          hotelSpots.push({
            name: `${hotel} Section ${section} Parking`,
            address: `${hotel}, Harare, Zimbabwe`,
            lat: -17.8000 + (hotelIndex * 0.002),
            lng: 31.0500 + (hotelIndex * 0.001),
            price: 4.00 + (hotelIndex * 0.30),
            availability: true,
            type: "Hotel",
            description: `${hotel} hotel parking`
          });
        }
      });
      const hotelResult = await addSpotsWithCheck(hotelSpots, 'Hotels');
      totalAdded += hotelResult.added;
      totalSkipped += hotelResult.skipped;
      
      // Entertainment
      const entertainmentSpots = [];
      const entertainmentVenues = [
        '7 Arts Theatre', 'Reps Theatre', 'Harare International Festival of the Arts',
        'National Gallery of Zimbabwe', 'National Archives of Zimbabwe', 'National Museum',
        'Queen Victoria Museum', 'Chapungu Sculpture Park', 'National Botanic Gardens',
        'Lion and Cheetah Park', 'Mukuvisi Woodlands', 'Hwange National Park',
        'Victoria Falls', 'Great Zimbabwe Ruins', 'Matobo Hills', 'Eastern Highlands',
        'Lake Kariba', 'Mana Pools', 'Gonarezhou National Park', 'Chimanimani Mountains',
        'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
        'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
        'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
        'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
        'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
        'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains', 'Chimanimani Mountains',
        'Nyanga National Park', 'Vumba Mountains', 'Bvumba Mountains'
      ];
      entertainmentVenues.forEach((venue, venueIndex) => {
        for (let section = 1; section <= 15; section++) {
          entertainmentSpots.push({
            name: `${venue} Section ${section} Parking`,
            address: `${venue}, Harare, Zimbabwe`,
            lat: -17.8000 + (venueIndex * 0.002),
            lng: 31.0500 + (venueIndex * 0.001),
            price: 3.50 + (venueIndex * 0.25),
            availability: true,
            type: "Entertainment",
            description: `${venue} entertainment venue parking`
          });
        }
      });
      const entertainmentResult = await addSpotsWithCheck(entertainmentSpots, 'Entertainment');
      totalAdded += entertainmentResult.added;
      totalSkipped += entertainmentResult.skipped;
      
      setSuccess(`Smart addition complete! Added ${totalAdded} new spots, Skipped ${totalSkipped} existing spots. Total: ${totalAdded + totalSkipped} spots in database.`);
      setTimeout(() => {
        navigate('/my-spots');
      }, 3000);
    } catch (err) {
      console.error('Error adding all Harare spots:', err);
      setError(`Failed to add all Harare spots: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper functions for street names
  const getAvenueName = (num) => {
    const names = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
                   'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth'];
    return names[num - 1] || `${num}th`;
  };

  const getStreetName = (num) => {
    const names = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
                   'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth'];
    return names[num - 1] || `${num}th`;
  };

  const handleMySpotsClick = () => {
    try {
      navigate('/my-spots');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  const handleDuplicateRemoverClick = () => {
    try {
      navigate('/duplicate-remover');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Arial, sans-serif"
    }}>
      <div style={{ 
        maxWidth: 600, 
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
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #ffd740, #ffe082)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              color: '#23201d',
              fontWeight: 'bold',
              margin: '0 auto 20px',
              boxShadow: '0 8px 32px rgba(255, 215, 64, 0.3)',
              border: '3px solid rgba(255, 255, 255, 0.1)'
            }}>
              
            </div>
            <h2 style={{ 
              color: '#ffd740', 
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '8px',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
              letterSpacing: '1px'
            }}>Add Parking Spot</h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1.1rem',
              margin: 0,
              fontWeight: '400'
            }}>Create a new parking location for users to find</p>
          </div>

          {success && (
            <div style={{ 
              background: 'rgba(76, 175, 80, 0.2)', 
              border: '1px solid rgba(76, 175, 80, 0.3)', 
              padding: '16px', 
              borderRadius: '12px', 
              fontSize: '1rem',
              color: '#4caf50',
              textAlign: 'center',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
               {success}
            </div>
          )}
          
          {error && (
            <div style={{ 
              background: 'rgba(244, 67, 54, 0.2)', 
              border: '1px solid rgba(244, 67, 54, 0.3)', 
              padding: '16px', 
              borderRadius: '12px', 
              fontSize: '1rem',
              color: '#f44336',
              textAlign: 'center',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
               {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  color: '#ffd740',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Parking Spot Name *</label>
                <input 
                  name="name" 
                  placeholder="e.g., Joina City Parking" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.borderColor = '#ffd740';
                    e.target.boxShadow = '0 0 0 2px rgba(255, 215, 64, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  color: '#ffd740',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Price per Hour *</label>
                <input 
                  name="price" 
                  placeholder="e.g., 5.00" 
                  value={form.price} 
                  onChange={handleChange} 
                  required 
                  type="number" 
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.borderColor = '#ffd740';
                    e.target.boxShadow = '0 0 0 2px rgba(255, 215, 64, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                color: '#ffd740',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '8px',
                display: 'block'
              }}>Full Address *</label>
              <input 
                name="address" 
                placeholder="e.g., Jason Moyo Ave, Harare, Zimbabwe" 
                value={form.address} 
                onChange={handleChange} 
                required 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.borderColor = '#ffd740';
                  e.target.boxShadow = '0 0 0 2px rgba(255, 215, 64, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  color: '#ffd740',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Latitude *</label>
                <input 
                  name="lat" 
                  placeholder="e.g., -17.8252" 
                  value={form.lat} 
                  onChange={handleChange} 
                  required 
                  type="number" 
                  step="any"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.borderColor = '#ffd740';
                    e.target.boxShadow = '0 0 0 2px rgba(255, 215, 64, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  color: '#ffd740',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Longitude *</label>
                <input 
                  name="lng" 
                  placeholder="e.g., 31.0335" 
                  value={form.lng} 
                  onChange={handleChange} 
                  required 
                  type="number" 
                  step="any"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.borderColor = '#ffd740';
                    e.target.boxShadow = '0 0 0 2px rgba(255, 215, 64, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  color: '#ffd740',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Availability *</label>
                <select 
                  name="availability" 
                  value={form.availability} 
                  onChange={handleSelectChange} 
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.borderColor = '#ffd740';
                    e.target.boxShadow = '0 0 0 2px rgba(255, 215, 64, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.boxShadow = 'none';
                  }}
                >
                  <option value={true}>✅ Available</option>
                  <option value={false}>❌ Not Available</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  color: '#ffd740',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>Type</label>
                <input 
                  name="type" 
                  placeholder="e.g., Garage, Street, Lot" 
                  value={form.type} 
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.borderColor = '#ffd740';
                    e.target.boxShadow = '0 0 0 2px rgba(255, 215, 64, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                color: '#ffd740',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '8px',
                display: 'block'
              }}>Description</label>
              <textarea 
                name="description" 
                placeholder="Additional details about the parking spot..." 
                value={form.description} 
                onChange={handleChange} 
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  resize: 'vertical',
                  fontFamily: "'Segoe UI', Arial, sans-serif"
                }}
                onFocus={(e) => {
                  e.target.borderColor = '#ffd740';
                  e.target.boxShadow = '0 0 0 2px rgba(255, 215, 64, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <button 
                onClick={handleMySpotsClick}
                style={{
                  background: '#ffd740',
                  color: '#23201d',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                Go to My Spots
              </button>

              <button 
                onClick={handleDuplicateRemoverClick}
                style={{
                  background: '#ffd740',
                  color: '#23201d',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 16,
                  marginLeft: 16
                }}
              >
                Duplicate Remover
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                flex: 2,
                background: 'linear-gradient(135deg, #ffd740, #ffe082)', 
                color: '#23201d', 
                border: 'none', 
                borderRadius: '12px', 
                padding: '16px', 
                fontWeight: '700', 
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 16px rgba(255, 215, 64, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.transform = 'translateY(-2px)';
                  e.target.boxShadow = '0 6px 20px rgba(255, 215, 64, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.transform = 'translateY(0)';
                e.target.boxShadow = '0 4px 16px rgba(255, 215, 64, 0.3)';
              }}
            >
              {loading ? ' Adding...' : 'Add Parking Spot'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSpotForm; 