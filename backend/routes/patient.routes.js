const express = require('express');
const router = express.Router();
const mockDB = require('../data/mockDatabase');
const { v4: uuidv4 } = require('uuid');
const intakeService = require('../services/intake.service');
const Patient = require('../models/Patient');
const { isMongoReady } = require('../config/mongo');

// Add new Intake Endpoint
router.post('/intake', async (req, res) => {
  try {
    const rawData = req.body;
    
    // Process and normalize data via business logic
    const structuredProfile = intakeService.processIntake(rawData);
    
    // Store in our mock database under the generated generic interface ID
    const newPatient = {
      id: structuredProfile.patientId, // for old compatibility
      ...structuredProfile
    };
    
    // Save to Mock DB for legacy
    mockDB.addPatient(newPatient);
    
    // Save to MongoDB
    try {
      if (isMongoReady()) {
      await Patient.create(newPatient);
      }
    } catch (dbErr) {
      console.warn("MongoDB save failed, relying on mockDB:", dbErr.message);
    }
    
    // We send back exactly what is required for the Next Layer
    res.status(201).json({
      patientId: newPatient.patientId,
      baselineHealthIndex: newPatient.metrics.baselineHealthIndex,
      riskScore: newPatient.metrics.riskScore,
      diseaseProbability: newPatient.metrics.diseaseProbability,
      profile: newPatient.profile,
      message: "Digital Health Profile Successfully Created"
    });
  } catch (error) {
    console.error("Intake Error:", error);
    res.status(500).json({ error: "Failed to process patient intake" });
  }
});

router.post('/', async (req, res) => {
  const patientData = req.body;
  if (!patientData.name || !patientData.age) {
    return res.status(400).json({ error: "Name and age are required" });
  }

  const newPatient = {
    id: uuidv4(),
    ...patientData,
    createdAt: new Date()
  };

  mockDB.addPatient(newPatient);
  try {
     if (isMongoReady()) {
      await Patient.create(newPatient);
     }
   } catch(e) {}
  
  res.status(201).json(newPatient);
});

router.get('/:id', async (req, res) => {
  let patient;
  try {
     if (isMongoReady()) {
     // try Mongo first
      const queryPatient = await Patient.findOne({ patientId: req.params.id });
      // fallback if using generic ID field in some places
      if (queryPatient) patient = queryPatient;
      if (!patient) patient = await Patient.findOne({ id: req.params.id });
     }
  } catch(e) {}
  
  if (!patient) {
     patient = mockDB.getPatient(req.params.id);
  }
  
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  res.json(patient);
});

router.get('/', async (req, res) => {
  let patients = [];
  try {
     if (isMongoReady()) {
      patients = await Patient.find({});
     }
  } catch(e) {}
  
  if (patients.length === 0) patients = mockDB.getAllPatients();
  
  res.json(patients);
});

module.exports = router;
