import React, { useEffect, useState, useContext } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../main';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe (replace with your actual publishable key)
const stripePromise = loadStripe('pk_test_your_stripe_publishable_key_here');

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

// Stripe Payment Form Component
const StripePaymentForm = ({ amount, description, onSuccess, onError, parkingSpotId, ownerId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent on your backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          description: description,
          parkingSpotId: parkingSpotId,
          ownerId: ownerId
        }),
      });

      const { clientSecret, paymentIntentId } = await response.json();

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Parking Payment',
          },
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        onError(stripeError.message);
      } else {
        // Payment successful - update database
        await updatePaymentRecord(paymentIntentId, paymentIntent);
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const updatePaymentRecord = async (paymentIntentId, paymentIntent) => {
    try {
      const paymentData = {
        paymentIntentId: paymentIntentId,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
        currency: paymentIntent.currency,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Add parking spot and owner info
        parkingSpotId: parkingSpotId,
        ownerId: ownerId,
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.email
      };

      await addDoc(collection(db, 'payments'), paymentData);
      
      // Update parking spot availability
      await updateParkingSpotAvailability(parkingSpotId);
      
      // Process owner payout
      await processOwnerPayout(ownerId, paymentIntent.amount / 100, parkingSpotId);
      
    } catch (error) {
      console.error('Error updating payment record:', error);
      throw error;
    }
  };

  const updateParkingSpotAvailability = async (spotId) => {
    try {
      const spotRef = doc(db, 'parkingSpots', spotId);
      await updateDoc(spotRef, {
        availability: false,
        lastBooked: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating parking spot:', error);
    }
  };

  const processOwnerPayout = async (ownerId, amount, spotId) => {
    try {
      // Calculate platform fee (e.g., 10%)
      const platformFee = amount * 0.10;
      const ownerAmount = amount - platformFee;

      // Create payout record
      const payoutData = {
        ownerId: ownerId,
        spotId: spotId,
        totalAmount: amount,
        platformFee: platformFee,
        ownerAmount: ownerAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
        processedAt: null
      };

      await addDoc(collection(db, 'payouts'), payoutData);

      // In a real implementation, you would:
      // 1. Use Stripe Connect to transfer money to owner's account
      // 2. Handle different payout methods (bank transfer, mobile money, etc.)
      // 3. Implement automatic payout scheduling
      
      console.log(`Payout scheduled: $${ownerAmount} to owner ${ownerId}`);
      
    } catch (error) {
      console.error('Error processing payout:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        marginBottom: '20px'
      }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#aab7c4',
                },
                backgroundColor: 'transparent',
              },
              invalid: {
                color: '#fa755a',
                iconColor: '#fa755a',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div style={{
          color: '#fa755a',
          marginBottom: '16px',
          padding: '12px',
          background: 'rgba(250, 117, 90, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(250, 117, 90, 0.3)'
        }}>
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: '100%',
          padding: '16px',
          background: processing ? '#666' : '#ffd740',
          color: processing ? '#ccc' : '#23201d',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: processing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        {processing ? 'Processing Payment...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [parkingSpots, setParkingSpots] = useState({});
  const [selectedSpot, setSelectedSpot] = useState(null);
  const location = useLocation();
  
  // Get user from AuthContext
  const { user } = useContext(AuthContext);

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
    } catch (error) {
      console.error('Error fetching parking spot:', error);
    }
    return null;
  };

  const fetchPayments = async (currentUser) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'payments'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const paymentsData = [];
      
      for (const doc of querySnapshot.docs) {
        const payment = { id: doc.id, ...doc.data() };
        
        // Fetch parking spot details if available
        if (payment.parkingSpotId) {
          const spotDetails = await fetchParkingSpotDetails(payment.parkingSpotId);
          if (spotDetails) {
            payment.parkingSpot = spotDetails;
          }
        }
        
        paymentsData.push(payment);
      }
      
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntent) => {
    alert('Payment successful! Your parking spot has been booked.');
    setShowPaymentForm(false);
    setSelectedSpot(null);
    setPaymentAmount("");
    setPaymentDescription("");
    fetchPayments(user);
  };

  const handlePaymentError = (error) => {
    alert('Payment failed: ' + error);
  };

  const handleSpotSelection = (spot) => {
    setSelectedSpot(spot);
    setPaymentAmount(spot.price || 0);
    setPaymentDescription(`Parking at ${spot.name || spot.address}`);
    setShowPaymentForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded': return '#4caf50';
      case 'processing': return '#ff9800';
      case 'requires_payment_method': return '#f44336';
      case 'canceled': return '#9e9e9e';
      default: return '#ffd740';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'succeeded': return 'Successful';
      case 'processing': return 'Processing';
      case 'requires_payment_method': return 'Failed';
      case 'canceled': return 'Canceled';
      default: return 'Unknown';
    }
  };

  useEffect(() => {
    if (user) {
      fetchPayments(user);
    }
  }, [user]);

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
          <p>You need to be logged in to view your payments.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
                Payment Center
              </h1>
              <p style={{ margin: '0', opacity: '0.8' }}>
                Manage your parking payments and transactions
              </p>
            </div>
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              style={{
                background: '#ffd740',
                color: '#23201d',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showPaymentForm ? 'Cancel' : 'New Payment'}
            </button>
          </header>

          {/* Payment Form */}
          {showPaymentForm && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ color: '#ffd740', marginBottom: '20px' }}>
                Secure Payment
              </h3>
              
              {selectedSpot ? (
                <div style={{
                  background: 'rgba(255, 215, 64, 0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid rgba(255, 215, 64, 0.3)'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#ffd740' }}>
                    {selectedSpot.name || 'Selected Parking Spot'}
                  </h4>
                  <p style={{ margin: '0', opacity: '0.8' }}>
                    {selectedSpot.address}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontWeight: '600' }}>
                    Amount: ${selectedSpot.price || 0}
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      fontSize: '16px'
                    }}
                    placeholder="Enter amount"
                  />
                </div>
              )}

              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  amount={parseFloat(paymentAmount) || 0}
                  description={paymentDescription}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  parkingSpotId={selectedSpot?.id}
                  ownerId={selectedSpot?.ownerId}
                />
              </Elements>
            </div>
          )}

          {/* Payment History */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#ffd740', marginBottom: '20px' }}>
              Payment History
            </h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ color: '#ffd740', fontSize: '1.2rem' }}>Loading payments...</div>
              </div>
            ) : error ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                color: '#fa755a',
                background: 'rgba(250, 117, 90, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(250, 117, 90, 0.3)'
              }}>
                {error}
              </div>
            ) : payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: '0.7' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No payments yet</div>
                <p>Your payment history will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {payments.map((payment) => (
                  <div key={payment.id} style={{
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
                        ${payment.amount?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ opacity: '0.7', fontSize: '14px' }}>
                        {payment.description || 'Parking Payment'}
                      </div>
                      {payment.parkingSpot && (
                        <div style={{ opacity: '0.6', fontSize: '12px', marginTop: '4px' }}>
                          {payment.parkingSpot.name || payment.parkingSpot.address}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(payment.status),
                        color: '#ffffff'
                      }}>
                        {getStatusText(payment.status)}
                      </div>
                      <div style={{ opacity: '0.6', fontSize: '12px', marginTop: '4px' }}>
                        {payment.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Payments; 