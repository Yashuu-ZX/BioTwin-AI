const express = require('express');
const router = express.Router();
const mockDB = require('../data/mockDatabase');
const aiMockService = require('../services/aiMock.service');

router.post('/simulate', async (req, res) => {
  const { patientId, treatmentOption, dosage, duration } = req.body;

  if (!patientId || !treatmentOption) {
    return res.status(400).json({ error: "patientId and treatmentOption are required" });
  }

  const patient = mockDB.getPatient(patientId);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // Simulate delay to make it feel like AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  const simulationResult = aiMockService.simulateTreatment(patient, treatmentOption, dosage, duration);

  res.json({
    patientId,
    treatmentOption,
    dosage,
    duration,
    ...simulationResult,
    timestamp: new Date()
  });
});

router.post('/predict', async (req, res) => {
  const { patientData } = req.body;
  if (!patientData) {
    return res.status(400).json({ error: "patientData is required" });
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Predict health trajectory without specific treatment
  const riskScore = Math.min(99, Math.max(5, (patientData.age - 30) * 0.5 + Math.random() * 20));

  res.json({
    baseRiskScore: riskScore.toFixed(2),
    recommendedAction: riskScore > 50 ? "Intervention Required" : "Monitor Vitals"
  });
});

module.exports = router;
