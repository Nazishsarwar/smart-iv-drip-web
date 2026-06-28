const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const dotenv  = require('dotenv');
const cors    = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

require('./models/User');
require('./models/Patient');
require('./models/Device');
require('./models/Session');
require('./models/Reading');
require('./models/Alert');
require('./models/Ward');
require('./models/Nurse');

const app        = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin:      allowedOrigins,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  transports:   ['polling', 'websocket'],
  allowUpgrades: true,
  pingTimeout:   60000,
  pingInterval:  25000,
});

app.set('io', io);

const { initSocket } = require('./sockets/socketHandler');
initSocket(io);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS blocked: ' + origin));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('/{*path}', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success:           true,
    message:           'Smart IV Drip API is running',
    timestamp:         new Date().toISOString(),
    socketConnections: io.engine.clientsCount,
  });
});

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/devices',  require('./routes/deviceRoutes'));
app.use('/api/readings', require('./routes/readingRoutes'));
app.use('/api/alerts',   require('./routes/alertRoutes'));
app.use('/api/nurses',   require('./routes/nurseRoutes'));
app.use('/api/reports',  require('./routes/reportRoutes'));
app.use('/api/wards',    require('./routes/wardRoutes'));

// ── One-time cleanup route ──────────────────────────────────
app.post('/api/cleanup',
  require('./middleware/authMiddleware').protect,
  async (req, res) => {
    try {
      const Session = require('./models/Session');
      const Patient = require('./models/Patient');
      const Device  = require('./models/Device');

      const activeSessions = await Session.find({ status: 'active' });
      let cleaned = 0;

      for (const session of activeSessions) {
        const patient = await Patient.findOne({
          _id:           session.patient,
          activeSession: session._id,
        });
        if (!patient) {
          await Session.findByIdAndUpdate(session._id, {
            status:    'completed',
            endTime:   new Date(),
            endReason: 'auto-cleanup',
          });
          cleaned++;
        }
      }

      const activeSessionDocs = await Session.find({ status: 'active' })
        .select('device')
        .lean();
      const activeDeviceIds = activeSessionDocs
        .map((s) => s.device)
        .filter(Boolean);

      await Device.updateMany(
        { _id: { $nin: activeDeviceIds } },
        { status: 'idle', assignedPatient: null, assignedSession: null }
      );

      const patientsWithSession = await Patient.find({
        activeSession: { $ne: null },
      }).lean();

      for (const p of patientsWithSession) {
        const session = await Session.findOne({
          _id:    p.activeSession,
          status: 'active',
        });
        if (!session) {
          await Patient.findByIdAndUpdate(p._id, {
            activeSession: null,
            status:        'inactive',
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Cleanup complete. ' + cleaned + ' orphaned sessions ended.',
        cleaned,
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Socket.IO ready — transports: polling + websocket');
  console.log('Allowed origins: ' + allowedOrigins.join(', '));
});
