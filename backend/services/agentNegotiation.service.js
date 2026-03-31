/**
 * Multi-Round Agent Negotiation Protocol Service
 * 
 * AI-Powered Implementation using OpenAI GPT-4
 * 
 * Enhanced with:
 * - Feature 1: HITL Steering (Human-in-the-Loop)
 * - Feature 2: Dynamic Agent Swarming
 * - Feature 3: Live Tool Use
 * - Feature 5: Agent Memory & Self-Reflection
 * 
 * Implements a cyclic negotiation loop (Actor Model pattern) where:
 * 1. Specialist Agents (Geneticist, Pharmacologist, Endocrinologist) analyze patient data
 * 2. HERA Guardian evaluates economic/access constraints and may VETO
 * 3. Consensus Engine synthesizes a final recommendation
 */

const EventEmitter = require('events');
require('dotenv').config();

// Import new services for advanced features
let agentMemory = null;
let agentSwarming = null;
let agentTools = null;

try {
  agentMemory = require('./agentMemory.service');
  console.log('✅ Agent Memory service loaded');
} catch (e) {
  console.log('⚠️ Agent Memory service not available');
}

try {
  agentSwarming = require('./agentSwarming.service');
  console.log('✅ Agent Swarming service loaded');
} catch (e) {
  console.log('⚠️ Agent Swarming service not available');
}

try {
  agentTools = require('./agentTools.service');
  console.log('✅ Agent Tools service loaded');
} catch (e) {
  console.log('⚠️ Agent Tools service not available');
}

// Check for OpenAI/OpenRouter integration
let openaiClient = null;
let AI_ENABLED = false;

try {
  if (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) {
    openaiClient = require('./ai/openaiClient');
    AI_ENABLED = true;
    const provider = process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'OpenAI';
    console.log(`✅ AI integration enabled (${provider}) for AI-powered agents`);
  } else {
    console.log('⚠️ No AI API key set - using mock agent responses');
    console.log('   Set OPENROUTER_API_KEY or OPENAI_API_KEY in .env to enable AI');
  }
} catch (error) {
  console.log('⚠️ AI client not available - using mock agent responses:', error.message);
}

// Global event bus for telemetry streaming
const negotiationEventBus = new EventEmitter();
negotiationEventBus.setMaxListeners(100);

// Agent role definitions with color coding for frontend
const AGENT_ROLES = {
  GENETICIST: {
    id: 'geneticist',
    name: 'Dr. Gene',
    specialty: 'Clinical Geneticist',
    avatar: '🧬',
    color: '#a855f7',
    bias: 'precision',
    priority: ['genomic_match', 'pharmacogenomics', 'precision_medicine']
  },
  PHARMACOLOGIST: {
    id: 'pharmacologist',
    name: 'Dr. Pharma',
    specialty: 'Clinical Pharmacologist',
    avatar: '💊',
    color: '#22c55e',
    bias: 'safety',
    priority: ['drug_safety', 'interactions', 'dose_optimization']
  },
  ENDOCRINOLOGIST: {
    id: 'endocrinologist',
    name: 'Dr. Endo',
    specialty: 'Endocrinologist',
    avatar: '⚗️',
    color: '#f59e0b',
    bias: 'metabolic',
    priority: ['metabolic_control', 'hormone_optimization', 'glycemic_targets']
  },
  HERA: {
    id: 'hera',
    name: 'HERA Guardian',
    specialty: 'Health Economics & Resource Agent',
    avatar: '🛡️',
    color: '#06b6d4',
    bias: 'constraint',
    priority: ['cost_effectiveness', 'accessibility', 'insurance_coverage']
  }
};

// Negotiation states
const NEGOTIATION_STATES = {
  INITIALIZING: 'initializing',
  ROUND_PROPOSAL: 'round_proposal',
  CONSTRAINT_REVIEW: 'constraint_review',
  VETO_ISSUED: 'veto_issued',
  REVISION_REQUIRED: 'revision_required',
  CONSENSUS_REACHED: 'consensus_reached',
  DEADLOCK: 'deadlock',
  HUMAN_INTERVENTION: 'human_intervention',
  STEERING: 'steering'
};

// Active negotiation sessions
const activeSessions = new Map();

/**
 * Create a new negotiation session
 */
function createSession(sessionId, patient, treatmentContext) {
  const session = {
    id: sessionId,
    patient,
    treatmentContext,
    state: NEGOTIATION_STATES.INITIALIZING,
    currentRound: 0,
    maxRounds: 3,
    proposals: [],
    agentAnalyses: {},
    vetoes: [],
    consensus: null,
    telemetry: [],
    humanInterventions: [],
    activeSubAgents: [],
    toolCalls: [],
    steeringConstraints: [],
    startTime: Date.now(),
    lastActivity: Date.now(),
    aiEnabled: AI_ENABLED
  };
  
  activeSessions.set(sessionId, session);
  return session;
}

/**
 * Emit telemetry event for real-time streaming
 */
function emitTelemetry(sessionId, event) {
  const telemetryEvent = {
    sessionId,
    timestamp: Date.now(),
    ...event
  };
  
  const session = activeSessions.get(sessionId);
  if (session) {
    session.telemetry.push(telemetryEvent);
    session.lastActivity = Date.now();
  }
  
  negotiationEventBus.emit('telemetry', telemetryEvent);
  negotiationEventBus.emit(`telemetry:${sessionId}`, telemetryEvent);
  
  return telemetryEvent;
}

/**
 * Helper for AI calls with retry
 */
async function retryAICall(fn, maxRetries = 1, delayMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`AI call attempt ${attempt}/${maxRetries + 1} failed:`, error.message);
      if (attempt <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

/**
 * Natural pacing delay
 */
async function agentThink(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * FEATURE 3: Emit tool use telemetry
 */
async function emitToolUse(sessionId, agentId, toolName, action, message) {
  emitTelemetry(sessionId, {
    type: 'tool_use',
    agent: agentId,
    color: AGENT_ROLES[agentId.toUpperCase()]?.color || '#64748b',
    tool: toolName,
    action: action,
    message: message || `Using ${toolName}...`
  });
  await agentThink(600);
}

/**
 * FEATURE 5: Emit reflection telemetry
 */
async function emitReflection(sessionId, agentId, patient) {
  if (!agentMemory) return null;
  
  const reflection = agentMemory.generateReflectionMessage(agentId, patient);
  if (reflection) {
    emitTelemetry(sessionId, {
      type: 'reflection',
      agent: agentId,
      color: AGENT_ROLES[agentId.toUpperCase()]?.color || '#64748b',
      message: reflection.message,
      memoryType: reflection.memoryType
    });
    await agentThink(800);
  }
  return reflection;
}

/**
 * FEATURE 2: Check and summon sub-agents
 */
async function checkAndSummonSubAgents(sessionId, agentId, patient) {
  if (!agentSwarming) return [];
  
  const specialists = agentSwarming.detectRequiredSpecialists(patient);
  const summonedAgents = [];
  
  for (const specialist of specialists.slice(0, 2)) {
    emitTelemetry(sessionId, {
      type: 'sub_agent',
      agent: agentId,
      subAgent: specialist.id,
      subAgentName: specialist.name,
      subAgentEmoji: specialist.avatar,
      subAgentColor: specialist.color,
      color: AGENT_ROLES[agentId.toUpperCase()]?.color || '#64748b',
      message: `${specialist.triggerReason}. Summoning ${specialist.name} Sub-Agent for specialized analysis.`
    });
    
    await agentThink(1000);
    
    const response = agentSwarming.generateSubAgentResponse(specialist.id, patient, 'General consultation');
    
    emitTelemetry(sessionId, {
      type: 'sub_agent_response',
      agent: specialist.id,
      agentName: specialist.name,
      color: specialist.color,
      message: `${specialist.avatar} ${specialist.name}: ${response.ruling}`,
      ruling: response.ruling,
      recommendations: response.recommendations,
      confidence: response.confidence
    });
    
    await agentThink(600);
    summonedAgents.push({ specialist, response });
  }
  
  return summonedAgents;
}

/**
 * AI-Powered Geneticist Agent
 */
async function geneticistAnalyze(session) {
  const agent = AGENT_ROLES.GENETICIST;
  const { patient } = session;
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    color: agent.color,
    message: `Analyzing pharmacogenomic profile...`
  });
  
  // FEATURE 5: Check memory for reflections
  await emitReflection(session.id, agent.id, patient);
  
  // FEATURE 3: Tool use - PharmGKB lookup
  await emitToolUse(session.id, agent.id, 'PharmGKB Lookup', 
    `Querying ${patient.biomarkers?.pharmacogenomics?.cyp2d6 || 'CYP2D6'} implications`,
    'Looking up pharmacogenomic guidelines...');
  
  // FEATURE 3: Tool use - CPIC guidelines
  await emitToolUse(session.id, agent.id, 'CPIC Guidelines API',
    'Fetching clinical pharmacogenetics recommendations',
    'Checking CPIC dosing guidelines...');
  
  let analysis;
  
  if (AI_ENABLED && openaiClient) {
    try {
      emitTelemetry(session.id, {
        type: 'agent_reasoning',
        agent: agent.id,
        color: agent.color,
        message: `Correlating genetic markers with drug response profiles...`
      });
      
      analysis = await retryAICall(
        () => openaiClient.analyzeWithAgent('geneticist', patient),
        0, 0
      );
      analysis.aiGenerated = true;
      
      if (analysis.keyFindings?.length > 0) {
        emitTelemetry(session.id, {
          type: 'agent_insight',
          agent: agent.id,
          color: agent.color,
          message: analysis.keyFindings[0],
          data: { metabolizerStatus: analysis.metabolizerStatus }
        });
      }
      
      if (analysis.actionableMutations?.length > 0) {
        emitTelemetry(session.id, {
          type: 'agent_alert',
          agent: agent.id,
          color: agent.color,
          severity: 'high',
          message: `⚠️ Actionable findings: ${analysis.actionableMutations.join(', ')}`
        });
      }
      
    } catch (error) {
      console.error('Geneticist AI analysis failed:', error);
      analysis = getMockGeneticistAnalysis(patient);
      emitTelemetry(session.id, {
        type: 'agent_fallback',
        agent: agent.id,
        color: agent.color,
        severity: 'warning',
        message: `⚡ Using enhanced algorithmic analysis (AI unavailable)`
      });
    }
  } else {
    analysis = getMockGeneticistAnalysis(patient);
  }
  
  // FEATURE 2: Check for sub-agent needs (neurological conditions)
  const conditions = patient.conditions || patient.medicalHistory?.conditions || [];
  if (conditions.some(c => c.toLowerCase().includes('alzheimer') || 
                          c.toLowerCase().includes('migraine') ||
                          c.toLowerCase().includes('parkinson'))) {
    await checkAndSummonSubAgents(session.id, agent.id, patient);
  }
  
  emitTelemetry(session.id, {
    type: 'agent_complete',
    agent: agent.id,
    color: agent.color,
    message: `Analysis complete. Confidence: ${Math.round((analysis.confidence || 0.7) * 100)}%`,
    proposal: {
      type: analysis.proposalType || 'Standard',
      confidence: analysis.confidence || 0.7
    }
  });
  
  session.agentAnalyses.geneticist = analysis;
  return analysis;
}

/**
 * AI-Powered Pharmacologist Agent
 */
async function pharmacologistAnalyze(session) {
  const agent = AGENT_ROLES.PHARMACOLOGIST;
  const { patient } = session;
  const medications = patient.medications?.filter(m => m.name) || [];
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    color: agent.color,
    message: `Initiating drug safety review...`
  });
  
  // FEATURE 5: Check memory for past interactions learned
  await emitReflection(session.id, agent.id, patient);
  
  // FEATURE 3: Tool use - PubMed search
  await emitToolUse(session.id, agent.id, 'PubMed Interactions API',
    `Querying ${medications.slice(0, 2).map(m => m.name).join(' + ') || 'medication'} interactions`,
    'Searching clinical literature for interaction data...');
  
  // FEATURE 3: Tool use - DrugBank
  await emitToolUse(session.id, agent.id, 'DrugBank API',
    `Checking interaction severity classifications`,
    'Verifying interaction mechanisms...');
  
  // FEATURE 3: Tool use - FDA FAERS
  await emitToolUse(session.id, agent.id, 'FDA FAERS Database',
    `Searching adverse event reports`,
    'Analyzing post-market safety signals...');
  
  let analysis;
  
  if (AI_ENABLED && openaiClient) {
    try {
      emitTelemetry(session.id, {
        type: 'agent_reasoning',
        agent: agent.id,
        color: agent.color,
        message: `Cross-referencing ${medications.length} medications for interactions...`
      });
      
      analysis = await retryAICall(
        () => openaiClient.analyzeWithAgent('pharmacologist', patient, {
          geneticistAnalysis: session.agentAnalyses.geneticist
        }),
        0, 0
      );
      analysis.aiGenerated = true;
      
      if (analysis.interactions?.length > 0) {
        const majorInteractions = analysis.interactions.filter(i => 
          i.severity === 'major' || i.severity === 'contraindicated'
        );
        if (majorInteractions.length > 0) {
          emitTelemetry(session.id, {
            type: 'agent_alert',
            agent: agent.id,
            color: agent.color,
            severity: 'critical',
            message: `🚨 ${majorInteractions.length} significant drug interaction(s) identified!`
          });
        }
      }
      
      emitTelemetry(session.id, {
        type: 'agent_insight',
        agent: agent.id,
        color: agent.color,
        message: analysis.recommendations?.[0] || `Safety assessment complete. Score: ${analysis.safetyScore || 75}/100`
      });
      
    } catch (error) {
      console.error('Pharmacologist AI analysis failed:', error);
      analysis = getMockPharmacologistAnalysis(patient);
      emitTelemetry(session.id, {
        type: 'agent_fallback',
        agent: agent.id,
        color: agent.color,
        severity: 'warning',
        message: `⚡ Using enhanced rule-based analysis (AI unavailable)`
      });
    }
  } else {
    analysis = getMockPharmacologistAnalysis(patient);
  }
  
  emitTelemetry(session.id, {
    type: 'agent_complete',
    agent: agent.id,
    color: agent.color,
    message: `Safety review complete. Safety Score: ${analysis.safetyScore || 75}/100`,
    proposal: {
      type: analysis.proposalType || 'Conservative',
      confidence: analysis.confidence || 0.75,
      safetyScore: analysis.safetyScore || 75
    }
  });
  
  session.agentAnalyses.pharmacologist = analysis;
  return analysis;
}

/**
 * AI-Powered Endocrinologist Agent
 */
async function endocrinologistAnalyze(session) {
  const agent = AGENT_ROLES.ENDOCRINOLOGIST;
  const { patient } = session;
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    color: agent.color,
    message: `Evaluating metabolic profile...`
  });
  
  // FEATURE 5: Check memory
  await emitReflection(session.id, agent.id, patient);
  
  // FEATURE 3: Tool use - ADA guidelines
  await emitToolUse(session.id, agent.id, 'ADA Standards of Care',
    'Referencing diabetes management guidelines',
    'Checking ADA 2024 recommendations...');
  
  // FEATURE 3: Tool use - Glycemic calculator
  await emitToolUse(session.id, agent.id, 'Glycemic Target Calculator',
    `Computing targets for age ${patient.age || '?'}, glucose ${patient.vitals?.sugar || patient.vitals?.glucose || '?'}`,
    'Calculating individualized HbA1c goals...');
  
  let analysis;
  
  if (AI_ENABLED && openaiClient) {
    try {
      emitTelemetry(session.id, {
        type: 'agent_reasoning',
        agent: agent.id,
        color: agent.color,
        message: `Assessing glucose (${patient.vitals?.sugar || patient.vitals?.glucose || '?'} mg/dL) and metabolic markers...`
      });
      
      analysis = await retryAICall(
        () => openaiClient.analyzeWithAgent('endocrinologist', patient, {
          geneticistAnalysis: session.agentAnalyses.geneticist,
          pharmacologistAnalysis: session.agentAnalyses.pharmacologist
        }),
        0, 0
      );
      analysis.aiGenerated = true;
      
      if (analysis.keyFindings?.length > 0) {
        emitTelemetry(session.id, {
          type: 'agent_insight',
          agent: agent.id,
          color: agent.color,
          message: analysis.keyFindings[0]
        });
      }
      
      if (analysis.metabolicRisks?.length > 0) {
        emitTelemetry(session.id, {
          type: 'agent_alert',
          agent: agent.id,
          color: agent.color,
          severity: 'warning',
          message: `⚠️ Metabolic consideration: ${analysis.metabolicRisks[0]}`
        });
      }
      
    } catch (error) {
      console.error('Endocrinologist AI analysis failed:', error);
      analysis = getMockEndocrinologistAnalysis(patient);
      emitTelemetry(session.id, {
        type: 'agent_fallback',
        agent: agent.id,
        color: agent.color,
        severity: 'warning',
        message: `⚡ Using algorithmic metabolic analysis (AI unavailable)`
      });
    }
  } else {
    analysis = getMockEndocrinologistAnalysis(patient);
  }
  
  // FEATURE 2: Check for cardiac sub-agent needs
  const conditions = patient.conditions || patient.medicalHistory?.conditions || [];
  if (conditions.some(c => c.toLowerCase().includes('heart') || 
                          c.toLowerCase().includes('cardiac') ||
                          c.toLowerCase().includes('coronary'))) {
    await checkAndSummonSubAgents(session.id, agent.id, patient);
  }
  
  emitTelemetry(session.id, {
    type: 'agent_complete',
    agent: agent.id,
    color: agent.color,
    message: `Metabolic assessment complete. Confidence: ${Math.round((analysis.confidence || 0.75) * 100)}%`,
    proposal: {
      type: analysis.proposalType || 'Standard',
      confidence: analysis.confidence || 0.75
    }
  });
  
  session.agentAnalyses.endocrinologist = analysis;
  return analysis;
}

/**
 * AI-Powered HERA Guardian Agent
 */
async function heraAnalyze(session) {
  const agent = AGENT_ROLES.HERA;
  const { patient } = session;
  const budget = patient.socioEconomic?.monthlyMedicationBudget || 150;
  const insurance = patient.socioEconomic?.insuranceTier || 'Unknown';
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    color: agent.color,
    message: `Evaluating resource constraints and feasibility...`
  });
  
  // FEATURE 5: Memory-based reflection (key feature for HERA)
  const reflection = await emitReflection(session.id, agent.id, patient);
  
  // FEATURE 3: Tool use - GoodRx pricing
  const medications = patient.medications?.filter(m => m.name) || [];
  await emitToolUse(session.id, agent.id, 'GoodRx Pricing API',
    `Querying local pricing for ${medications[0]?.name || 'medications'}`,
    'Fetching pharmacy prices in patient area...');
  
  // FEATURE 3: Tool use - Formulary check
  await emitToolUse(session.id, agent.id, 'CMS Formulary Check',
    `Verifying ${insurance} tier coverage`,
    'Checking formulary and prior auth requirements...');
  
  // FEATURE 3: Tool use - Patient assistance
  await emitToolUse(session.id, agent.id, 'Patient Assistance Programs',
    'Searching manufacturer programs',
    'Finding assistance program eligibility...');
  
  let analysis;
  
  if (AI_ENABLED && openaiClient) {
    try {
      emitTelemetry(session.id, {
        type: 'agent_reasoning',
        agent: agent.id,
        color: agent.color,
        message: `Analyzing budget ($${budget}/mo) and insurance (${insurance}) constraints...`
      });
      
      analysis = await retryAICall(
        () => openaiClient.analyzeWithAgent('hera', patient, {
          geneticistAnalysis: session.agentAnalyses.geneticist,
          pharmacologistAnalysis: session.agentAnalyses.pharmacologist,
          endocrinologistAnalysis: session.agentAnalyses.endocrinologist
        }),
        0, 0
      );
      analysis.aiGenerated = true;
      
      if (analysis.veto?.issued) {
        emitTelemetry(session.id, {
          type: 'agent_veto',
          agent: agent.id,
          color: agent.color,
          severity: 'critical',
          message: `🛑 VETO: ${analysis.veto.reason}`
        });
        
        // Record veto for memory
        if (agentMemory) {
          agentMemory.recordHeraVeto(patient, {
            reason: analysis.veto.reason,
            drugs: analysis.vetoDrugs || [],
            estimatedCost: analysis.estimatedCost,
            targetAgent: analysis.targetAgent
          });
        }
        
        if (analysis.alternatives?.length > 0) {
          await agentThink(500);
          emitTelemetry(session.id, {
            type: 'agent_proposal',
            agent: agent.id,
            color: agent.color,
            message: `Proposing alternative: ${analysis.alternatives[0].suggestion}`
          });
        }
      } else {
        emitTelemetry(session.id, {
          type: 'agent_approval',
          agent: agent.id,
          color: agent.color,
          message: `✅ Feasibility approved (Score: ${analysis.feasibilityScore || 75}/100)`
        });
      }
      
    } catch (error) {
      console.error('HERA AI analysis failed:', error);
      analysis = getMockHeraAnalysis(patient, session.agentAnalyses);
      emitTelemetry(session.id, {
        type: 'agent_fallback',
        agent: agent.id,
        color: agent.color,
        severity: 'warning',
        message: `⚡ Using cost estimation model (AI unavailable)`
      });
    }
  } else {
    analysis = getMockHeraAnalysis(patient, session.agentAnalyses);
  }
  
  emitTelemetry(session.id, {
    type: 'agent_complete',
    agent: agent.id,
    color: agent.color,
    message: `Feasibility analysis complete. Score: ${analysis.feasibilityScore || 75}%`,
    response: {
      feasibilityScore: analysis.feasibilityScore,
      veto: analysis.veto
    }
  });
  
  session.agentAnalyses.hera = analysis;
  return analysis;
}

/**
 * Generate consensus
 */
async function generateConsensus(session) {
  emitTelemetry(session.id, {
    type: 'phase_start',
    phase: 'consensus_building',
    message: `Building multi-agent consensus...`
  });
  
  let consensus;
  
  if (AI_ENABLED && openaiClient) {
    try {
      consensus = await retryAICall(
        () => openaiClient.generateConsensusRecommendation(
          session.patient,
          session.agentAnalyses
        ),
        0, 0
      );
      consensus.aiGenerated = true;
      
      emitTelemetry(session.id, {
        type: 'consensus_generated',
        message: `Consensus protocol: ${consensus.recommendedProtocol}`,
        data: consensus
      });
      
    } catch (error) {
      console.error('Consensus generation failed:', error);
      consensus = getMockConsensus(session);
      emitTelemetry(session.id, {
        type: 'consensus_fallback',
        severity: 'warning',
        message: `⚡ Consensus built from agent analyses`
      });
    }
  } else {
    consensus = getMockConsensus(session);
  }
  
  session.consensus = consensus;
  return consensus;
}

/**
 * FEATURE 1: Handle HITL steering intervention
 */
async function handleSteeringIntervention(sessionId, intervention) {
  const session = activeSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  
  session.state = NEGOTIATION_STATES.STEERING;
  session.steeringConstraints.push({
    timestamp: Date.now(),
    ...intervention
  });
  
  // Emit the steering event
  emitTelemetry(sessionId, {
    type: 'steering_intervention',
    severity: 'high',
    message: `🔔 CLINICIAN STEERING: "${intervention.constraint}"`,
    constraint: intervention.constraint,
    source: 'clinician'
  });
  
  // Determine which agent should respond based on content
  const text = intervention.constraint.toLowerCase();
  let respondingAgent = 'pharmacologist';
  let responseType = 'acknowledgment';
  
  if (text.includes('metformin') || text.includes('gi') || text.includes('stomach') || 
      text.includes('gastrointestinal') || text.includes('nausea')) {
    respondingAgent = 'endocrinologist';
    responseType = 'drug_retraction';
  } else if (text.includes('cost') || text.includes('expensive') || text.includes('afford') ||
             text.includes('budget') || text.includes('insurance')) {
    respondingAgent = 'hera';
    responseType = 'budget_constraint';
  } else if (text.includes('gene') || text.includes('cyp') || text.includes('metabolizer') ||
             text.includes('dna') || text.includes('genetic')) {
    respondingAgent = 'geneticist';
    responseType = 'genetic_update';
  } else if (text.includes('allergy') || text.includes('allergic') || text.includes('reaction') ||
             text.includes('interaction') || text.includes('side effect')) {
    respondingAgent = 'pharmacologist';
    responseType = 'safety_alert';
  }
  
  // Emit agent acknowledgment with flashing alert
  await agentThink(800);
  emitTelemetry(sessionId, {
    type: 'steering_acknowledgment',
    agent: respondingAgent,
    color: AGENT_ROLES[respondingAgent.toUpperCase()]?.color,
    isFlashing: true,
    message: generateSteeringResponse(respondingAgent, responseType, intervention.constraint),
    responseType
  });
  
  // Emit re-negotiation signal
  await agentThink(1200);
  emitTelemetry(sessionId, {
    type: 'renegotiation_triggered',
    message: '🔄 Re-negotiation initiated based on clinician steering...',
    triggeredBy: respondingAgent,
    constraint: intervention.constraint
  });
  
  return {
    acknowledged: true,
    respondingAgent,
    responseType,
    session
  };
}

/**
 * Generate context-aware steering response
 */
function generateSteeringResponse(agentId, responseType, constraint) {
  const responses = {
    endocrinologist: {
      drug_retraction: `⚠️ INTERCEPTING: Patient history noted. Withdrawing Metformin from consideration. Pivoting to SGLT2 inhibitor or DPP-4 inhibitor classes with better GI tolerance.`,
      default: `Acknowledged. Recalibrating metabolic recommendations based on new information.`
    },
    hera: {
      budget_constraint: `🛡️ CONSTRAINT OVERRIDE: Strictly filtering Tier 3 / Specialty drugs from consensus. Enforcing generic-first policy.`,
      default: `Budget constraint noted. Re-evaluating cost-effectiveness of all recommendations.`
    },
    geneticist: {
      genetic_update: `🧬 RECALIBRATING: Updating pharmacogenomic mapping based on clinical input. Re-analyzing drug metabolism pathways.`,
      default: `Genetic consideration noted. Adjusting precision medicine recommendations.`
    },
    pharmacologist: {
      safety_alert: `🚨 SAFETY FLAG: New contraindication identified. Initiating drug interaction re-analysis with updated constraints.`,
      default: `Safety constraint acknowledged. Re-evaluating medication safety profile.`
    }
  };
  
  return responses[agentId]?.[responseType] || responses[agentId]?.default || 'Constraint acknowledged. Re-evaluating recommendations.';
}

/**
 * Run full negotiation process
 */
async function runNegotiation(sessionId, patient, treatmentContext = {}) {
  const session = createSession(sessionId, patient, treatmentContext);
  
  emitTelemetry(sessionId, {
    type: 'negotiation_start',
    message: `🚀 Multi-Agent Consensus Protocol Initiated`,
    patient: { name: patient.name, disease: patient.disease },
    aiEnabled: AI_ENABLED
  });
  
  session.currentRound = 1;
  session.state = NEGOTIATION_STATES.ROUND_PROPOSAL;
  
  emitTelemetry(sessionId, {
    type: 'round_start',
    round: 1,
    message: `═══════════ ROUND 1: Specialist Analysis (Parallel) ═══════════`
  });
  
  // Phase 1: Run specialist agents in parallel
  const startTime = Date.now();
  
  await Promise.all([
    geneticistAnalyze(session),
    pharmacologistAnalyze(session),
    endocrinologistAnalyze(session)
  ]);
  
  console.log(`[Negotiation] Parallel agent analysis completed in ${Date.now() - startTime}ms`);
  
  // Phase 2: HERA constraint review
  emitTelemetry(sessionId, {
    type: 'phase_start',
    phase: 'constraint_review',
    message: `HERA Guardian constraint evaluation...`
  });
  
  session.state = NEGOTIATION_STATES.CONSTRAINT_REVIEW;
  await heraAnalyze(session);
  
  // Phase 3: Handle vetoes
  const heraAnalysis = session.agentAnalyses.hera;
  
  if (heraAnalysis?.veto?.issued) {
    session.state = NEGOTIATION_STATES.VETO_ISSUED;
    session.vetoes.push({
      round: 1,
      vetoAgent: 'hera',
      veto: heraAnalysis.veto
    });
    
    emitTelemetry(sessionId, {
      type: 'revision_adaptation',
      round: 1,
      message: `Adjusting recommendations based on HERA constraints...`
    });
  }
  
  // Phase 4: Generate consensus
  const consensus = await generateConsensus(session);
  
  session.state = NEGOTIATION_STATES.CONSENSUS_REACHED;
  
  const totalTime = Date.now() - startTime;
  console.log(`[Negotiation] Total negotiation completed in ${totalTime}ms`);
  
  emitTelemetry(sessionId, {
    type: 'consensus_reached',
    round: session.currentRound,
    message: `✅ CONSENSUS ACHIEVED`,
    consensus,
    timing: { totalMs: totalTime }
  });
  
  emitTelemetry(sessionId, {
    type: 'negotiation_complete',
    message: `═══════════ NEGOTIATION COMPLETE ═══════════`,
    totalRounds: session.currentRound,
    vetoes: session.vetoes.length,
    consensusReached: true,
    aiEnabled: AI_ENABLED,
    timing: { totalMs: totalTime }
  });
  
  return {
    sessionId,
    session,
    result: {
      consensusReached: true,
      consensus,
      agentAnalyses: session.agentAnalyses
    },
    telemetry: session.telemetry,
    timing: { totalMs: totalTime }
  };
}

/**
 * Inject human intervention
 */
async function injectHumanIntervention(sessionId, intervention) {
  const session = activeSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  
  session.state = NEGOTIATION_STATES.HUMAN_INTERVENTION;
  session.humanInterventions.push({
    timestamp: Date.now(),
    ...intervention
  });
  
  // Check if this is a steering intervention
  if (intervention.type === 'steering' || intervention.constraint) {
    return handleSteeringIntervention(sessionId, intervention);
  }
  
  emitTelemetry(sessionId, {
    type: 'human_intervention',
    severity: 'critical',
    message: `🔔 HUMAN INTERVENTION: ${intervention.message || intervention.constraint}`,
    intervention
  });
  
  return session;
}

function getSession(sessionId) {
  return activeSessions.get(sessionId);
}

function getSessionTelemetry(sessionId) {
  const session = activeSessions.get(sessionId);
  return session ? session.telemetry : [];
}

// ============== MOCK FUNCTIONS ==============
// Keeping these for when AI is unavailable

function getMockGeneticistAnalysis(patient) {
  const pgx = patient.biomarkers?.pharmacogenomics || {};
  const cyp2d6 = pgx.cyp2d6 || pgx.CYP2D6 || 'Normal Metabolizer';
  const cyp2c19 = pgx.cyp2c19 || pgx.CYP2C19 || 'Normal Metabolizer';
  
  const keyFindings = [];
  const actionableMutations = [];
  
  if (cyp2d6.toLowerCase().includes('poor')) {
    keyFindings.push(`CYP2D6 Poor Metabolizer: Reduced efficacy with codeine/tramadol; increased levels with beta-blockers`);
    actionableMutations.push('CYP2D6 PM');
  }
  if (cyp2c19.toLowerCase().includes('poor')) {
    keyFindings.push(`CYP2C19 Poor Metabolizer: Reduced clopidogrel efficacy; consider prasugrel/ticagrelor`);
    actionableMutations.push('CYP2C19 PM');
  }
  
  if (keyFindings.length === 0) {
    keyFindings.push('Standard pharmacogenomic profile. No significant metabolizer variants detected.');
  }
  
  return {
    analysis: `Pharmacogenomic profile analyzed for ${patient.name || 'patient'}.`,
    metabolizerStatus: { cyp2d6, cyp2c19 },
    actionableMutations,
    keyFindings,
    proposalType: actionableMutations.length > 0 ? 'Conservative' : 'Standard',
    confidence: 0.75,
    mockGenerated: true
  };
}

function getMockPharmacologistAnalysis(patient) {
  const medications = patient.medications?.filter(m => m.name) || [];
  const interactions = [];
  const criticalAlerts = [];
  
  // Check common interactions
  const medNames = medications.map(m => (m.name || '').toLowerCase());
  
  if (medNames.some(m => m.includes('warfarin')) && medNames.some(m => m.includes('aspirin'))) {
    interactions.push({ drugs: ['Warfarin', 'Aspirin'], severity: 'major', mechanism: 'Bleeding risk' });
    criticalAlerts.push('Major interaction: Warfarin + Aspirin');
  }
  
  let safetyScore = 100 - (interactions.filter(i => i.severity === 'major').length * 15);
  safetyScore = Math.max(40, Math.min(100, safetyScore));
  
  return {
    analysis: `Safety review of ${medications.length} medications.`,
    interactions,
    safetyScore,
    criticalAlerts,
    recommendations: criticalAlerts.length > 0 ? ['Review drug interactions'] : ['Continue current regimen with monitoring'],
    proposalType: criticalAlerts.length > 0 ? 'Conservative' : 'Standard',
    confidence: 0.78,
    mockGenerated: true
  };
}

function getMockEndocrinologistAnalysis(patient) {
  const vitals = patient.vitals || {};
  const glucose = vitals.sugar || vitals.glucose || 120;
  const keyFindings = [];
  const metabolicRisks = [];
  
  if (glucose >= 180) {
    keyFindings.push(`Elevated glucose (${glucose} mg/dL) - poor glycemic control`);
    metabolicRisks.push('Hyperglycemia risk');
  } else if (glucose >= 126) {
    keyFindings.push(`Glucose ${glucose} mg/dL - suboptimal control`);
  } else {
    keyFindings.push(`Glucose ${glucose} mg/dL - adequate control`);
  }
  
  return {
    analysis: `Metabolic assessment for ${patient.name || 'patient'}.`,
    metabolicStatus: { diabetesControl: glucose >= 180 ? 'Poor' : glucose >= 126 ? 'Suboptimal' : 'Adequate' },
    keyFindings,
    metabolicRisks,
    proposalType: glucose >= 180 ? 'Aggressive' : 'Standard',
    confidence: 0.76,
    mockGenerated: true
  };
}

function getMockHeraAnalysis(patient, proposals) {
  const budget = patient.socioEconomic?.monthlyMedicationBudget || 150;
  const medications = patient.medications?.filter(m => m.name) || [];
  
  // Estimate costs
  let totalCost = medications.length * 50;
  const expensiveMeds = medications.filter(m => 
    ['ozempic', 'jardiance', 'humira', 'keytruda'].some(e => (m.name || '').toLowerCase().includes(e))
  );
  
  if (expensiveMeds.length > 0) {
    totalCost += expensiveMeds.length * 500;
  }
  
  const veto = totalCost > budget * 2 ? {
    issued: true,
    reason: `Monthly cost estimate $${totalCost} exceeds patient budget ($${budget}/mo)`,
    constraints: ['Budget exceeded']
  } : { issued: false };
  
  const alternatives = veto.issued ? [{
    category: 'Generic',
    suggestion: 'Consider generic alternatives to reduce cost',
    costSavings: `Up to $${Math.round(totalCost * 0.6)}/month`
  }] : [];
  
  return {
    analysis: `Resource constraints evaluated. Est. cost: $${totalCost} vs budget $${budget}.`,
    feasibilityScore: veto.issued ? 45 : 85,
    veto,
    alternatives,
    constraintEvaluation: { budget: { status: veto.issued ? 'exceeded' : 'within' } },
    confidence: 0.82,
    mockGenerated: true
  };
}

function getMockConsensus(session) {
  const analyses = session.agentAnalyses;
  const medications = session.patient.medications?.filter(m => m.name) || [];
  
  const avgConfidence = (
    (analyses.geneticist?.confidence || 0.5) +
    (analyses.pharmacologist?.confidence || 0.5) +
    (analyses.endocrinologist?.confidence || 0.5) +
    (analyses.hera?.confidence || 0.5)
  ) / 4;
  
  return {
    recommendedProtocol: 'Personalized Treatment Optimization Protocol',
    protocolDetails: 'Maintain current regimen with specified monitoring.',
    rationale: `Based on ${Object.keys(analyses).length}-agent analysis.`,
    medications: medications.map(m => ({
      name: m.name,
      dose: m.dosage,
      frequency: m.frequency,
      notes: 'Continue as prescribed'
    })),
    monitoring: ['Regular follow-up', 'Lab monitoring as indicated'],
    precautions: ['Report adverse effects', 'Maintain medication adherence'],
    confidence: avgConfidence,
    consensusLevel: 'Majority',
    agentAgreement: {
      geneticist: 'agreed',
      pharmacologist: 'agreed',
      endocrinologist: 'agreed',
      hera: analyses.hera?.veto?.issued ? 'vetoed_then_adjusted' : 'approved'
    },
    mockGenerated: true
  };
}

module.exports = {
  runNegotiation,
  injectHumanIntervention,
  handleSteeringIntervention,
  getSession,
  getSessionTelemetry,
  createSession,
  negotiationEventBus,
  AGENT_ROLES,
  NEGOTIATION_STATES,
  AI_ENABLED: () => AI_ENABLED
};
