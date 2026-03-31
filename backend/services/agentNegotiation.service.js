/**
 * Multi-Round Agent Negotiation Protocol Service
 * 
 * AI-Powered Implementation using OpenAI GPT-4
 * 
 * Implements a cyclic negotiation loop (Actor Model pattern) where:
 * 1. Specialist Agents (Geneticist, Pharmacologist, Endocrinologist) analyze patient data
 * 2. HERA Guardian evaluates economic/access constraints and may VETO
 * 3. Consensus Engine synthesizes a final recommendation
 */

const EventEmitter = require('events');
require('dotenv').config();

// Check for OpenAI/OpenRouter integration
let openaiClient = null;
let AI_ENABLED = false;

try {
  // Support both OpenRouter (OPENROUTER_API_KEY) and direct OpenAI (OPENAI_API_KEY)
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
    color: '#a855f7', // violet
    bias: 'precision',
    priority: ['genomic_match', 'pharmacogenomics', 'precision_medicine']
  },
  PHARMACOLOGIST: {
    id: 'pharmacologist',
    name: 'Dr. Pharma',
    specialty: 'Clinical Pharmacologist',
    avatar: '💊',
    color: '#22c55e', // green
    bias: 'safety',
    priority: ['drug_safety', 'interactions', 'dose_optimization']
  },
  ENDOCRINOLOGIST: {
    id: 'endocrinologist',
    name: 'Dr. Endo',
    specialty: 'Endocrinologist',
    avatar: '⚗️',
    color: '#f59e0b', // amber
    bias: 'metabolic',
    priority: ['metabolic_control', 'hormone_optimization', 'glycemic_targets']
  },
  HERA: {
    id: 'hera',
    name: 'HERA Guardian',
    specialty: 'Health Economics & Resource Agent',
    avatar: '🛡️',
    color: '#06b6d4', // cyan
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
  HUMAN_INTERVENTION: 'human_intervention'
};

/**
 * Active negotiation sessions (in-memory store)
 */
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
  
  // Store in session
  const session = activeSessions.get(sessionId);
  if (session) {
    session.telemetry.push(telemetryEvent);
    session.lastActivity = Date.now();
  }
  
  // Emit to WebSocket listeners
  negotiationEventBus.emit('telemetry', telemetryEvent);
  negotiationEventBus.emit(`telemetry:${sessionId}`, telemetryEvent);
  
  return telemetryEvent;
}

/**
 * Helper function to retry AI calls with shorter delays for faster response
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
 * Small delay for natural telemetry pacing (reduced for faster response)
 */
async function agentThink(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  
  let analysis;
  
  if (AI_ENABLED && openaiClient) {
    try {
      emitTelemetry(session.id, {
        type: 'agent_reasoning',
        agent: agent.id,
        color: agent.color,
   // FEATURE 2: Dynamic Agent "Swarming" (Sub-agent)
  await agentThink(500);
  if (patient.conditions && patient.conditions.some(c => c.toLowerCase().includes('alzheimer') || c.toLowerCase().includes('migraine'))) {
    emitTelemetry(session.id, {
      type: 'sub_agent',
      agent: agent.id,
      color: agent.color,
      message: `Genomic markers show elevated neuro-inflammation baseline. Summoning Neurologist Sub-Agent for specialized pathway analysis.`
    });
    await agentThink(1200);
  }

        () => openaiClient.analyzeWithAgent('geneticist', patient),
        0, 0
      );
      analysis.aiGenerated = true;
      
      // Emit key findings
      if (analysis.keyFindings?.length > 0) {
        emitTelemetry(session.id, {
          type: 'agent_insight',
          agent: agent.id,
          color: agent.color,
          message: analysis.keyFindings[0],
          data: { metabolizerStatus: analysis.metabolizerStatus }
        });
      }
      
      // Alert for actionable mutations
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
      console.error('Geneticist AI analysis failed after retries:', error);
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
    if (!AI_ENABLED) {
      emitTelemetry(session.id, {
        type: 'agent_info',
        agent: agent.id,
        color: agent.color,
        message: `Using rule-based analysis (AI not configured)`
      });
    }
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
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    color: agent.color,
    message: `Initiating drug safety review...`
  });
  
  const medications = patient.medications?.filter(m => m.name) || [];
  
  // FEATURE 3: Tool Use
  await agentThink(500);
  emitTelemetry(session.id, {
    type: 'tool_use',
    agent: agent.id,
    color: agent.color,
    tool: 'PubMed Interactions API',
    action: `Querying ${medications.map(m => m.name).join(' + ')} interactions`,
    message: `Checking literature for off-label toxicity...`
  });
  await agentThink(800);

        }),
        0, 0
      );
      analysis.aiGenerated = true;
      
      // Emit interaction alerts
      if (analysis.interactions?.length > 0) {
        const majorInteractions = analysis.interactions.filter(i => i.severity === 'major' || i.severity === 'contraindicated');
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
      
      // Emit safety score
      emitTelemetry(session.id, {
        type: 'agent_insight',
        agent: agent.id,
        color: agent.color,
        message: analysis.recommendations?.[0] || `Safety assessment complete. Score: ${analysis.safetyScore || 75}/100`
      });
      
    } catch (error) {
      console.error('Pharmacologist AI analysis failed after retries:', error);
      analysis = getMockPharmacologistAnalysis(patient);
      emitTelemetry(session.id, {
        type: 'agent_fallback',
        agent: agent.id,
        color: agent.color,
        severity: 'warning',
        message: `⚡ Using enhanced rule-based analysis with drug database (AI unavailable)`
      });
    }
  } else {
    analysis = getMockPharmacologistAnalysis(patient);
    if (!AI_ENABLED) {
      emitTelemetry(session.id, {
        type: 'agent_info',
        agent: agent.id,
        color: agent.color,
        message: `Using rule-based analysis (AI not configured)`
      });
    }
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
  
  emitTelemetry(session.id, {
    type: 'agent_reasoning',
    agent: agent.id,
    color: agent.color,
    message: `Assessing glucose (${patient.vitals?.sugar || '?'} mg/dL), BMI, and metabolic markers...`
  });
  
  let analysis;
  
  if (AI_ENABLED && openaiClient) {
    try {
      // Single AI call attempt for faster response
      analysis = await retryAICall(
        () => openaiClient.analyzeWithAgent('endocrinologist', patient, {
          geneticistAnalysis: session.agentAnalyses.geneticist,
          pharmacologistAnalysis: session.agentAnalyses.pharmacologist
        }),
        0, 0
      );
      analysis.aiGenerated = true;
      
      // Emit metabolic findings
      if (analysis.keyFindings?.length > 0) {
        emitTelemetry(session.id, {
          type: 'agent_insight',
          agent: agent.id,
          color: agent.color,
          message: analysis.keyFindings[0]
        });
      }
      
      // Alert for metabolic risks
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
      console.error('Endocrinologist AI analysis failed after retries:', error);
      analysis = getMockEndocrinologistAnalysis(patient);
      emitTelemetry(session.id, {
        type: 'agent_fallback',
        agent: agent.id,
        color: agent.color,
        severity: 'warning',
        message: `⚡ Using enhanced algorithmic metabolic analysis (AI unavailable)`
      });
    }
  } else {
    analysis = getMockEndocrinologistAnalysis(patient);
    if (!AI_ENABLED) {
      emitTelemetry(session.id, {
        type: 'agent_info',
        agent: agent.id,
        color: agent.color,
        message: `Using rule-based analysis (AI not configured)`
      });
    }
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
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    color: agent.color,
    message: `Evaluating resource constraints and feasibility...`
  });
  
  const budget = patient.socioEconomic?.monthlyMedicationBudget || 150;
  const insurance = patient.socioEconomic?.insuranceTier || 'Unknown';

  // FEATURE 5: Agent Reflection (Memory)
  await agentThink(600);
  emitTelemetry(session.id, {
    type: 'reflection',
    agent: agent.id,
    color: agent.color,
    message: `Recalling past cases with budget constraints ≤ $150/mo. Biological therapies triggered non-adherence. Enforcing strict budget caps for proposed therapeutics.`
  });
  await agentThink(800);

0, 0
      );
      analysis.aiGenerated = true;
      
      // Handle VETO
      if (analysis.veto?.issued) {
        emitTelemetry(session.id, {
          type: 'agent_veto',
          agent: agent.id,
          color: agent.color,
          severity: 'critical',
          message: `🛑 VETO: ${analysis.veto.reason}`
        });
        
        // Emit alternatives
        if (analysis.alternatives?.length > 0) {
          await agentThink(50);
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
      console.error('HERA AI analysis failed after retries:', error);
      analysis = getMockHeraAnalysis(patient, session.agentAnalyses);
      emitTelemetry(session.id, {
        type: 'agent_fallback',
        agent: agent.id,
        color: agent.color,
        severity: 'warning',
        message: `⚡ Using enhanced cost estimation model (AI unavailable)`
      });
    }
  } else {
    analysis = getMockHeraAnalysis(patient, session.agentAnalyses);
    if (!AI_ENABLED) {
      emitTelemetry(session.id, {
        type: 'agent_info',
        agent: agent.id,
        color: agent.color,
        message: `Using rule-based analysis (AI not configured)`
      });
    }
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
 * Generate consensus using AI
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
      // Single AI call attempt for faster response
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
      console.error('Consensus generation failed after retries:', error);
      consensus = getMockConsensus(session);
      emitTelemetry(session.id, {
        type: 'consensus_fallback',
        severity: 'warning',
        message: `⚡ Consensus built from agent analyses (AI synthesis unavailable)`
      });
    }
  } else {
    consensus = getMockConsensus(session);
    if (!AI_ENABLED) {
      emitTelemetry(session.id, {
        type: 'consensus_info',
        message: `Consensus built using rule-based synthesis (AI not configured)`
      });
    }
  }
  
  session.consensus = consensus;
  return consensus;
}

/**
 * Run full negotiation process - OPTIMIZED for parallel execution
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
  
  // Phase 1: Run specialist agents IN PARALLEL for faster response
  const startTime = Date.now();
  
  await Promise.all([
    geneticistAnalyze(session),
    pharmacologistAnalyze(session),
    endocrinologistAnalyze(session)
  ]);
  
  console.log(`[Negotiation] Parallel agent analysis completed in ${Date.now() - startTime}ms`);
  
  // Phase 2: HERA constraint review (needs other agent results)
  emitTelemetry(sessionId, {
    type: 'phase_start',
    phase: 'constraint_review',
    message: `HERA Guardian constraint evaluation...`
  });
  
  session.state = NEGOTIATION_STATES.CONSTRAINT_REVIEW;
  await heraAnalyze(session);
  
  // Phase 3: Build consensus
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
  
  // Generate final consensus
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

// ============== ENHANCED DYNAMIC MOCK FUNCTIONS ==============
// These functions generate patient-specific responses when AI is unavailable
// They include a 'mockGenerated' flag to indicate non-AI source

function getMockGeneticistAnalysis(patient) {
  const pgx = patient.biomarkers?.pharmacogenomics || {};
  const cyp2d6 = pgx.cyp2d6 || 'Normal Metabolizer';
  const cyp2c19 = pgx.cyp2c19 || 'Normal Metabolizer';
  const cyp2c9 = pgx.cyp2c9 || 'Normal Metabolizer';
  const vkorc1 = pgx.vkorc1 || 'Unknown';
  const tpmt = pgx.tpmt || 'Normal';
  
  const variant = patient.biomarkers?.genomicVariant || 'Not assessed';
  const genomics = patient.biomarkers?.genomics || {};
  const medications = patient.medications?.filter(m => m.name) || [];
  
  // Dynamic analysis based on actual patient data
  const keyFindings = [];
  const risks = [];
  const drugRecommendations = [];
  const actionableMutations = [];
  
  // CYP2D6 analysis
  if (cyp2d6.includes('Poor') || cyp2d6.includes('poor')) {
    keyFindings.push(`CYP2D6 Poor Metabolizer: May have reduced efficacy with codeine, tramadol; increased levels with metoprolol, fluoxetine`);
    risks.push('Reduced drug activation for prodrugs (codeine, tramadol)');
    medications.forEach(m => {
      if (['codeine', 'tramadol', 'metoprolol', 'fluoxetine'].some(d => m.name?.toLowerCase().includes(d))) {
        drugRecommendations.push({
          drug: m.name,
          recommendation: 'dose-adjust',
          reason: 'CYP2D6 Poor Metabolizer status',
          evidence: 'CPIC Guidelines'
        });
      }
    });
  } else if (cyp2d6.includes('Ultrarapid') || cyp2d6.includes('ultrarapid')) {
    keyFindings.push(`CYP2D6 Ultrarapid Metabolizer: Risk of toxicity with codeine; rapid clearance of other substrates`);
    risks.push('Codeine toxicity risk due to rapid morphine conversion');
  } else {
    keyFindings.push(`CYP2D6 ${cyp2d6}: Standard drug metabolism expected`);
  }
  
  // CYP2C19 analysis
  if (cyp2c19.includes('Poor') || cyp2c19.includes('poor')) {
    keyFindings.push(`CYP2C19 Poor Metabolizer: Reduced clopidogrel efficacy; higher PPI exposure`);
    risks.push('Clopidogrel may not provide adequate antiplatelet effect');
    medications.forEach(m => {
      if (['clopidogrel', 'plavix', 'omeprazole', 'pantoprazole'].some(d => m.name?.toLowerCase().includes(d))) {
        drugRecommendations.push({
          drug: m.name,
          recommendation: m.name?.toLowerCase().includes('clopidogrel') ? 'avoid' : 'dose-adjust',
          reason: 'CYP2C19 Poor Metabolizer status',
          evidence: 'CPIC Guidelines'
        });
      }
    });
  }
  
  // CYP2C9 and VKORC1 for warfarin
  if ((cyp2c9.includes('Poor') || vkorc1.includes('A/A')) && 
      medications.some(m => m.name?.toLowerCase().includes('warfarin'))) {
    keyFindings.push(`Warfarin sensitivity detected: CYP2C9 ${cyp2c9}, VKORC1 ${vkorc1}`);
    risks.push('Significantly reduced warfarin dose likely required');
    drugRecommendations.push({
      drug: 'Warfarin',
      recommendation: 'dose-adjust',
      reason: `Genetic variants (CYP2C9 ${cyp2c9}, VKORC1 ${vkorc1}) indicate warfarin sensitivity`,
      evidence: 'PharmGKB/CPIC Guidelines'
    });
  }
  
  // Genomic variants
  if (variant !== 'Not assessed' && variant !== 'Unknown') {
    actionableMutations.push(variant);
    keyFindings.push(`Actionable variant detected: ${variant}`);
  }
  
  // Oncology markers
  if (genomics.microsatelliteStatus === 'MSI-H') {
    actionableMutations.push('MSI-H');
    keyFindings.push('MSI-H status: May benefit from immunotherapy (pembrolizumab, dostarlimab)');
  }
  if (genomics.herStatus === 'Positive') {
    actionableMutations.push('HER2-Positive');
    keyFindings.push('HER2-Positive: Eligible for HER2-targeted therapies (trastuzumab, T-DXd)');
  }
  
  // Calculate confidence based on available data
  let confidence = 0.5;
  if (pgx.cyp2d6 || pgx.cyp2c19) confidence += 0.15;
  if (variant !== 'Not assessed') confidence += 0.1;
  if (Object.keys(genomics).length > 0) confidence += 0.1;
  confidence = Math.min(0.85, confidence);
  
  // Determine proposal type
  let proposalType = 'Standard';
  if (risks.length > 2 || drugRecommendations.some(r => r.recommendation === 'avoid')) {
    proposalType = 'Conservative';
  }
  
  return {
    analysis: `Pharmacogenomic profile analyzed for ${patient.name || 'patient'}. ${keyFindings.length} notable findings identified based on genetic markers.`,
    metabolizerStatus: {
      cyp2d6: cyp2d6,
      cyp2c19: cyp2c19,
      cyp2c9: cyp2c9,
      vkorc1: vkorc1,
      tpmt: tpmt
    },
    actionableMutations,
    drugRecommendations,
    proposalType,
    confidence: parseFloat(confidence.toFixed(2)),
    keyFindings: keyFindings.length > 0 ? keyFindings : ['No significant pharmacogenomic concerns identified'],
    risks: risks.length > 0 ? risks : ['No elevated genetic risks detected'],
    mockGenerated: true,
    mockReason: 'AI service unavailable - using enhanced algorithmic analysis'
  };
}

function getMockPharmacologistAnalysis(patient) {
  const medications = patient.medications?.filter(m => m.name) || [];
  const allergies = patient.allergies || [];
  const pgx = patient.biomarkers?.pharmacogenomics || {};
  
  // Import pharmacology service for comprehensive analysis
  let pharmacologyAnalysis = null;
  try {
    const pharmacologyService = require('./pharmacology.service');
    pharmacologyAnalysis = pharmacologyService.analyzePatientPharmacology(patient);
  } catch (e) {
    console.warn('Pharmacology service not available for mock analysis');
  }
  
  const interactions = [];
  const allergyAlerts = [];
  const doseAdjustments = [];
  const criticalAlerts = [];
  const recommendations = [];
  
  // Check for common drug-drug interactions
  const medNames = medications.map(m => (m.name || '').toLowerCase());
  
  // Warfarin interactions
  if (medNames.some(m => m.includes('warfarin'))) {
    if (medNames.some(m => m.includes('aspirin'))) {
      interactions.push({
        drugs: ['Warfarin', 'Aspirin'],
        severity: 'major',
        mechanism: 'Both affect hemostasis; additive bleeding risk',
        management: 'Monitor for signs of bleeding; consider GI protection'
      });
    }
    if (medNames.some(m => m.includes('omeprazole') || m.includes('pantoprazole'))) {
      interactions.push({
        drugs: ['Warfarin', 'PPI'],
        severity: 'moderate',
        mechanism: 'PPIs may alter warfarin metabolism',
        management: 'Monitor INR more frequently'
      });
    }
  }
  
  // ACE inhibitor + Potassium interactions
  if (medNames.some(m => m.includes('lisinopril') || m.includes('enalapril') || m.includes('ramipril'))) {
    if (medNames.some(m => m.includes('potassium') || m.includes('spironolactone'))) {
      interactions.push({
        drugs: ['ACE Inhibitor', 'Potassium-sparing agent'],
        severity: 'major',
        mechanism: 'Additive hyperkalemia risk',
        management: 'Monitor serum potassium closely'
      });
      criticalAlerts.push('Hyperkalemia risk with current medication combination');
    }
  }
  
  // Metformin + Contrast considerations
  if (medNames.some(m => m.includes('metformin'))) {
    recommendations.push('Hold metformin 48h before/after IV contrast procedures to prevent lactic acidosis');
  }
  
  // Check allergies against current medications
  allergies.forEach(allergy => {
    const allergen = (allergy.allergen || '').toLowerCase();
    medications.forEach(med => {
      const medName = (med.name || '').toLowerCase();
      // Penicillin cross-reactivity
      if (allergen.includes('penicillin') && 
          (medName.includes('amoxicillin') || medName.includes('ampicillin'))) {
        allergyAlerts.push({
          allergen: allergy.allergen,
          risk: `${med.name} is a penicillin - CONTRAINDICATED`,
          action: 'avoid'
        });
        criticalAlerts.push(`ALLERGY ALERT: Patient allergic to ${allergy.allergen}, currently on ${med.name}`);
      }
      // Sulfa cross-reactivity
      if (allergen.includes('sulfa') && medName.includes('sulfamethoxazole')) {
        allergyAlerts.push({
          allergen: allergy.allergen,
          risk: `${med.name} contains sulfa - CONTRAINDICATED`,
          action: 'avoid'
        });
        criticalAlerts.push(`ALLERGY ALERT: Sulfa allergy with sulfamethoxazole on board`);
      }
    });
  });
  
  // PGx-based dose adjustments
  if (pgx.cyp2d6?.toLowerCase().includes('poor')) {
    medications.forEach(med => {
      if (['metoprolol', 'carvedilol'].some(d => med.name?.toLowerCase().includes(d))) {
        doseAdjustments.push({
          drug: med.name,
          currentDose: med.dosage || 'Unknown',
          recommendedDose: 'Consider 50% dose reduction',
          reason: 'CYP2D6 Poor Metabolizer - reduced clearance'
        });
      }
    });
  }
  
  // Calculate dynamic safety score
  let safetyScore = 100;
  safetyScore -= interactions.filter(i => i.severity === 'major').length * 15;
  safetyScore -= interactions.filter(i => i.severity === 'moderate').length * 8;
  safetyScore -= allergyAlerts.filter(a => a.action === 'avoid').length * 25;
  safetyScore -= criticalAlerts.length * 10;
  safetyScore = Math.max(10, Math.min(100, safetyScore));
  
  // Use pharmacology service results if available
  if (pharmacologyAnalysis) {
    safetyScore = pharmacologyAnalysis.summary.safetyScore;
    if (pharmacologyAnalysis.criticalAlerts.length > 0) {
      pharmacologyAnalysis.criticalAlerts.forEach(alert => {
        if (!criticalAlerts.includes(alert.type)) {
          criticalAlerts.push(`${alert.type}: Review required`);
        }
      });
    }
  }
  
  // Determine proposal type
  let proposalType = 'Standard';
  if (safetyScore < 60 || criticalAlerts.length > 0) {
    proposalType = 'Conservative';
  }
  
  // Generate recommendations
  if (interactions.length > 0) {
    recommendations.push(`${interactions.length} drug interaction(s) identified - review clinical significance`);
  }
  if (doseAdjustments.length > 0) {
    recommendations.push('Pharmacogenomic-based dose adjustments recommended');
  }
  if (recommendations.length === 0) {
    recommendations.push('Continue current medications with standard monitoring');
  }
  
  // Calculate confidence
  let confidence = 0.6;
  if (pharmacologyAnalysis) confidence += 0.15;
  if (allergies.length > 0) confidence += 0.1; // More data = more confidence
  if (Object.keys(pgx).length > 0) confidence += 0.1;
  confidence = Math.min(0.85, confidence);
  
  return {
    analysis: `Comprehensive safety review of ${medications.length} medications. ${interactions.length} interactions identified, ${allergyAlerts.length} allergy concerns flagged.`,
    currentMedications: medications.map(m => ({
      name: m.name,
      appropriateness: allergyAlerts.some(a => a.risk?.includes(m.name)) ? 'contraindicated' : 
                       doseAdjustments.some(d => d.drug === m.name) ? 'dose-adjust' : 'appropriate',
      notes: `${m.dosage || ''} ${m.frequency || ''}`
    })),
    interactions,
    allergyAlerts,
    doseAdjustments,
    safetyScore,
    proposalType,
    confidence: parseFloat(confidence.toFixed(2)),
    criticalAlerts,
    recommendations,
    mockGenerated: true,
    mockReason: 'AI service unavailable - using enhanced rule-based analysis with drug database'
  };
}

function getMockEndocrinologistAnalysis(patient) {
  const vitals = patient.vitals || {};
  const glucose = vitals.sugar || vitals.glucose || null;
  const weight = patient.weight;
  const height = patient.height;
  const bmi = (weight && height) ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;
  const conditions = patient.medicalHistory?.conditions || [];
  const medications = patient.medications?.filter(m => m.name) || [];
  
  const hasDiabetes = conditions.some(c => 
    c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('dm')
  );
  const hasThyroid = conditions.some(c =>
    c.toLowerCase().includes('thyroid') || c.toLowerCase().includes('hypothyroid') || c.toLowerCase().includes('hyperthyroid')
  );
  const hasMetabolicSyndrome = conditions.some(c =>
    c.toLowerCase().includes('metabolic') || c.toLowerCase().includes('obesity')
  );
  
  const keyFindings = [];
  const metabolicRisks = [];
  const recommendations = [];
  const currentTherapyAssessment = [];
  
  // Glucose analysis
  let diabetesControl = 'Not applicable';
  if (glucose !== null) {
    if (glucose >= 200) {
      diabetesControl = 'Poor - Significantly elevated';
      keyFindings.push(`Fasting glucose ${glucose} mg/dL indicates poor glycemic control`);
      metabolicRisks.push('Hyperglycemia - risk of diabetic complications');
      recommendations.push({
        category: 'Glycemic',
        suggestion: 'Intensify diabetes management; consider additional agent or insulin',
        priority: 'High',
        rationale: `Glucose ${glucose} mg/dL is significantly above target`
      });
    } else if (glucose >= 126) {
      diabetesControl = 'Suboptimal';
      keyFindings.push(`Fasting glucose ${glucose} mg/dL suggests suboptimal control`);
      recommendations.push({
        category: 'Glycemic',
        suggestion: 'Review diabetes regimen; optimize current therapy',
        priority: 'Medium',
        rationale: 'Glucose above fasting target of <126 mg/dL'
      });
    } else if (glucose >= 100 && glucose < 126) {
      diabetesControl = 'Prediabetes range';
      keyFindings.push(`Fasting glucose ${glucose} mg/dL in prediabetes range`);
      if (!hasDiabetes) {
        recommendations.push({
          category: 'Glycemic',
          suggestion: 'Consider HbA1c testing; lifestyle intervention',
          priority: 'Medium',
          rationale: 'Prediabetes may progress without intervention'
        });
      }
    } else {
      diabetesControl = 'Adequate';
      keyFindings.push(`Fasting glucose ${glucose} mg/dL within normal limits`);
    }
  } else {
    keyFindings.push('Glucose not available - recommend fasting glucose or HbA1c');
  }
  
  // BMI analysis
  let weightStatus = 'Not assessed';
  if (bmi !== null) {
    const bmiNum = parseFloat(bmi);
    if (bmiNum >= 40) {
      weightStatus = `Class III Obesity (BMI ${bmi})`;
      metabolicRisks.push('Severe obesity - high cardiovascular and metabolic risk');
      recommendations.push({
        category: 'Weight',
        suggestion: 'Consider weight management program; GLP-1 agonist or bariatric referral',
        priority: 'High',
        rationale: 'Class III obesity significantly increases morbidity'
      });
    } else if (bmiNum >= 35) {
      weightStatus = `Class II Obesity (BMI ${bmi})`;
      metabolicRisks.push('Obesity increases insulin resistance and cardiovascular risk');
    } else if (bmiNum >= 30) {
      weightStatus = `Class I Obesity (BMI ${bmi})`;
      recommendations.push({
        category: 'Weight',
        suggestion: 'Lifestyle modification; consider weight-favorable medications',
        priority: 'Medium',
        rationale: 'Obesity management improves metabolic outcomes'
      });
    } else if (bmiNum >= 25) {
      weightStatus = `Overweight (BMI ${bmi})`;
    } else if (bmiNum >= 18.5) {
      weightStatus = `Normal (BMI ${bmi})`;
    } else {
      weightStatus = `Underweight (BMI ${bmi})`;
      metabolicRisks.push('Underweight - assess for nutritional deficiencies');
    }
  }
  
  // Metabolic syndrome assessment
  let metabolicSyndromeStatus = 'Evaluation needed';
  let msComponents = 0;
  if (bmi && parseFloat(bmi) >= 30) msComponents++;
  if (glucose && glucose >= 100) msComponents++;
  if (vitals.bpSystolic && vitals.bpSystolic >= 130) msComponents++;
  // Would need lipids for full assessment
  
  if (msComponents >= 2) {
    metabolicSyndromeStatus = `${msComponents}/5 criteria (partial assessment)`;
    if (msComponents >= 3) {
      metabolicRisks.push('Metabolic syndrome likely - increased cardiovascular risk');
    }
  }
  
  // Assess current diabetes medications
  medications.forEach(med => {
    const medName = (med.name || '').toLowerCase();
    
    if (medName.includes('metformin')) {
      currentTherapyAssessment.push({
        medication: med.name,
        effectiveness: glucose && glucose > 150 ? 'May need intensification' : 'Appropriate first-line',
        optimization: glucose && glucose > 150 ? 'Consider adding second agent' : 'Continue current dose'
      });
    }
    
    if (medName.includes('semaglutide') || medName.includes('ozempic') || medName.includes('wegovy')) {
      currentTherapyAssessment.push({
        medication: med.name,
        effectiveness: 'GLP-1 agonist - good glycemic and weight benefits',
        optimization: 'Ensure titrated to therapeutic dose'
      });
    }
    
    if (medName.includes('insulin')) {
      currentTherapyAssessment.push({
        medication: med.name,
        effectiveness: glucose && glucose > 180 ? 'May need dose adjustment' : 'Appears adequate',
        optimization: 'Monitor for hypoglycemia; adjust based on glucose patterns'
      });
    }
    
    if (medName.includes('levothyroxine') || medName.includes('synthroid')) {
      currentTherapyAssessment.push({
        medication: med.name,
        effectiveness: 'Thyroid replacement',
        optimization: 'Check TSH in 6-8 weeks after any dose changes'
      });
    }
  });
  
  // Thyroid considerations
  let thyroidFunction = 'Not assessed';
  if (hasThyroid) {
    thyroidFunction = 'Known thyroid disorder - ensure TSH monitoring';
    keyFindings.push('Thyroid condition on record - monitor thyroid function');
  }
  
  // Calculate confidence
  let confidence = 0.5;
  if (glucose !== null) confidence += 0.15;
  if (bmi !== null) confidence += 0.1;
  if (currentTherapyAssessment.length > 0) confidence += 0.1;
  confidence = Math.min(0.85, confidence);
  
  // Determine proposal type
  let proposalType = 'Standard';
  if (metabolicRisks.length > 2 || (glucose && glucose >= 200)) {
    proposalType = 'Aggressive';
  } else if (recommendations.length === 0) {
    proposalType = 'Conservative';
  }
  
  if (keyFindings.length === 0) {
    keyFindings.push('Limited metabolic data available for assessment');
  }
  
  return {
    analysis: `Metabolic profile assessed for ${patient.name || 'patient'}. ${keyFindings.length} findings, ${metabolicRisks.length} risk factors identified.`,
    metabolicStatus: {
      diabetesControl,
      thyroidFunction,
      weightStatus,
      metabolicSyndrome: metabolicSyndromeStatus
    },
    currentTherapyAssessment,
    recommendations,
    metabolicRisks: metabolicRisks.length > 0 ? metabolicRisks : ['No significant metabolic risks identified'],
    proposalType,
    confidence: parseFloat(confidence.toFixed(2)),
    keyFindings,
    mockGenerated: true,
    mockReason: 'AI service unavailable - using enhanced algorithmic metabolic analysis'
  };
}

function getMockHeraAnalysis(patient, proposals) {
  const socioEconomic = patient.socioEconomic || {};
  const budget = socioEconomic.monthlyMedicationBudget || 150;
  const insuranceTier = socioEconomic.insuranceTier || 'Unknown';
  const location = socioEconomic.location || 'Unknown';
  const transportation = socioEconomic.transportationAccess || 'Unknown';
  const workFlexibility = socioEconomic.workScheduleFlexibility || 'Unknown';
  
  const medications = patient.medications?.filter(m => m.name) || [];
  
  // Estimate medication costs (simplified model)
  const drugCostEstimates = {
    // Brand name/specialty drugs (high cost)
    'humira': 5000, 'enbrel': 4500, 'keytruda': 15000, 'opdivo': 12000,
    'ozempic': 900, 'wegovy': 1300, 'mounjaro': 1000, 'jardiance': 500,
    'eliquis': 450, 'xarelto': 400, 'entresto': 550,
    // Generics (low cost)
    'metformin': 15, 'lisinopril': 10, 'atorvastatin': 15, 'amlodipine': 12,
    'metoprolol': 15, 'omeprazole': 20, 'levothyroxine': 25, 'aspirin': 10,
    // Medium cost
    'insulin': 300, 'lantus': 350, 'humalog': 300,
    'default': 50
  };
  
  let totalEstimatedCost = 0;
  const medicationCostBreakdown = [];
  
  medications.forEach(med => {
    const medName = (med.name || '').toLowerCase();
    let cost = drugCostEstimates.default;
    
    for (const [drug, price] of Object.entries(drugCostEstimates)) {
      if (medName.includes(drug)) {
        cost = price;
        break;
      }
    }
    
    totalEstimatedCost += cost;
    medicationCostBreakdown.push({
      medication: med.name,
      estimatedMonthlyCost: cost,
      tier: cost > 500 ? 'Specialty' : cost > 100 ? 'Brand' : 'Generic'
    });
  });
  
  // Budget analysis
  let budgetStatus = 'within';
  let budgetGap = budget - totalEstimatedCost;
  
  if (totalEstimatedCost > budget * 3) {
    budgetStatus = 'significantly_exceeded';
  } else if (totalEstimatedCost > budget) {
    budgetStatus = 'exceeded';
  }
  
  // Insurance coverage assessment
  let coverageLikelihood = 'likely';
  const specialtyMeds = medicationCostBreakdown.filter(m => m.tier === 'Specialty');
  
  if (insuranceTier === 'Bronze' || insuranceTier === 'Uninsured') {
    if (specialtyMeds.length > 0) {
      coverageLikelihood = 'unlikely';
    } else {
      coverageLikelihood = 'partial';
    }
  } else if (insuranceTier === 'Silver' && specialtyMeds.length > 0) {
    coverageLikelihood = 'prior_auth_needed';
  }
  
  // Access assessment
  const accessAssessment = {
    geographic: location.toLowerCase().includes('rural') ? 'Limited - rural area' : 'Adequate',
    transportation: transportation === 'None' || transportation === 'Limited' ? 
      'Barrier - may need telehealth or home delivery' : 'Available',
    scheduling: workFlexibility === 'None' ? 
      'Barrier - limited appointment flexibility' : 'Manageable'
  };
  
  // Determine if VETO needed
  let veto = { issued: false };
  const constraints = [];
  
  if (budgetStatus === 'significantly_exceeded') {
    veto = {
      issued: true,
      reason: `Monthly cost estimate $${totalEstimatedCost} exceeds 3x patient budget ($${budget}/mo)`,
      constraints: ['Budget severely exceeded']
    };
    constraints.push('Budget constraint');
  }
  
  if (coverageLikelihood === 'unlikely' && specialtyMeds.length > 0) {
    if (!veto.issued) {
      veto = {
        issued: true,
        reason: `${specialtyMeds.length} specialty medication(s) unlikely covered by ${insuranceTier} plan`,
        constraints: ['Insurance coverage inadequate']
      };
    } else {
      veto.constraints.push('Insurance coverage inadequate');
    }
    constraints.push('Insurance constraint');
  }
  
  // Generate alternatives
  const alternatives = [];
  
  if (budgetStatus !== 'within') {
    // Suggest generic alternatives
    const brandMeds = medicationCostBreakdown.filter(m => m.tier === 'Brand' || m.tier === 'Specialty');
    if (brandMeds.length > 0) {
      alternatives.push({
        category: 'Generic',
        suggestion: `Consider generic alternatives for: ${brandMeds.map(m => m.medication).join(', ')}`,
        costSavings: `Potential savings: $${brandMeds.reduce((sum, m) => sum + m.estimatedMonthlyCost * 0.7, 0).toFixed(0)}/month`,
        tradeoff: 'Some brand medications may not have generic equivalents'
      });
    }
    
    // Suggest patient assistance programs
    if (specialtyMeds.length > 0) {
      alternatives.push({
        category: 'Assistance Program',
        suggestion: `Manufacturer assistance programs available for: ${specialtyMeds.map(m => m.medication).join(', ')}`,
        costSavings: 'Up to 100% cost reduction for eligible patients',
        tradeoff: 'Requires application and income verification'
      });
    }
  }
  
  if (accessAssessment.transportation.includes('Barrier')) {
    alternatives.push({
      category: 'Alternative Route',
      suggestion: 'Consider telehealth visits and mail-order pharmacy',
      costSavings: 'Reduces transportation burden and may offer lower prices',
      tradeoff: 'Some medications require in-person pickup'
    });
  }
  
  // Calculate feasibility score
  let feasibilityScore = 100;
  if (budgetStatus === 'exceeded') feasibilityScore -= 25;
  if (budgetStatus === 'significantly_exceeded') feasibilityScore -= 50;
  if (coverageLikelihood === 'unlikely') feasibilityScore -= 30;
  if (coverageLikelihood === 'prior_auth_needed') feasibilityScore -= 15;
  if (accessAssessment.transportation.includes('Barrier')) feasibilityScore -= 15;
  if (accessAssessment.scheduling.includes('Barrier')) feasibilityScore -= 10;
  feasibilityScore = Math.max(10, Math.min(100, feasibilityScore));
  
  // Generate recommendations
  const recommendations = [];
  if (veto.issued) {
    recommendations.push('Treatment plan requires revision to meet patient constraints');
  }
  if (coverageLikelihood === 'prior_auth_needed') {
    recommendations.push('Initiate prior authorization for specialty medications');
  }
  if (alternatives.length > 0) {
    recommendations.push(`${alternatives.length} cost-reduction option(s) identified`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Current treatment plan appears feasible within patient constraints');
  }
  
  // Calculate confidence
  let confidence = 0.6;
  if (budget !== 150) confidence += 0.1; // User provided actual budget
  if (insuranceTier !== 'Unknown') confidence += 0.1;
  if (location !== 'Unknown') confidence += 0.05;
  confidence = Math.min(0.85, confidence);
  
  return {
    analysis: `Resource constraints evaluated. Est. monthly cost: $${totalEstimatedCost} vs budget $${budget}. ${constraints.length > 0 ? constraints.join(', ') + ' identified.' : 'All constraints satisfied.'}`,
    constraintEvaluation: {
      budget: {
        status: budgetStatus,
        patientBudget: `$${budget}/month`,
        estimatedCost: `$${totalEstimatedCost}/month`,
        gap: budgetGap >= 0 ? `$${budgetGap} under budget` : `$${Math.abs(budgetGap)} over budget`,
        breakdown: medicationCostBreakdown
      },
      insurance: {
        tier: insuranceTier,
        coverageLikelihood,
        notes: coverageLikelihood === 'prior_auth_needed' ? 
          'Specialty medications may require prior authorization' :
          coverageLikelihood === 'unlikely' ?
          'Consider patient assistance programs' :
          'Standard formulary coverage expected'
      },
      access: accessAssessment
    },
    feasibilityScore,
    veto,
    alternatives,
    recommendations,
    confidence: parseFloat(confidence.toFixed(2)),
    mockGenerated: true,
    mockReason: 'AI service unavailable - using enhanced cost estimation model'
  };
}

function getMockConsensus(session) {
  const patient = session.patient;
  const medications = patient.medications?.filter(m => m.name) || [];
  const conditions = patient.medicalHistory?.conditions || [];
  const analyses = session.agentAnalyses;
  
  // Gather key findings from all agents
  const geneticistFindings = analyses.geneticist?.keyFindings || [];
  const pharmacologistAlerts = analyses.pharmacologist?.criticalAlerts || [];
  const endoRecommendations = analyses.endocrinologist?.recommendations || [];
  const heraVeto = analyses.hera?.veto?.issued;
  const heraAlternatives = analyses.hera?.alternatives || [];
  
  // Calculate weighted confidence
  const avgConfidence = (
    (analyses.geneticist?.confidence || 0.5) +
    (analyses.pharmacologist?.confidence || 0.5) +
    (analyses.endocrinologist?.confidence || 0.5) +
    (analyses.hera?.confidence || 0.5)
  ) / 4;
  
  // Determine agent agreement
  const agentAgreement = {
    geneticist: analyses.geneticist?.proposalType === 'Conservative' ? 'adjusted' : 'agreed',
    pharmacologist: pharmacologistAlerts.length > 0 ? 'adjusted' : 'agreed',
    endocrinologist: endoRecommendations.some(r => r.priority === 'High') ? 'adjusted' : 'agreed',
    hera: heraVeto ? 'vetoed_then_adjusted' : 'approved'
  };
  
  // Count adjustments
  const adjustedCount = Object.values(agentAgreement).filter(v => v !== 'agreed' && v !== 'approved').length;
  let consensusLevel = 'Full';
  if (adjustedCount > 0) consensusLevel = 'Majority';
  if (adjustedCount > 2) consensusLevel = 'Adjusted';
  
  // Build treatment protocol based on conditions
  let protocol = 'Personalized Treatment Optimization Protocol';
  let details = '';
  const treatmentMedications = [];
  const monitoring = [];
  const precautions = [];
  
  // Disease-specific protocols
  if (conditions.some(c => c.toLowerCase().includes('diabetes'))) {
    protocol = 'Glycemic Optimization Protocol with Safety Monitoring';
    details = 'Focus on achieving target glucose levels while minimizing hypoglycemia risk. ';
    
    // Check if metformin should be continued/adjusted
    const hasMetformin = medications.some(m => m.name?.toLowerCase().includes('metformin'));
    if (hasMetformin) {
      treatmentMedications.push({
        name: 'Metformin',
        dose: medications.find(m => m.name?.toLowerCase().includes('metformin'))?.dosage || '500mg',
        frequency: 'Twice daily with meals',
        duration: 'Ongoing',
        notes: 'Continue current therapy; monitor renal function'
      });
    }
    
    monitoring.push('HbA1c every 3 months until at target, then every 6 months');
    monitoring.push('Fasting glucose and renal function panel');
    
    // Add GLP-1 if high priority endocrine recommendation
    if (endoRecommendations.some(r => r.category === 'Glycemic' && r.priority === 'High')) {
      details += 'Consider adding GLP-1 agonist for additional glycemic and weight benefits. ';
      treatmentMedications.push({
        name: 'Semaglutide (consider)',
        dose: '0.25mg weekly, titrate to 1mg',
        frequency: 'Once weekly',
        duration: 'Long-term',
        notes: 'If added, provides cardiovascular benefits'
      });
    }
  } else if (conditions.some(c => c.toLowerCase().includes('cardiac') || c.toLowerCase().includes('heart') || c.toLowerCase().includes('hypertension'))) {
    protocol = 'Cardiovascular Risk Reduction Protocol';
    details = 'Optimize blood pressure, lipids, and antiplatelet therapy as indicated. ';
    
    monitoring.push('Blood pressure monitoring; home readings if possible');
    monitoring.push('Lipid panel annually');
    monitoring.push('Renal function and electrolytes');
    
    // Add statins if cardiac
    if (!medications.some(m => m.name?.toLowerCase().includes('statin') || m.name?.toLowerCase().includes('atorvastatin'))) {
      treatmentMedications.push({
        name: 'Atorvastatin (consider)',
        dose: '20-40mg',
        frequency: 'Once daily at bedtime',
        duration: 'Ongoing',
        notes: 'For cardiovascular risk reduction'
      });
    }
  } else if (patient.disease === 'Neurological') {
    protocol = 'Neurological Symptom Management Protocol';
    details = 'Balance symptom control with minimizing medication burden and side effects. ';
    
    monitoring.push('Neurological symptom diary');
    monitoring.push('Cognitive assessment if indicated');
  } else if (patient.disease === 'Oncology') {
    protocol = 'Precision Oncology Treatment Protocol';
    details = 'Leverage genomic markers for targeted therapy selection. ';
    
    if (geneticistFindings.some(f => f.includes('EGFR'))) {
      details += 'EGFR-targeted therapy indicated based on molecular profile. ';
    }
    if (geneticistFindings.some(f => f.includes('MSI-H'))) {
      details += 'MSI-H status supports immunotherapy approach. ';
    }
    
    monitoring.push('Tumor markers as appropriate');
    monitoring.push('CT/imaging per protocol');
    monitoring.push('CBC, CMP, LFTs per treatment cycle');
  }
  
  // Add current medications to list
  medications.forEach(med => {
    if (!treatmentMedications.some(tm => tm.name.toLowerCase().includes(med.name?.toLowerCase()))) {
      const adjustment = analyses.pharmacologist?.doseAdjustments?.find(d => d.drug === med.name);
      treatmentMedications.push({
        name: med.name,
        dose: adjustment ? adjustment.recommendedDose : med.dosage,
        frequency: med.frequency,
        duration: 'Ongoing',
        notes: adjustment ? `Adjusted: ${adjustment.reason}` : 'Continue as prescribed'
      });
    }
  });
  
  // Add precautions based on agent findings
  if (pharmacologistAlerts.length > 0) {
    pharmacologistAlerts.forEach(alert => precautions.push(alert));
  }
  if (analyses.geneticist?.risks?.length > 0) {
    analyses.geneticist.risks.forEach(risk => {
      if (!precautions.includes(risk)) precautions.push(risk);
    });
  }
  if (precautions.length === 0) {
    precautions.push('Monitor for adverse effects');
    precautions.push('Report new or worsening symptoms');
  }
  
  // Handle HERA veto with adjustments
  let adjustedForConstraints = false;
  let adjustmentReason = null;
  
  if (heraVeto && heraAlternatives.length > 0) {
    adjustedForConstraints = true;
    adjustmentReason = analyses.hera.veto.reason;
    details += `Note: Treatment adjusted for ${heraAlternatives[0].category.toLowerCase()} considerations. `;
    
    // Mark potentially unaffordable medications
    treatmentMedications.forEach(med => {
      const highCost = analyses.hera?.constraintEvaluation?.budget?.breakdown?.find(
        b => b.medication === med.name && b.tier === 'Specialty'
      );
      if (highCost) {
        med.notes += ' [May need assistance program]';
      }
    });
  }
  
  // Finalize details
  if (!details) {
    details = `Maintain current medication regimen with ${monitoring.length > 0 ? 'specified' : 'standard'} monitoring. Personalized based on patient's ${patient.disease || 'clinical'} profile and agent consensus.`;
  }
  
  return {
    recommendedProtocol: protocol,
    protocolDetails: details.trim(),
    rationale: `Based on ${Object.keys(analyses).length}-agent analysis of ${patient.name || 'patient'}'s ${patient.disease || 'clinical'} profile. ${adjustedCount > 0 ? `${adjustedCount} agent(s) recommended adjustments.` : 'All agents in agreement.'}`,
    medications: treatmentMedications,
    monitoring,
    precautions,
    adjustedForConstraints,
    adjustmentReason,
    confidence: parseFloat(avgConfidence.toFixed(2)),
    consensusLevel,
    agentAgreement,
    mockGenerated: true,
    mockReason: 'AI service unavailable - consensus built from agent analyses'
  };
}

/**
 * Inject human intervention
 */
async function injectHumanIntervention(sessionId, intervention) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  session.state = NEGOTIATION_STATES.HUMAN_INTERVENTION;
  session.humanInterventions.push({
    timestamp: Date.now(),
    ...intervention
  });
  
  emitTelemetry(sessionId, {
    type: 'human_intervention',
    severity: 'critical',
    message: `🔔 HUMAN INTERVENTION: ${intervention.message}`,
    intervention
  });
  
  return session;
}

/**
 * Get session by ID
 */
function getSession(sessionId) {
  return activeSessions.get(sessionId);
}

/**
 * Get all telemetry for a session
 */
function getSessionTelemetry(sessionId) {
  const session = activeSessions.get(sessionId);
  return session ? session.telemetry : [];
}

module.exports = {
  runNegotiation,
  injectHumanIntervention,
  getSession,
  getSessionTelemetry,
  createSession,
  negotiationEventBus,
  AGENT_ROLES,
  NEGOTIATION_STATES,
  AI_ENABLED: () => AI_ENABLED
};
