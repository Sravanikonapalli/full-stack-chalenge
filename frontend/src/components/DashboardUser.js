import React, { useState, useEffect } from 'react';
import '../styles/dashboardUser.css';
export default function DashboardUser({ onLogout }) {
  const [stores, setStores] = useState([]); 
  const [userRatings, setUserRatings] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch store data
  useEffect(() => {
    const fetchStores = async () => {
      const token = localStorage.getItem('token'); // Get token
       if (!token) {
          console.error("No token found, logging out.");
          onLogout();
          return;
       }
       const headers = {
          'Authorization': `Bearer ${token}`,
       };
  
      try {
        const response = await fetch('https://full-stack-chalenge.onrender.com/api/user/stores', { headers }); 
        if (!response.ok) throw new Error(`Store fetch failed: ${response.statusText}`);
  
        const data = await response.json();
        // The /api/user/stores route returns the array directly, not nested in { stores: [...] }
        if (Array.isArray(data)) {
          setStores(data);
          // Initialize userRatings based on fetched data
          const initialRatings = {};
          data.forEach(store => {
              if (store.user_rating !== null) {
                  initialRatings[store.id] = store.user_rating;
              }
          });
          setUserRatings(initialRatings);
        } else {
          console.error('Stores data is not an array:', data);
          setStores([]);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        setStores([]);
      }
    };
  
    fetchStores();
  }, []);

  const handleRatingSubmit = async (storeId, rating) => {
    try {
      const response = await fetch(`https://full-stack-chalenge.onrender.com/api/ratings/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        setUserRatings((prevRatings) => ({
          ...prevRatings,
          [storeId]: rating,
        }));
      } else {
        alert('Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

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
      alert('Failed to update password');
    }
  };

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">User Dashboard</h1>
      <p>Welcome, user! You can browse and rate stores here.</p>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search stores by name or address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Store Listings</h2>
        <ul>
          {filteredStores.length > 0 ? (
            filteredStores.map((store) => (
              <li key={store.id} className="border-b p-4">
                <h3 className="text-lg font-semibold">{store.name}</h3>
                <p>{store.email}</p>
                <p>{store.address}</p>
                <p><strong>Overall Rating:</strong> {store.averageRating || 'N/A'}</p>
                <p>
                  <strong>Your Rating:</strong>{' '}
                  {userRatings[store.id] || 'Not rated yet'}
                </p>
                {userRatings[store.id] ? (
                  <button
                    onClick={() => handleRatingSubmit(store.id, userRatings[store.id])}
                    className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded"
                  >
                    Modify Rating
                  </button>
                ) : (
                  <button
                    onClick={() => handleRatingSubmit(store.id, 5)} 
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Submit Rating
                  </button>
                )}
              </li>
            ))
          ) : (
            <p>No stores found.</p>
          )}
        </ul>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Change Password</h2>
        {passwordChangeSuccess && <p className="text-green-500">Password updated successfully!</p>}
        <form onSubmit={handlePasswordChange}>
          <div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Change Password</button>
        </form>
      </div>

      <button onClick={onLogout} className="mt-6 bg-red-500 text-white px-4 py-2 rounded">Logout</button>
    </div>
  );
}
