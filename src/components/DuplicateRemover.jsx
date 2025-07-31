import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

const DuplicateRemover = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [stats, setStats] = useState({});

  // Function to remove all duplicates and ensure exactly 6000 unique spots
  const removeDuplicatesAndNormalize = async () => {
    setLoading(true);
    setStatus('Starting duplicate removal process...');
    
    try {
      // Get all parking spots
      const querySnapshot = await getDocs(collection(db, 'parkingSpots'));
      const allSpots = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStatus(`Found ${allSpots.length} total spots. Analyzing for duplicates...`);
      
      // Create a map to track unique spots by name and coordinates
      const uniqueSpots = new Map();
      const duplicates = [];
      
      allSpots.forEach(spot => {
        // Create a unique key based on name and coordinates (with some tolerance for coordinates)
        const roundedLat = Math.round(spot.lat * 10000) / 10000; // Round to 4 decimal places
        const roundedLng = Math.round(spot.lng * 10000) / 10000;
        const key = `${spot.name}_${roundedLat}_${roundedLng}`;
        
        if (uniqueSpots.has(key)) {
          duplicates.push(spot);
        } else {
          uniqueSpots.set(key, spot);
        }
      });
      
      const uniqueSpotsArray = Array.from(uniqueSpots.values());
      
      setStatus(`Found ${duplicates.length} duplicates. Removing duplicates...`);
      
      // Delete all duplicate spots
      for (const duplicate of duplicates) {
        await deleteDoc(doc(db, 'parkingSpots', duplicate.id));
      }
      
      setStatus(`Removed ${duplicates.length} duplicates. Now have ${uniqueSpotsArray.length} unique spots.`);
      
      // If we have more than 6000 spots, remove excess spots
      if (uniqueSpotsArray.length > 6000) {
        const spotsToRemove = uniqueSpotsArray.length - 6000;
        setStatus(`Need to remove ${spotsToRemove} excess spots to reach 6000 total...`);
        
        // Remove excess spots (keep the first 6000)
        const spotsToDelete = uniqueSpotsArray.slice(6000);
        
        for (let i = 0; i < spotsToDelete.length; i++) {
          await deleteDoc(doc(db, 'parkingSpots', spotsToDelete[i].id));
          
          if (i % 100 === 0) {
            setStatus(`Removed ${i + 1}/${spotsToDelete.length} excess spots...`);
          }
        }
        
        setStatus(`Successfully removed ${spotsToDelete.length} excess spots.`);
      }
      // If we have less than 6000 spots, add more unique spots
      else if (uniqueSpotsArray.length < 6000) {
        const spotsToAdd = 6000 - uniqueSpotsArray.length;
        setStatus(`Need to add ${spotsToAdd} more spots to reach 6000 total...`);
        
        // Generate additional unique spots
        const additionalSpots = generateAdditionalSpots(spotsToAdd, uniqueSpotsArray);
        
        for (let i = 0; i < additionalSpots.length; i++) {
          await addDoc(collection(db, 'parkingSpots'), {
            ...additionalSpots[i],
            createdAt: new Date(),
          });
          
          if (i % 100 === 0) {
            setStatus(`Added ${i + 1}/${additionalSpots.length} additional spots...`);
          }
        }
        
        setStatus(`Successfully added ${additionalSpots.length} additional spots.`);
      }
      
      // Final count
      const finalSnapshot = await getDocs(collection(db, 'parkingSpots'));
      const finalCount = finalSnapshot.size;
      
      setStats({
        originalCount: allSpots.length,
        duplicatesRemoved: duplicates.length,
        uniqueSpots: uniqueSpotsArray.length,
        excessSpotsRemoved: uniqueSpotsArray.length > 6000 ? uniqueSpotsArray.length - 6000 : 0,
        additionalSpotsAdded: uniqueSpotsArray.length < 6000 ? 6000 - uniqueSpotsArray.length : 0,
        finalCount: finalCount
      });
      
      setStatus(`✅ Complete! Database now contains exactly ${finalCount} unique parking spots.`);
      
    } catch (error) {
      console.error('Error removing duplicates:', error);
      setStatus(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  // Function to generate additional unique spots
  const generateAdditionalSpots = (count, existingSpots) => {
    const spots = [];
    const existingNames = new Set(existingSpots.map(spot => spot.name));
    const existingCoords = new Set(existingSpots.map(spot => `${spot.lat}_${spot.lng}`));
    
    const areas = [
      'Central Business District', 'Northern Suburbs', 'Southern Suburbs', 
      'Eastern Suburbs', 'Western Suburbs', 'Highlands', 'Borrowdale',
      'Avondale', 'Belgravia', 'Mount Pleasant', 'Newlands', 'Arcadia',
      'Arundel', 'Ballantyne Park', 'Glen Lorne', 'Westgate', 'Budiriro',
      'Glen View', 'Warren Park', 'Hatcliffe', 'Crowborough', 'Epworth'
    ];
    
    const types = [
      'Street Parking', 'Shopping Center', 'Residential Parking', 'Hospital',
      'University', 'Transport Hub', 'Government Office', 'Hotel', 'Entertainment'
    ];
    
    let spotIndex = 0;
    let areaIndex = 0;
    let typeIndex = 0;
    
    for (let i = 0; i < count; i++) {
      let name, lat, lng;
      let attempts = 0;
      
      do {
        const area = areas[areaIndex % areas.length];
        const type = types[typeIndex % types.length];
        const section = Math.floor(spotIndex / 50) + 1;
        
        name = `${area} Section ${section} Parking`;
        
        // Generate unique coordinates
        lat = -17.8000 + (areaIndex * 0.001) + (Math.random() * 0.01);
        lng = 31.0500 + (typeIndex * 0.001) + (Math.random() * 0.01);
        
        attempts++;
        spotIndex++;
        
        if (spotIndex % 50 === 0) {
          areaIndex++;
        }
        if (spotIndex % 30 === 0) {
          typeIndex++;
        }
        
        // Prevent infinite loop
        if (attempts > 1000) {
          lat = -17.8000 + (Math.random() * 0.1);
          lng = 31.0500 + (Math.random() * 0.1);
          name = `Additional Spot ${i + 1}`;
          break;
        }
      } while (existingNames.has(name) || existingCoords.has(`${lat}_${lng}`));
      
      spots.push({
        name: name,
        address: `${name}, Harare, Zimbabwe`,
        lat: lat,
        lng: lng,
        price: 1.50 + (Math.random() * 4.50),
        availability: true,
        type: types[typeIndex % types.length],
        description: `${name} - Additional parking location`
      });
    }
    
    return spots;
  };

  // Function to just count current spots
  const countSpots = async () => {
    setLoading(true);
    setStatus('Counting current spots...');
    
    try {
      const querySnapshot = await getDocs(collection(db, 'parkingSpots'));
      const count = querySnapshot.size;
      
      setStatus(`Current database contains ${count} parking spots.`);
      setStats({ currentCount: count });
    } catch (error) {
      console.error('Error counting spots:', error);
      setStatus(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  // Function to remove all spots (use with caution)
  const removeAllSpots = async () => {
    if (!window.confirm('Are you sure you want to delete ALL parking spots? This action cannot be undone!')) {
      return;
    }
    
    setLoading(true);
    setStatus('Removing all parking spots...');
    
    try {
      const querySnapshot = await getDocs(collection(db, 'parkingSpots'));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      setStatus(`✅ Removed all ${querySnapshot.size} parking spots.`);
    } catch (error) {
      console.error('Error removing all spots:', error);
      setStatus(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
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
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ 
            color: '#ffd740', 
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '8px'
          }}>
            🧹 Duplicate Remover
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem',
            margin: 0
          }}>
            Clean up your parking spots database and ensure exactly 6000 unique spots
          </p>
        </div>

        {status && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            padding: '16px', 
            borderRadius: '12px', 
            fontSize: '1rem',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            {status}
          </div>
        )}

        {Object.keys(stats).length > 0 && (
          <div style={{ 
            background: 'rgba(255, 215, 64, 0.1)', 
            border: '1px solid rgba(255, 215, 64, 0.3)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#ffd740', marginBottom: '16px' }}>Statistics:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {stats.originalCount && (
                <div>
                  <strong style={{ color: '#ffd740' }}>Original Count:</strong> {stats.originalCount}
                </div>
              )}
              {stats.duplicatesRemoved && (
                <div>
                  <strong style={{ color: '#ffd740' }}>Duplicates Removed:</strong> {stats.duplicatesRemoved}
                </div>
              )}
              {stats.uniqueSpots && (
                <div>
                  <strong style={{ color: '#ffd740' }}>Unique Spots:</strong> {stats.uniqueSpots}
                </div>
              )}
              {stats.excessSpotsRemoved && (
                <div>
                  <strong style={{ color: '#ffd740' }}>Excess Spots Removed:</strong> {stats.excessSpotsRemoved}
                </div>
              )}
              {stats.additionalSpotsAdded && (
                <div>
                  <strong style={{ color: '#ffd740' }}>Additional Spots Added:</strong> {stats.additionalSpotsAdded}
                </div>
              )}
              {stats.finalCount && (
                <div>
                  <strong style={{ color: '#ffd740' }}>Final Count:</strong> {stats.finalCount}
                </div>
              )}
              {stats.currentCount && (
                <div>
                  <strong style={{ color: '#ffd740' }}>Current Count:</strong> {stats.currentCount}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          <button 
            onClick={countSpots}
            disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #2196f3, #42a5f5)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '16px', 
              fontWeight: '600', 
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            📊 Count Current Spots
          </button>

          <button 
            onClick={removeDuplicatesAndNormalize}
            disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '16px', 
              fontWeight: '600', 
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            🧹 Remove Duplicates & Normalize to 6000 Spots
          </button>

          <button 
            onClick={removeAllSpots}
            disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #f44336, #ef5350)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '16px', 
              fontWeight: '600', 
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            ⚠️ Remove ALL Spots (Danger Zone)
          </button>
        </div>

        <div style={{ 
          marginTop: '32px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ color: '#ffd740', marginBottom: '12px' }}>What this tool does:</h3>
          <ul style={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            margin: 0,
            paddingLeft: '20px'
          }}>
            <li>Counts all current parking spots in your database</li>
            <li>Identifies and removes duplicate spots based on name and coordinates</li>
            <li>Ensures you have exactly 6000 unique parking spots</li>
            <li>Adds additional unique spots if needed to reach 6000 total</li>
            <li>Provides detailed statistics of the cleanup process</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DuplicateRemover; 