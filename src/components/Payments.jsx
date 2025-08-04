import React, { useEffect, useState, useContext } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { useLocation } from 'react-router-dom';
import { useAuth } from '../main';

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

// Payment Method Component
const PaymentMethodCard = ({ method, isSelected, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(method)}
      style={{
        background: isSelected ? 'rgba(255, 215, 64, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        border: isSelected ? '2px solid #ffd740' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.target.style.background = 'rgba(255, 255, 255, 0.08)';
          e.target.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
          e.target.style.transform = 'translateY(0)';
        }
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          background: '#ffd740',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#23201d'
        }}>
          ✓
        </div>
      )}
      
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: method.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '600',
          color: '#ffffff'
        }}>
          {method.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{
            margin: '0 0 4px 0',
            color: '#ffffff',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            {method.name}
          </h4>
          <p style={{
            margin: '0',
            opacity: '0.7',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            {method.description}
          </p>
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {method.processingTime}
            </span>
            {method.fee && (
              <span style={{
                background: 'rgba(255, 215, 64, 0.2)',
                color: '#ffd740',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Fee: {method.fee}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState('new');
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedInternationalMethod, setSelectedInternationalMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [availableSpots, setAvailableSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const location = useLocation();
  
  // Get user from AuthContext using custom hook
  const { user } = useAuth();

  // Zimbabwe Payment Methods
  const paymentMethods = [
    {
      id: 'ecocash',
      name: 'EcoCash',
      description: 'Zimbabwe\'s most popular mobile money service',
      color: '#22c55e',
      processingTime: 'Instant',
      fee: '2%',
      requiresPhone: true
    },
    {
      id: 'onemoney',
      name: 'OneMoney',
      description: 'NetOne\'s secure mobile money platform',
      color: '#3b82f6',
      processingTime: 'Instant',
      fee: '1.5%',
      requiresPhone: true
    },
    {
      id: 'innbucks',
      name: 'InnBucks',
      description: 'Innscor\'s digital payment solution',
      color: '#8b5cf6',
      processingTime: 'Instant',
      fee: '1%',
      requiresPhone: false
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer to your account',
      color: '#f59e0b',
      processingTime: '1-2 hours',
      fee: 'Free',
      requiresBankAccount: true
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      description: 'Pay in person at the parking location',
      color: '#10b981',
      processingTime: 'Immediate',
      fee: 'Free',
      requiresPhone: false
    }
  ];

  // International Payment Methods
  const internationalPaymentMethods = [
    {
      id: 'zimswitch',
      name: 'ZimSwitch',
      description: 'Zimbabwe\'s national payment switch',
      color: '#ef4444',
      processingTime: 'Instant',
      fee: '1%',
      requiresBankAccount: true
    },
    {
      id: 'posb',
      name: 'POSB',
      description: 'People\'s Own Savings Bank',
      color: '#06b6d4',
      processingTime: 'Instant',
      fee: '0.5%',
      requiresBankAccount: true
    },
    {
      id: 'zimpost',
      name: 'ZimPost',
      description: 'Postal money orders',
      color: '#84cc16',
      processingTime: '1-3 days',
      fee: 'Free',
      requiresPhone: false
    },
    {
      id: 'visa',
      name: 'Visa Card',
      description: 'International Visa card payments',
      color: '#1e40af',
      processingTime: 'Instant',
      fee: '3%',
      requiresPhone: false
    },
    {
      id: 'mastercard',
      name: 'Mastercard',
      description: 'International Mastercard payments',
      color: '#dc2626',
      processingTime: 'Instant',
      fee: '3%',
      requiresPhone: false
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'International PayPal payments',
      color: '#0ea5e9',
      processingTime: 'Instant',
      fee: '3.5%',
      requiresPhone: false
    }
  ];

  const getUserName = async (user) => {
    if (!user) {
      setUserName("");
      return;
    }
    if (user.displayName) {
      setUserName(user.displayName);
    } else if (user.email) {
      setUserName(user.email.split('@')[0]);
    } else {
      setUserName("User");
    }
  };

  const fetchParkingSpotDetails = async (spotId) => {
    try {
      const spotDoc = await getDoc(doc(db, "parkingSpots", spotId));
      if (spotDoc.exists()) {
        return { id: spotDoc.id, ...spotDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching spot details:', error);
      return null;
    }
  };

  const fetchPayments = async (currentUser) => {
    if (!currentUser) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching payments for user:', currentUser.uid);
      
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(paymentsQuery);
      
      const paymentsData = [];
      for (const doc of querySnapshot.docs) {
        const paymentData = { id: doc.id, ...doc.data() };
        
        // Fetch spot details if available
        if (paymentData.spotId) {
          const spotDetails = await fetchParkingSpotDetails(paymentData.spotId);
          if (spotDetails) {
            paymentData.parkingSpot = spotDetails;
          }
        }
        
        paymentsData.push(paymentData);
      }
      
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(`Failed to fetch payments: ${error.message}`);
      setPayments([]);
    }
    setLoading(false);
  };

  const fetchAvailableSpots = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "parkingSpots"));
      const spots = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Filter available spots
      const availableSpots = spots.filter(spot => 
        spot.isAvailable !== false && 
        !spot.isTest && 
        !spot.name?.toLowerCase().includes('test')
      );
      
      setAvailableSpots(availableSpots);
    } catch (error) {
      console.error('Error fetching available spots:', error);
      setAvailableSpots([]);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    // Reset form fields based on payment method
    if (method.requiresPhone) {
      setPhoneNumber("");
    }
    if (method.requiresBankAccount) {
      setBankAccount("");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.uid) {
      alert('Please log in to make a payment.');
      return;
    }

    if (!selectedPaymentMethod && !selectedInternationalMethod) {
      alert('Please select a payment method.');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const currentMethod = selectedPaymentMethod || selectedInternationalMethod;
    
    if (currentMethod.requiresPhone && !phoneNumber.trim()) {
      alert('Please enter your phone number.');
      return;
    }

    if (currentMethod.requiresBankAccount && !bankAccount.trim()) {
      alert('Please enter your bank account details.');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData = {
        userId: user.uid,
        userName: userName || user.email,
        amount: parseFloat(paymentAmount),
        description: paymentDescription || 'Parking Payment',
        paymentMethod: currentMethod.id,
        paymentMethodName: currentMethod.name,
        phoneNumber: phoneNumber,
        bankAccount: bankAccount,
        spotId: selectedSpot?.id,
        spotName: selectedSpot?.name,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      console.log('Creating payment:', paymentData);
      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);
      
      // Simulate payment processing
      setTimeout(() => {
        // Update payment status to completed
        updateDoc(paymentRef, { status: 'completed' });
        
        alert(`Payment of $${paymentAmount} via ${currentMethod.name} completed successfully!`);
        
        // Reset form
        setPaymentAmount("");
        setPaymentDescription("");
        setPhoneNumber("");
        setBankAccount("");
        setSelectedPaymentMethod(null);
        setSelectedInternationalMethod(null);
        setSelectedSpot(null);
        
        // Refresh payments list
        fetchPayments(user);
        
        setIsProcessing(false);
      }, 2000);

    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error creating payment: ' + error.message);
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'rgba(34, 197, 94, 0.2)';
      case 'pending':
        return 'rgba(251, 191, 36, 0.2)';
      case 'failed':
        return 'rgba(239, 68, 68, 0.2)';
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Processing';
    }
  };

  useEffect(() => {
    if (user) {
      getUserName(user);
      fetchPayments(user);
      fetchAvailableSpots();
    } else {
      setPayments([]);
      setLoading(false);
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
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        color: '#ffffff',
        padding: '20px',
        fontFamily: "'Segoe UI', Arial, sans-serif"
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            marginTop: '60px',
            padding: '40px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
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
              background: 'radial-gradient(circle, rgba(255, 215, 64, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{
                color: '#ffffff',
                margin: '0 0 12px 0',
                fontSize: '2.2rem',
                fontWeight: '600',
                letterSpacing: '-0.5px'
              }}>
                Payment Center
              </h1>
              <p style={{
                margin: '0',
                opacity: '0.7',
                fontSize: '1rem',
                fontWeight: '400',
                lineHeight: '1.5'
              }}>
                Secure payment methods for parking services
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: '#ffffff', fontWeight: '500', fontSize: '0.9rem' }}>
                  {payments.length} Transactions
                </span>
              </div>
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <span style={{ color: '#22c55e', fontWeight: '500', fontSize: '0.9rem' }}>
                  ${payments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </header>

                    {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <button
              onClick={() => setActiveTab('new')}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: activeTab === 'new' ? '#ffffff' : 'transparent',
                color: activeTab === 'new' ? '#1a1a1a' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
            >
              New Payment
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: activeTab === 'history' ? '#ffffff' : 'transparent',
                color: activeTab === 'history' ? '#1a1a1a' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
            >
              Payment History
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'new' ? (
            /* New Payment Form */
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '40px',
                  alignItems: 'start'
                }}>
                  {/* Payment Form */}
                  <div>
                    <h3 style={{ 
                      color: '#ffd740', 
                      marginBottom: '24px', 
                      fontSize: '1.8rem', 
                      fontWeight: '600' 
                    }}>
                       Secure Payment
                    </h3>
                    
                    <form onSubmit={handlePaymentSubmit}>
                      {/* Parking Spot Selection */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: '600', 
                          color: '#ffffff',
                          fontSize: '1rem'
                        }}>
                           Parking Spot (Optional)
                        </label>
                        <select
                          value={selectedSpot?.id || ''}
                          onChange={(e) => {
                            const spot = availableSpots.find(s => s.id === e.target.value);
                            setSelectedSpot(spot);
                          }}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                        >
                          <option value="">Select a parking spot (optional)</option>
                          {availableSpots.map(spot => (
                            <option key={spot.id} value={spot.id}>
                              {spot.name} - {spot.address}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: '600', 
                          color: '#ffffff',
                          fontSize: '1rem'
                        }}>
                           Amount (USD)
                        </label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          placeholder="Enter amount in USD"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: '600', 
                          color: '#ffffff',
                          fontSize: '1rem'
                        }}>
                           Description
                        </label>
                        <input
                          type="text"
                          value={paymentDescription}
                          onChange={(e) => setPaymentDescription(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            fontSize: '16px',
                            transition: 'all 0.3s ease'
                          }}
                          placeholder="Payment description"
                        />
                      </div>

                      {/* Payment Methods */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '16px', 
                          fontWeight: '600', 
                          color: '#ffffff',
                          fontSize: '1rem'
                        }}>
                           Payment Method
                        </label>
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {paymentMethods.map(method => (
                            <PaymentMethodCard
                              key={method.id}
                              method={method}
                              isSelected={selectedPaymentMethod?.id === method.id}
                              onSelect={handlePaymentMethodSelect}
                            />
                          ))}
                        </div>
                      </div>

                      {/* International Payment Methods */}
                      <div style={{ marginBottom: '24px', marginTop: '32px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '16px', 
                          fontWeight: '600', 
                          color: '#ffffff',
                          fontSize: '1rem'
                        }}>
                           International Payment Methods
                        </label>
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {internationalPaymentMethods.map(method => (
                            <PaymentMethodCard
                              key={method.id}
                              method={method}
                              isSelected={selectedInternationalMethod?.id === method.id}
                              onSelect={(method) => {
                                setSelectedInternationalMethod(method);
                                setSelectedPaymentMethod(null);
                                if (method.requiresPhone) {
                                  setPhoneNumber("");
                                }
                                if (method.requiresBankAccount) {
                                  setBankAccount("");
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Conditional Fields */}
                      {(selectedPaymentMethod?.requiresPhone || selectedInternationalMethod?.requiresPhone) && (
                        <div style={{ marginBottom: '24px' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            fontWeight: '600', 
                            color: '#ffffff',
                            fontSize: '1rem'
                          }}>
                             Phone Number
                          </label>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: '#ffffff',
                              fontSize: '14px',
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            placeholder="Enter your phone number"
                          />
                        </div>
                      )}

                      {(selectedPaymentMethod?.requiresBankAccount || selectedInternationalMethod?.requiresBankAccount) && (
                        <div style={{ marginBottom: '24px' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            fontWeight: '600', 
                            color: '#ffffff',
                            fontSize: '1rem'
                          }}>
                             Bank Account Details
                          </label>
                          <textarea
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: '#ffffff',
                              fontSize: '14px',
                              transition: 'all 0.2s ease',
                              outline: 'none',
                              minHeight: '80px',
                              resize: 'vertical'
                            }}
                            placeholder="Enter your bank account number and bank name"
                          />
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isProcessing || (!selectedPaymentMethod && !selectedInternationalMethod)}
                        style={{
                          width: '100%',
                          padding: '16px 24px',
                          background: isProcessing || (!selectedPaymentMethod && !selectedInternationalMethod)
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                          color: isProcessing || (!selectedPaymentMethod && !selectedInternationalMethod) ? 'rgba(255, 255, 255, 0.4)' : '#1a1a1a',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '1rem',
                          cursor: isProcessing || (!selectedPaymentMethod && !selectedInternationalMethod) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isProcessing || (!selectedPaymentMethod && !selectedInternationalMethod)
                            ? 'none' 
                            : '0 4px 12px rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isProcessing && (selectedPaymentMethod || selectedInternationalMethod)) {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(255, 255, 255, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isProcessing && (selectedPaymentMethod || selectedInternationalMethod)) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.2)';
                          }
                        }}
                      >
                        {isProcessing ? 'Processing Payment...' : 'Pay Now'}
                      </button>
                    </form>
                  </div>

                  {/* Payment Info */}
                  <div>
                    <h3 style={{ 
                      color: '#ffffff', 
                      marginBottom: '24px', 
                      fontSize: '1.6rem', 
                      fontWeight: '600' 
                    }}>
                       Payment Information
                    </h3>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontWeight: '600' }}>
                         Security Features
                      </h4>
                      <ul style={{ margin: '0', paddingLeft: '20px', opacity: '0.9' }}>
                        <li style={{ marginBottom: '8px' }}>End-to-end encryption</li>
                        <li style={{ marginBottom: '8px' }}>Secure payment processing</li>
                        <li style={{ marginBottom: '8px' }}>Instant confirmation</li>
                        <li style={{ marginBottom: '8px' }}>24/7 transaction monitoring</li>
                      </ul>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontWeight: '600' }}>
                         Zimbabwe Payment Methods
                      </h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {paymentMethods.map(method => (
                          <div key={method.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 0'
                          }}>
                            <span style={{ fontSize: '16px' }}>{method.icon}</span>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{method.name}</span>
                            <span style={{ 
                              fontSize: '12px', 
                              opacity: '0.7',
                              marginLeft: 'auto'
                            }}>
                              {method.processingTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedPaymentMethod && (
                      <div style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#22c55e', fontWeight: '600' }}>
                          ✅ Selected: {selectedPaymentMethod.name}
                        </h4>
                        <div style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          background: 'rgba(34, 197, 94, 0.2)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '600' }}>
                            Processing Time: {selectedPaymentMethod.processingTime}
                          </span>
                          {selectedPaymentMethod.fee !== 'Free' && (
                            <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '600' }}>
                              Fee: {selectedPaymentMethod.fee}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Payment History */
            <div style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
              }}>
                <h3 style={{ color: '#ffd740', margin: '0', fontSize: '1.8rem', fontWeight: '600' }}>
                   Transaction History
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    background: 'rgba(255, 215, 64, 0.1)',
                    padding: '12px 20px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 215, 64, 0.3)'
                  }}>
                    <span style={{ color: '#ffd740', fontWeight: '600' }}>
                      Total: ${payments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255, 215, 64, 0.3)',
                    borderTop: '3px solid #ffd740',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                  }} />
                  <div style={{ color: '#ffd740', fontSize: '1.1rem', fontWeight: '600' }}>
                    Loading transactions...
                  </div>
                </div>
              ) : error ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '24px',
                  color: '#fa755a',
                  background: 'rgba(250, 117, 90, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(250, 117, 90, 0.3)'
                }}>
                  {error}
                </div>
              ) : payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', opacity: '0.7' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}> </div>
                  <div style={{ fontSize: '1.3rem', marginBottom: '8px', fontWeight: '600' }}>
                    No transactions yet
                  </div>
                  <p style={{ opacity: '0.8' }}>
                    Your payment history will appear here once you make your first payment
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {payments.map((payment, index) => (
                    <div key={payment.id} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: getStatusColor(payment.status),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          color: '#ffffff',
                          fontWeight: 'bold'
                        }}>
                          {payment.status === 'completed' ? '✅' : 
                           payment.status === 'pending' ? '⏳' : 
                           payment.status === 'failed' ? '❌' : 
                           user?.displayName ? user.displayName.charAt(0).toUpperCase() :
                           user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '1.1rem' }}>
                            ${payment.amount?.toFixed(2) || '0.00'}
                          </div>
                          <div style={{ opacity: '0.7', fontSize: '14px' }}>
                            {payment.description || `${user?.displayName || user?.email?.split('@')[0] || 'User'}'s Parking Payment`}
                          </div>
                          {payment.parkingSpot && (
                            <div style={{ opacity: '0.6', fontSize: '12px', marginTop: '4px' }}>
                              📍 {payment.parkingSpot.name || payment.parkingSpot.address}
                            </div>
                          )}
                          <div style={{ opacity: '0.6', fontSize: '12px', marginTop: '4px' }}>
                             {payment.paymentMethodName || 'Mobile Payment'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: getStatusColor(payment.status),
                          color: '#ffffff',
                          marginBottom: '8px'
                        }}>
                          {getStatusText(payment.status)}
                        </div>
                        <div style={{ opacity: '0.6', fontSize: '12px' }}>
                          {payment.createdAt?.toDate?.() ? 
                            payment.createdAt.toDate().toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 
                            'Recent'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Payments; 