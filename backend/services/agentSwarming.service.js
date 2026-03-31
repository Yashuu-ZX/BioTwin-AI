/**
 * Dynamic Agent Swarming Service
 * 
 * Implements the Agent-as-a-Manager pattern where main agents can:
 * - Dynamically spawn sub-agents based on case complexity
 * - Call specialist agents for specific consultations
 * - Manage temporary agent lifecycles
 * 
 * Sub-agents are lightweight, task-specific agents that:
 * - Appear temporarily in the UI
 * - Provide specialized rulings
 * - Return results to the summoning agent
 */

const EventEmitter = require('events');

// Sub-agent registry
const SUB_AGENTS = {
  cardiologist: {
    id: 'cardiologist',
    name: 'Cardiologist',
    specialty: 'Cardiovascular Medicine',
    avatar: '❤️',
    color: '#ec4899',
    expertise: ['heart_failure', 'arrhythmia', 'cad', 'hypertension', 'cv_risk'],
    triggers: ['cardiovascular', 'heart', 'cardiac', 'arrhythmia', 'coronary', 'atrial', 'ventricular']
  },
  neurologist: {
    id: 'neurologist',
    name: 'Neurologist',
    specialty: 'Neurology',
    avatar: '🧠',
    color: '#8b5cf6',
    expertise: ['epilepsy', 'parkinsons', 'alzheimers', 'migraine', 'neuropathy'],
    triggers: ['neurological', 'brain', 'seizure', 'cognitive', 'tremor', 'neuropathy', 'dementia']
  },
  nephrologist: {
    id: 'nephrologist',
    name: 'Nephrologist',
    specialty: 'Nephrology',
    avatar: '🫘',
    color: '#0ea5e9',
    expertise: ['ckd', 'dialysis', 'renal_dosing', 'electrolytes'],
    triggers: ['kidney', 'renal', 'ckd', 'creatinine', 'gfr', 'dialysis']
  },
  oncologist: {
    id: 'oncologist',
    name: 'Oncologist',
    specialty: 'Oncology',
    avatar: '🔬',
    color: '#f43f5e',
    expertise: ['chemotherapy', 'immunotherapy', 'targeted_therapy', 'tumor_markers'],
    triggers: ['cancer', 'tumor', 'malignant', 'oncology', 'chemotherapy', 'metastatic']
  },
  rheumatologist: {
    id: 'rheumatologist',
    name: 'Rheumatologist',
    specialty: 'Rheumatology',
    avatar: '🦴',
    color: '#f59e0b',
    expertise: ['autoimmune', 'arthritis', 'lupus', 'biologics'],
    triggers: ['rheumatoid', 'lupus', 'autoimmune', 'joint', 'arthritis', 'inflammatory']
  },
  psychiatrist: {
    id: 'psychiatrist',
    name: 'Psychiatrist',
    specialty: 'Psychiatry',
    avatar: '🧘',
    color: '#14b8a6',
    expertise: ['depression', 'anxiety', 'psychosis', 'mood_disorders'],
    triggers: ['psychiatric', 'mental', 'depression', 'anxiety', 'psychosis', 'mood']
  },
  pulmonologist: {
    id: 'pulmonologist',
    name: 'Pulmonologist',
    specialty: 'Pulmonology',
    avatar: '🫁',
    color: '#06b6d4',
    expertise: ['copd', 'asthma', 'pulmonary_fibrosis', 'respiratory'],
    triggers: ['lung', 'respiratory', 'copd', 'asthma', 'pulmonary', 'breathing']
  },
  hepatologist: {
    id: 'hepatologist',
    name: 'Hepatologist',
    specialty: 'Hepatology',
    avatar: '🫀',
    color: '#84cc16',
    expertise: ['liver_disease', 'hepatitis', 'cirrhosis', 'hepatotoxicity'],
    triggers: ['liver', 'hepatic', 'cirrhosis', 'hepatitis', 'hepatotoxic']
  },
  infectious_disease: {
    id: 'infectious_disease',
    name: 'Infectious Disease Specialist',
    specialty: 'Infectious Disease',
    avatar: '🦠',
    color: '#f97316',
    expertise: ['antibiotics', 'antivirals', 'resistant_organisms', 'prophylaxis'],
    triggers: ['infection', 'antibiotic', 'sepsis', 'bacterial', 'viral', 'resistant']
  }
};

// Active sub-agent sessions
const activeSubAgents = new Map();

/**
 * Detect if a sub-agent should be summoned based on patient data
 */
function detectRequiredSpecialists(patientData, agentAnalyses = {}) {
  const requiredSpecialists = [];
  
  const conditions = [
    ...(patientData.conditions || []),
    ...(patientData.medicalHistory?.conditions || [])
  ].map(c => c.toLowerCase());
  
  const medications = (patientData.medications || []).map(m => (m.name || '').toLowerCase());
  const notes = JSON.stringify(patientData).toLowerCase();
  
  // Check each sub-agent's triggers
  Object.values(SUB_AGENTS).forEach(subAgent => {
    const triggerFound = subAgent.triggers.some(trigger => {
      return conditions.some(c => c.includes(trigger)) ||
             medications.some(m => m.includes(trigger)) ||
             notes.includes(trigger);
    });
    
    if (triggerFound) {
      requiredSpecialists.push({
        ...subAgent,
        triggerReason: `Detected ${subAgent.specialty.toLowerCase()} relevance in patient data`
      });
    }
  });
  
  return requiredSpecialists;
}

/**
 * Summon a sub-agent for consultation
 */
function summonSubAgent(subAgentId, summoningAgent, patientData, question) {
  const subAgent = SUB_AGENTS[subAgentId];
  if (!subAgent) {
    throw new Error(`Unknown sub-agent: ${subAgentId}`);
  }
  
  const sessionId = `sub_${subAgentId}_${Date.now()}`;
  
  const session = {
    id: sessionId,
    subAgent,
    summoningAgent,
    patientData,
    question,
    status: 'active',
    startTime: Date.now(),
    response: null
  };
  
  activeSubAgents.set(sessionId, session);
  
  return session;
}

/**
 * Generate sub-agent response (mock/rule-based)
 */
function generateSubAgentResponse(subAgentId, patientData, question) {
  const subAgent = SUB_AGENTS[subAgentId];
  if (!subAgent) return null;
  
  const responses = {
    cardiologist: generateCardiologistResponse,
    neurologist: generateNeurologistResponse,
    nephrologist: generateNephrologistResponse,
    oncologist: generateOncologistResponse,
    rheumatologist: generateRheumatologistResponse,
    psychiatrist: generatePsychiatristResponse,
    pulmonologist: generatePulmonologistResponse,
    hepatologist: generateHepatologistResponse,
    infectious_disease: generateInfectiousDiseaseResponse
  };
  
  const generator = responses[subAgentId];
  if (generator) {
    return generator(patientData, question);
  }
  
  return {
    ruling: 'Consultation complete. No specific concerns identified.',
    confidence: 0.7,
    recommendations: []
  };
}

// Sub-agent response generators
function generateCardiologistResponse(patientData, question) {
  const vitals = patientData.vitals || {};
  const conditions = (patientData.conditions || []).map(c => c.toLowerCase());
  
  let ruling = '';
  let confidence = 0.8;
  const recommendations = [];
  
  // Check for cardiovascular markers
  if (vitals.bpSystolic > 140 || vitals.bpDiastolic > 90) {
    ruling = 'Elevated blood pressure detected. ';
    recommendations.push('Consider ACE inhibitor or ARB optimization');
    recommendations.push('Home BP monitoring recommended');
  }
  
  if (conditions.some(c => c.includes('heart') || c.includes('cardiac'))) {
    ruling += 'Cardiovascular history noted. ';
    recommendations.push('ASCVD risk assessment recommended');
    recommendations.push('Consider statin therapy if not contraindicated');
    confidence = 0.85;
  }
  
  if (conditions.some(c => c.includes('atrial') || c.includes('arrhythmia'))) {
    ruling += 'Arrhythmia history detected. ';
    recommendations.push('CHA2DS2-VASc score evaluation for anticoagulation');
    recommendations.push('Rate/rhythm control strategy review');
    confidence = 0.9;
  }
  
  if (!ruling) {
    ruling = 'No immediate cardiovascular concerns identified. Routine monitoring recommended.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations,
    cvRiskLevel: vitals.bpSystolic > 140 ? 'elevated' : 'moderate'
  };
}

function generateNeurologistResponse(patientData, question) {
  const conditions = (patientData.conditions || []).map(c => c.toLowerCase());
  const medications = (patientData.medications || []).map(m => (m.name || '').toLowerCase());
  
  let ruling = '';
  let confidence = 0.8;
  const recommendations = [];
  
  if (conditions.some(c => c.includes('alzheimer') || c.includes('dementia'))) {
    ruling = 'Cognitive impairment noted. ';
    recommendations.push('Cholinesterase inhibitor consideration (donepezil, rivastigmine)');
    recommendations.push('Avoid anticholinergic medications');
    recommendations.push('Cognitive assessment follow-up');
    confidence = 0.85;
  }
  
  if (conditions.some(c => c.includes('parkinson'))) {
    ruling += 'Parkinsonian features detected. ';
    recommendations.push('Levodopa optimization if motor fluctuations present');
    recommendations.push('Avoid dopamine antagonists (metoclopramide, antipsychotics)');
    confidence = 0.88;
  }
  
  if (conditions.some(c => c.includes('migraine'))) {
    ruling += 'Migraine history noted. ';
    recommendations.push('Assess triptan contraindications');
    recommendations.push('Consider CGRP antagonist for prevention if frequent');
  }
  
  if (conditions.some(c => c.includes('neuropathy'))) {
    ruling += 'Neuropathy detected. ';
    recommendations.push('Gabapentin or pregabalin for neuropathic pain');
    recommendations.push('B12 and glucose level monitoring');
  }
  
  if (!ruling) {
    ruling = 'No acute neurological concerns. Baseline cognitive screening may be beneficial.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations,
    needsFollowUp: conditions.some(c => c.includes('dementia') || c.includes('parkinson'))
  };
}

function generateNephrologistResponse(patientData, question) {
  const vitals = patientData.vitals || {};
  const biomarkers = patientData.biomarkers || {};
  
  let ruling = '';
  let confidence = 0.8;
  const recommendations = [];
  
  const creatinine = biomarkers.creatinine || vitals.creatinine;
  const gfr = biomarkers.gfr || biomarkers.eGFR;
  
  if (gfr && gfr < 60) {
    ruling = `CKD Stage ${gfr < 30 ? '4' : gfr < 45 ? '3b' : '3a'} (eGFR: ${gfr}). `;
    recommendations.push('Renal dosing required for renally-cleared medications');
    recommendations.push('Avoid nephrotoxic agents (NSAIDs, contrast, aminoglycosides)');
    recommendations.push('Monitor electrolytes closely');
    confidence = 0.9;
    
    if (gfr < 30) {
      recommendations.push('Nephrology referral recommended');
      recommendations.push('Consider dialysis planning discussion');
    }
  }
  
  if (creatinine && creatinine > 1.5) {
    ruling += 'Elevated creatinine noted. ';
    recommendations.push('Assess for acute vs chronic kidney injury');
    recommendations.push('Medication review for nephrotoxicity');
  }
  
  if (!ruling) {
    ruling = 'Renal function appears adequate. Standard medication dosing appropriate.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations,
    renalAdjustmentRequired: gfr && gfr < 60
  };
}

function generateOncologistResponse(patientData, question) {
  const genomics = patientData.biomarkers?.genomics || {};
  const conditions = (patientData.conditions || []).map(c => c.toLowerCase());
  
  let ruling = '';
  let confidence = 0.75;
  const recommendations = [];
  
  if (genomics.microsatelliteStatus === 'MSI-H') {
    ruling = 'MSI-H tumor status detected - immunotherapy eligible. ';
    recommendations.push('Pembrolizumab or dostarlimab consideration');
    recommendations.push('PD-L1 testing if not already done');
    confidence = 0.9;
  }
  
  if (genomics.herStatus === 'Positive') {
    ruling += 'HER2-positive status detected. ';
    recommendations.push('HER2-targeted therapy (trastuzumab, T-DXd)');
    recommendations.push('Cardiac monitoring with HER2 agents');
    confidence = 0.88;
  }
  
  if (conditions.some(c => c.includes('cancer') || c.includes('malignant'))) {
    ruling += 'Active malignancy noted. ';
    recommendations.push('Tumor board review recommended');
    recommendations.push('Consider supportive care needs');
  }
  
  if (!ruling) {
    ruling = 'No specific oncology concerns identified. Standard surveillance protocols apply.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations,
    requiresTumorBoard: conditions.some(c => c.includes('cancer'))
  };
}

function generateRheumatologistResponse(patientData, question) {
  const conditions = (patientData.conditions || []).map(c => c.toLowerCase());
  
  let ruling = '';
  let confidence = 0.8;
  const recommendations = [];
  
  if (conditions.some(c => c.includes('rheumatoid') || c.includes('ra'))) {
    ruling = 'Rheumatoid arthritis noted. ';
    recommendations.push('DMARD optimization (methotrexate, sulfasalazine)');
    recommendations.push('Consider biologic if inadequate response');
    recommendations.push('Monitor for extra-articular manifestations');
    confidence = 0.85;
  }
  
  if (conditions.some(c => c.includes('lupus') || c.includes('sle'))) {
    ruling += 'Systemic lupus noted. ';
    recommendations.push('Hydroxychloroquine if not already on');
    recommendations.push('Renal function monitoring');
    recommendations.push('UV protection counseling');
  }
  
  if (!ruling) {
    ruling = 'No specific rheumatologic concerns identified.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations
  };
}

function generatePsychiatristResponse(patientData, question) {
  const conditions = (patientData.conditions || []).map(c => c.toLowerCase());
  const medications = (patientData.medications || []).map(m => (m.name || '').toLowerCase());
  
  let ruling = '';
  let confidence = 0.8;
  const recommendations = [];
  
  const onPsychMeds = medications.some(m => 
    ['ssri', 'snri', 'antidepressant', 'sertraline', 'fluoxetine', 'escitalopram', 'bupropion', 'venlafaxine'].some(p => m.includes(p))
  );
  
  if (conditions.some(c => c.includes('depression'))) {
    ruling = 'Depression noted. ';
    recommendations.push(onPsychMeds ? 'Monitor current therapy efficacy' : 'Consider SSRI initiation');
    recommendations.push('PHQ-9 monitoring recommended');
    confidence = 0.85;
  }
  
  if (conditions.some(c => c.includes('anxiety'))) {
    ruling += 'Anxiety disorder noted. ';
    recommendations.push('GAD-7 monitoring recommended');
    recommendations.push('Consider CBT referral');
  }
  
  if (!ruling) {
    ruling = 'No acute psychiatric concerns identified. Routine mental health screening appropriate.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations
  };
}

function generatePulmonologistResponse(patientData, question) {
  const conditions = (patientData.conditions || []).map(c => c.toLowerCase());
  
  let ruling = '';
  let confidence = 0.8;
  const recommendations = [];
  
  if (conditions.some(c => c.includes('copd'))) {
    ruling = 'COPD noted. ';
    recommendations.push('Inhaler technique assessment');
    recommendations.push('LAMA/LABA optimization');
    recommendations.push('Pulmonary rehabilitation referral');
    confidence = 0.85;
  }
  
  if (conditions.some(c => c.includes('asthma'))) {
    ruling += 'Asthma noted. ';
    recommendations.push('Step therapy assessment');
    recommendations.push('ICS compliance monitoring');
    recommendations.push('Asthma action plan review');
  }
  
  if (!ruling) {
    ruling = 'No specific pulmonary concerns identified.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations
  };
}

function generateHepatologistResponse(patientData, question) {
  const biomarkers = patientData.biomarkers || {};
  const medications = (patientData.medications || []).map(m => (m.name || '').toLowerCase());
  
  let ruling = '';
  let confidence = 0.8;
  const recommendations = [];
  
  // Check for hepatotoxic medications
  const hepatotoxicMeds = ['acetaminophen', 'methotrexate', 'amiodarone', 'statins'];
  const onHepatotoxic = medications.some(m => hepatotoxicMeds.some(h => m.includes(h)));
  
  if (onHepatotoxic) {
    ruling = 'Hepatotoxic medication(s) detected. ';
    recommendations.push('LFT monitoring recommended');
    recommendations.push('Assess for signs of hepatotoxicity');
    confidence = 0.85;
  }
  
  if (biomarkers.alt > 40 || biomarkers.ast > 40) {
    ruling += 'Elevated liver enzymes noted. ';
    recommendations.push('Medication-induced liver injury assessment');
    recommendations.push('Hepatitis panel if not done');
  }
  
  if (!ruling) {
    ruling = 'No specific hepatology concerns identified.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations
  };
}

function generateInfectiousDiseaseResponse(patientData, question) {
  const medications = (patientData.medications || []).map(m => (m.name || '').toLowerCase());
  
  let ruling = '';
  let confidence = 0.8;
  const recommendations = [];
  
  const onAntibiotics = medications.some(m => 
    ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline', 'metronidazole'].some(a => m.includes(a))
  );
  
  if (onAntibiotics) {
    ruling = 'Active antibiotic therapy noted. ';
    recommendations.push('Antibiotic stewardship review');
    recommendations.push('Assess duration and de-escalation opportunity');
    confidence = 0.85;
  }
  
  if (!ruling) {
    ruling = 'No acute infectious disease concerns identified.';
  }
  
  return {
    ruling: ruling.trim(),
    confidence,
    recommendations
  };
}

/**
 * Complete sub-agent session
 */
function completeSubAgentSession(sessionId, response) {
  const session = activeSubAgents.get(sessionId);
  if (session) {
    session.status = 'complete';
    session.response = response;
    session.endTime = Date.now();
    
    // Clean up after a delay
    setTimeout(() => {
      activeSubAgents.delete(sessionId);
    }, 60000);
  }
  return session;
}

/**
 * Get all active sub-agents
 */
function getActiveSubAgents() {
  return Array.from(activeSubAgents.values());
}

/**
 * Get sub-agent by ID
 */
function getSubAgent(subAgentId) {
  return SUB_AGENTS[subAgentId];
}

/**
 * List all available sub-agents
 */
function listSubAgents() {
  return Object.values(SUB_AGENTS);
}

module.exports = {
  SUB_AGENTS,
  detectRequiredSpecialists,
  summonSubAgent,
  generateSubAgentResponse,
  completeSubAgentSession,
  getActiveSubAgents,
  getSubAgent,
  listSubAgents
};
