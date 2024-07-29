import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'adminpassword') {
      navigate('/admin-form');
    } else if (username === 'cs' && password === 'cspassword') {
      navigate('/leaderboard');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="form-title">Sign in to your account</p>
      <div className="input-container">
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <span></span>
      </div>
      <div className="input-container">
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="submit">
        Sign in
      </button>
    </form>
  );
};

export default Login;
