const generateId = () => require('crypto').randomBytes(16).toString('hex');

const parseLabPanel = (rawText = '') => {
  const text = String(rawText || '').toLowerCase();
  const extract = (regex, fallback) => {
    const match = text.match(regex);
    return match ? match[1] : fallback;
  };

  const glucose = Number(extract(/glucose\s*[:=]?\s*(\d{2,3})/, 100));
  const systolic = Number(extract(/bp\s*[:=]?\s*(\d{2,3})\/?(\d{2,3})?/, 120));
  const diastolic = Number((text.match(/bp\s*[:=]?\s*(\d{2,3})\/?(\d{2,3})?/) || [])[2] || 80);
  const spo2 = Number(extract(/spo2\s*[:=]?\s*(\d{2,3})/, 98));
  const variant = extract(/variant\s*[:=]?\s*([a-z0-9\-\s]+?)(?=\s+(target|resistance|immune|glucose|bp|spo2)\b|$)/, 'Not Assessed').trim();
  const target = extract(/target\s*[:=]?\s*([a-z0-9\-\s]+?)(?=\s+(variant|resistance|immune|glucose|bp|spo2)\b|$)/, 'Broad Standard of Care').trim();
  const resistance = extract(/resistance\s*[:=]?\s*([a-z0-9\-\s]+?)(?=\s+(variant|target|immune|glucose|bp|spo2)\b|$)/, 'None reported').trim();
  const immune = extract(/immune\s*[:=]?\s*([a-z0-9\-\s]+?)(?=\s+(variant|target|resistance|glucose|bp|spo2)\b|$)/, 'Baseline').trim();

  return {
    parsedVitals: {
      sugar: glucose,
      bpSystolic: systolic,
      bpDiastolic: diastolic,
      spO2: spo2,
    },
    parsedBiomarkers: {
      genomicVariant: variant || 'Not Assessed',
      therapyTarget: target || 'Broad Standard of Care',
      expressionLevel: glucose > 130 ? 'Elevated metabolic stress' : 'Moderate',
      resistanceMarker: resistance || 'None reported',
      immuneProfile: immune || 'Baseline',
    },
    summary: 'Mock lab parser extracted structured vitals and biomarker hints from raw lab panel text.',
  };
};

const getDemoCases = () => ([
  {
    slug: 'cardio-intervention',
    title: 'Cardiovascular Intervention',
    disease: 'Cardiac',
    payload: {
      name: 'Robert Miller', age: 62, gender: 'Male', height: 175, weight: 88, bloodGroup: 'O+',
      symptoms: ['Chest Pain', 'Shortness of Breath'], symptomSeverity: 8, symptomDuration: 3,
      medicalHistory: { conditions: ['Hypertension', 'Type 2 Diabetes'], surgeries: 'Appendectomy (2010)', familyHistory: 'Father had early CAD.' },
      medications: [{ name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }, { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' }],
      biomarkers: { genomicVariant: 'CYP2C19 reduced metabolizer', therapyTarget: 'Platelet pathway', expressionLevel: 'Moderate', resistanceMarker: 'None reported', immuneProfile: 'Baseline' },
      lifestyle: { smoking: 'Past', alcohol: 'Occasionally', exercise: 'Rarely', diet: 'Poor' },
      vitals: { heartRate: 88, bpSystolic: 145, bpDiastolic: 92, sugar: 142, spO2: 95, temperature: 98.4 },
      disease: 'Cardiac', treatmentGoal: 'Fast Recovery'
    }
  },
  {
    slug: 'oncology-precision',
    title: 'Oncology Precision',
    disease: 'Oncology',
    payload: {
      name: 'Maya Chen', age: 49, gender: 'Female', height: 164, weight: 61, bloodGroup: 'A+',
      symptoms: ['Fatigue', 'Weight Loss'], symptomSeverity: 7, symptomDuration: 5,
      medicalHistory: { conditions: ['Tumor History'], surgeries: 'Lumpectomy (2024)', familyHistory: 'Mother had breast cancer.' },
      medications: [{ name: 'Tamoxifen', dosage: '20mg', frequency: 'Once daily' }],
      biomarkers: { genomicVariant: 'EGFR exon 19 deletion', therapyTarget: 'EGFR pathway', expressionLevel: 'High', resistanceMarker: 'T790M negative', immuneProfile: 'Inflamed' },
      lifestyle: { smoking: 'No', alcohol: 'Rarely', exercise: 'Moderate', diet: 'Healthy' },
      vitals: { heartRate: 79, bpSystolic: 122, bpDiastolic: 78, sugar: 99, spO2: 98, temperature: 98.7 },
      disease: 'Oncology', treatmentGoal: 'Fast Recovery'
    }
  },
  {
    slug: 'metabolic-regulation',
    title: 'Metabolic Regulation',
    disease: 'Metabolic',
    payload: {
      name: 'Daniel Brooks', age: 55, gender: 'Male', height: 172, weight: 93, bloodGroup: 'B+',
      symptoms: ['Fatigue', 'Frequent Urination'], symptomSeverity: 6, symptomDuration: 14,
      medicalHistory: { conditions: ['Type 2 Diabetes', 'Obesity'], surgeries: '', familyHistory: 'Strong diabetic history.' },
      medications: [{ name: 'Metformin', dosage: '850mg', frequency: 'Twice daily' }],
      biomarkers: { genomicVariant: 'PPARG sensitivity marker', therapyTarget: 'Insulin sensitivity axis', expressionLevel: 'Medium', resistanceMarker: 'None reported', immuneProfile: 'Low inflammatory tone' },
      lifestyle: { smoking: 'No', alcohol: 'Rarely', exercise: 'None', diet: 'Poor' },
      vitals: { heartRate: 84, bpSystolic: 134, bpDiastolic: 86, sugar: 156, spO2: 97, temperature: 98.5 },
      disease: 'Metabolic', treatmentGoal: 'Low Risk / Conservative'
    }
  }
]);

const processIntake = (data) => {
  const {
    name, age, gender, height, weight, bloodGroup,
    symptoms = [],
    medicalHistory = { conditions: [], surgeries: "", familyHistory: "" },
    medications = [],
    biomarkers = {
      genomicVariant: 'Not Assessed',
      therapyTarget: 'Broad Standard of Care',
      expressionLevel: 'Unknown',
      resistanceMarker: 'None reported',
      immuneProfile: 'Baseline'
    },
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
  
  // Prevent division by zero - ensure sum is at least a small positive number
  const sum = cardiac + respiratory + metabolic || 0.3;
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
    biomarkers,
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
  processIntake,
  parseLabPanel,
  getDemoCases
};
