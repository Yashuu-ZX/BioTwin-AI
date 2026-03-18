// Layer 6: Explainability & Advanced Intelligence API

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
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

router.post('/cohort-match', async (req, res) => {
  const { patientId, treatmentPlan } = req.body;
  if (!patientId) return res.status(400).json({ error: 'patientId required' });

  try {
    const data = await explainService.generateCohortMatches(patientId, treatmentPlan);
    res.json(data);
  } catch (error) {
    console.error('Cohort Match Error:', error);
    res.status(500).json({ error: 'Failed to generate cohort matches.' });
  }
});

router.post('/drug-intelligence', async (req, res) => {
  const { patientId } = req.body;
  if (!patientId) return res.status(400).json({ error: 'patientId required' });

  try {
    const data = await explainService.analyzeDrugInteractions(patientId);
    res.json(data);
  } catch (error) {
    console.error('Drug Intelligence Error:', error);
    res.status(500).json({ error: 'Failed to analyze drug interactions.' });
  }
});

router.post('/report', async (req, res) => {
  const { patientId, treatmentPlan } = req.body;
  if (!patientId) return res.status(400).json({ error: 'patientId required' });

  try {
    const report = await explainService.buildClinicianReport(patientId, treatmentPlan);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const filename = `biotwin-report-${patientId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(22).text('BioTwin AI Clinician Report', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Generated: ${report.generatedAt}`);
    doc.text(`Patient: ${report.patient.name} (${report.patient.patientId})`);
    doc.text(`Disease Pathway: ${report.patient.disease}`);
    doc.text(`Treatment Plan: ${report.treatmentPlan.type} / ${report.treatmentPlan.dosage} / ${report.treatmentPlan.duration} days`);

    doc.moveDown();
    doc.fontSize(16).text('Simulation Summary');
    doc.fontSize(11).text(`Effectiveness: ${report.simulation.effectiveness}%`);
    doc.text(`Risk: ${report.simulation.risk}%`);
    doc.text(`Side Effects: ${report.simulation.sideEffects}%`);
    doc.text(`Best Recommendation: ${report.simulation.recommendation.best.name}`);

    doc.moveDown();
    doc.fontSize(16).text('Top Risk Drivers');
    report.xai.slice(0, 4).forEach((item) => doc.fontSize(11).text(`- ${item.feature}: ${item.value} (${item.normalizedWeight}%)`));

    doc.moveDown();
    doc.fontSize(16).text('Preventive Actions');
    report.preventive.slice(0, 3).forEach((item) => doc.fontSize(11).text(`- ${item}`));

    doc.moveDown();
    doc.fontSize(16).text('Cohort Match');
    doc.fontSize(11).text(`Recommended cohort: ${report.cohort.recommendedCohort.label}`);
    doc.text(`Similarity: ${report.cohort.recommendedCohort.similarityScore}%`);
    doc.text(`Response rate: ${report.cohort.recommendedCohort.responseRate}%`);

    doc.moveDown();
    doc.fontSize(16).text('Drug Interaction Intelligence');
    if (report.drugIntel.interactions.length) {
      report.drugIntel.interactions.slice(0, 3).forEach((item) => {
        doc.fontSize(11).text(`- ${item.pair} [${item.severity}]`);
        doc.text(`  ${item.action}`);
      });
    } else {
      doc.fontSize(11).text('- No major interaction warnings detected.');
    }

    doc.end();
  } catch (error) {
    console.error('Report Export Error:', error);
    res.status(500).json({ error: 'Failed to generate clinician report.' });
  }
});

module.exports = router;
