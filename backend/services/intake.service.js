const generateId = () => require('crypto').randomBytes(16).toString('hex');

const processIntake = (data) => {
  const {
    name, age, gender, height, weight, bloodGroup,
    symptoms = [],
    medicalHistory = { conditions: [], surgeries: "", familyHistory: "" },
    medications = [],
    lifestyle = { smoking: "No", alcohol: "No", exercise: "None", diet: "Average" },
    vitals = { heartRate: 80, bpSystolic: 120, bpDiastolic: 80, sugar: 100, spO2: 98, temperature: 98.6 },
    disease = "Unknown",
    treatmentGoal = "Low Risk"
  } = data;

  // 1. Calculate BMI
  let bmi = 22; // default
  if (height && weight) {
    const heightM = height / 100;
    bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
  }

  // 2. Calculate Risk Score & Health Score
  let riskScore = 0.2; // base risk
  
  // Age factor
  if (age > 60) riskScore += 0.2;
  else if (age > 40) riskScore += 0.1;

  // Lifestyle factor
  if (lifestyle.smoking === "Yes") riskScore += 0.15;
  if (lifestyle.alcohol === "Frequently") riskScore += 0.1;
  if (lifestyle.exercise === "None") riskScore += 0.1;
  
  // Vitals factor
  if (vitals.bpSystolic > 140 || vitals.bpDiastolic > 90) riskScore += 0.15;
  if (vitals.sugar > 140) riskScore += 0.1;
  if (vitals.spO2 < 95) riskScore += 0.15;
  if (bmi > 30) riskScore += 0.1;

  // Disease factor
  if (medicalHistory.conditions && medicalHistory.conditions.length > 0) {
    riskScore += (medicalHistory.conditions.length * 0.05);
  }
  
  riskScore = Math.min(0.99, riskScore);
  
  // Baseline health index inverse to risk
  const baselineHealthIndex = Math.max(10, Math.floor(100 - (riskScore * 100)));

  // 3. Compute Disease Probability Distribution
  // Dummy logic based on inputs for show
  let cardiac = 0.1, respiratory = 0.1, metabolic = 0.1;
  
  if (vitals.bpSystolic > 130 || bmi > 25 || lifestyle.smoking === "Yes") cardiac += 0.4;
  if (vitals.spO2 < 96 || lifestyle.smoking === "Yes") respiratory += 0.4;
  if (vitals.sugar > 120 || bmi > 28) metabolic += 0.5;
  
  const sum = cardiac + respiratory + metabolic;
  const diseaseProbability = {
    cardiac: parseFloat((cardiac / sum).toFixed(2)),
    respiratory: parseFloat((respiratory / sum).toFixed(2)),
    metabolic: parseFloat((metabolic / sum).toFixed(2))
  };

  const structuredData = {
    patientId: generateId(),
    name, // Keep at root for easier UI rendering
    age, // Keep at root
    gender, // Keep at root
    conditions: medicalHistory.conditions, // Keep at root for UI compatibility
    profile: {
      age,
      gender,
      height,
      weight,
      bmi,
      bloodGroup
    },
    symptoms,
    medicalHistory,
    medications,
    lifestyle,
    vitals,
    disease,
    treatmentGoal,
    metrics: {
      baselineHealthIndex,
      riskScore: parseFloat(riskScore.toFixed(2)),
      diseaseProbability
    }
  };

  return structuredData;
};

module.exports = {
  processIntake
};
