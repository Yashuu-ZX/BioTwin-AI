const simulateTreatment = (patient, treatmentOption, dosage = 'Medium', duration = '30 days') => {
  // Simple heuristic based on patient age and conditions
  const baseEffectiveness = 60 + Math.random() * 20;
  const baseRisk = 10 + Math.random() * 20;

  let effectivenessMultiplier = 1;
  let riskMultiplier = 1;

  const conditions = patient.conditions || [];
  if (conditions.includes("Hypertension")) {
    riskMultiplier += 0.2;
    if (treatmentOption === "Aggressive Protocol") effectivenessMultiplier -= 0.1;
  }

  if (patient.age > 65) {
    riskMultiplier += 0.3;
    if (treatmentOption === "Standard Protocol") effectivenessMultiplier -= 0.05;
  } else if (patient.age < 30) {
    effectivenessMultiplier += 0.1;
    riskMultiplier -= 0.1;
  }

  // Adjust by treatment option
  if (treatmentOption === "Aggressive Protocol") {
    effectivenessMultiplier += 0.2;
    riskMultiplier += 0.4;
  } else if (treatmentOption === "Conservative Protocol") {
    effectivenessMultiplier -= 0.1;
    riskMultiplier -= 0.3;
  } else if (treatmentOption === "Standard Protocol") {
    effectivenessMultiplier += 0.05;
    riskMultiplier += 0.1;
  } else if (treatmentOption === "Experimental Therapy A") {
    effectivenessMultiplier += 0.3;
    riskMultiplier += 0.5;
  }
  
  // Adjust dosage
  if (dosage === 'High') {
    effectivenessMultiplier += 0.15;
    riskMultiplier += 0.25;
  } else if (dosage === 'Low') {
    effectivenessMultiplier -= 0.15;
    riskMultiplier -= 0.2;
  }

  // Calculate final bounds
  let finalEffectiveness = Math.max(10, Math.min(99, baseEffectiveness * effectivenessMultiplier));
  let finalRisk = Math.max(5, Math.min(99, baseRisk * riskMultiplier));
  
  // Calculate new metrics
  let diseaseProgression = "Stable";
  if (finalEffectiveness > 80 && finalRisk < 40) diseaseProgression = "Improving";
  if (finalEffectiveness < 40 || finalRisk > 70) diseaseProgression = "Worsening";
  
  let recoveryDays = Math.max(7, Math.floor(100 - finalEffectiveness) + (duration === '90 days' ? 20 : 0));
  let recoveryTime = `${recoveryDays} days`;
  
  let survivalProbability = Math.max(10, Math.min(99, (finalEffectiveness * 1.2) - (finalRisk * 0.3)));
  let confidenceScore = Math.max(60, Math.min(99, 100 - Math.random() * 15 - (conditions.length * 5)));
  
  // Dynamic Recommendations
  const allProtocols = ["Standard Protocol", "Conservative Protocol", "Aggressive Protocol", "Experimental Therapy A"];
  let best = "Conservative Protocol";
  let avoid = ["Aggressive Protocol"];
  let alternatives = ["Standard Protocol"];
  
  if (diseaseProgression === "Worsening") {
    best = "Aggressive Protocol";
    avoid = ["Conservative Protocol"];
    alternatives = ["Experimental Therapy A"];
  } else if (finalRisk > 50) {
    best = "Conservative Protocol";
    avoid = ["Aggressive Protocol", "Experimental Therapy A"];
    alternatives = ["Standard Protocol"];
  } else {
    best = "Standard Protocol";
    avoid = ["Experimental Therapy A"];
    alternatives = ["Conservative Protocol"];
  }

  return {
    effectiveness: parseFloat(finalEffectiveness.toFixed(2)),
    risk: parseFloat(finalRisk.toFixed(2)),
    sideEffects: parseFloat((finalRisk * 0.8).toFixed(2)), // mapped to sideEffects based on req
    diseaseProgression,
    recoveryTime,
    survivalProbability: parseFloat(survivalProbability.toFixed(1)),
    confidenceScore: parseFloat(confidenceScore.toFixed(1)),
    recommendation: {
      best,
      alternatives,
      avoid
    }
  };
};

module.exports = {
  simulateTreatment
};
