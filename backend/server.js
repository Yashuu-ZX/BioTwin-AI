const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

// ==========================================
// LAYER 5: Security & Performance Middleware
// ==========================================
app.use(helmet()); 
app.use(compression()); 
app.use(morgan(':date[iso] | :method :url | Status: :status | RespTime: :response-time ms'));

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Strict Limit Exceeded: Wait 60s before transmitting more data." }
});
app.use('/api', apiLimiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://biotwin-azure.com', 'https://hospital-intranet.gov'] : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Routes
const patientRoutes = require('./routes/patient.routes');
const simulationRoutes = require('./routes/simulation.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const externalRoutes = require('./routes/external.routes');
const explainRoutes = require('./routes/explain.routes');

app.use('/api/patient', patientRoutes);
app.use('/api', simulationRoutes); // /api/simulate and /api/predict
app.use('/api/learning', feedbackRoutes); // Layer 4 API
app.use('/api/external', externalRoutes); // Layer 5 API
app.use('/api/explain', explainRoutes); // Layer 6 Advanced Intelligence & XAI

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: "BioTwin AI API is running properly." });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BioTwin API Mock Server running on port ${PORT}`);
});
