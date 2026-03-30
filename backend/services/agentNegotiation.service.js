/**
 * Multi-Round Agent Negotiation Protocol Service
 * 
 * Implements a cyclic negotiation loop (Actor Model pattern) where:
 * 1. Utopian Specialists propose ideal treatment protocols
 * 2. Constraint Agents (HERA) evaluate and may VETO
 * 3. System forces revision cycles until consensus
 * 
 * This demonstrates iterative reasoning and self-correcting workflows.
 */

const EventEmitter = require('events');
const digitalTwinService = require('./digitalTwin.service');
const pharmacologyService = require('./pharmacology.service');

// Global event bus for telemetry streaming
const negotiationEventBus = new EventEmitter();
negotiationEventBus.setMaxListeners(100);

// Agent role definitions
const AGENT_ROLES = {
  GENETICIST: {
    id: 'geneticist',
    name: 'Dr. Gene',
    specialty: 'Clinical Geneticist',
    avatar: '🧬',
    bias: 'aggressive', // Prefers targeted therapies
    priority: ['genomic_match', 'efficacy', 'precision']
  },
  ONCOLOGIST: {
    id: 'oncologist',
    name: 'Dr. Onco',
    specialty: 'Medical Oncologist',
    avatar: '🔬',
    bias: 'aggressive',
    priority: ['tumor_response', 'survival', 'combination_therapy']
  },
  CARDIOLOGIST: {
    id: 'cardiologist',
    name: 'Dr. Cardio',
    specialty: 'Interventional Cardiologist',
    avatar: '❤️',
    bias: 'moderate',
    priority: ['cardiac_safety', 'hemodynamics', 'intervention_timing']
  },
  ENDOCRINOLOGIST: {
    id: 'endocrinologist',
    name: 'Dr. Endo',
    specialty: 'Endocrinologist',
    avatar: '⚗️',
    bias: 'aggressive',
    priority: ['metabolic_control', 'hormone_optimization', 'glycemic_targets']
  },
  PHARMACOLOGIST: {
    id: 'pharmacologist',
    name: 'Dr. Pharma',
    specialty: 'Clinical Pharmacologist',
    avatar: '💊',
    bias: 'conservative',
    priority: ['drug_safety', 'interactions', 'pharmacogenomics']
  },
  HERA: {
    id: 'hera',
    name: 'HERA',
    specialty: 'Health Economics & Resource Agent',
    avatar: '📊',
    bias: 'constraint',
    priority: ['cost_effectiveness', 'accessibility', 'insurance_coverage', 'geographic_feasibility']
  },
  PATIENT_ADVOCATE: {
    id: 'patient_advocate',
    name: 'PatientVoice',
    specialty: 'Patient Advocate AI',
    avatar: '🗣️',
    bias: 'patient_centered',
    priority: ['quality_of_life', 'patient_preference', 'treatment_burden']
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
    maxRounds: 5,
    proposals: [],
    vetoes: [],
    revisions: [],
    consensus: null,
    telemetry: [],
    humanInterventions: [],
    startTime: Date.now(),
    lastActivity: Date.now()
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
 * Simulate agent thinking delay for realistic telemetry
 */
async function agentThink(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Geneticist Agent - Proposes genomic-targeted therapies
 */
async function geneticistAnalyze(session, context) {
  const agent = AGENT_ROLES.GENETICIST;
  const { patient } = session;
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    avatar: agent.avatar,
    message: `Initiating genomic profile analysis...`
  });
  
  await agentThink(600);
  
  const genomicVariant = patient.biomarkers?.genomicVariant || 'Not assessed';
  const variants = patient.biomarkers?.genomics?.variants || [];
  
  emitTelemetry(session.id, {
    type: 'agent_reasoning',
    agent: agent.id,
    message: `Scanning genomic markers... Found: ${genomicVariant}`,
    data: { genomicVariant, variantCount: variants.length }
  });
  
  await agentThink(400);
  
  let proposal = {
    agentId: agent.id,
    type: 'Standard',
    confidence: 0.7,
    rationale: [],
    recommendations: [],
    risks: []
  };
  
  // Check for actionable mutations
  const actionableMarkers = ['EGFR', 'BRCA', 'HER2', 'ALK', 'ROS1', 'BRAF', 'KRAS'];
  const hasActionable = actionableMarkers.some(marker => 
    genomicVariant.toUpperCase().includes(marker) ||
    variants.some(v => v.gene?.toUpperCase().includes(marker))
  );
  
  if (hasActionable) {
    emitTelemetry(session.id, {
      type: 'agent_alert',
      agent: agent.id,
      severity: 'high',
      message: `⚠️ ACTIONABLE MUTATION DETECTED! Recommending targeted therapy pathway.`
    });
    
    await agentThink(500);
    
    proposal.type = 'Aggressive';
    proposal.confidence = 0.85;
    proposal.rationale.push(`Actionable genomic variant identified: ${genomicVariant}`);
    proposal.recommendations.push({
      category: 'Targeted Therapy',
      suggestion: 'Initiate precision oncology protocol with matched TKI or immunotherapy',
      priority: 'High',
      evidence: 'FDA-approved indication based on genomic profile'
    });
    
    emitTelemetry(session.id, {
      type: 'agent_proposal',
      agent: agent.id,
      message: `Proposing AGGRESSIVE targeted therapy based on ${genomicVariant}`,
      proposal: { type: proposal.type, confidence: proposal.confidence }
    });
  } else {
    emitTelemetry(session.id, {
      type: 'agent_reasoning',
      agent: agent.id,
      message: `No actionable mutations found. Recommending standard genomic monitoring.`
    });
    
    proposal.rationale.push('No actionable genomic markers identified');
    proposal.recommendations.push({
      category: 'Monitoring',
      suggestion: 'Continue standard care with periodic genomic reassessment',
      priority: 'Medium',
      evidence: 'Standard of care guidelines'
    });
  }
  
  emitTelemetry(session.id, {
    type: 'agent_complete',
    agent: agent.id,
    message: `Analysis complete. Confidence: ${(proposal.confidence * 100).toFixed(0)}%`,
    proposal
  });
  
  return proposal;
}

/**
 * Pharmacologist Agent - Evaluates drug safety and interactions
 */
async function pharmacologistAnalyze(session, context) {
  const agent = AGENT_ROLES.PHARMACOLOGIST;
  const { patient } = session;
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    avatar: agent.avatar,
    message: `Initiating pharmacological safety review...`
  });
  
  await agentThink(500);
  
  const medications = patient.medications || [];
  const allergies = patient.allergies || [];
  const pharmacogenomics = patient.biomarkers?.pharmacogenomics || {};
  
  emitTelemetry(session.id, {
    type: 'agent_reasoning',
    agent: agent.id,
    message: `Scanning current medications (${medications.length}) and allergy profile (${allergies.length})...`
  });
  
  await agentThink(400);
  
  // Run pharmacology analysis
  const drugAnalysis = pharmacologyService.analyzePatientPharmacology(patient);
  
  let proposal = {
    agentId: agent.id,
    type: 'Conservative',
    confidence: 0.75,
    rationale: [],
    recommendations: [],
    risks: [],
    veto: null
  };
  
  // Check for CYP interactions
  if (pharmacogenomics.cyp2c19) {
    emitTelemetry(session.id, {
      type: 'agent_alert',
      agent: agent.id,
      severity: pharmacogenomics.cyp2c19.includes('Poor') ? 'critical' : 'info',
      message: `Scanning CYP2C19 profile... ${pharmacogenomics.cyp2c19} detected.`
    });
    
    await agentThink(300);
    
    if (pharmacogenomics.cyp2c19.includes('Poor')) {
      proposal.risks.push({
        type: 'Pharmacogenomic',
        description: 'CYP2C19 poor metabolizer - altered drug metabolism',
        severity: 'High',
        affectedDrugs: ['Clopidogrel', 'Omeprazole', 'Citalopram']
      });
      
      emitTelemetry(session.id, {
        type: 'agent_alert',
        agent: agent.id,
        severity: 'critical',
        message: `⚠️ ALERTING GROUP: Standard Clopidogrel dosage carries HIGH TOXICITY RISK for this patient!`
      });
      
      proposal.recommendations.push({
        category: 'Drug Substitution',
        suggestion: 'Switch from Clopidogrel to Ticagrelor or Prasugrel',
        priority: 'Critical',
        evidence: 'CPIC Guidelines for CYP2C19 poor metabolizers'
      });
    }
  }
  
  await agentThink(400);
  
  // Check drug interactions
  if (drugAnalysis.criticalAlerts.length > 0) {
    emitTelemetry(session.id, {
      type: 'agent_alert',
      agent: agent.id,
      severity: 'critical',
      message: `🚨 ${drugAnalysis.criticalAlerts.length} CRITICAL DRUG INTERACTION(S) DETECTED!`
    });
    
    proposal.type = 'Conservative';
    proposal.confidence = 0.6;
    proposal.veto = {
      reason: 'Critical drug interactions require resolution before aggressive therapy',
      details: drugAnalysis.criticalAlerts
    };
  }
  
  emitTelemetry(session.id, {
    type: 'agent_complete',
    agent: agent.id,
    message: `Safety review complete. Safety Score: ${drugAnalysis.summary.safetyScore}/100`,
    proposal,
    safetyScore: drugAnalysis.summary.safetyScore
  });
  
  return proposal;
}

/**
 * HERA Agent - Health Economics & Resource Constraints
 */
async function heraAnalyze(session, context, currentProposals) {
  const agent = AGENT_ROLES.HERA;
  const { patient } = session;
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    avatar: agent.avatar,
    message: `Initiating health economics and resource feasibility analysis...`
  });
  
  await agentThink(500);
  
  const socioEconomic = patient.socioEconomic || {};
  const insuranceTier = socioEconomic.insuranceTier || 'Silver';
  const monthlyBudget = socioEconomic.monthlyMedicationBudget || 150;
  const location = socioEconomic.location || 'Urban';
  const transportAccess = socioEconomic.transportationAccess || 'Own Vehicle';
  
  emitTelemetry(session.id, {
    type: 'agent_reasoning',
    agent: agent.id,
    message: `Evaluating patient constraints: Insurance=${insuranceTier}, Budget=$${monthlyBudget}/mo, Location=${location}`
  });
  
  await agentThink(400);
  
  let heraResponse = {
    agentId: agent.id,
    veto: null,
    constraints: [],
    alternatives: [],
    feasibilityScore: 100
  };
  
  // Analyze each specialist proposal
  const aggressiveProposals = currentProposals.filter(p => p.type === 'Aggressive');
  
  for (const proposal of aggressiveProposals) {
    emitTelemetry(session.id, {
      type: 'agent_reasoning',
      agent: agent.id,
      message: `Reviewing ${proposal.agentId}'s AGGRESSIVE proposal...`
    });
    
    await agentThink(300);
    
    // Cost constraint check
    const estimatedMonthlyCost = proposal.type === 'Aggressive' ? 2500 : 500;
    
    if (estimatedMonthlyCost > monthlyBudget * 3) {
      emitTelemetry(session.id, {
        type: 'agent_alert',
        agent: agent.id,
        severity: 'critical',
        message: `🚫 COST VIOLATION: Proposed therapy ($${estimatedMonthlyCost}/mo) exceeds patient budget ($${monthlyBudget}/mo) by ${Math.round(estimatedMonthlyCost/monthlyBudget)}x`
      });
      
      heraResponse.constraints.push({
        type: 'Cost',
        violation: `Treatment cost $${estimatedMonthlyCost}/mo vs budget $${monthlyBudget}/mo`,
        severity: 'High'
      });
      
      heraResponse.feasibilityScore -= 30;
    }
    
    // Insurance coverage check
    if (insuranceTier === 'Uninsured' || insuranceTier === 'Medicaid') {
      emitTelemetry(session.id, {
        type: 'agent_alert',
        agent: agent.id,
        severity: 'warning',
        message: `⚠️ COVERAGE CONCERN: ${insuranceTier} tier may not cover targeted therapies without prior authorization`
      });
      
      heraResponse.constraints.push({
        type: 'Insurance',
        violation: `${insuranceTier} coverage limitations`,
        severity: 'Medium'
      });
      
      heraResponse.feasibilityScore -= 20;
    }
    
    // Geographic access check
    if (location === 'Rural' || location === 'Remote') {
      emitTelemetry(session.id, {
        type: 'agent_alert',
        agent: agent.id,
        severity: 'warning',
        message: `⚠️ ACCESS BARRIER: ${location} location limits access to specialized infusion centers`
      });
      
      heraResponse.constraints.push({
        type: 'Geographic',
        violation: `${location} location - limited specialty access`,
        severity: 'Medium'
      });
      
      heraResponse.feasibilityScore -= 15;
    }
  }
  
  await agentThink(400);
  
  // Issue VETO if feasibility is too low
  if (heraResponse.feasibilityScore < 50 && aggressiveProposals.length > 0) {
    emitTelemetry(session.id, {
      type: 'agent_veto',
      agent: agent.id,
      severity: 'critical',
      message: `🛑 VETO ISSUED: Current aggressive proposal is NOT FEASIBLE (Score: ${heraResponse.feasibilityScore}/100)`
    });
    
    heraResponse.veto = {
      issued: true,
      reason: 'Resource constraints make aggressive therapy infeasible',
      constraints: heraResponse.constraints,
      requiredRevisions: [
        'Consider generic alternatives where available',
        'Explore patient assistance programs',
        'Evaluate oral vs infusion options for accessibility'
      ]
    };
    
    // Propose alternatives
    emitTelemetry(session.id, {
      type: 'agent_reasoning',
      agent: agent.id,
      message: `Calculating cost-effective alternatives...`
    });
    
    await agentThink(500);
    
    heraResponse.alternatives.push({
      category: 'Generic Substitution',
      suggestion: 'Switch from branded targeted therapy to generic equivalent with enhanced monitoring',
      costSavings: '60-80%',
      tradeoff: 'Requires more frequent lab monitoring'
    });
    
    heraResponse.alternatives.push({
      category: 'Patient Assistance',
      suggestion: 'Enroll in manufacturer patient assistance program (PAP)',
      costSavings: '90-100%',
      tradeoff: 'Requires income documentation and 2-4 week approval'
    });
    
    emitTelemetry(session.id, {
      type: 'agent_proposal',
      agent: agent.id,
      message: `Proposed ${heraResponse.alternatives.length} cost-effective alternatives`,
      alternatives: heraResponse.alternatives
    });
  } else {
    emitTelemetry(session.id, {
      type: 'agent_approval',
      agent: agent.id,
      message: `✅ Resource feasibility APPROVED (Score: ${heraResponse.feasibilityScore}/100)`
    });
  }
  
  emitTelemetry(session.id, {
    type: 'agent_complete',
    agent: agent.id,
    message: `Economic analysis complete. Feasibility: ${heraResponse.feasibilityScore}%`,
    response: heraResponse
  });
  
  return heraResponse;
}

/**
 * Patient Advocate Agent - Quality of life and patient preferences
 */
async function patientAdvocateAnalyze(session, context) {
  const agent = AGENT_ROLES.PATIENT_ADVOCATE;
  const { patient } = session;
  
  emitTelemetry(session.id, {
    type: 'agent_start',
    agent: agent.id,
    agentName: agent.name,
    specialty: agent.specialty,
    avatar: agent.avatar,
    message: `Initiating patient-centered care analysis...`
  });
  
  await agentThink(400);
  
  const preferences = patient.preferences || {};
  const lifestyle = patient.lifestyle || {};
  const treatmentGoal = patient.treatmentGoal || 'Balanced';
  
  emitTelemetry(session.id, {
    type: 'agent_reasoning',
    agent: agent.id,
    message: `Analyzing patient preferences: Goal="${treatmentGoal}", Work flexibility: ${patient.socioEconomic?.workScheduleFlexibility || 'Unknown'}`
  });
  
  await agentThink(300);
  
  let advocateResponse = {
    agentId: agent.id,
    patientPriorities: [],
    concerns: [],
    recommendations: []
  };
  
  // Treatment burden analysis
  if (patient.socioEconomic?.workScheduleFlexibility === 'Fixed Hours' || 
      patient.socioEconomic?.workScheduleFlexibility === 'Multiple Jobs') {
    
    emitTelemetry(session.id, {
      type: 'agent_alert',
      agent: agent.id,
      severity: 'warning',
      message: `⚠️ TREATMENT BURDEN CONCERN: Patient has limited work flexibility - avoid frequent clinic visits`
    });
    
    advocateResponse.concerns.push({
      type: 'Treatment Burden',
      issue: 'Limited work schedule flexibility',
      recommendation: 'Prefer oral therapies over infusions, consolidate appointments'
    });
  }
  
  // Quality of life considerations
  if (treatmentGoal === 'Low Risk / Conservative' || treatmentGoal === 'Quality of Life') {
    emitTelemetry(session.id, {
      type: 'agent_reasoning',
      agent: agent.id,
      message: `Patient prioritizes quality of life over aggressive intervention`
    });
    
    advocateResponse.patientPriorities.push('Minimize side effects');
    advocateResponse.patientPriorities.push('Maintain daily activities');
    advocateResponse.recommendations.push({
      category: 'QoL Optimization',
      suggestion: 'Favor treatments with better tolerability profiles even if slightly less efficacious',
      priority: 'High'
    });
  }
  
  emitTelemetry(session.id, {
    type: 'agent_complete',
    agent: agent.id,
    message: `Patient advocacy review complete`,
    response: advocateResponse
  });
  
  return advocateResponse;
}

/**
 * Run a single negotiation round
 */
async function runNegotiationRound(session, roundNumber) {
  session.currentRound = roundNumber;
  session.state = NEGOTIATION_STATES.ROUND_PROPOSAL;
  
  emitTelemetry(session.id, {
    type: 'round_start',
    round: roundNumber,
    message: `═══════════════ ROUND ${roundNumber} INITIATED ═══════════════`
  });
  
  await agentThink(300);
  
  // Phase 1: Specialist Proposals
  emitTelemetry(session.id, {
    type: 'phase_start',
    phase: 'specialist_proposals',
    message: `Phase 1: Gathering specialist proposals...`
  });
  
  const specialistProposals = [];
  
  // Run specialists in sequence for better telemetry visibility
  const geneticistProposal = await geneticistAnalyze(session, {});
  specialistProposals.push(geneticistProposal);
  
  const pharmacologistProposal = await pharmacologistAnalyze(session, {});
  specialistProposals.push(pharmacologistProposal);
  
  const advocateResponse = await patientAdvocateAnalyze(session, {});
  
  session.proposals.push({
    round: roundNumber,
    specialists: specialistProposals,
    advocate: advocateResponse
  });
  
  // Phase 2: Constraint Review (HERA)
  emitTelemetry(session.id, {
    type: 'phase_start',
    phase: 'constraint_review',
    message: `Phase 2: HERA constraint evaluation...`
  });
  
  session.state = NEGOTIATION_STATES.CONSTRAINT_REVIEW;
  
  const heraResponse = await heraAnalyze(session, {}, specialistProposals);
  
  // Phase 3: Check for VETO
  if (heraResponse.veto?.issued) {
    session.state = NEGOTIATION_STATES.VETO_ISSUED;
    session.vetoes.push({
      round: roundNumber,
      vetoAgent: 'hera',
      veto: heraResponse.veto
    });
    
    emitTelemetry(session.id, {
      type: 'veto_announcement',
      round: roundNumber,
      message: `🛑 ROUND ${roundNumber} VETOED - Revision required`,
      veto: heraResponse.veto
    });
    
    // Check if we have more rounds
    if (roundNumber < session.maxRounds) {
      session.state = NEGOTIATION_STATES.REVISION_REQUIRED;
      
      emitTelemetry(session.id, {
        type: 'revision_required',
        round: roundNumber,
        message: `Specialists must revise proposals based on HERA constraints...`,
        constraints: heraResponse.constraints,
        alternatives: heraResponse.alternatives
      });
      
      return {
        consensusReached: false,
        vetoIssued: true,
        heraResponse,
        proposals: specialistProposals,
        requiresRevision: true
      };
    } else {
      // Max rounds reached - deadlock
      session.state = NEGOTIATION_STATES.DEADLOCK;
      
      emitTelemetry(session.id, {
        type: 'deadlock',
        message: `⚠️ DEADLOCK: Maximum rounds (${session.maxRounds}) reached without consensus`,
        recommendation: 'Human intervention required'
      });
      
      return {
        consensusReached: false,
        vetoIssued: true,
        deadlock: true,
        heraResponse,
        proposals: specialistProposals
      };
    }
  }
  
  // Phase 4: Consensus Building
  emitTelemetry(session.id, {
    type: 'phase_start',
    phase: 'consensus_building',
    message: `Phase 3: Building consensus...`
  });
  
  await agentThink(500);
  
  // Calculate consensus
  const consensus = buildConsensus(specialistProposals, heraResponse, advocateResponse);
  
  session.state = NEGOTIATION_STATES.CONSENSUS_REACHED;
  session.consensus = consensus;
  
  emitTelemetry(session.id, {
    type: 'consensus_reached',
    round: roundNumber,
    message: `✅ CONSENSUS ACHIEVED in Round ${roundNumber}!`,
    consensus
  });
  
  return {
    consensusReached: true,
    vetoIssued: false,
    consensus,
    proposals: specialistProposals,
    heraResponse,
    advocateResponse
  };
}

/**
 * Build final consensus from all agent inputs
 */
function buildConsensus(proposals, heraResponse, advocateResponse) {
  // Aggregate confidence scores
  const avgConfidence = proposals.reduce((sum, p) => sum + p.confidence, 0) / proposals.length;
  
  // Determine consensus treatment type
  const typeCounts = proposals.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});
  
  let consensusType = 'Standard';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      consensusType = type;
    }
  }
  
  // Adjust for HERA feasibility
  if (heraResponse.feasibilityScore < 70 && consensusType === 'Aggressive') {
    consensusType = 'Standard';
  }
  
  // Aggregate all recommendations
  const allRecommendations = [];
  proposals.forEach(p => {
    if (p.recommendations) {
      allRecommendations.push(...p.recommendations);
    }
  });
  
  if (heraResponse.alternatives) {
    allRecommendations.push(...heraResponse.alternatives.map(a => ({
      category: a.category,
      suggestion: a.suggestion,
      priority: 'High',
      source: 'HERA'
    })));
  }
  
  if (advocateResponse.recommendations) {
    allRecommendations.push(...advocateResponse.recommendations);
  }
  
  // Aggregate all risks
  const allRisks = [];
  proposals.forEach(p => {
    if (p.risks) {
      allRisks.push(...p.risks);
    }
  });
  
  return {
    treatmentType: consensusType,
    confidence: Math.round(avgConfidence * 100) / 100,
    feasibilityScore: heraResponse.feasibilityScore,
    recommendations: allRecommendations,
    risks: allRisks,
    patientPriorities: advocateResponse.patientPriorities,
    agentAgreement: {
      total: proposals.length + 2, // +2 for HERA and Advocate
      agreeing: proposals.filter(p => p.type === consensusType).length + 
                (heraResponse.veto?.issued ? 0 : 1) + 1,
      dissenting: proposals.filter(p => p.type !== consensusType).length +
                  (heraResponse.veto?.issued ? 1 : 0)
    }
  };
}

/**
 * Inject human intervention into active negotiation
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
  
  await agentThink(300);
  
  // Notify all agents of the intervention
  emitTelemetry(sessionId, {
    type: 'agent_notification',
    message: `All agents notified of new constraint: "${intervention.constraint}"`,
    constraint: intervention.constraint
  });
  
  // Update patient context based on intervention type
  if (intervention.type === 'insurance_lost') {
    session.patient.socioEconomic = {
      ...session.patient.socioEconomic,
      insuranceTier: 'Uninsured',
      monthlyMedicationBudget: 50
    };
    
    emitTelemetry(sessionId, {
      type: 'context_update',
      message: `Patient insurance status updated to: UNINSURED`,
      impact: 'Critical cost reevaluation required'
    });
  } else if (intervention.type === 'refuses_injections') {
    session.patient.preferences = {
      ...session.patient.preferences,
      excludedRoutes: ['IV', 'IM', 'SC']
    };
    
    emitTelemetry(sessionId, {
      type: 'context_update',
      message: `Patient preference updated: REFUSES ALL INJECTIONS`,
      impact: 'Must switch to oral-only options'
    });
  } else if (intervention.type === 'custom') {
    emitTelemetry(sessionId, {
      type: 'context_update',
      message: `Custom constraint applied: ${intervention.constraint}`,
      impact: intervention.impact || 'Workflow re-evaluation required'
    });
  }
  
  // Force immediate revision round
  emitTelemetry(sessionId, {
    type: 'revision_forced',
    message: `⚡ IMMEDIATE REVISION TRIGGERED - All agents must re-evaluate with new constraint`
  });
  
  return session;
}

/**
 * Main orchestrator: Run full multi-round negotiation
 */
async function runNegotiation(sessionId, patient, treatmentContext = {}) {
  const session = createSession(sessionId, patient, treatmentContext);
  
  emitTelemetry(sessionId, {
    type: 'negotiation_start',
    message: `🚀 MULTI-AGENT NEGOTIATION PROTOCOL INITIATED`,
    patient: { name: patient.name, disease: patient.disease },
    maxRounds: session.maxRounds
  });
  
  await agentThink(500);
  
  // Run negotiation rounds until consensus or deadlock
  let result;
  for (let round = 1; round <= session.maxRounds; round++) {
    result = await runNegotiationRound(session, round);
    
    if (result.consensusReached) {
      break;
    }
    
    if (result.deadlock) {
      break;
    }
    
    // If revision required, simulate specialists adapting to constraints
    if (result.requiresRevision && round < session.maxRounds) {
      emitTelemetry(sessionId, {
        type: 'revision_adaptation',
        round: round,
        message: `Specialists adapting proposals based on HERA feedback...`
      });
      
      await agentThink(800);
      
      // Modify patient context to reflect HERA's alternatives for next round
      // (In a real system, this would involve more sophisticated state management)
    }
  }
  
  // Final summary
  emitTelemetry(sessionId, {
    type: 'negotiation_complete',
    message: `═══════════════ NEGOTIATION COMPLETE ═══════════════`,
    totalRounds: session.currentRound,
    vetoes: session.vetoes.length,
    consensusReached: result.consensusReached,
    finalState: session.state
  });
  
  return {
    sessionId,
    session,
    result,
    telemetry: session.telemetry
  };
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
  NEGOTIATION_STATES
};
