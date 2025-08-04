import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import LogoOnlyNavbar from './components/LogoOnlyNavbar';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import About from './pages/About';
import Register from './components/Register';
import LoginLink from './components/LoginLink';
import LandingPage2 from './components/LandingPage2';
import EmailVerification from './components/EmailVerification';
import UserCleanup from './components/UserCleanup';
import FirebaseConfigCheck from './components/FirebaseConfigCheck';
import MySpots from './components/MySpots';
import BottomNavOnly from './components/BottomNavOnly';
import MyBookings from './components/MyBookings';
import Payments from './components/Payments';
import Reviews from './components/Reviews';
import Profile from './components/Profile';
import AddSpotForm from './components/AddSpotForm';
import DuplicateRemover from './components/DuplicateRemover';
import OwnerDashboard from './components/OwnerDashboard';
import './index.css';

// Create Auth Context
export const AuthContext = React.createContext();

// Custom hook for safe auth context usage
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Error Boundary for Auth Context
class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: '#ffffff',
          fontFamily: "'Segoe UI', Arial, sans-serif"
        }}>
          <h2 style={{ color: '#ffd740', marginBottom: '20px' }}>Authentication Error</h2>
          <p style={{ marginBottom: '20px' }}>There was an issue with authentication. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#ffd740',
              color: '#23201d',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
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

// Protected Route Component for Admin Features
const ProtectedAdminRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  
  // List of admin email addresses (you can modify this)
  const adminEmails = [
    'admin@psfinder.com',
    'owner@psfinder.com',
    // Add more admin emails as needed
  ];
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!adminEmails.includes(user.email)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff',
        fontFamily: "'Segoe UI', Arial, sans-serif"
      }}>
        <h2 style={{ color: '#ffd740', marginBottom: '20px' }}>Access Denied</h2>
        <p style={{ marginBottom: '20px', textAlign: 'center' }}>
          This feature is only available to administrators.
        </p>
        <button 
          onClick={() => window.history.back()}
          style={{
            background: '#ffd740',
            color: '#23201d',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return children;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Create a stable context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    loading,
    initialized
  }), [user, loading, initialized]);

  // Show loading screen while auth is initializing
  if (loading || !initialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff',
        fontFamily: "'Segoe UI', Arial, sans-serif"
      }}>
        <h2 style={{ color: '#ffd740', marginBottom: '20px' }}>Loading...</h2>
        <p>Please wait while we initialize the application.</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

const App = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/landing2' || 
                   location.pathname.startsWith('/my-spots') || 
                   location.pathname.startsWith('/my-bookings') || 
                   location.pathname.startsWith('/payments') || 
                   location.pathname.startsWith('/reviews') || 
                   location.pathname.startsWith('/profile');
  
  const showLogoOnlyNavbar = location.pathname.startsWith('/my-spots') || 
                             location.pathname.startsWith('/my-bookings') || 
                             location.pathname.startsWith('/payments') || 
                             location.pathname.startsWith('/reviews') || 
                             location.pathname.startsWith('/profile');
  
  return (
    <>
      {!hideNavbar && <Navbar />}
      {showLogoOnlyNavbar && <LogoOnlyNavbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login-link" element={<LoginLink />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/user-cleanup" element={<UserCleanup />} />
        <Route path="/firebase-check" element={<FirebaseConfigCheck />} />
        <Route path="/landing2" element={<LandingPage2 />} />
        <Route path="/my-spots" element={<MySpots />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add-spot" element={
          <ProtectedAdminRoute>
            <AddSpotForm />
          </ProtectedAdminRoute>
        } />
        <Route path="/duplicate-remover" element={
          <ProtectedAdminRoute>
            <DuplicateRemover />
          </ProtectedAdminRoute>
        } />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/bottom-nav" element={<BottomNavOnly />} />
      </Routes>
    </>
  );
};

const Root = () => (
  <BrowserRouter>
    <AuthErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AuthErrorBoundary>
  </BrowserRouter>
);

// Create root only once
const container = document.getElementById('root');
if (!container._reactRootContainer) {
  const root = ReactDOM.createRoot(container);
  container._reactRootContainer = root;
  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}
