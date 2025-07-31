import React, { useEffect, useState, useContext } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { AuthContext } from '../main';

const OwnerDashboard = () => {
  const [payouts, setPayouts] = useState([]);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    completedPayouts: 0
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchOwnerData();
    }
  }, [user]);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch owner's parking spots
      const spotsQuery = query(
        collection(db, 'parkingSpots'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const spotsSnapshot = await getDocs(spotsQuery);
      const spotsData = [];
      spotsSnapshot.forEach(doc => {
        spotsData.push({ id: doc.id, ...doc.data() });
      });
      setParkingSpots(spotsData);

      // Fetch payouts
      const payoutsQuery = query(
        collection(db, 'payouts'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payoutsData = [];
      payoutsSnapshot.forEach(doc => {
        payoutsData.push({ id: doc.id, ...doc.data() });
      });
      setPayouts(payoutsData);

      // Calculate stats
      const totalEarnings = payoutsData.reduce((sum, payout) => sum + payout.totalAmount, 0);
      const totalPayouts = payoutsData.reduce((sum, payout) => sum + payout.ownerAmount, 0);
      const pendingPayouts = payoutsData.filter(p => p.status === 'pending').length;
      const completedPayouts = payoutsData.filter(p => p.status === 'completed').length;

      setStats({
        totalEarnings,
        totalPayouts,
        pendingPayouts,
        completedPayouts
      });

    } catch (error) {
      console.error('Error fetching owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'failed': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ffd740', marginBottom: '20px' }}>Please Log In</h2>
          <p>You need to be logged in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#ffffff',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <h1 style={{ color: '#ffd740', margin: '0 0 8px 0', fontSize: '2rem' }}>
              Owner Dashboard
            </h1>
            <p style={{ margin: '0', opacity: '0.8' }}>
              Manage your parking spots and track earnings
            </p>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ color: '#ffd740', fontSize: '1.2rem' }}>Loading dashboard...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', color: '#ffd740', marginBottom: '8px' }}>
                  ${stats.totalEarnings.toFixed(2)}
                </div>
                <div style={{ opacity: '0.8' }}>Total Earnings</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', color: '#4caf50', marginBottom: '8px' }}>
                  ${stats.totalPayouts.toFixed(2)}
                </div>
                <div style={{ opacity: '0.8' }}>Total Payouts</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', color: '#ff9800', marginBottom: '8px' }}>
                  {stats.pendingPayouts}
                </div>
                <div style={{ opacity: '0.8' }}>Pending Payouts</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', color: '#4caf50', marginBottom: '8px' }}>
                  {parkingSpots.length}
                </div>
                <div style={{ opacity: '0.8' }}>Parking Spots</div>
              </div>
            </div>

            {/* Payouts Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ color: '#ffd740', marginBottom: '20px' }}>
                Payout History
              </h3>
              
              {payouts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: '0.7' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No payouts yet</div>
                  <p>Your payout history will appear here when you receive payments</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {payouts.map((payout) => (
                    <div key={payout.id} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          ${payout.ownerAmount?.toFixed(2) || '0.00'}
                        </div>
                        <div style={{ opacity: '0.7', fontSize: '14px' }}>
                          Spot: {payout.spotId}
                        </div>
                        <div style={{ opacity: '0.6', fontSize: '12px', marginTop: '4px' }}>
                          Platform Fee: ${payout.platformFee?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: getStatusColor(payout.status),
                          color: '#ffffff'
                        }}>
                          {getStatusText(payout.status)}
                        </div>
                        <div style={{ opacity: '0.6', fontSize: '12px', marginTop: '4px' }}>
                          {payout.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Parking Spots Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ color: '#ffd740', marginBottom: '20px' }}>
                Your Parking Spots
              </h3>
              
              {parkingSpots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: '0.7' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No parking spots</div>
                  <p>Add parking spots to start earning</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {parkingSpots.map((spot) => (
                    <div key={spot.id} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {spot.name || 'Unnamed Spot'}
                        </div>
                        <div style={{ opacity: '0.7', fontSize: '14px' }}>
                          {spot.address}
                        </div>
                        <div style={{ opacity: '0.6', fontSize: '12px', marginTop: '4px' }}>
                          ${spot.price}/hr
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: spot.availability ? '#4caf50' : '#f44336',
                          color: '#ffffff'
                        }}>
                          {spot.availability ? 'Available' : 'Booked'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard; 