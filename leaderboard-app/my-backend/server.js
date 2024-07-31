const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
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
      } else {
        resolve(results);
      }
    });
  });
};

let deletedEntries = []; // In-memory storage for deleted entries

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

// Add new entry to the leaderboard
app.post('/leaderboard', async (req, res) => {
  const { name, text, status } = req.body;
  try {
    const result = await query('INSERT INTO users (name, text, status) VALUES (?, ?, ?)', [name, text, status]);
    const newEntry = { id: result.insertId, name, text, status, date_created: new Date() };
    io.emit('new-entry', newEntry);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error adding new entry:', error);
    res.status(500).json({ error: 'Error adding new entry' });
  }
});

// Update entry by ID
app.put('/leaderboard/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
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
  const id = parseInt(req.params.id, 10);
  try {
    const deletedEntry = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (deletedEntry.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    await query('DELETE FROM users WHERE id = ?', [id]);
    deletedEntries.push({ ...deletedEntry[0], date_deleted: new Date() });
    io.emit('delete-entry', id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Error deleting entry' });
  }
});

// Endpoint to get deleted entries
app.get('/deleted-entries', async (req, res) => {
  console.log('Fetching deleted entries');
  try {
    res.json(deletedEntries); // Use the in-memory storage directly
  } catch (error) {
    console.error('Error fetching deleted entries:', error);
    res.status(500).json({ error: 'Failed to fetch deleted entries' });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('new-entry', (data) => {
    io.emit('new-entry', data);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
