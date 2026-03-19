const express = require('express');
const router = express.Router();
const mockDB = require('../data/mockDatabase');
const { v4: uuidv4 } = require('uuid');
const intakeService = require('../services/intake.service');
const Patient = require('../models/Patient');
const { isMongoReady } = require('../config/mongo');
const { validatePatientId, validatePatientIntake, sanitizeString } = require('../utils/validation');

router.post('/parse-lab', (req, res) => {
  const { rawText } = req.body;
  if (!rawText) return res.status(400).json({ error: 'rawText required' });

  try {
    const parsed = intakeService.parseLabPanel(rawText);
    res.json(parsed);
  } catch (error) {
    console.error('Lab parse error:', error);
    res.status(500).json({ error: 'Failed to parse lab panel.' });
  }
});

router.get('/demo-cases', (req, res) => {
  res.json(intakeService.getDemoCases().map(({ slug, title, disease }) => ({ slug, title, disease })));
});

router.post('/demo-seed/:slug', async (req, res) => {
  const demo = intakeService.getDemoCases().find((item) => item.slug === req.params.slug);
  if (!demo) return res.status(404).json({ error: 'Demo case not found' });

  try {
    const structuredProfile = intakeService.processIntake(demo.payload);
    const newPatient = { id: structuredProfile.patientId, ...structuredProfile };
    mockDB.addPatient(newPatient);

    try {
      if (isMongoReady()) {
        await Patient.create(newPatient);
      }
    } catch (dbErr) {
      console.warn('MongoDB save failed for demo case:', dbErr.message);
    }

    res.status(201).json({
      patientId: newPatient.patientId,
      demo: { slug: demo.slug, title: demo.title, disease: demo.disease },
      message: 'Demo patient seeded successfully',
    });
  } catch (error) {
    console.error('Demo seed error:', error);
    res.status(500).json({ error: 'Failed to seed demo patient.' });
  }
});

// Add new Intake Endpoint
router.post('/intake', async (req, res) => {
  try {
    const rawData = req.body;
    
    // Validate patient intake data
    const intakeValidation = validatePatientIntake(rawData);
    if (!intakeValidation.valid) {
      return res.status(400).json({ error: intakeValidation.error });
    }
    
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
  
  // Validate required fields
  if (!patientData.name || !patientData.age) {
    return res.status(400).json({ error: "Name and age are required" });
  }
  
  // Sanitize name
  const sanitizedName = sanitizeString(patientData.name, 100);
  if (!sanitizedName) {
    return res.status(400).json({ error: "Name is required and must be a valid string" });
  }
  
  // Validate age
  const age = Number(patientData.age);
  if (isNaN(age) || age < 0 || age > 150) {
    return res.status(400).json({ error: "Age must be a number between 0 and 150" });
  }

  const newPatient = {
    id: uuidv4(),
    ...patientData,
    name: sanitizedName,
    age: age,
    createdAt: new Date()
  };

  mockDB.addPatient(newPatient);
  try {
     if (isMongoReady()) {
      await Patient.create(newPatient);
     }
   } catch(e) {
     console.warn('MongoDB save failed for patient:', e.message);
   }
  
  res.status(201).json(newPatient);
});

router.get('/:id', async (req, res) => {
  // Validate patient ID
  const patientIdValidation = validatePatientId(req.params.id);
  if (!patientIdValidation.valid) {
    return res.status(400).json({ error: patientIdValidation.error });
  }

  let patient;
  try {
     if (isMongoReady()) {
     // try Mongo first
      const queryPatient = await Patient.findOne({ patientId: req.params.id });
      // fallback if using generic ID field in some places
      if (queryPatient) patient = queryPatient;
      if (!patient) patient = await Patient.findOne({ id: req.params.id });
     }
  } catch(e) {
    console.warn('MongoDB query failed for patient lookup:', e.message);
  }
  
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
  } catch(e) {
    console.warn('MongoDB query failed for patient list:', e.message);
  }
  
  if (patients.length === 0) patients = mockDB.getAllPatients();
  
  res.json(patients);
});

module.exports = router;
