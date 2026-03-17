// Layer 6: Explainability & Advanced Intelligence API

const express = require('express');
const router = express.Router();
const explainService = require('../services/explainability.service');
const Patient = require('../models/Patient');
const mockDB = require('../data/mockDatabase');
const { isMongoReady } = require('../config/mongo');

// POST /api/explain/insights - Get Feature Importance (Explainable AI)
router.post('/insights', async (req, res) => {
  const { patientId } = req.body;
  if (!patientId) return res.status(400).json({ error: "patientId required" });
  
  try {
    let patient;
    try {
      if (isMongoReady()) {
        patient = await Patient.findOne({ patientId: patientId });
      }
      patient = patient || mockDB.getPatient(patientId);
    } catch(e) {
      patient = mockDB.getPatient(patientId);
    }
    
    if (!patient) return res.status(404).json({ error: "Patient Twin not found." });
    
    const featureImportance = explainService.calculateFeatureImportance(patient);
    const preventiveInsights = explainService.generatePreventiveInsights(featureImportance);
    
    res.json({
      featureImportance,
      preventiveInsights
    });
  } catch (error) {
    console.error("XAI Insight Error:", error);
    res.status(500).json({ error: "Failed to compile XAI reasoning." });
  }
});

// POST /api/explain/what-if - Run Interactive What-If Scenarios
router.post('/what-if', async (req, res) => {
  const { patientId, modifications, treatmentPlan } = req.body;
  
  if (!patientId || !modifications || !treatmentPlan) {
    return res.status(400).json({ error: "Missing parameters for What-If compilation." });
  }
  
  try {
    const whatIfResults = await explainService.runWhatIfSimulation(patientId, modifications, treatmentPlan);
    res.json(whatIfResults);
  } catch (error) {
    console.error("What-If Engine Error:", error);
    res.status(500).json({ error: "Failed to simulate alternative timeline." });
  }
});

module.exports = router;
