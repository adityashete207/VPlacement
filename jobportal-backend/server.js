// jobportal-backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken'); // Import JWT for token verification

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // NEW
const statsRoutes = require('./routes/statsRoutes'); // public homepage stats
const pool = require('./db');

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.FRONTEND_URL, // e.g., 'http://localhost:5173' from .env
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());

// Ensure the uploads directory exists before anything tries to write to it
// (a fresh git clone won't have this folder, since uploaded files aren't committed).
const resumeUploadDir = path.join(__dirname, 'uploads', 'resumes');
fs.mkdirSync(resumeUploadDir, { recursive: true });

app.set('socketio', io); // Attach io to app.locals for access in routes

pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL database!');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to MySQL:', err.message);
  });

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log(`Socket.IO: User connected: ${socket.id}`);

  const token = socket.handshake.query.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      console.log(`Socket.IO: Authenticated user ${socket.userId} (${socket.userRole}) on socket ${socket.id}.`);

      socket.join(`user-${socket.userId}`);
      socket.join(`role-${socket.userRole}`);

    } catch (err) {
      console.error('Socket.IO: Invalid token in handshake for socket connection. Disconnecting:', err.message);
      socket.disconnect(true);
    }
  } else {
    console.log('Socket.IO: Unauthenticated user connected. Not joining specific rooms.');
  }

  socket.on('authenticate', ({ userId, role }) => {
    if (!socket.userId) {
      socket.userId = userId;
      socket.userRole = role;
      socket.join(`user-${userId}`);
      socket.join(`role-${role}`);
      console.log(`Socket.IO: User ${userId} (${role}) authenticated and joined rooms via event.`);
    } else {
      console.log(`Socket.IO: User ${userId} already authenticated. Not re-joining rooms via 'authenticate' event.`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket.IO: User disconnected: ${socket.id} (User: ${socket.userId || 'N/A'}, Reason: ${reason})`);
  });

  socket.on('error', (err) => {
    console.error('Socket.IO: Socket error on connection:', err.message);
  });
});

// Define your Express API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes); // NEW
app.use('/api/stats', statsRoutes); // public homepage stats

// Simple root route to confirm API is running
app.get('/', (req, res) => {
  res.send('API is running.');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));