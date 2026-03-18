// Layer 4 Routes

const express = require('express');
const router = express.Router();
const learningService = require('../services/learning.service');

// POST /api/feedback - Bridge Prediction vs Reality
router.post('/feedback', (req, res) => {
  const { patientId, treatmentUsed, actualOutcome, predictedOutcome } = req.body;

  if (!patientId || !treatmentUsed || !actualOutcome || !predictedOutcome) {
    return res.status(400).json({ error: "Missing required feedback fields for continuous learning update." });
  }

  try {
    const evaluation = learningService.processFeedback(req.body);

    res.json({
      success: true,
      message: "Neural weights updated successfully.",
      evaluation
    });
  } catch (err) {
    console.error("Learning Service Error:", err);
    res.status(500).json({ error: "Failed to optimize model." });
  }
});

// GET /api/learning/status - Dashboard API
router.get('/status', (req, res) => {
  try {
    const state = learningService.getLearningState();
    const historyArray = Array.isArray(state.history) ? state.history : [];
    
    res.json({
      modelAccuracy: state.modelAccuracy,
      learningStatus: state.learningStatus,
      totalFeedbackProcessed: state.totalFeedbackProcessed,
      history: historyArray,
      latestInsights: historyArray.slice(-3).map(h => {
        // Safely access patientId with null check
        const patientIdDisplay = h && h.patientId ? h.patientId.slice(0, 8) : 'unknown';
        const treatmentName = h && h.treatmentUsed ? h.treatmentUsed : 'unknown';
        const accuracy = h && typeof h.predictionAccuracy === 'number' ? h.predictionAccuracy : 0;
        
        return {
          trend: accuracy > 80 ? "High Calibration" : "Adjusting Weights",
          event: `Outcome logged for ${treatmentName} (${patientIdDisplay})`
        };
      })
    });
  } catch (err) {
    console.error('Learning status error:', err);
    res.status(500).json({ error: "Failed to fetch learning status." });
  }
});

module.exports = router;
