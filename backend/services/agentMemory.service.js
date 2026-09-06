/**
 * Agent Memory & Self-Reflection Service
 * 
 * Simplified Version.
 * Retains basic case history logging for demonstration without complex 
 * reflective pattern matching.
 */

// In-memory store for agent memories (simplified)
const agentMemories = {
  geneticist: [],
  pharmacologist: [],
  endocrinologist: [],
  hera: []
};

// Memory types
const MEMORY_TYPES = {
  VETO_RECEIVED: 'veto_received',
  RECOMMENDATION_SUCCESS: 'recommendation_success',
  DRUG_INTERACTION_LEARNED: 'drug_interaction_learned',
  BUDGET_CONSTRAINT_LEARNED: 'budget_constraint_learned',
  PATIENT_PATTERN: 'patient_pattern',
  CONSENSUS_ACHIEVED: 'consensus_achieved'
};

const MAX_MEMORIES_PER_AGENT = 10;

function storeMemory(agentId, memory) {
  if (!agentMemories[agentId]) {
    agentMemories[agentId] = [];
  }
  
  const memoryEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId,
    timestamp: Date.now(),
    ...memory
  };
  
  agentMemories[agentId].unshift(memoryEntry);
  if (agentMemories[agentId].length > MAX_MEMORIES_PER_AGENT) {
    agentMemories[agentId] = agentMemories[agentId].slice(0, MAX_MEMORIES_PER_AGENT);
  }
  
  return memoryEntry;
}

function queryMemories(agentId, query = {}) {
  return []; // Simplified: return empty or basic history
}

// Replaced complex reflections with empty array
function getReflections(agentId, patientContext) {
  return [];
}

function recordHeraVeto(patientContext, vetoDetails) {
  return storeMemory('hera', {
    type: MEMORY_TYPES.VETO_RECEIVED,
    vetoReason: vetoDetails.reason,
    timestamp: Date.now()
  });
}

function recordSuccessfulRecommendation(agentId, patientContext, recommendation) {
  return storeMemory(agentId, {
    type: MEMORY_TYPES.RECOMMENDATION_SUCCESS,
    timestamp: Date.now()
  });
}

function recordDrugInteraction(drugs, severity, description) {
  return storeMemory('pharmacologist', {
    type: MEMORY_TYPES.DRUG_INTERACTION_LEARNED,
    description
  });
}

function recordBudgetLearning(budgetRange, successfulAlternative) {
  return storeMemory('hera', {
    type: MEMORY_TYPES.BUDGET_CONSTRAINT_LEARNED
  });
}

// Generating reflection message now returns null to remove "fake memory" UI chatter
function generateReflectionMessage(agentId, patientContext) {
  return null;
}

function getAllMemories() {
  return agentMemories;
}

function clearAllMemories() {
  Object.keys(agentMemories).forEach(key => {
    agentMemories[key] = [];
  });
}

module.exports = {
  storeMemory,
  queryMemories,
  getReflections,
  recordHeraVeto,
  recordSuccessfulRecommendation,
  recordDrugInteraction,
  recordBudgetLearning,
  generateReflectionMessage,
  getAllMemories,
  clearAllMemories,
  MEMORY_TYPES
};
