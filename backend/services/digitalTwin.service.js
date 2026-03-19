// Layer 2: Digital Twin Creation & Simulation Engine
const learningService = require('./learning.service');

/**
 * 1. Digital Twin Construction Engine
 * Converts structured patient profile from Layer 1 into a computable digital twin state.
 */
const createDigitalTwin = (patient) => {
  // Normalize patient features
  const age = patient.age || 45;
  const vitals = patient.vitals || { heartRate: 80, bpSystolic: 120, bpDiastolic: 80, sugar: 100, spO2: 98, temperature: 98.6 };
  const lifestyle = patient.lifestyle || { smoking: "No", alcohol: "No", exercise: "None" };
  const medicalHistory = patient.medicalHistory || { conditions: [] };

  // Feature vector generation: [cardiovascular_stress, metabolic_stress, respiratory_stress]
  let cvStress = ((vitals.bpSystolic - 120) / 120) + ((vitals.heartRate - 80) / 80);
  let metStress = ((vitals.sugar - 100) / 100);
  let respStress = ((98 - vitals.spO2) / 100);

  if (lifestyle.smoking === "Yes") respStress += 0.25;
  else if (lifestyle.smoking === "Past") respStress += 0.1;
  
  if (lifestyle.exercise === "None") cvStress += 0.15;
  else if (lifestyle.exercise === "Rarely") cvStress += 0.08;
  else if (lifestyle.exercise === "Active") cvStress -= 0.1;

  const featureVector = [
    Math.max(0, Math.min(1, cvStress)),
    Math.max(0, Math.min(1, metStress)),
    Math.max(0, Math.min(1, respStress))
  ];

  // Calculate dynamic health index and risk score from vitals and lifestyle
  const baseHealth = patient.metrics?.baselineHealthIndex || 70;
  const baseRisk = patient.metrics?.riskScore || 0.3;
  
  // Adjust health index based on vitals (higher stress = lower health)
  const totalStress = (featureVector[0] + featureVector[1] + featureVector[2]) / 3;
  const dynamicHealthIndex = Math.max(10, Math.min(95, baseHealth - (totalStress * 40)));
  
  // Adjust risk score based on vitals and lifestyle
  let dynamicRiskScore = baseRisk;
  
  // Blood pressure impact
  if (vitals.bpSystolic > 140) dynamicRiskScore += 0.15;
  else if (vitals.bpSystolic > 130) dynamicRiskScore += 0.08;
  else if (vitals.bpSystolic < 110) dynamicRiskScore -= 0.05;
  
  // Blood sugar impact
  if (vitals.sugar > 180) dynamicRiskScore += 0.15;
  else if (vitals.sugar > 140) dynamicRiskScore += 0.1;
  else if (vitals.sugar < 110) dynamicRiskScore -= 0.05;
  
  // SpO2 impact
  if (vitals.spO2 < 92) dynamicRiskScore += 0.15;
  else if (vitals.spO2 < 95) dynamicRiskScore += 0.08;
  else if (vitals.spO2 >= 98) dynamicRiskScore -= 0.03;
  
  // Lifestyle impact
  if (lifestyle.smoking === "Yes") dynamicRiskScore += 0.12;
  else if (lifestyle.smoking === "Past") dynamicRiskScore += 0.05;
  else if (lifestyle.smoking === "No") dynamicRiskScore -= 0.03;
  
  if (lifestyle.exercise === "None") dynamicRiskScore += 0.1;
  else if (lifestyle.exercise === "Rarely") dynamicRiskScore += 0.05;
  else if (lifestyle.exercise === "Active") dynamicRiskScore -= 0.08;
  else if (lifestyle.exercise === "Moderate") dynamicRiskScore -= 0.03;
  
  // Clamp risk score between 0.05 and 0.95
  dynamicRiskScore = Math.max(0.05, Math.min(0.95, dynamicRiskScore));

  let riskLevel = "Low";
  if (dynamicRiskScore > 0.6) riskLevel = "High";
  else if (dynamicRiskScore > 0.3) riskLevel = "Medium";

  let diseaseState = patient.disease || "Unknown";
  if (diseaseState === "Unknown" && medicalHistory.conditions.length > 0) {
    diseaseState = medicalHistory.conditions[0];
  }

  // Determine contributing factors
  const contributingFactors = [];
  if (vitals.bpSystolic > 130) contributingFactors.push("High Blood Pressure");
  if (lifestyle.smoking === "Yes") contributingFactors.push("Smoking");
  if (vitals.sugar > 120) contributingFactors.push("Elevated Blood Sugar");
  if (lifestyle.exercise === "None") contributingFactors.push("Sedentary Lifestyle");
  if (vitals.spO2 < 95) contributingFactors.push("Low Oxygen Saturation");
  if (contributingFactors.length === 0) contributingFactors.push("Age / General Status");

  return {
    patientId: patient.patientId || patient.id,
    healthIndex: dynamicHealthIndex,
    riskLevel,
    riskScore: dynamicRiskScore,
    diseaseState,
    featureVector,
    contributingFactors
  };
};

/**
 * 2. Disease Modeling Engine
 * Simulate baseline disease progression (without treatment)
 */
const simulateBaselineProgression = (twin, days) => {
  const ageFactor = 1 + (twin.healthIndex < 50 ? 0.05 : 0.01);
  const progressionRate = twin.riskScore * ageFactor * 1.2; // Worsening over time without treatment

  let trajectory = [];
  let currentSeverity = 100 - twin.healthIndex; // high severity = bad
  
  // Ensure step is at least 1 to prevent infinite loop
  const step = Math.max(1, Math.floor(days / 10));
  
  for (let i = 0; i <= days; i += step) {
    trajectory.push({
      day: i,
      severity: Math.min(100, Math.round(currentSeverity)),
      type: "Baseline (No Treatment)"
    });
    currentSeverity += progressionRate * (days / 10);
  }
  return trajectory;
};

/**
 * Helper to simulate a specific treatment type and return metrics
 */
const evaluateTreatment = (twin, treatmentPlan) => {
  const { type, dosage, duration } = treatmentPlan;
  
  // Treatment weights
  let treatmentStrength = 1.0;
  let treatmentAggression = 1.0;

  if (type === "Aggressive") {
    treatmentStrength = 1.5;
    treatmentAggression = 1.8;
  } else if (type === "Conservative") {
    treatmentStrength = 0.8;
    treatmentAggression = 0.5;
  } else if (type === "Standard") {
    treatmentStrength = 1.0;
    treatmentAggression = 1.0;
  }

  if (dosage === "High") {
    treatmentStrength *= 1.2;
    treatmentAggression *= 1.3;
  } else if (dosage === "Low") {
    treatmentStrength *= 0.8;
    treatmentAggression *= 0.8;
  }

  // AI Prediction Logic (Weighted Scoring)
  let effectiveness = twin.healthIndex * treatmentStrength * (1 - twin.riskScore);
  let riskExposure = twin.riskScore * 100 * treatmentAggression;
  
  // ==========================================
  // LAYER 4: Continuous Learning Injection
  // ==========================================
  try {
    const learningState = learningService.getLearningState();
    const learnedAdjustments = learningState.protocolAdjustments[type];
    
    if (learnedAdjustments) {
       // Apply dynamically tuned global neural weights from real-world feedback
       effectiveness *= learnedAdjustments.effectivenessMod;
       riskExposure *= learnedAdjustments.riskMod;
    }
  } catch (err) {
    // Failsafe: Continue with raw baseline physics if learning memory is inaccessible
    // Log the error in non-production environments for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[DigitalTwin] Learning service unavailable, using baseline calculations:', err.message);
    }
  }
  // ==========================================

  let sideEffects = Math.min(100, riskExposure * 0.8 * treatmentAggression);
  
  effectiveness = Math.max(10, Math.min(99, effectiveness));
  riskExposure = Math.max(5, Math.min(99, riskExposure));
  sideEffects = Math.max(0, Math.min(99, sideEffects));

  let diseaseProgression = "Stable";
  if (effectiveness > 60 && riskExposure < 40) diseaseProgression = "Improving";
  if (effectiveness < 40 || riskExposure > 70) diseaseProgression = "Worsening";

  let recoveryBase = Math.max(7, Math.floor(100 - effectiveness));
  let recoveryTime = `${Math.min(duration, recoveryBase)} days`;

  let survivalProbability = Math.max(10, Math.min(99, (effectiveness * 1.1) - (riskExposure * 0.2)));
  let confidenceScore = Math.max(50, Math.min(99, 100 - (twin.riskScore * 50) + (treatmentStrength * 10)));

  return {
    effectiveness: parseFloat(effectiveness.toFixed(2)),
    risk: parseFloat(riskExposure.toFixed(2)),
    sideEffects: parseFloat(sideEffects.toFixed(2)),
    diseaseProgression,
    recoveryTime,
    survivalProbability: parseFloat(survivalProbability.toFixed(1)),
    confidenceScore: parseFloat(confidenceScore.toFixed(1))
  };
};

const ensureTwin = (input) => {
  if (!input) {
    throw new Error('Patient or digital twin input is required');
  }

  if (Array.isArray(input.featureVector) && typeof input.healthIndex === 'number') {
    return input;
  }

  return createDigitalTwin(input);
};

/**
 * 3 & 4. Treatment Simulation Engine API Core Logic
 */
const simulateTreatment = (twin, treatmentPlan) => {
  return evaluateTreatment(ensureTwin(twin), treatmentPlan);
};

/**
 * 5. Multi-Treatment Comparison Engine
 */
const compareTreatments = (twin) => {
  const normalizedTwin = ensureTwin(twin);
  const protocols = ["Conservative", "Standard", "Aggressive"];
  const results = protocols.map(type => ({
    type,
    metrics: evaluateTreatment(normalizedTwin, { type, dosage: "Medium", duration: 30 })
  }));

  // Sort by effectiveness descending
  results.sort((a, b) => b.metrics.effectiveness - a.metrics.effectiveness);

  // Classify based on risk and effectiveness
  let best = { name: results[0].type, reason: "Optimal balance of highest effectiveness and manageable risk." };
  let alternatives = [];
  let avoid = [];

  results.forEach(res => {
    if (res.type === best.name) return;
    if (res.metrics.risk > 70 || res.metrics.sideEffects > 60) {
      avoid.push({ 
        name: res.type, 
        reason: res.metrics.sideEffects > 60 ? "High side-effect probability detected." : "Excessive risk exposure limits safety." 
      });
    } else {
      alternatives.push({ 
        name: res.type, 
        reason: "Viable option with slightly altered risk/recovery profile." 
      });
    }
  });

  if (alternatives.length === 0 && avoid.length > 0) {
    const fallback = avoid.pop();
    alternatives.push({ name: fallback.name, reason: "Fallback option, but proceed with caution." }); // Fallback
  }

  return {
    best,
    alternatives,
    avoid,
    comparisons: results
  };
};

/**
 * 6. Outcome Trajectory Generator
 */
const generateTrajectories = (twin, selectedTreatment, days) => {
  const normalizedTwin = ensureTwin(twin);
  const baseline = simulateBaselineProgression(normalizedTwin, days);
  
  let currentSeveritySelected = 100 - normalizedTwin.healthIndex;
  let currentSeverityOptimized = 100 - normalizedTwin.healthIndex;

  const selectedMetrics = evaluateTreatment(normalizedTwin, selectedTreatment);
  const comparison = compareTreatments(normalizedTwin);
  const optimizedMetrics = evaluateTreatment(normalizedTwin, { type: comparison.best.name, dosage: "Medium", duration: days });

  const trajectory = [];
  
  for (let i = 0; i < baseline.length; i++) {
    const day = baseline[i].day;
    
    // Calculate recovery rate (severity decreasing)
    const selectedFactor = (selectedMetrics.effectiveness / 100) * (day / days) * 50;
    const optimizedFactor = (optimizedMetrics.effectiveness / 100) * (day / days) * 60;

    trajectory.push({
      day,
      "Without Treatment": baseline[i].severity,
      "Selected Treatment": Math.max(0, Math.round(currentSeveritySelected - selectedFactor)),
      "Optimized Treatment": Math.max(0, Math.round(currentSeverityOptimized - optimizedFactor)),
    });
  }

  return trajectory;
};

/**
 * Main Entry Point for the Simulation
 */
const runFullSimulation = (patient, treatmentPlan) => {
  const twin = createDigitalTwin(patient);
  const simulationMetrics = simulateTreatment(twin, treatmentPlan);
  const comparisons = compareTreatments(twin);
  const trajectory = generateTrajectories(twin, treatmentPlan, treatmentPlan.duration || 30);

  return {
    ...simulationMetrics,
    recommendation: comparisons,
    trajectory,
    digitalTwinState: twin
  };
};

module.exports = {
  createDigitalTwin,
  simulateTreatment,
  compareTreatments,
  generateTrajectories,
  runFullSimulation
};
