import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import About from './pages/About';
import Register from './components/Register';
import LoginLink from './components/LoginLink';
import LandingPage2 from './components/LandingPage2';
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

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const App = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/landing2' || location.pathname === '/my-spots';
  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login-link" element={<LoginLink />} />
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
    <AuthProvider>
      <App />
    </AuthProvider>
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
