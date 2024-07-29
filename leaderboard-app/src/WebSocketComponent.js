import React, { useEffect, useState } from 'react';

const WebSocketComponent = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000');

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      setMessage(event.data);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h2>WebSocket Messages:</h2>
      <pre>{message}</pre>
    </div>
  );
};

export default WebSocketComponent;
