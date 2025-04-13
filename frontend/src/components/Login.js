import React, { useState } from 'react';
import '../styles/login.css';
export default function Login({ onLogin, onSwitch }) {
  const [form, setForm] = useState({ email: '', password: '', role: 'normaluser' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      if (onLogin) onLogin(data.role);
    } else {
      setMessage(data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="heading">Login</h2>
      <input name="email" className='input-field' type="email" onChange={handleChange} placeholder="Email" required />
      <input name="password" className='input-field' type="password" onChange={handleChange} placeholder="Password" required />
      <select name="role"  onChange={handleChange} className='select-field'>
        <option value="normaluser">Normal User</option>
        <option value="storeowner">Store Owner</option>
        <option value="systemadmin">System Admin</option>
      </select>
      <button type="submit" className='login-btn'>Login</button>
      <p className='message'>{message}</p>
      <p>
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="signup-btn">Sign Up</button>
      </p>
    </form>
  );
}
