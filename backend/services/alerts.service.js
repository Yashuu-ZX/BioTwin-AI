/**
 * Clinical Alerts Service
 * 
 * Monitors patient vitals, labs, and clinical status to generate
 * real-time alerts for clinical decision support.
 * 
 * Features:
 * 1. Vital sign threshold monitoring
 * 2. Lab value alerting
 * 3. Clinical deterioration scoring (NEWS2, qSOFA)
 * 4. Trend analysis for early warning
 * 5. Alert acknowledgment and escalation
 */

const Patient = require('../models/Patient');

// Vital sign thresholds with age/condition adjustments
const VITAL_THRESHOLDS = {
  heartRate: {
    adult: { low: 50, high: 100, critical_low: 40, critical_high: 130 },
    elderly: { low: 50, high: 90, critical_low: 40, critical_high: 120 },
    cardiac: { low: 50, high: 90, critical_low: 40, critical_high: 110 },
    unit: 'bpm'
  },
  bpSystolic: {
    adult: { low: 90, high: 140, critical_low: 80, critical_high: 180 },
    elderly: { low: 100, high: 150, critical_low: 90, critical_high: 180 },
    hypertensive: { low: 90, high: 130, critical_low: 80, critical_high: 160 },
    unit: 'mmHg'
  },
  bpDiastolic: {
    adult: { low: 60, high: 90, critical_low: 50, critical_high: 110 },
    elderly: { low: 60, high: 90, critical_low: 50, critical_high: 100 },
    unit: 'mmHg'
  },
  spO2: {
    adult: { low: 94, critical_low: 90 },
    respiratory: { low: 92, critical_low: 88 },
    copd: { low: 88, critical_low: 85 },  // COPD patients may have lower baseline
    unit: '%'
  },
  temperature: {
    adult: { low: 96.8, high: 99.5, critical_low: 95.0, critical_high: 103.0 },
    unit: '°F'
  },
  respiratoryRate: {
    adult: { low: 12, high: 20, critical_low: 8, critical_high: 30 },
    unit: 'breaths/min'
  },
  sugar: {
    adult: { low: 70, high: 180, critical_low: 50, critical_high: 400 },
    diabetic: { low: 70, high: 140, critical_low: 50, critical_high: 300 },
    unit: 'mg/dL'
  }
};

// Lab value thresholds
const LAB_THRESHOLDS = {
  potassium: {
    low: 3.5, high: 5.0, critical_low: 2.8, critical_high: 6.0,
    unit: 'mEq/L'
  },
  sodium: {
    low: 136, high: 145, critical_low: 125, critical_high: 155,
    unit: 'mEq/L'
  },
  creatinine: {
    high: 1.2, critical_high: 4.0,  // Context-dependent
    unit: 'mg/dL'
  },
  hemoglobin: {
    male: { low: 13.5, critical_low: 7.0 },
    female: { low: 12.0, critical_low: 7.0 },
    unit: 'g/dL'
  },
  platelets: {
    low: 150, critical_low: 50, critical_high: 450,
    unit: 'K/uL'
  },
  wbc: {
    low: 4.5, high: 11.0, critical_low: 1.0, critical_high: 30.0,
    unit: 'K/uL'
  },
  neutrophils: {
    low: 1.5, critical_low: 0.5,  // Neutropenia risk
    unit: 'K/uL'
  },
  inr: {
    therapeutic: { low: 2.0, high: 3.0 },  // For warfarin patients
    high: 1.1, critical_high: 5.0,
    unit: ''
  },
  glucose_fasting: {
    low: 70, high: 100, prediabetic: 125, critical_low: 50, critical_high: 400,
    unit: 'mg/dL'
  },
  hba1c: {
    target: 7.0, high: 9.0,  // Percent
    unit: '%'
  },
  troponin: {
    high: 0.04,  // ng/mL - elevated suggests cardiac injury
    unit: 'ng/mL'
  },
  bnp: {
    high: 100, critical_high: 500,  // pg/mL - heart failure marker
    unit: 'pg/mL'
  }
};

// NEWS2 (National Early Warning Score 2) parameters
const NEWS2_SCORING = {
  respiratoryRate: [
    { min: 0, max: 8, score: 3 },
    { min: 9, max: 11, score: 1 },
    { min: 12, max: 20, score: 0 },
    { min: 21, max: 24, score: 2 },
    { min: 25, max: Infinity, score: 3 }
  ],
  spO2_scale1: [  // For most patients
    { min: 0, max: 91, score: 3 },
    { min: 92, max: 93, score: 2 },
    { min: 94, max: 95, score: 1 },
    { min: 96, max: 100, score: 0 }
  ],
  spO2_scale2: [  // For COPD/hypercapnic respiratory failure
    { min: 0, max: 83, score: 3 },
    { min: 84, max: 85, score: 2 },
    { min: 86, max: 87, score: 1 },
    { min: 88, max: 92, score: 0 },
    { min: 93, max: 94, score: 1 },  // Too high for these patients
    { min: 95, max: 96, score: 2 },
    { min: 97, max: 100, score: 3 }
  ],
  supplementalO2: { yes: 2, no: 0 },
  temperature: [
    { min: 0, max: 95.0, score: 3 },
    { min: 95.1, max: 96.8, score: 1 },
    { min: 96.9, max: 100.4, score: 0 },
    { min: 100.5, max: 102.2, score: 1 },
    { min: 102.3, max: Infinity, score: 2 }
  ],
  bpSystolic: [
    { min: 0, max: 90, score: 3 },
    { min: 91, max: 100, score: 2 },
    { min: 101, max: 110, score: 1 },
    { min: 111, max: 219, score: 0 },
    { min: 220, max: Infinity, score: 3 }
  ],
  heartRate: [
    { min: 0, max: 40, score: 3 },
    { min: 41, max: 50, score: 1 },
    { min: 51, max: 90, score: 0 },
    { min: 91, max: 110, score: 1 },
    { min: 111, max: 130, score: 2 },
    { min: 131, max: Infinity, score: 3 }
  ],
  consciousness: {
    alert: 0,
    'voice-responsive': 3,
    'pain-responsive': 3,
    unresponsive: 3
  }
};

/**
 * Generate alerts based on patient vitals
 * @param {Object} patient - Patient object with vitals
 * @returns {Array} Array of alert objects
 */
function checkVitalAlerts(patient) {
  const alerts = [];
  const vitals = patient.vitals || {};
  const conditions = patient.conditions || [];
  const age = patient.age || patient.profile?.age || 50;
  
  // Determine patient profile for threshold selection
  const isElderly = age >= 65;
  const isCardiac = conditions.some(c => 
    /cardiac|heart|cad|arrhythmia|chf/i.test(c)
  );
  const isRespiratory = conditions.some(c => 
    /copd|asthma|respiratory|pulmonary/i.test(c)
  );
  const isDiabetic = conditions.some(c => 
    /diabetes|diabetic/i.test(c)
  );
  const isHypertensive = conditions.some(c => 
    /hypertension|htn/i.test(c)
  );

  // Check each vital sign
  const vitalChecks = [
    { key: 'heartRate', value: vitals.heartRate, profile: isCardiac ? 'cardiac' : (isElderly ? 'elderly' : 'adult') },
    { key: 'bpSystolic', value: vitals.bpSystolic, profile: isHypertensive ? 'hypertensive' : (isElderly ? 'elderly' : 'adult') },
    { key: 'bpDiastolic', value: vitals.bpDiastolic, profile: isElderly ? 'elderly' : 'adult' },
    { key: 'spO2', value: vitals.spO2, profile: isRespiratory ? 'respiratory' : 'adult' },
    { key: 'temperature', value: vitals.temperature, profile: 'adult' },
    { key: 'respiratoryRate', value: vitals.respiratoryRate, profile: 'adult' },
    { key: 'sugar', value: vitals.sugar, profile: isDiabetic ? 'diabetic' : 'adult' }
  ];

  for (const check of vitalChecks) {
    if (check.value === undefined || check.value === null) continue;
    
    const thresholds = VITAL_THRESHOLDS[check.key]?.[check.profile] || VITAL_THRESHOLDS[check.key]?.adult;
    if (!thresholds) continue;
    
    const unit = VITAL_THRESHOLDS[check.key].unit;
    const alert = evaluateThreshold(check.key, check.value, thresholds, unit);
    
    if (alert) {
      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Evaluate a value against thresholds
 */
function evaluateThreshold(parameter, value, thresholds, unit) {
  const parameterLabels = {
    heartRate: 'Heart Rate',
    bpSystolic: 'Systolic BP',
    bpDiastolic: 'Diastolic BP',
    spO2: 'Oxygen Saturation',
    temperature: 'Temperature',
    respiratoryRate: 'Respiratory Rate',
    sugar: 'Blood Glucose'
  };

  // Critical low
  if (thresholds.critical_low !== undefined && value < thresholds.critical_low) {
    return {
      alertType: 'Vital',
      severity: 'Critical',
      parameter,
      value,
      threshold: thresholds.critical_low,
      message: `CRITICAL: ${parameterLabels[parameter] || parameter} critically low at ${value} ${unit} (threshold: ${thresholds.critical_low} ${unit})`,
      direction: 'low',
      createdAt: new Date()
    };
  }
  
  // Critical high
  if (thresholds.critical_high !== undefined && value > thresholds.critical_high) {
    return {
      alertType: 'Vital',
      severity: 'Critical',
      parameter,
      value,
      threshold: thresholds.critical_high,
      message: `CRITICAL: ${parameterLabels[parameter] || parameter} critically high at ${value} ${unit} (threshold: ${thresholds.critical_high} ${unit})`,
      direction: 'high',
      createdAt: new Date()
    };
  }
  
  // Warning low
  if (thresholds.low !== undefined && value < thresholds.low) {
    return {
      alertType: 'Vital',
      severity: 'Warning',
      parameter,
      value,
      threshold: thresholds.low,
      message: `${parameterLabels[parameter] || parameter} below normal at ${value} ${unit} (expected: >${thresholds.low} ${unit})`,
      direction: 'low',
      createdAt: new Date()
    };
  }
  
  // Warning high
  if (thresholds.high !== undefined && value > thresholds.high) {
    return {
      alertType: 'Vital',
      severity: 'Warning',
      parameter,
      value,
      threshold: thresholds.high,
      message: `${parameterLabels[parameter] || parameter} above normal at ${value} ${unit} (expected: <${thresholds.high} ${unit})`,
      direction: 'high',
      createdAt: new Date()
    };
  }
  
  return null;
}

/**
 * Calculate NEWS2 score for deterioration risk
 * @param {Object} vitals - Patient vitals
 * @param {Object} options - Additional options (e.g., supplementalO2, consciousness)
 * @returns {Object} NEWS2 assessment
 */
function calculateNEWS2(vitals, options = {}) {
  const {
    supplementalO2 = false,
    consciousness = 'alert',
    useSpO2Scale2 = false  // For COPD patients
  } = options;

  let totalScore = 0;
  const breakdown = {};

  // Respiratory rate
  if (vitals.respiratoryRate !== undefined) {
    const rrScore = NEWS2_SCORING.respiratoryRate.find(
      r => vitals.respiratoryRate >= r.min && vitals.respiratoryRate <= r.max
    )?.score || 0;
    breakdown.respiratoryRate = { value: vitals.respiratoryRate, score: rrScore };
    totalScore += rrScore;
  }

  // SpO2
  if (vitals.spO2 !== undefined) {
    const spO2Scale = useSpO2Scale2 ? NEWS2_SCORING.spO2_scale2 : NEWS2_SCORING.spO2_scale1;
    const spO2Score = spO2Scale.find(
      r => vitals.spO2 >= r.min && vitals.spO2 <= r.max
    )?.score || 0;
    breakdown.spO2 = { value: vitals.spO2, score: spO2Score, scale: useSpO2Scale2 ? 2 : 1 };
    totalScore += spO2Score;
  }

  // Supplemental O2
  const o2Score = supplementalO2 ? NEWS2_SCORING.supplementalO2.yes : NEWS2_SCORING.supplementalO2.no;
  breakdown.supplementalO2 = { value: supplementalO2, score: o2Score };
  totalScore += o2Score;

  // Temperature (convert if needed - assuming Fahrenheit input)
  if (vitals.temperature !== undefined) {
    const tempScore = NEWS2_SCORING.temperature.find(
      r => vitals.temperature >= r.min && vitals.temperature <= r.max
    )?.score || 0;
    breakdown.temperature = { value: vitals.temperature, score: tempScore };
    totalScore += tempScore;
  }

  // Systolic BP
  if (vitals.bpSystolic !== undefined) {
    const bpScore = NEWS2_SCORING.bpSystolic.find(
      r => vitals.bpSystolic >= r.min && vitals.bpSystolic <= r.max
    )?.score || 0;
    breakdown.bpSystolic = { value: vitals.bpSystolic, score: bpScore };
    totalScore += bpScore;
  }

  // Heart rate
  if (vitals.heartRate !== undefined) {
    const hrScore = NEWS2_SCORING.heartRate.find(
      r => vitals.heartRate >= r.min && vitals.heartRate <= r.max
    )?.score || 0;
    breakdown.heartRate = { value: vitals.heartRate, score: hrScore };
    totalScore += hrScore;
  }

  // Consciousness
  const consciousnessScore = NEWS2_SCORING.consciousness[consciousness.toLowerCase()] || 0;
  breakdown.consciousness = { value: consciousness, score: consciousnessScore };
  totalScore += consciousnessScore;

  // Determine risk level
  let riskLevel, clinicalResponse;
  if (totalScore >= 7 || breakdown.consciousness?.score === 3) {
    riskLevel = 'High';
    clinicalResponse = 'Emergency response - immediate senior clinical review, consider ICU transfer';
  } else if (totalScore >= 5) {
    riskLevel = 'Medium';
    clinicalResponse = 'Urgent response - senior clinical review within 1 hour';
  } else if (totalScore >= 1) {
    riskLevel = 'Low-Medium';
    clinicalResponse = 'Ward-based response - increase monitoring frequency';
  } else {
    riskLevel = 'Low';
    clinicalResponse = 'Continue routine monitoring';
  }

  return {
    score: totalScore,
    riskLevel,
    clinicalResponse,
    breakdown,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Calculate qSOFA score for sepsis screening
 * @param {Object} vitals - Patient vitals
 * @param {String} mentalStatus - Mental status (normal, altered)
 * @returns {Object} qSOFA assessment
 */
function calculateQSOFA(vitals, mentalStatus = 'normal') {
  let score = 0;
  const criteria = [];

  // Respiratory rate >= 22
  if (vitals.respiratoryRate >= 22) {
    score += 1;
    criteria.push({ criterion: 'Respiratory rate ≥ 22/min', met: true, value: vitals.respiratoryRate });
  } else if (vitals.respiratoryRate !== undefined) {
    criteria.push({ criterion: 'Respiratory rate ≥ 22/min', met: false, value: vitals.respiratoryRate });
  }

  // Altered mental status
  if (mentalStatus.toLowerCase() !== 'normal' && mentalStatus.toLowerCase() !== 'alert') {
    score += 1;
    criteria.push({ criterion: 'Altered mental status', met: true, value: mentalStatus });
  } else {
    criteria.push({ criterion: 'Altered mental status', met: false, value: mentalStatus });
  }

  // Systolic BP <= 100
  if (vitals.bpSystolic <= 100) {
    score += 1;
    criteria.push({ criterion: 'Systolic BP ≤ 100 mmHg', met: true, value: vitals.bpSystolic });
  } else if (vitals.bpSystolic !== undefined) {
    criteria.push({ criterion: 'Systolic BP ≤ 100 mmHg', met: false, value: vitals.bpSystolic });
  }

  // Interpretation
  const sepsisRisk = score >= 2 ? 'High' : 'Low';
  const recommendation = score >= 2 
    ? 'High suspicion for sepsis - initiate sepsis workup, consider early antibiotics and lactate measurement'
    : 'Continue monitoring for clinical deterioration';

  return {
    score,
    criteria,
    sepsisRisk,
    recommendation,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Comprehensive alert generation for a patient
 * @param {Object} patient - Full patient object
 * @returns {Object} Complete alert analysis
 */
async function generatePatientAlerts(patient) {
  const alerts = [];
  
  // 1. Vital sign alerts
  const vitalAlerts = checkVitalAlerts(patient);
  alerts.push(...vitalAlerts);
  
  // 2. Calculate deterioration scores
  const news2 = calculateNEWS2(patient.vitals || {}, {
    useSpO2Scale2: (patient.conditions || []).some(c => /copd/i.test(c))
  });
  
  const qsofa = calculateQSOFA(patient.vitals || {});
  
  // 3. Add deterioration alerts if warranted
  if (news2.riskLevel === 'High') {
    alerts.push({
      alertType: 'Deterioration',
      severity: 'Critical',
      parameter: 'NEWS2',
      value: news2.score,
      threshold: 7,
      message: `NEWS2 score ${news2.score}: ${news2.clinicalResponse}`,
      createdAt: new Date()
    });
  } else if (news2.riskLevel === 'Medium') {
    alerts.push({
      alertType: 'Deterioration',
      severity: 'Warning',
      parameter: 'NEWS2',
      value: news2.score,
      threshold: 5,
      message: `NEWS2 score ${news2.score}: ${news2.clinicalResponse}`,
      createdAt: new Date()
    });
  }
  
  if (qsofa.sepsisRisk === 'High') {
    alerts.push({
      alertType: 'Deterioration',
      severity: 'Critical',
      parameter: 'qSOFA',
      value: qsofa.score,
      threshold: 2,
      message: `qSOFA score ${qsofa.score}/3: ${qsofa.recommendation}`,
      createdAt: new Date()
    });
  }
  
  // 4. Sort by severity
  const severityOrder = { 'Critical': 0, 'Warning': 1, 'Info': 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    alerts,
    alertCount: {
      critical: alerts.filter(a => a.severity === 'Critical').length,
      warning: alerts.filter(a => a.severity === 'Warning').length,
      info: alerts.filter(a => a.severity === 'Info').length
    },
    deteriorationScores: {
      news2,
      qsofa
    },
    requiresImmediateAttention: alerts.some(a => a.severity === 'Critical'),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Save alerts to patient record
 * @param {String} patientId - Patient ID
 * @param {Array} alerts - Alerts to save
 */
async function savePatientAlerts(patientId, alerts) {
  try {
    await Patient.findOneAndUpdate(
      { patientId },
      { 
        $push: { 
          alerts: { 
            $each: alerts,
            $slice: -50  // Keep last 50 alerts
          } 
        }
      }
    );
    return { success: true, alertsSaved: alerts.length };
  } catch (error) {
    console.error('Error saving alerts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Acknowledge an alert
 * @param {String} patientId - Patient ID
 * @param {String} alertId - Alert ID
 * @param {String} acknowledgedBy - User who acknowledged
 */
async function acknowledgeAlert(patientId, alertId, acknowledgedBy) {
  try {
    await Patient.findOneAndUpdate(
      { patientId, 'alerts._id': alertId },
      { 
        $set: { 
          'alerts.$.acknowledged': true,
          'alerts.$.acknowledgedBy': acknowledgedBy,
          'alerts.$.acknowledgedAt': new Date()
        }
      }
    );
    return { success: true };
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get unacknowledged alerts for a patient
 * @param {String} patientId - Patient ID
 */
async function getUnacknowledgedAlerts(patientId) {
  try {
    const patient = await Patient.findOne({ patientId });
    if (!patient) return { alerts: [], error: 'Patient not found' };
    
    const unacknowledged = (patient.alerts || []).filter(a => !a.acknowledged);
    return { 
      alerts: unacknowledged,
      count: unacknowledged.length
    };
  } catch (error) {
    console.error('Error getting alerts:', error);
    return { alerts: [], error: error.message };
  }
}

module.exports = {
  checkVitalAlerts,
  calculateNEWS2,
  calculateQSOFA,
  generatePatientAlerts,
  savePatientAlerts,
  acknowledgeAlert,
  getUnacknowledgedAlerts,
  VITAL_THRESHOLDS,
  LAB_THRESHOLDS,
  NEWS2_SCORING
};
