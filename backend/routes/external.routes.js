// Layer 5: External Healthcare Integration API

const express = require('express');
const router = express.Router();
const mockDB = require('../data/mockDatabase');

// HMS API Key from environment variable
const getHMSApiKey = () => process.env.HMS_API_KEY;

// Mock HMS (Hospital Management System) Auth Strategy
const requireHMSAuth = (req, res, next) => {
  const HMS_API_KEY = getHMSApiKey();
  
  // In production, API key is always required
  if (process.env.NODE_ENV === 'production') {
    if (!HMS_API_KEY) {
      return res.status(500).json({ error: "Server configuration error: HMS_API_KEY not set" });
    }
    
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== HMS_API_KEY) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing Hospital Management System credentials." });
    }
  } else {
    // In development, allow bypass only if explicitly configured to do so
    const apiKey = req.headers['x-api-key'];
    if (HMS_API_KEY && apiKey !== HMS_API_KEY) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing Hospital Management System credentials." });
    }
  }
  
  next();
};

// GET /api/external/ehr-data - Mock EHR Gateway Endpoint
router.get('/ehr-data/:patientId', requireHMSAuth, (req, res) => {
  const { patientId } = req.params;
  
  // Simulated external fetch from a massive HL7/FHIR compliant legacy database
  res.json({
    status: "success",
    source: "External EHR System",
    timestamp: new Date().toISOString(),
    data: {
      patientId,
      hl7_code: "M01-12-AE",
      lastVisit: "2026-03-10T14:30:00Z",
      structuredRecordsHash: "f1a2b3c4d5e6f7g8h9i0",
      notes: "Patient data successfully bridged from legacy Epic/Cerner node."
    }
  });
});

// POST /api/external/wearable-stream - IoT Ingestion Endpoint
router.post('/wearable-stream', (req, res) => {
  const { deviceId, metrics } = req.body;
  
  if (!deviceId || !metrics) {
    return res.status(400).json({ error: "Invalid IoT packet structure." });
  }

  // Simulated IoT ingestion queue processing
  console.log(`[IoT INGEST] Stream received from wearable ${deviceId}: HR ${metrics.heartRate} bpm`);
  mockDB.addWearableEvent(deviceId, {
    deviceId,
    metrics,
    timestamp: new Date().toISOString()
  });
  
  res.status(202).json({
    status: "accepted",
    message: "Wearable telemetry ingested for Live Digital Twin Sync."
  });
});

router.get('/wearable-stream/:deviceId', (req, res) => {
  res.json({
    deviceId: req.params.deviceId,
    history: mockDB.getWearableEvents(req.params.deviceId)
  });
});

module.exports = router;
