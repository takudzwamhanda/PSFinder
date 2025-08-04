import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import "./Login.css";

const UserCleanup = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users from Firestore (if you store user data there)
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = [];
      
      usersSnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUserData = async (userId) => {
    try {
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // Also delete related data (bookings, payments, etc.)
      const collections = ['bookings', 'payments', 'parkingSpots'];
      
      for (const collectionName of collections) {
        const collectionRef = collection(db, collectionName);
        const querySnapshot = await getDocs(collectionRef);
        
        querySnapshot.forEach(async (document) => {
          const data = document.data();
          if (data.userId === userId || data.ownerId === userId) {
            await deleteDoc(doc(db, collectionName, document.id));
          }
        });
      }
      
      setMessage(`User ${userId} and all related data deleted successfully`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Error deleting user data');
    }
  };

  const clearAllUsers = async () => {
    if (!window.confirm('Are you sure you want to delete ALL users? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setMessage('Deleting all users...');
      
      for (const user of users) {
        await deleteUserData(user.id);
      }
      
      setMessage('All users deleted successfully');
      setUsers([]);
    } catch (error) {
      console.error('Error clearing users:', error);
      setMessage('Error clearing users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-logo">P</div>
        <div style={{ textAlign: 'center', color: '#ffd740' }}>
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
          <div>Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-logo">P</div>
      <h2 className="login-title">User Cleanup</h2>
      
      <div style={{
        background: 'rgba(255, 215, 64, 0.1)',
        border: '1px solid rgba(255, 215, 64, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#ffd740' }}>
          ⚠️ Admin Only
        </div>
        <div style={{ opacity: '0.8', fontSize: '14px' }}>
          This will delete user accounts and all related data.
          <br />
          This action cannot be undone.
        </div>
      </div>

      {message && (
        <div style={{
          color: message.includes('Error') ? '#ffd740' : '#4caf50',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          className="login-btn"
          onClick={clearAllUsers}
          style={{
            background: '#f44336',
            marginBottom: '12px'
          }}
        >
          Delete All Users ({users.length})
        </button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {users.map((user) => (
          <div key={user.id} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: '600' }}>
                {user.email || user.displayName || 'Unknown User'}
              </div>
              <div style={{ fontSize: '12px', opacity: '0.7' }}>
                ID: {user.id}
              </div>
            </div>
            <button
              onClick={() => deleteUserData(user.id)}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div style={{ textAlign: 'center', opacity: '0.7', marginTop: '20px' }}>
          No users found
        </div>
      )}
    </div>
  );
};

export default UserCleanup; 