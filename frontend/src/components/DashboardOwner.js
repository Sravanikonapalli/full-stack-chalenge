import React, { useState, useEffect } from 'react';
import '../styles/dashboardOwner.css';
export default function DashboardOwner({ onLogout }) {
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const storeResponse = await fetch('https://full-stack-chalenge.onrender.com/api/store/my-store', {
          headers: {
            // Sends the authentication token to identify the store owner
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const storeData = await storeResponse.json();

        if (storeData.store) {
          setStore(storeData.store); 
          setRatings(storeData.ratings); 
          setAverageRating(storeData.average); 
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
      }
    };

    fetchStoreData();
  }, []); 

  // Handles the password change form submission
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeSuccess(false);

    try {
        const response = await fetch('https://full-stack-chalenge.onrender.com/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ newPassword }),
        });

        if (response.ok) {
        setPasswordChangeSuccess(true); 
        setNewPassword(''); 
        } else {
        const errorData = await response.json(); 
        alert(`Failed to update password: ${errorData.message || 'Server error'}`);
        }
    } catch (error) {
        console.error("Password change error:", error);
        alert('An error occurred while changing the password.');
    }
  };

  return (
    <div className="owner-con"> 
      <div className="header-con">
          <h1 className="text-2xl font-bold">Store Owner Dashboard</h1>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-150 ease-in-out">Logout</button>
      </div>
      <p className="mb-6">Welcome, Store Owner! Manage your store and reviews here.</p>

      {store ? (
        <div className="mb-6 p-4 border rounded shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-2">Your Store Details</h2>
          <p><strong>Name:</strong> {store.name}</p>
          <p><strong>Email:</strong> {store.email || 'N/A'}</p>
          <p><strong>Address:</strong> {store.address || 'N/A'}</p>
        </div>
      ) : (
          <p>Loading store details...</p>
      )}

      {/* Section: Ratings List */}
      <div className="mb-6 p-4 border rounded shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-2">Ratings Received</h2>
        {ratings.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {ratings.map((rating, index) => ( 
              <li key={rating.id || index} className="border-b last:border-b-0 py-1">
                <strong>{rating.username}</strong> gave a rating of: <strong>{rating.rating}</strong>/5
              </li>
            ))}
          </ul>
        ) : (
          <p>No users have rated your store yet.</p>
        )}
      </div>

      {/* Section: Change Password */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-3">Change Your Password</h2>
        {passwordChangeSuccess && <p className="sucess-msg">Password updated successfully!</p>}
        <form onSubmit={handlePasswordChange}>
          <div className="mb-3">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password:</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter New Password"
              required 
              className="changepass-field"
            />
          </div>
          <button type="submit" className="btn">Change Password</button>
        </form>
      </div>
    </div>
  );
}