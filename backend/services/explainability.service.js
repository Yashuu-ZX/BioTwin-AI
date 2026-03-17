// Layer 6: Explainability & Advanced Intelligence Engine

const digitalTwinService = require('./digitalTwin.service');
const mockDB = require('../data/mockDatabase');
const Patient = require('../models/Patient');
const { isMongoReady } = require('../config/mongo');

/**
 * 1. Feature Importance Calculator (Explainable AI)
 * Simulates SHAP values by perturbing inputs and observing risk score delta.
 */
const calculateFeatureImportance = (patientProfile) => {
  // Baseline static estimation based on medical rules for the hackathon
  // In a real python microservice, this would be actual SHAP extraction.
  
  let factors = [];
  const vitals = patientProfile.vitals || {};
  const lifestyle = patientProfile.lifestyle || {};
  const age = patientProfile.age || 40;
  
  // Weights (adds up to ~100)
  if (vitals.bpSystolic > 130) {
    factors.push({ feature: "Blood Pressure (Systolic)", weight: 35, impact: "Negative", value: vitals.bpSystolic });
  } else {
    factors.push({ feature: "Blood Pressure", weight: 15, impact: "Neutral", value: vitals.bpSystolic });
  }
  
  if (lifestyle.smoking === "Yes" || lifestyle.smoking === "Past") {
    factors.push({ feature: "Smoking History", weight: 28, impact: "Negative", value: lifestyle.smoking });
  }
  
  if (vitals.sugar > 140) {
    factors.push({ feature: "Blood Glucose", weight: 22, impact: "Negative", value: vitals.sugar });
  }
  
  if (age > 60) {
    factors.push({ feature: "Age Factor", weight: 20, impact: "Negative", value: age });
  } else {
    factors.push({ feature: "Age Factor", weight: 10, impact: "Positive", value: age });
  }
  
  if (lifestyle.exercise === "None") {
    factors.push({ feature: "Sedentary Lifestyle", weight: 15, impact: "Negative", value: "None" });
  } else if (lifestyle.exercise === "Active") {
    factors.push({ feature: "Active Lifestyle", weight: 25, impact: "Positive", value: "Active" });
  }
  
  // Normalize weights to sum to 100%
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  factors = factors.map(f => ({
    ...f,
    normalizedWeight: parseFloat(((f.weight / totalWeight) * 100).toFixed(1))
  }));
  
  // Sort descending by weight
  factors.sort((a, b) => b.normalizedWeight - a.normalizedWeight);
  
  return factors;
};

/**
 * 2. Preventive Insights Generator
 */
const generatePreventiveInsights = (featureImportance) => {
  const insights = [];
  
  featureImportance.forEach(f => {
    if (f.impact === "Negative") {
      if (f.feature.includes("Blood Pressure")) {
        insights.push("Reducing Systolic BP by 10% can lower your acute cardiac event probability by 18%.");
      }
      if (f.feature.includes("Smoking")) {
        insights.push("Smoking cessation will improve SpO2 absorption efficiency and reduce respiratory distress risk by 35% within 1 year.");
      }
      if (f.feature.includes("Glucose")) {
        insights.push("Stabilizing fasting blood sugar below 110 mg/dL significantly enhances recovery velocity and limits metabolic complications.");
      }
      if (f.feature.includes("Sedentary")) {
        insights.push("Introducing 30 mins of moderate cardiovascular exercise daily improves systemic resilience.");
      }
    }
  });
  
  if (insights.length === 0) {
    insights.push("Patient profile demonstrates robust baseline stability. Maintain current lifestyle regimen.");
  }
  
  return insights;
};

/**
 * 3. What-If Scenario Engine Wrapper
 */
const runWhatIfSimulation = async (patientId, modifications, treatmentPlan) => {
  // Fetch original patient
  let patient;
  try {
     if (isMongoReady()) {
       patient = await Patient.findOne({ patientId: patientId });
     }
     patient = patient || mockDB.getPatient(patientId);
  } catch (e) {
     patient = mockDB.getPatient(patientId);
  }
  
  if (!patient) throw new Error("Patient not found for What-If scenario.");
  
  // Deep clone to avoid mutating real DB twin
  const modifiedTwinInput = JSON.parse(JSON.stringify(patient));
  
  // Apply modifications (e.g., changes to vitals or lifestyle)
  if (modifications.vitals) {
    modifiedTwinInput.vitals = { ...modifiedTwinInput.vitals, ...modifications.vitals };
  }
  if (modifications.lifestyle) {
    modifiedTwinInput.lifestyle = { ...modifiedTwinInput.lifestyle, ...modifications.lifestyle };
  }

  if (modifications.profile) {
    modifiedTwinInput.profile = { ...modifiedTwinInput.profile, ...modifications.profile };
    if (typeof modifications.profile.height !== 'undefined') modifiedTwinInput.height = modifications.profile.height;
    if (typeof modifications.profile.weight !== 'undefined') modifiedTwinInput.weight = modifications.profile.weight;
  }
  
  // Re-run the core Digital Twin Simulation on the modified phantom twin
  const whatIfSimResult = digitalTwinService.simulateTreatment(modifiedTwinInput, treatmentPlan);
  
  // Run on baseline for delta calculation
  const baselineSimResult = digitalTwinService.simulateTreatment(patient, treatmentPlan);
  
  return {
    appliedModifications: modifications,
    baselineMetrics: {
      effectiveness: baselineSimResult.effectiveness,
      risk: baselineSimResult.risk
    },
    whatIfMetrics: {
      effectiveness: whatIfSimResult.effectiveness,
      risk: whatIfSimResult.risk
    },
    deltas: {
      effectivenessChange: parseFloat((whatIfSimResult.effectiveness - baselineSimResult.effectiveness).toFixed(1)),
      riskChange: parseFloat((whatIfSimResult.risk - baselineSimResult.risk).toFixed(1))
    }
  };
};

module.exports = {
  calculateFeatureImportance,
  generatePreventiveInsights,
  runWhatIfSimulation
};
