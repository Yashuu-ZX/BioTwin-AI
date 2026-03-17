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
app.use(cors());
app.use(express.json());

// Routes
const patientRoutes = require('./routes/patient.routes');
const simulationRoutes = require('./routes/simulation.routes');

app.use('/api/patient', patientRoutes);
app.use('/api', simulationRoutes); // /api/simulate and /api/predict

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: "BioTwin AI API is running properly." });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BioTwin API Mock Server running on port ${PORT}`);
});
