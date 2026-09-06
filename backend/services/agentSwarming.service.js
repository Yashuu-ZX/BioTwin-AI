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
  cardiologist: {
    id: 'cardiologist',
    name: 'Cardiologist',
    specialty: 'Cardiovascular Medicine',
    avatar: '❤️',
    color: '#ec4899',
    expertise: ['heart_failure', 'arrhythmia', 'cad', 'hypertension', 'cv_risk'],
    triggers: ['cardiovascular', 'heart', 'cardiac', 'arrhythmia', 'coronary', 'atrial', 'ventricular']
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
    nephrologist: generateNephrologistResponse,
    oncologist: generateOncologistResponse
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

// Neurologist response removed


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

// Removed other specialty generators (neurologist, rheumatologist, psychiatrist, pulmonologist, hepatologist, infectious disease)


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
