// Layer 4: Continuous Learning, Feedback Loop & Intelligence Optimization System

const fs = require('fs');
const path = require('path');

// Simulate a database for historical feedback and model weights
const DB_PATH = path.join(__dirname, '../data/learningWeights.json');

// Simple in-memory cache to reduce file I/O
let cachedState = null;
let lastReadTime = 0;
const CACHE_TTL = 5000; // 5 seconds cache

// Initialize weights if they don't exist
const initializeWeights = () => {
  try {
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
      const dirPath = path.dirname(DB_PATH);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      cachedState = initialData;
      lastReadTime = Date.now();
    }
  } catch (error) {
    // Log but don't crash - we can work with in-memory state
    console.error('Failed to initialize learning weights file:', error.message);
  }
};

const getLearningState = () => {
  // Return cached state if still valid
  if (cachedState && (Date.now() - lastReadTime) < CACHE_TTL) {
    return JSON.parse(JSON.stringify(cachedState)); // Return deep copy
  }
  
  initializeWeights();
  
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    cachedState = JSON.parse(data);
    lastReadTime = Date.now();
    return JSON.parse(JSON.stringify(cachedState)); // Return deep copy
  } catch (error) {
    console.error('Failed to read learning state:', error.message);
    // Return default state if file read fails
    return {
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
  }
};

const saveLearningState = (state) => {
  try {
    // Validate state before saving
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid state object');
    }
    
    // Write atomically using temp file
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2));
    fs.renameSync(tempPath, DB_PATH);
    
    // Update cache
    cachedState = JSON.parse(JSON.stringify(state));
    lastReadTime = Date.now();
  } catch (error) {
    console.error('Failed to save learning state:', error.message);
    // Still update in-memory cache even if file save fails
    cachedState = JSON.parse(JSON.stringify(state));
    lastReadTime = Date.now();
  }
};

/**
 * Clamp a value between min and max
 */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * 1. Feedback Ingestion & 2. Model Performance Evaluator
 */
const processFeedback = (feedbackData) => {
  // Validate input
  if (!feedbackData) {
    throw new Error('Feedback data is required');
  }
  
  const { patientId, treatmentUsed, predictedOutcome, actualOutcome } = feedbackData;
  
  if (!patientId || !treatmentUsed || !actualOutcome || !predictedOutcome) {
    throw new Error('Missing required feedback fields: patientId, treatmentUsed, predictedOutcome, actualOutcome');
  }
  
  const state = getLearningState();
  
  // Calculate Error Margins with validation
  const predictedEffectiveness = Number(predictedOutcome.effectiveness) || 0;
  const actualEffectiveness = Number(actualOutcome.effectiveness) || 0;
  const predictedRisk = Number(predictedOutcome.risk) || 0;
  const actualSideEffects = Number(actualOutcome.sideEffects) || 0;
  
  const effectivenessError = actualEffectiveness - predictedEffectiveness;
  const riskError = actualSideEffects - predictedRisk;
  
  // Absolute average error
  const averageError = (Math.abs(effectivenessError) + Math.abs(riskError)) / 2;
  const errorMarginFloat = parseFloat(clamp(averageError, 0, 100).toFixed(2));
  
  // Update Global Accuracy (Moving average approach)
  const currentAccuracy = state.modelAccuracy;
  const newAccuracy = clamp(100 - errorMarginFloat, 0, 100);
  
  // Weight recent feedback slightly more (alpha = 0.2)
  state.modelAccuracy = parseFloat((currentAccuracy * 0.8 + newAccuracy * 0.2).toFixed(2));
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
  state.protocolAdjustments[treatmentUsed].effectivenessMod = clamp(
    state.protocolAdjustments[treatmentUsed].effectivenessMod, 0.5, 1.5
  );
  state.protocolAdjustments[treatmentUsed].riskMod = clamp(
    state.protocolAdjustments[treatmentUsed].riskMod, 0.5, 2.0
  );
  
  // Store History - anonymize patient ID for privacy
  const anonymizedPatientId = `patient_${Date.now()}`;
  state.history.push({
    patientId: anonymizedPatientId,
    treatmentUsed,
    timestamp: new Date().toISOString(),
    predictionAccuracy: parseFloat(newAccuracy.toFixed(2)),
    errorMargin: errorMarginFloat
  });
  
  // Keep history bounded
  if (state.history.length > 50) {
    state.history.shift();
  }

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

/**
 * Reset learning state (useful for testing)
 */
const resetLearningState = () => {
  cachedState = null;
  lastReadTime = 0;
  try {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  } catch (error) {
    console.error('Failed to reset learning state:', error.message);
  }
  initializeWeights();
  return getLearningState();
};

module.exports = {
  getLearningState,
  processFeedback,
  resetLearningState
};
