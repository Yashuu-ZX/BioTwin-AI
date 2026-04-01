/**
 * Agent Memory & Self-Reflection Service
 * 
 * Implements episodic memory for agents to learn from past cases.
 * Each agent maintains a memory of:
 * - Past recommendations and outcomes
 * - HERA vetoes and their reasons
 * - Successful drug combinations
 * - Patient profile patterns
 * 
 * This enables agents to proactively adjust recommendations based on historical data.
 */

const EventEmitter = require('events');

// In-memory store for agent memories (would be persisted to DB in production)
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

// Maximum memories per agent
const MAX_MEMORIES_PER_AGENT = 50;

/**
 * Store a new memory for an agent
 */
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
  
  // Trim old memories
  if (agentMemories[agentId].length > MAX_MEMORIES_PER_AGENT) {
    agentMemories[agentId] = agentMemories[agentId].slice(0, MAX_MEMORIES_PER_AGENT);
  }
  
  return memoryEntry;
}

/**
 * Query memories based on conditions
 */
function queryMemories(agentId, query = {}) {
  const memories = agentMemories[agentId] || [];
  
  return memories.filter(memory => {
    if (query.type && memory.type !== query.type) return false;
    if (query.drug && !memory.drugs?.includes(query.drug)) return false;
    if (query.condition && !memory.conditions?.includes(query.condition)) return false;
    if (query.budgetRange) {
      if (memory.budgetConstraint < query.budgetRange.min || 
          memory.budgetConstraint > query.budgetRange.max) return false;
    }
    return true;
  });
}

/**
 * Get relevant reflections for a patient case
 * This is the key method that agents call to "reflect" on past cases
 */
function getReflections(agentId, patientContext) {
  const memories = agentMemories[agentId] || [];
  const reflections = [];
  
  const patientBudget = patientContext.socioEconomic?.monthlyMedicationBudget || 150;
  const patientConditions = patientContext.conditions || patientContext.medicalHistory?.conditions || [];
  const patientMeds = patientContext.medications?.map(m => m.name?.toLowerCase()) || [];
  
  // Find relevant vetoes from HERA
  const heraVetoes = queryMemories('hera', { type: MEMORY_TYPES.VETO_RECEIVED });
  
  // Check if any vetoed drugs are in current medications or similar budget constraints
  heraVetoes.forEach(veto => {
    if (veto.budgetConstraint && Math.abs(veto.budgetConstraint - patientBudget) < 50) {
      reflections.push({
        type: 'budget_warning',
        message: `Recalling HERA veto from ${formatTimeAgo(veto.timestamp)}: "${veto.vetoReason}". Similar budget constraints detected.`,
        relevance: 0.9,
        source: veto
      });
    }
    
    if (veto.drugs && patientMeds.some(med => veto.drugs.includes(med))) {
      reflections.push({
        type: 'drug_veto_history',
        message: `Previous case with ${veto.drugs.join(', ')} was vetoed. Reason: ${veto.vetoReason}`,
        relevance: 0.95,
        source: veto
      });
    }
  });
  
  // Check for successful recommendations with similar conditions
  const successfulRecs = queryMemories(agentId, { type: MEMORY_TYPES.RECOMMENDATION_SUCCESS });
  
  successfulRecs.forEach(rec => {
    const conditionOverlap = rec.conditions?.filter(c => 
      patientConditions.some(pc => pc.toLowerCase().includes(c.toLowerCase()))
    );
    
    if (conditionOverlap && conditionOverlap.length > 0) {
      reflections.push({
        type: 'successful_pattern',
        message: `Similar case (${conditionOverlap.join(', ')}) reached consensus with: ${rec.recommendation}`,
        relevance: 0.7,
        source: rec
      });
    }
  });
  
  // Check for learned drug interactions
  const interactions = queryMemories('pharmacologist', { type: MEMORY_TYPES.DRUG_INTERACTION_LEARNED });
  
  interactions.forEach(interaction => {
    const drugMatch = interaction.drugs?.some(d => patientMeds.includes(d.toLowerCase()));
    if (drugMatch) {
      reflections.push({
        type: 'interaction_memory',
        message: `Learned interaction: ${interaction.description}`,
        relevance: 0.85,
        source: interaction
      });
    }
  });
  
  // Sort by relevance and return top reflections
  return reflections.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
}

/**
 * Record that HERA vetoed a recommendation
 */
function recordHeraVeto(patientContext, vetoDetails) {
  const memory = {
    type: MEMORY_TYPES.VETO_RECEIVED,
    vetoReason: vetoDetails.reason,
    drugs: vetoDetails.drugs || [],
    conditions: patientContext.conditions || patientContext.medicalHistory?.conditions || [],
    budgetConstraint: patientContext.socioEconomic?.monthlyMedicationBudget,
    insuranceTier: patientContext.socioEconomic?.insuranceTier,
    estimatedCost: vetoDetails.estimatedCost,
    alternative: vetoDetails.alternative
  };
  
  // Store for HERA and the agent that was vetoed
  storeMemory('hera', memory);
  if (vetoDetails.targetAgent) {
    storeMemory(vetoDetails.targetAgent, memory);
  }
  
  return memory;
}

/**
 * Record a successful recommendation
 */
function recordSuccessfulRecommendation(agentId, patientContext, recommendation) {
  return storeMemory(agentId, {
    type: MEMORY_TYPES.RECOMMENDATION_SUCCESS,
    recommendation: recommendation.summary || recommendation.drug || recommendation,
    drugs: recommendation.drugs || [recommendation.drug],
    conditions: patientContext.conditions || patientContext.medicalHistory?.conditions || [],
    budgetConstraint: patientContext.socioEconomic?.monthlyMedicationBudget,
    confidence: recommendation.confidence
  });
}

/**
 * Record a learned drug interaction
 */
function recordDrugInteraction(drugs, severity, description) {
  return storeMemory('pharmacologist', {
    type: MEMORY_TYPES.DRUG_INTERACTION_LEARNED,
    drugs: drugs.map(d => d.toLowerCase()),
    severity,
    description
  });
}

/**
 * Record budget constraint learning
 */
function recordBudgetLearning(budgetRange, successfulAlternative) {
  return storeMemory('hera', {
    type: MEMORY_TYPES.BUDGET_CONSTRAINT_LEARNED,
    budgetMin: budgetRange.min,
    budgetMax: budgetRange.max,
    successfulAlternative,
    genericOptions: successfulAlternative.generics || []
  });
}

/**
 * Generate a reflection message for UI display
 */
function generateReflectionMessage(agentId, patientContext) {
  const reflections = getReflections(agentId, patientContext);
  
  if (reflections.length === 0) {
    return null;
  }
  
  // Return the most relevant reflection
  const topReflection = reflections[0];
  return {
    agentId,
    type: 'reflection',
    message: topReflection.message,
    relevance: topReflection.relevance,
    memoryType: topReflection.type
  };
}

/**
 * Initialize with some seed memories for demo purposes
 */
function initializeSeedMemories() {
  // Seed HERA memories
  storeMemory('hera', {
    type: MEMORY_TYPES.VETO_RECEIVED,
    vetoReason: 'Monthly cost $580 exceeds 3x patient budget of $150',
    drugs: ['jardiance', 'empagliflozin'],
    conditions: ['Type 2 Diabetes'],
    budgetConstraint: 150,
    estimatedCost: 580,
    alternative: 'Generic metformin + lifestyle intervention'
  });
  
  storeMemory('hera', {
    type: MEMORY_TYPES.VETO_RECEIVED,
    vetoReason: 'Specialty biologic not covered by Bronze tier insurance',
    drugs: ['humira', 'adalimumab'],
    conditions: ['Rheumatoid Arthritis'],
    budgetConstraint: 200,
    insuranceTier: 'Bronze',
    estimatedCost: 5000,
    alternative: 'Step therapy with generic DMARDs first'
  });
  
  storeMemory('hera', {
    type: MEMORY_TYPES.BUDGET_CONSTRAINT_LEARNED,
    budgetMin: 100,
    budgetMax: 200,
    successfulAlternative: {
      description: 'Triple generic therapy for T2D',
      generics: ['metformin', 'glipizide', 'lisinopril'],
      totalCost: 45
    }
  });
  
  // Seed Pharmacologist memories
  storeMemory('pharmacologist', {
    type: MEMORY_TYPES.DRUG_INTERACTION_LEARNED,
    drugs: ['metformin', 'contrast dye'],
    severity: 'major',
    description: 'Hold metformin 48h before/after IV contrast to prevent lactic acidosis'
  });
  
  storeMemory('pharmacologist', {
    type: MEMORY_TYPES.RECOMMENDATION_SUCCESS,
    recommendation: 'Switched from Clopidogrel to Ticagrelor for CYP2C19 poor metabolizer',
    drugs: ['ticagrelor'],
    conditions: ['CAD', 'CYP2C19 Poor Metabolizer'],
    confidence: 0.92
  });
  
  // Seed Endocrinologist memories
  storeMemory('endocrinologist', {
    type: MEMORY_TYPES.RECOMMENDATION_SUCCESS,
    recommendation: 'GLP-1 agonist added to metformin for HbA1c > 8%',
    drugs: ['semaglutide', 'metformin'],
    conditions: ['Type 2 Diabetes', 'Obesity'],
    confidence: 0.88
  });
  
  // Seed Geneticist memories
  storeMemory('geneticist', {
    type: MEMORY_TYPES.PATIENT_PATTERN,
    pattern: 'CYP2D6 Poor Metabolizer pattern',
    affectedDrugs: ['codeine', 'tramadol', 'metoprolol', 'fluoxetine'],
    recommendation: 'Use alternative pathways or dose adjustment'
  });
  
  console.log('[AgentMemory] Seed memories initialized');
}

/**
 * Helper: Format timestamp as "X ago"
 */
function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Get all memories for debugging/admin
 */
function getAllMemories() {
  return agentMemories;
}

/**
 * Clear all memories (for testing)
 */
function clearAllMemories() {
  Object.keys(agentMemories).forEach(key => {
    agentMemories[key] = [];
  });
}

// Initialize seed memories on module load
initializeSeedMemories();

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
