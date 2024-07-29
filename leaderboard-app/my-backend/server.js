const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
})); // Enable CORS for all routes
app.use(express.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'passw0rd',
  database: 'noc_leaderboard'
});

// Function to execute a query
const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        console.error('Database query error:', error);
        reject(error);
      }
      resolve(results);
    });
  });
};

// Serve an HTML file or basic response at the root URL
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the server!</h1>');
});

// Get leaderboard data
app.get('/leaderboard', async (req, res) => {
  try {
    const results = await query('SELECT * FROM users ORDER BY id DESC');
    res.json(results);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ error: 'Error fetching leaderboard data' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);

    if (user.length > 0) {
      res.json({ success: true, user: user[0] });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// Add new entry to the leaderboard
app.post('/leaderboard', async (req, res) => {
  console.log('Request body:', req.body);
  const { id, name, text, status } = req.body;
  try {
    const result = await query('INSERT INTO users (id, name, text, status) VALUES (?, ?, ?, ?)', [id, name, text, status]);
    const newEntry = { id: result.insertId, name, text, status };

    // Emit the new entry to all connected clients
    io.emit('new-entry', newEntry);

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error adding new entry:', error);
    res.status(500).json({ error: 'Error adding new entry' });
  }
});

// Update entry by ID
app.put('/leaderboard/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10); // Ensure id is a number
  const { name, text, status } = req.body;

  try {
    const result = await query('UPDATE users SET name = ?, text = ?, status = ? WHERE id = ?', [name, text, status, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const updatedEntry = { id, name, text, status };
    io.emit('update-entry', updatedEntry);

    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Error updating entry' });
  }
});

// Delete an entry from the leaderboard
app.delete('/leaderboard/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Received DELETE request for id:', id);

  try {
    const result = await query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    io.emit('delete-entry', id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Error deleting entry' });
  }
});

// Start the HTTP server
const server = http.createServer(app);

// Set up WebSocket server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('new-entry', (data) => {
    io.emit('new-entry', data);  // Emit to all connected clients
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
