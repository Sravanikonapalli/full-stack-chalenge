import React, { useState, useEffect } from 'react';
import '../styles/dashboardAdmin.css';

export default function DashboardAdmin({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '' });
  const [filter, setFilter] = useState({ name: '', email: '', address: '', role: '' });
  const [summary, setSummary] = useState({ total_users: 0, total_stores: 0, total_ratings: 0 });

  const backendUrl = 'https://full-stack-chalenge.onrender.com';

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No token found, logging out.");
        onLogout();
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      try {
        const summaryResponse = await fetch(`${backendUrl}/api/admin/summary`, { headers });
        if (!summaryResponse.ok) throw new Error(`Summary fetch failed: ${summaryResponse.statusText}`);
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);

        const userParams = new URLSearchParams(filter).toString();
        const userResponse = await fetch(`${backendUrl}/api/admin/users?${userParams}`, { headers });
        if (!userResponse.ok) throw new Error(`Users fetch failed: ${userResponse.statusText}`);
        const usersData = await userResponse.json();
        setUsers(usersData);

        const storeResponse = await fetch(`${backendUrl}/api/admin/stores`, { headers });
        if (!storeResponse.ok) throw new Error(`Stores fetch failed: ${storeResponse.statusText}`);
        const storesData = await storeResponse.json();
        setStores(storesData);

      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
          onLogout();
        }
      }
    };

    fetchData();
  }, [filter, onLogout]);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    const response = await fetch(`${backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    if (response.ok) {
      alert('User added successfully!');
      setNewUser({ name: '', email: '', password: '', address: '' });
      const usersResponse = await fetch(`${backendUrl}/api/admin/users`);
      const usersData = await usersResponse.json();
      setUsers(usersData);
    } else {
      alert('Error adding user');
    }
  };

  const applyFilters = () => {
    const filteredUsers = users.filter(user => {
      return (
        (filter.name ? user.name.toLowerCase().includes(filter.name.toLowerCase()) : true) &&
        (filter.email ? user.email.toLowerCase().includes(filter.email.toLowerCase()) : true) &&
        (filter.address ? user.address.toLowerCase().includes(filter.address.toLowerCase()) : true) &&
        (filter.role ? user.role.toLowerCase().includes(filter.role.toLowerCase()) : true)
      );
    });

    const filteredStores = stores.filter(store => {
      return (
        (filter.name ? store.name.toLowerCase().includes(filter.name.toLowerCase()) : true) &&
        (filter.email ? store.email.toLowerCase().includes(filter.email.toLowerCase()) : true) &&
        (filter.address ? store.address.toLowerCase().includes(filter.address.toLowerCase()) : true)
      );
    });

    return { filteredUsers, filteredStores };
  };

  const { filteredUsers, filteredStores } = applyFilters();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">System Admin Dashboard</h1>
      <p>Welcome, Admin! You have full control over the system.</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Statistics</h2>
        <ul>
          <li>Total Users: {summary.total_users}</li>
          <li>Total Stores: {summary.total_stores}</li>
          <li>Total Ratings: {summary.total_ratings}</li>
        </ul>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Add New User</h2>
        <form onSubmit={handleAddUser} className="mt-4 space-y-2">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newUser.name}
            onChange={handleUserChange}
            className="p-2 border border-gray-300 rounded w-full"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newUser.email}
            onChange={handleUserChange}
            className="p-2 border border-gray-300 rounded w-full"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={newUser.password}
            onChange={handleUserChange}
            className="p-2 border border-gray-300 rounded w-full"
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={newUser.address}
            onChange={handleUserChange}
            className="p-2 border border-gray-300 rounded w-full"
          />
          <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Add User</button>
        </form>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Filters</h2>
        <div className="space-x-2">
          <input
            type="text"
            placeholder="Filter by Name"
            value={filter.name}
            onChange={(e) => setFilter({ ...filter, name: e.target.value })}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="email"
            placeholder="Filter by Email"
            value={filter.email}
            onChange={(e) => setFilter({ ...filter, email: e.target.value })}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Filter by Address"
            value={filter.address}
            onChange={(e) => setFilter({ ...filter, address: e.target.value })}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Filter by Role"
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Users List</h2>
        <ul>
          {filteredUsers.map(user => (
            <li key={user.id} className="border-b p-2">
              {user.name} ({user.email}) - {user.role} - {user.address}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Stores List</h2>
        <ul>
          {filteredStores.map(store => (
            <li key={store.id} className="border-b p-2">
              {store.name} - {store.email} - {store.address} - Rating: {store.average_rating || 'N/A'}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onLogout} className="mt-6 bg-red-500 text-white px-4 py-2 rounded">Logout</button>
    </div>
  );
}
