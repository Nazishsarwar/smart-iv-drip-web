// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// ─── Pre-load all models ───
require('./models/User');
require('./models/Patient');
require('./models/Device');
require('./models/Session');
require('./models/Reading');
require('./models/Alert');
require('./models/Ward');
require('./models/Nurse');

const app = express();
const httpServer = http.createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible throughout the app
app.set('io', io);

// Initialize socket handler
const { initSocket } = require('./sockets/socketHandler');
initSocket(io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart IV Drip API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/devices',  require('./routes/deviceRoutes'));
app.use('/api/readings', require('./routes/readingRoutes'));
app.use('/api/alerts',   require('./routes/alertRoutes'));
app.use('/api/nurses',   require('./routes/nurseRoutes'));
app.use('/api/reports',  require('./routes/reportRoutes'));
app.use('/api/wards', require('./routes/wardRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
