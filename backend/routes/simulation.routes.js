const express = require('express');
const router = express.Router();
const mockDB = require('../data/mockDatabase');
const digitalTwinService = require('../services/digitalTwin.service');
const Patient = require('../models/Patient');
const { isMongoReady } = require('../config/mongo');
const { validatePatientId, validateTreatmentPlan } = require('../utils/validation');

const getPatientRecord = async (patientId) => {
  let patient = null;

  try {
    if (isMongoReady()) {
      patient = await Patient.findOne({ patientId }) || await Patient.findOne({ id: patientId });
    }
  } catch (error) {
    patient = null;
  }

  return patient || mockDB.getPatient(patientId);
};

router.post('/simulate', async (req, res) => {
  const { patientId, treatmentPlan } = req.body;

  // Validate patient ID
  const patientIdValidation = validatePatientId(patientId);
  if (!patientIdValidation.valid) {
    return res.status(400).json({ error: patientIdValidation.error });
  }

  // Validate treatment plan
  const treatmentValidation = validateTreatmentPlan(treatmentPlan);
  if (!treatmentValidation.valid) {
    return res.status(400).json({ error: treatmentValidation.error });
  }
  const sanitizedTreatmentPlan = treatmentValidation.sanitized;

  const patient = await getPatientRecord(patientId);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // Simulate delay to make it feel like AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  const simulationResult = digitalTwinService.runFullSimulation(patient, sanitizedTreatmentPlan);
  mockDB.addSimulation(patientId, {
    patientId,
    treatmentPlan: sanitizedTreatmentPlan,
    ...simulationResult,
    timestamp: new Date().toISOString()
  });

  res.json({
    patientId,
    treatmentPlan: sanitizedTreatmentPlan,
    ...simulationResult,
    timestamp: new Date()
  });
});

router.get('/simulate/:patientId/history', async (req, res) => {
  // Validate patient ID from URL params
  const patientIdValidation = validatePatientId(req.params.patientId);
  if (!patientIdValidation.valid) {
    return res.status(400).json({ error: patientIdValidation.error });
  }

  const patient = await getPatientRecord(req.params.patientId);

  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  res.json({
    patientId: req.params.patientId,
    history: mockDB.getSimulations(req.params.patientId)
  });
});

router.post('/predict', async (req, res) => {
  const { patientData } = req.body;
  if (!patientData) {
    return res.status(400).json({ error: "patientData is required" });
  }

  // Validate age if provided
  if (patientData.age !== undefined) {
    const age = Number(patientData.age);
    if (isNaN(age) || age < 0 || age > 150) {
      return res.status(400).json({ error: "Age must be a number between 0 and 150" });
    }
    patientData.age = age;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Predict health trajectory without specific treatment
  const riskScore = Math.min(99, Math.max(5, (patientData.age - 30) * 0.5 + Math.random() * 20));

  res.json({
    baseRiskScore: riskScore.toFixed(2),
    recommendedAction: riskScore > 50 ? "Intervention Required" : "Monitor Vitals"
  });
});

router.get('/predict/:patientId', async (req, res) => {
  // Validate patient ID from URL params
  const patientIdValidation = validatePatientId(req.params.patientId);
  if (!patientIdValidation.valid) {
    return res.status(400).json({ error: patientIdValidation.error });
  }

  const patient = await getPatientRecord(req.params.patientId);

  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const twin = digitalTwinService.createDigitalTwin(patient);
  res.json({
    patientId: req.params.patientId,
    baseRiskScore: (twin.riskScore * 100).toFixed(2),
    riskLevel: twin.riskLevel,
    diseaseState: twin.diseaseState,
    recommendedAction: twin.riskLevel === 'High' ? 'Immediate personalized intervention' : twin.riskLevel === 'Medium' ? 'Run comparative treatment simulation' : 'Continue monitoring and preventive plan'
  });
});

module.exports = router;
