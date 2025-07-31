import React, { useEffect, useState, useContext } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc, orderBy } from "firebase/firestore";
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

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [showAddReview, setShowAddReview] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [parkingSpots, setParkingSpots] = useState({});
  const [allParkingSpots, setAllParkingSpots] = useState([]); // New state for all parking spots
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingStats, setRatingStats] = useState({});
  const location = useLocation();
  
  // Get user from AuthContext
  const { user } = useContext(AuthContext);

  // Fetch all parking spots for the dropdown
  const fetchAllParkingSpots = async () => {
    try {
      console.log('Fetching all parking spots for review dropdown');
      const querySnapshot = await getDocs(collection(db, "parkingSpots"));
      const spots = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Filter out test spots
      const realSpots = spots.filter(spot => 
        !spot.isTest && 
        !spot.name?.toLowerCase().includes('test') && 
        !spot.address?.toLowerCase().includes('test')
      );
      
      // Sort spots alphabetically by name
      const sortedSpots = realSpots.sort((a, b) => {
        const nameA = (a.name || `Spot ID: ${a.id}`).toLowerCase();
        const nameB = (b.name || `Spot ID: ${b.id}`).toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      console.log('All parking spots fetched and sorted:', sortedSpots.length);
      setAllParkingSpots(sortedSpots);
    } catch (error) {
      console.error('Error fetching all parking spots:', error);
      setAllParkingSpots([]);
    }
  };

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
    if (!spotId) {
      console.warn('No spotId provided to fetchParkingSpotDetails');
      return null;
    }
    
    try {
      console.log('Fetching spot details for spotId:', spotId);
      const spotDoc = await getDoc(doc(db, 'parkingSpots', spotId));
      if (spotDoc.exists()) {
        const spotData = spotDoc.data();
        console.log('Spot details found:', spotData);
        return spotData;
      } else {
        console.warn('Spot document does not exist for spotId:', spotId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching spot details for spotId:', spotId, error);
      return null;
    }
  };

  const fetchAllReviews = async () => {
    try {
      console.log('Fetching all reviews for overall rating calculation');
      
      const allReviewsQuery = query(collection(db, 'reviews'));
      const querySnapshot = await getDocs(allReviewsQuery);
      
      const allReviews = [];
      querySnapshot.forEach(doc => {
        allReviews.push({ id: doc.id, ...doc.data() });
      });
      
      // Calculate overall rating
      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const averageRating = totalRating / allReviews.length;
        
        // Calculate rating statistics
        const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allReviews.forEach(review => {
          const rating = review.rating || 0;
          if (rating >= 1 && rating <= 5) {
            stats[rating]++;
          }
        });
        
        console.log('Overall rating calculated:', averageRating);
        console.log('Total reviews:', allReviews.length);
        console.log('Rating stats:', stats);
        
        setOverallRating(averageRating);
        setTotalReviews(allReviews.length);
        setRatingStats(stats);
      } else {
        setOverallRating(0);
        setTotalReviews(0);
        setRatingStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }
    } catch (error) {
      console.error('Error fetching all reviews:', error);
    }
  };

  const fetchReviews = async (currentUser) => {
    if (!currentUser) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching reviews for user:', currentUser);
      console.log('User UID:', currentUser.uid);
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', currentUser.uid)
      );
      
      console.log('Query created for user:', currentUser.uid);
      const querySnapshot = await getDocs(reviewsQuery);
      
      console.log('Query snapshot size:', querySnapshot.size);
      console.log('Query snapshot empty:', querySnapshot.empty);
      
      const reviewsData = [];
      const spotsData = {};
      
      for (const doc of querySnapshot.docs) {
        const reviewData = { id: doc.id, ...doc.data() };
        console.log('Review data:', reviewData);
        reviewsData.push(reviewData);
        
        // Fetch spot details if not already fetched
        if (reviewData.spotId && !spotsData[reviewData.spotId]) {
          console.log('Fetching spot details for review:', reviewData.id, 'spotId:', reviewData.spotId);
          const spotDetails = await fetchParkingSpotDetails(reviewData.spotId);
          if (spotDetails) {
            spotsData[reviewData.spotId] = spotDetails;
            console.log('Spot details cached for spotId:', reviewData.spotId);
          } else {
            console.warn('Could not fetch spot details for spotId:', reviewData.spotId);
            // Add a placeholder to prevent repeated fetching attempts
            spotsData[reviewData.spotId] = { name: 'Spot Not Found', address: 'Address not available' };
          }
        } else if (!reviewData.spotId) {
          console.warn('Review has no spotId:', reviewData.id);
        }
      }
      
      console.log('All reviews data:', reviewsData);
      
      // Sort reviews by createdAt date (newest first)
      const sortedReviews = reviewsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setReviews(sortedReviews);
      setParkingSpots(spotsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      console.error('Error details:', error.code, error.message);
      setError(`Failed to fetch reviews: ${error.message}`);
      setReviews([]);
    }
    setLoading(false);
  };

  const addReview = async (e) => {
    e.preventDefault();
    
    if (!user || !user.uid) {
      alert('Please log in to add a review.');
      return;
    }

    if (!selectedSpot) {
      alert('Please select a parking spot.');
      return;
    }

    if (!comment.trim()) {
      alert('Please enter a comment.');
      return;
    }

    try {
      const reviewData = {
        userId: user.uid,
        userName: userName || user.email,
        spotId: selectedSpot.id,
        spotName: selectedSpot.name,
        spotAddress: selectedSpot.address,
        rating: rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };
      
      console.log('Adding review:', reviewData);
      await addDoc(collection(db, 'reviews'), reviewData);
      console.log('Review added successfully');
      alert('Review added successfully!');
      
      // Reset form
      setShowAddReview(false);
      setSelectedSpot(null);
      setRating(5);
      setComment("");
      
      // Refresh reviews
      fetchReviews(user);
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Error adding review: ' + error.message);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting review:', reviewId);
      await deleteDoc(doc(db, 'reviews', reviewId));
      console.log('Review deleted successfully');
      alert('Review deleted successfully!');
      
      // Refresh reviews
      if (user) {
        fetchReviews(user);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review: ' + error.message);
    }
  };

  // Debug function to check spot data
  const debugSpotData = () => {
    console.log('=== DEBUG: Spot Data ===');
    console.log('Parking spots state:', parkingSpots);
    console.log('Reviews with spot data:');
    reviews.forEach(review => {
      console.log(`Review ${review.id}:`, {
        spotId: review.spotId,
        spotName: review.spotName,
        spotAddress: review.spotAddress,
        hasSpotData: !!parkingSpots[review.spotId],
        spotData: parkingSpots[review.spotId]
      });
    });
    console.log('=== END DEBUG ===');
  };

  // Fetch reviews on component mount
  useEffect(() => {
    if (user) {
      console.log('Reviews component - User authenticated:', user.uid);
      fetchReviews(user);
      fetchAllReviews(); // Also fetch overall ratings
      fetchAllParkingSpots(); // Fetch parking spots for the dropdown
    } else {
      console.log('Reviews component - No user authenticated');
      setReviews([]);
      setLoading(false);
    }
  }, [user]);

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

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
            }}>⭐ My Reviews</h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem',
            margin: 0,
              marginBottom: '20px',
            fontWeight: '400'
            }}>Share your parking experiences</p>
            
            {/* Overall App Rating */}
            {totalReviews > 0 && (
              <div style={{
                background: 'linear-gradient(145deg, rgba(255, 215, 64, 0.1) 0%, rgba(255, 215, 64, 0.05) 100%)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '30px',
                border: '1px solid rgba(255, 215, 64, 0.2)',
                textAlign: 'center'
              }}>
                <h3 style={{
                  color: '#ffd740',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  marginBottom: '12px'
                }}>App Overall Rating</h3>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    color: '#ffd740'
                  }}>
                    {renderStars(Math.round(overallRating))}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#ffffff'
                    }}>
                      {overallRating.toFixed(1)}
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.9rem'
                    }}>
                      out of 5
                    </div>
                  </div>
                </div>
                
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  marginBottom: '16px'
                }}>
                  Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </div>
                
                {/* Rating Distribution */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  maxWidth: '300px',
                  margin: '0 auto'
                }}>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} style={{
                      textAlign: 'center'
                    }}>
                      <div style={{
                        color: '#ffd740',
                        fontSize: '0.8rem',
                        marginBottom: '4px'
                      }}>
                        {rating}⭐
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        height: '8px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          background: '#ffd740',
                          height: '100%',
                          width: `${(ratingStats[rating] / totalReviews) * 100}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.7rem',
                        marginTop: '4px'
                      }}>
                        {ratingStats[rating]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 215, 64, 0.3)',
                borderTop: '4px solid #ffd740',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1rem',
                margin: 0
              }}>Loading your reviews...</p>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              background: 'rgba(244, 67, 54, 0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(244, 67, 54, 0.3)'
            }}>
              <h3 style={{ color: '#f44336', marginBottom: '16px' }}>Error</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>{error}</p>
              <button 
                onClick={() => user && fetchReviews(user)}
                style={{
                  background: '#ffd740',
                  color: '#23201d',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div>
              {/* Add Review Button */}
              <div style={{
                textAlign: 'center',
                marginBottom: '30px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={() => setShowAddReview(true)}
                  style={{
                    background: 'linear-gradient(135deg, #ffd740 0%, #ffe082 100%)',
                    color: '#23201d',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: '0 8px 24px rgba(255, 215, 64, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                    e.target.style.boxShadow = '0 12px 32px rgba(255, 215, 64, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 8px 24px rgba(255, 215, 64, 0.3)';
                  }}
                >
                   Add New Review
                </button>
                
                {/* Debug Button */}
                <button 
                  onClick={debugSpotData}
                  style={{
                    background: 'rgba(33, 150, 243, 0.2)',
                    color: '#2196f3',
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(33, 150, 243, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(33, 150, 243, 0.2)';
                  }}
                >
                   🔍 Debug Spot Data
                </button>
        </div>

              {reviews.length === 0 ? (
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
                  }}>⭐</div>
            <h3 style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '12px'
            }}>No reviews yet</h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '1rem',
              margin: 0
                  }}>Share your parking experiences to help others</p>
          </div>
        ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {reviews.map((review, index) => (
                    <div key={`review-${review.id}-${index}`} style={{ 
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
                <div style={{
                  display: 'grid',
                        gridTemplateColumns: '1fr auto',
                  gap: '20px',
                        alignItems: 'flex-start'
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
                              ⭐
                  </div>
                      <div>
                        <h3 style={{
                          color: '#ffffff',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          margin: '0 0 4px 0'
                              }}>{
                                parkingSpots[review.spotId]?.name || 
                                review.spotName || 
                                (review.spotId ? `Spot ID: ${review.spotId}` : 'Unknown Spot')
                              }</h3>
                              <p style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.9rem',
                                margin: '0 0 4px 0'
                              }}>{
                                parkingSpots[review.spotId]?.address || 
                                review.spotAddress || 
                                'Address not available'
                              }</p>
                              <p style={{
                                color: '#ffd740',
                                fontSize: '0.85rem',
                                margin: '0 0 8px 0',
                                fontWeight: '600'
                              }}>Reviewed by: {review.userName || 'Anonymous'}</p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{
                                  fontSize: '1.1rem',
                                  color: '#ffd740'
                                }}>
                                  {renderStars(review.rating)}
                                </span>
                          <span style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                                  fontSize: '0.9rem'
                          }}>
                                  {review.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '12px'
                          }}>
                            <p style={{
                              color: '#ffffff',
                              fontSize: '1rem',
                              margin: 0,
                              lineHeight: '1.5'
                            }}>"{review.comment}"</p>
                          </div>

                      <div style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '0.85rem'
                          }}>
                            Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <button 
                          onClick={() => deleteReview(review.id)}
                          style={{ 
                            background: 'rgba(244, 67, 54, 0.2)',
                            color: '#f44336',
                            border: '1px solid rgba(244, 67, 54, 0.3)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(244, 67, 54, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(244, 67, 54, 0.2)';
                          }}
                        >
                           Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
        </div>
      </div>

      {/* Add Review Modal */}
      {showAddReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255, 215, 64, 0.3)',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 style={{
              color: '#ffd740',
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '20px',
              textAlign: 'center'
            }}> Add New Review</h3>
            
            <form onSubmit={addReview}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Parking Spot
                </label>
                <select
                  value={selectedSpot ? selectedSpot.id : ''}
                  onChange={(e) => {
                    const spotId = e.target.value;
                    if (spotId) {
                      // Find the selected spot from allParkingSpots
                      const selectedSpotData = allParkingSpots.find(spot => spot.id === spotId);
                      if (selectedSpotData) {
                        setSelectedSpot({
                          id: selectedSpotData.id,
                          name: selectedSpotData.name || `Spot ID: ${selectedSpotData.id}`,
                          address: selectedSpotData.address || 'Address not available'
                        });
                      } else {
                        setSelectedSpot(null);
                      }
                    } else {
                      setSelectedSpot(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '1rem'
                  }}
                  required
                >
                  <option value="">Select a parking spot...</option>
                  {allParkingSpots.map(spot => (
                    <option key={spot.id} value={spot.id}>
                      {spot.name || `Spot ID: ${spot.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Rating
                </label>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center'
                }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '2rem',
                        cursor: 'pointer',
                        color: star <= rating ? '#ffd740' : 'rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <div style={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  marginTop: '8px'
                }}>
                  {rating}/5 stars
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this parking spot..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddReview(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #ffd740 0%, #ffe082 100%)',
                    color: '#23201d',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Submit Review
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Custom dropdown styling */
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
      `}</style>
      </div>
    </ErrorBoundary>
);
};

export default Reviews; 