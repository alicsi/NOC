import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
  
    const adminUsername = process.env.REACT_APP_ADMIN_USERNAME;
    const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD;
    const csUsername = process.env.REACT_APP_CS_USERNAME;
    const csPassword = process.env.REACT_APP_CS_PASSWORD;
  
    console.log('Admin Username:', adminUsername);
    console.log('Admin Password:', adminPassword);
    console.log('CS Username:', csUsername);
    console.log('CS Password:', csPassword);
  
    if (username === adminUsername && password === adminPassword) {
      navigate('/admin-form');
    } else if (username === csUsername && password === csPassword) {
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
