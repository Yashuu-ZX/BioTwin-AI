// Layer 4: Continuous Learning, Feedback Loop & Intelligence Optimization System

const fs = require('fs');
const path = require('path');

// Simulate a database for historical feedback and model weights
const DB_PATH = path.join(__dirname, '../data/learningWeights.json');

// Initialize weights if they don't exist
const initializeWeights = () => {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      modelAccuracy: 82.5,
      learningStatus: "Active",
      totalFeedbackProcessed: 0,
      protocolAdjustments: {
        "Conservative": { effectivenessMod: 1.0, riskMod: 1.0 },
        "Standard": { effectivenessMod: 1.0, riskMod: 1.0 },
        "Aggressive": { effectivenessMod: 1.0, riskMod: 1.0 }
      },
      history: []
    };
    
    // Create directory if not exists
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
};

const getLearningState = () => {
  initializeWeights();
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

const saveLearningState = (state) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
};

/**
 * 1. Feedback Ingestion & 2. Model Performance Evaluator
 */
const processFeedback = (feedbackData) => {
  const { patientId, treatmentUsed, predictedOutcome, actualOutcome } = feedbackData;
  const state = getLearningState();
  
  // Calculate Error Margins
  const effectivenessError = actualOutcome.effectiveness - predictedOutcome.effectiveness;
  const riskError = actualOutcome.sideEffects - predictedOutcome.risk; // simplified
  
  // Absolute average error
  const averageError = (Math.abs(effectivenessError) + Math.abs(riskError)) / 2;
  const errorMarginFloat = parseFloat(averageError.toFixed(2));
  
  // Update Global Accuracy (Moving average approach)
  let currentAccuracy = state.modelAccuracy;
  let newAccuracy = 100 - errorMarginFloat;
  
  // Weight recent feedback slightly more (alpha = 0.2)
  state.modelAccuracy = (currentAccuracy * 0.8) + (newAccuracy * 0.2);
  state.modelAccuracy = parseFloat(state.modelAccuracy.toFixed(2));
  
  state.totalFeedbackProcessed += 1;
  state.learningStatus = state.modelAccuracy > currentAccuracy ? "Improving" : "Stable";

  /**
   * 3. Adaptive Learning Engine - Weight Adjustments
   */
  if (!state.protocolAdjustments[treatmentUsed]) {
    state.protocolAdjustments[treatmentUsed] = { effectivenessMod: 1.0, riskMod: 1.0 };
  }
  
  // If actual effectiveness was higher than predicted, we increase the multiplier slightly
  if (effectivenessError > 5) {
    state.protocolAdjustments[treatmentUsed].effectivenessMod += 0.02;
  } else if (effectivenessError < -5) {
    state.protocolAdjustments[treatmentUsed].effectivenessMod -= 0.02;
  }
  
  // If actual side effects were higher than predicted risk, increase risk modifier
  if (riskError > 5) {
    state.protocolAdjustments[treatmentUsed].riskMod += 0.03;
  } else if (riskError < -5) {
    state.protocolAdjustments[treatmentUsed].riskMod -= 0.02;
  }
  
  // Clamp modifiers to prevent runaway feedback
  state.protocolAdjustments[treatmentUsed].effectivenessMod = Math.max(0.5, Math.min(1.5, state.protocolAdjustments[treatmentUsed].effectivenessMod));
  state.protocolAdjustments[treatmentUsed].riskMod = Math.max(0.5, Math.min(2.0, state.protocolAdjustments[treatmentUsed].riskMod));
  
  // Store History
  state.history.push({
    patientId,
    treatmentUsed,
    timestamp: new Date().toISOString(),
    predictionAccuracy: parseFloat(newAccuracy.toFixed(2)),
    errorMargin: errorMarginFloat
  });
  
  // Keep history bounded
  if (state.history.length > 50) state.history.shift();

  saveLearningState(state);

  return {
    predictionAccuracy: parseFloat(newAccuracy.toFixed(2)),
    errorMargin: errorMarginFloat,
    modelReliability: state.learningStatus,
    globalAccuracyUpdated: state.modelAccuracy,
    insight: generateInsight(state, treatmentUsed)
  };
};

/**
 * 5. Population Intelligence Layer
 */
const generateInsight = (state, treatmentUsed) => {
  const history = state.history.filter(h => h.treatmentUsed === treatmentUsed);
  if (history.length > 3) {
    const recentAccuracy = history.slice(-3).reduce((acc, h) => acc + h.predictionAccuracy, 0) / 3;
    if (recentAccuracy > 85) {
      return `Confidence locally tuned. Model is highly calibrated for ${treatmentUsed}.`;
    }
  }
  return `Neural weights adjusted for ${treatmentUsed} based on real-world feedback.`;
};

module.exports = {
  getLearningState,
  processFeedback
};
