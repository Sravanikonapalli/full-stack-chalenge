import React, { useState } from 'react';
import '../styles/login.css';
export default function Signup({ onSwitch }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'normaluser',
    address: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('https://full-stack-chalenge.onrender.com/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="heading">Sign Up</h2>
      <input name="username" className='input-field' onChange={handleChange} placeholder="Username" required />
      <input name="email" className='input-field' type="email" onChange={handleChange} placeholder="Email" required />
      <input name="password" className='input-field' type="password" onChange={handleChange} placeholder="Password" required />
      <input name="address" className='input-field' onChange={handleChange} placeholder="Address" required />
      <select name="role" onChange={handleChange} className='select-field'>
        <option value="normaluser">Normal User</option>
        <option value="storeowner">Store Owner</option>
        <option value="systemadmin">System Admin</option>
      </select>
      <button type="submit" className='login-btn'>Register</button>
      <p className='message sucess-message'>{message}</p>
      <p>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="signup-btn">Login</button>
      </p>
    </form>
  );
}
