import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  
import Signup from './components/Signup';
import Login from './components/Login';
import DashboardRouter from './DashboardRouter';

export default function App() {
  const storedRole = localStorage.getItem('role');
  const storedToken = localStorage.getItem('token');

  const [role, setRole] = useState(storedRole);
  const [token, setToken] = useState(storedToken);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();  

  const handleLogin = (role) => {
    setRole(role);
    setToken(localStorage.getItem('token'));
  };

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setToken(null);
    navigate('/login');  // Redirect to the login page after logout
  };

  return (
    <div className="App p-8">
      {role && token ? (
        <DashboardRouter role={role} onLogout={handleLogout} />
      ) : showLogin ? (
        <Login onLogin={handleLogin} onSwitch={() => setShowLogin(false)} />
      ) : (
        <Signup onSwitch={() => setShowLogin(true)} />
      )}
    </div>
  );
}
