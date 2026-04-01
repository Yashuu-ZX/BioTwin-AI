import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Download,
  Home,
  Info,
  Sparkles,
  User,
  LayoutDashboard,
  Dna,
  Pill,
  Zap,
  Shield,
  TrendingUp,
  FileCheck,
  ChevronRight,
  Play,
  RotateCcw,
  Clock,
  AlertOctagon,
  FlaskConical,
  Database,
  Search,
  Brain,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import apiClient, { startNegotiationSync, injectIntervention } from '../api/apiClient';
import PatientProfilePanel from '../components/PatientProfilePanel';
import OutcomeTrajectoryChart from '../components/OutcomeTrajectoryChart';

// =============================================================================
// CONFIGURATION: New sidebar structure for consensus-centered dashboard
// =============================================================================

const AGENT_CONFIG = {
  geneticist: {
    key: 'geneticist',
    name: 'Geneticist',
    shortName: 'GA',
    icon: Dna,
    emoji: '🧬',
    color: '#a855f7',
    bgColor: '#f3e8ff',
    borderColor: '#a855f7',
    description: 'Pharmacogenomic analysis and variant interpretation',
  },
  pharmacologist: {
    key: 'pharmacologist',
    name: 'Pharmacologist',
    shortName: 'PA',
    icon: Pill,
    emoji: '💊',
    color: '#22c55e',
    bgColor: '#dcfce7',
    borderColor: '#22c55e',
    description: 'Drug interactions and dosing optimization',
  },
  endocrinologist: {
    key: 'endocrinologist',
    name: 'Endocrinologist',
    shortName: 'EA',
    icon: Zap,
    emoji: '⚡',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    description: 'Metabolic pathway analysis and glucose management',
  },
  hera: {
    key: 'hera',
    name: 'HERA Guardian',
    shortName: 'HERA',
    icon: Shield,
    emoji: '🛡️',
    color: '#06b6d4',
    bgColor: '#cffafe',
    borderColor: '#06b6d4',
    description: 'Economic constraints and real-world viability',
    isGuardian: true,
  },
};

const sectionThemes = {
  overview: {
    layer: 'Consensus Overview',
    description: 'Multi-agent consensus summary with transparent reasoning and recommendations.',
    accentBg: 'bg-emerald-100',
    accentText: 'text-emerald-700',
  },
  profile: {
    layer: 'Patient Profile',
    description: 'Complete patient phenotype, vitals, biomarkers, and socio-economic context.',
    accentBg: 'bg-sky-100',
    accentText: 'text-sky-700',
  },
  geneticist: {
    layer: 'Geneticist Agent',
    description: 'Pharmacogenomic analysis, variant interpretation, and genetic risk factors.',
    accentBg: 'bg-violet-100',
    accentText: 'text-violet-700',
  },
  pharmacologist: {
    layer: 'Pharmacologist Agent',
    description: 'Drug interaction analysis, dosing recommendations, and safety assessment.',
    accentBg: 'bg-green-100',
    accentText: 'text-green-700',
  },
  endocrinologist: {
    layer: 'Endocrinologist Agent',
    description: 'Metabolic pathway analysis, glucose management, and hormonal factors.',
    accentBg: 'bg-amber-100',
    accentText: 'text-amber-700',
  },
  hera: {
    layer: 'HERA Guardian',
    description: 'Economic constraints, insurance validation, and real-world treatment viability.',
    accentBg: 'bg-cyan-100',
    accentText: 'text-cyan-700',
  },
  trajectory: {
    layer: 'Outcome Trajectory',
    description: 'Projected disease path comparing baseline vs. consensus-driven protocol.',
    accentBg: 'bg-emerald-100',
    accentText: 'text-emerald-700',
  },
  recommendation: {
    layer: 'Final Recommendation',
    description: 'Consensus-driven treatment protocol with full explainability audit trail.',
    accentBg: 'bg-emerald-100',
    accentText: 'text-emerald-700',
  },
};

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

const Panel = ({ children, className = '' }) => (
  <div className={`rounded-[28px] border border-black/5 bg-white/88 p-6 shadow-[0_10px_40px_rgba(64,88,70,0.08)] backdrop-blur ${className}`}>
    {children}
  </div>
);

const InfoHint = ({ text }) => (
  <span className="group relative inline-flex align-middle">
    <span className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-black/10">
      <Info className="h-3.5 w-3.5" />
    </span>
    <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-64 -translate-x-1/2 rounded-2xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block">
      {text}
    </span>
  </span>
);

// Agent insight data generator based on patient data
const generateAgentInsights = (patient, drugIntel, result) => {
  const _genomicVariant = patient?.biomarkers?.genomicVariant || 'CYP2C19 reduced metabolizer';
  const cyp2c19 = patient?.biomarkers?.pharmacogenomics?.cyp2c19 || '*1/*2 Poor Metabolizer';
  const glucoseLevel = patient?.vitals?.sugar || patient?.vitals?.glucose || 142;
  const monthlyBudget = patient?.socioEconomic?.monthlyMedicationBudget || 150;
  const insurance = patient?.socioEconomic?.insuranceTier || 'Basic';
  const medications = patient?.medications || [];
  
  return {
    geneticist: {
      ...AGENT_CONFIG.geneticist,
      status: result ? 'consensus' : 'ready',
      dataAnalyzed: [
        'Pharmacogenomic panel results',
        `CYP2C19 genotype: ${cyp2c19}`,
        'Drug metabolism predictions',
        'Hereditary risk factors',
      ],
      rationale: `Genetic analysis reveals ${cyp2c19} heterozygous genotype, classifying patient as Intermediate/Poor Metabolizer. This affects metabolism of ~15% of commonly prescribed drugs including PPIs, antidepressants, and antiplatelets.`,
      recommendation: 'Flag CYP2C19-dependent drugs for dose adjustment',
      risk: 'Standard dosages of affected medications may cause toxicity or reduced efficacy',
      confidence: 95,
    },
    pharmacologist: {
      ...AGENT_CONFIG.pharmacologist,
      status: result ? 'consensus' : 'ready',
      dataAnalyzed: [
        `Current medication regimen (${medications.length} active drugs)`,
        `CYP2C19 genotype: ${cyp2c19}`,
        'Drug-drug interaction database',
        'Renal function assessment',
      ],
      rationale: `Patient's ${cyp2c19} poor metabolizer status significantly affects drug efficacy. ${medications.length > 0 ? `Current regimen includes ${medications.map(m => m.name).join(', ')}.` : ''} Standard dosing may result in inadequate therapeutic response. Recommend alternative agents or genetic-guided dosing adjustment.`,
      recommendation: 'Avoid standard Clopidogrel dosing; consider Ticagrelor',
      risk: 'Drug accumulation and potential toxicity with standard protocol',
      confidence: 92,
    },
    endocrinologist: {
      ...AGENT_CONFIG.endocrinologist,
      status: result ? 'consensus' : 'ready',
      dataAnalyzed: [
        `Glucose level: ${glucoseLevel} mg/dL`,
        'HbA1c trend analysis',
        'Metabolic cascade risk',
        'Cardiovascular risk factors',
      ],
      rationale: `Current glucose (${glucoseLevel} mg/dL) indicates ${glucoseLevel > 140 ? 'suboptimal glycemic control' : 'adequate control'}. ${glucoseLevel > 140 ? 'Aggressive alternative treatments could trigger metabolic instability. Prefer conservative pathway with close monitoring.' : 'Continue current management with periodic reassessment.'}`,
      recommendation: glucoseLevel > 140 ? 'Intensify glycemic therapy conservatively' : 'Maintain current glycemic management',
      risk: 'Metabolic instability with aggressive intervention',
      confidence: 88,
    },
    hera: {
      ...AGENT_CONFIG.hera,
      status: result ? (result.recommendation?.hasVeto ? 'blocked' : 'consensus') : 'monitoring',
      dataAnalyzed: [
        `Budget constraint: $${monthlyBudget}/month`,
        `Insurance tier: ${insurance}`,
        'Transportation access assessment',
        'Socioeconomic risk factors',
      ],
      rationale: `Enforcing strict budget compliance at $${monthlyBudget}/mo. ${monthlyBudget < 200 ? 'Several proposed therapies exceed budget limit. Advanced biologics (~$800/mo) are not viable. ' : ''}HERA mandates generic-only formulary to prevent financial toxicity and ensure medication adherence.`,
      recommendation: monthlyBudget < 200 ? 'VETO: Mandate Generic Protocol Only' : 'Approved within budget constraints',
      risk: 'Medication non-adherence due to cost is #1 cause of treatment failure',
      confidence: 100,
      isVeto: monthlyBudget < 200,
    },
  };
};

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

const Dashboard = ({ role = 'doctor' }) => {
  const { id, section } = useParams();
  const navigate = useNavigate();

  const activeSection = section || 'overview';
  const canSimulate = role === 'doctor' || role === 'admin';
  const canExport = role === 'doctor' || role === 'admin';

  // State
  const [loading, setLoading] = useState(true);
  const [, setSimulating] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [error, setError] = useState('');

  const [patient, setPatient] = useState(null);
  const [, setPrediction] = useState(null);
  const [, setExplainability] = useState(null);
  const [, setCohortData] = useState(null);
  const [drugIntel, setDrugIntel] = useState(null);
  const [result, setResult] = useState(null);

  const [treatmentPlan] = useState({ type: 'Standard', dosage: 'Medium', duration: 30 });

  // Consensus simulation state
  const [consensusStatus, setConsensusStatus] = useState('idle'); // idle, running, consensus
  const [deliberationMessages, setDeliberationMessages] = useState([]);
  const [consensusResult, setConsensusResult] = useState(null);
  const feedRef = useRef(null);
  
  // HITL Steering state - moved here for useEffect access
  const [excludedMedications, setExcludedMedications] = useState([]);
  const consensusResultRef = useRef(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    consensusResultRef.current = consensusResult;
  }, [consensusResult]);

  // CRITICAL: useEffect to update consensusResult when medications are excluded via steering
  // Runs when EITHER excludedMedications OR consensusResult changes to handle timing issues
  useEffect(() => {
    if (excludedMedications.length === 0) return;
    if (!consensusResult) {
      console.log('[Steering Effect] No consensus result yet');
      return;
    }
    
    // Check if any excluded medication is STILL in the current result
    const currentMeds = consensusResult.medications || [];
    const medsStillPresent = currentMeds.filter(med => 
      excludedMedications.some(excluded => 
        med.name.toLowerCase().includes(excluded.toLowerCase())
      )
    );
    
    // Only update if there are medications that should be removed but aren't yet
    if (medsStillPresent.length > 0) {
      console.log('[Steering Effect] Found excluded medications still in result:', medsStillPresent.map(m => m.name));
      console.log('[Steering Effect] Excluded list:', excludedMedications);
      
      const updatedMedications = currentMeds.filter(med => 
        !excludedMedications.some(excluded => 
          med.name.toLowerCase().includes(excluded.toLowerCase())
        )
      );
      
      console.log('[Steering Effect] Updated medications list:', updatedMedications.map(m => m.name));
      
      // Create the updated result
      const excludedNames = medsStillPresent.map(m => m.name).join(', ');
      const updatedResult = {
        ...consensusResult,
        medications: updatedMedications,
        hasVeto: true,
        reasoning: consensusResult.reasoning + (consensusResult.reasoning.includes('NOTE:') ? '' : ` NOTE: ${excludedNames} withdrawn per clinician steering.`)
      };
      
      setConsensusResult(updatedResult);
    }
  }, [excludedMedications, consensusResult]);

  // Demo agent deliberation responses
  const DEMO_RESPONSES = useMemo(() => {
    const budget = patient?.socioEconomic?.monthlyMedicationBudget || 150;
    const cyp2c19 = patient?.biomarkers?.pharmacogenomics?.cyp2c19 || '*1/*2 Poor Metabolizer';
    const glucose = patient?.vitals?.glucose || patient?.vitals?.sugar || 142;
    const hba1c = patient?.biomarkers?.hba1c || '7.8%';
    const medications = patient?.medications || [];
    
    return [
      { 
        agent: 'system', 
        type: 'system',
        message: 'Initializing multi-agent consensus protocol...' 
      },
      // FEATURE 5: Memory/Reflection - Geneticist recalls past case
      {
        agent: 'geneticist',
        type: 'reflection',
        message: `Recalling similar case #PT-2847: CYP2C19 poor metabolizer with T2DM. Clopidogrel required 150% dose adjustment. Outcome: Successful with no adverse events.`
      },
      // FEATURE 3: Tool Use - PharmGKB query
      {
        agent: 'geneticist',
        type: 'tool_use',
        tool: 'PharmGKB',
        action: `Querying CYP2C19 variant guidelines for ${cyp2c19}...`
      },
      { 
        agent: 'geneticist', 
        type: 'proposal',
        message: `Analyzing pharmacogenomic profile. ${cyp2c19} genotype confirmed - patient is an Intermediate/Poor Metabolizer. This affects ~15% of common medications including PPIs, antidepressants, and antiplatelets.` 
      },
      // FEATURE 3: Tool Use - DrugBank query
      {
        agent: 'pharmacologist',
        type: 'tool_use',
        tool: 'DrugBank',
        action: `Cross-referencing drug interactions for ${medications.length > 0 ? medications.map(m => m.name).join(', ') : 'Metformin, Lisinopril'}...`
      },
      { 
        agent: 'pharmacologist', 
        type: 'proposal',
        message: `Cross-referencing current medications (${medications.length > 0 ? medications.map(m => m.name).join(', ') : 'Metformin, Lisinopril'}) with genetic data. WARNING: Standard Clopidogrel dosing poses efficacy concerns. Recommending Ticagrelor or dose adjustment.` 
      },
      // FEATURE 2: Sub-Agent Spawning - Complex case triggers specialist
      {
        agent: 'pharmacologist',
        type: 'sub_agent',
        subAgentName: 'Cardiology Specialist',
        subAgentEmoji: '❤️',
        message: 'Case complexity detected: Summoning Cardiology Specialist for antiplatelet therapy evaluation.'
      },
      // FEATURE 2: Sub-Agent Response
      {
        agent: 'cardiologist',
        type: 'sub_agent_response',
        agentName: 'Cardiology Specialist',
        message: 'Antiplatelet evaluation complete. Given CYP2C19 poor metabolizer status, Ticagrelor is preferred over Clopidogrel. No additional cardiac workup needed at this time.',
        recommendations: ['Prefer Ticagrelor over Clopidogrel', 'Monitor for bleeding risk'],
        color: '#ec4899'
      },
      // FEATURE 3: Tool Use - PubMed query
      {
        agent: 'endocrinologist',
        type: 'tool_use',
        tool: 'PubMed',
        action: `Searching recent SGLT2 inhibitor trials for T2DM with HbA1c ${hba1c}...`
      },
      { 
        agent: 'endocrinologist', 
        type: 'proposal',
        message: `HbA1c ${hba1c} indicates ${parseFloat(hba1c) > 7 ? 'suboptimal glycemic control' : 'adequate control'}. Fasting glucose ${glucose} mg/dL. ${parseFloat(hba1c) > 7 ? 'Evaluating SGLT2 inhibitor for cardiovascular co-benefit.' : 'Current management adequate.'}` 
      },
      // FEATURE 5: Memory/Reflection - HERA recalls budget outcome
      {
        agent: 'hera',
        type: 'reflection',
        message: `Memory: Similar patient with $${budget}/mo budget had 40% non-adherence rate when prescribed >$100/mo medications. Enforcing strict budget compliance.`
      },
      { 
        agent: 'hera', 
        type: 'veto',
        message: `BUDGET VIOLATION: Proposed Jardiance costs $580/month. Patient budget is $${budget}/month. VETOING this recommendation. Agents must propose generic alternatives within budget.` 
      },
      { 
        agent: 'endocrinologist', 
        type: 'proposal',
        message: `Acknowledged. Pivoting recommendation: Increase Metformin to 1000mg BID + structured lifestyle intervention. Total cost: $15/month.` 
      },
      { 
        agent: 'pharmacologist', 
        type: 'proposal',
        message: `Confirming safety: Metformin increase compatible with current regimen. No ${cyp2c19.includes('Poor') ? 'CYP2C19' : 'major'} interaction. Recommending addition of generic ACE inhibitor for renal protection.` 
      },
      { 
        agent: 'coordinator', 
        type: 'consensus',
        message: `All agents have reached agreement. Consensus score: 87%. Protocol validated by HERA Guardian within $${budget}/month budget constraint.` 
      },
    ];
  }, [patient]);

  const DEMO_CONSENSUS_RESULT = useMemo(() => ({
    protocol: 'Generic Metformin (1000mg BID) + Lisinopril (20mg QD) + Lifestyle Counseling',
    reasoning: `Multi-agent consensus achieved. HERA validated all recommendations meet the $${patient?.socioEconomic?.monthlyMedicationBudget || 150}/month budget constraint while optimizing therapeutic outcomes for patient's pharmacogenomic profile.`,
    confidence: 87,
    rounds: 3,
    hasVeto: true,
    agentAgreement: {
      geneticist: 'agreed',
      pharmacologist: 'agreed',
      endocrinologist: 'adjusted',
      hera: 'validated'
    }
  }), [patient]);

  // Helper function to format timestamp - wrapped in useCallback to prevent dependency issues
  const formatTimestamp = useCallback(() => {
    return new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
  }, []);

  // Run the consensus deliberation using REAL backend AI agents
  const runConsensusDeliberation = useCallback(async () => {
    setConsensusStatus('running');
    setDeliberationMessages([]);
    setConsensusResult(null);
    
    // Add initial system message
    setDeliberationMessages([{
      id: Date.now(),
      agent: 'system',
      type: 'system',
      message: 'Initializing multi-agent consensus protocol...',
      timestamp: formatTimestamp()
    }]);
    
    try {
      // Call the real backend API for AI-powered agent negotiation
      const response = await startNegotiationSync(id);
      
      // Store session ID for HITL steering interventions
      if (response.session?.sessionId) {
        setNegotiationSessionId(response.session.sessionId);
      }
      
      if (response.success && response.telemetry) {
        // Process telemetry into deliberation messages - ENHANCED for all 5 features
        const messages = [];
        
        for (const event of response.telemetry) {
          const agentId = event.agent || 'system';
          const baseTimestamp = event.timestamp 
            ? new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' })
            : formatTimestamp();
          
          // FEATURE 3: Tool Use Events (Live Tool-Use Overlay)
          if (event.type === 'tool_use' || event.type === 'api_query' || event.type === 'database_query') {
            messages.push({
              id: event.timestamp || Date.now() + Math.random(),
              agent: agentId,
              type: 'tool_use',
              tool: event.tool || event.database || 'External API',
              action: event.action || event.query || event.message,
              timestamp: baseTimestamp
            });
          }
          // FEATURE 2: Sub-Agent Spawning (Dynamic Agent Swarming)
          else if (event.type === 'sub_agent_spawn' || event.type === 'specialist_summon') {
            messages.push({
              id: event.timestamp || Date.now() + Math.random(),
              agent: agentId,
              type: 'sub_agent',
              subAgentName: event.subAgentName || event.specialistName || 'Specialist',
              subAgentEmoji: event.emoji || '🔬',
              message: event.message || `Summoning ${event.subAgentName || 'specialist'} for complex analysis`,
              timestamp: baseTimestamp
            });
          }
          // FEATURE 2: Sub-Agent Response
          else if (event.type === 'sub_agent_response' || event.type === 'specialist_response') {
            messages.push({
              id: event.timestamp || Date.now() + Math.random(),
              agent: agentId,
              type: 'sub_agent_response',
              agentName: event.agentName || event.subAgentName || 'Specialist',
              message: event.message,
              recommendations: event.recommendations || [],
              color: event.color,
              timestamp: baseTimestamp
            });
          }
          // FEATURE 5: Memory & Reflection Events
          else if (event.type === 'reflection' || event.type === 'memory_recall' || event.type === 'past_case') {
            messages.push({
              id: event.timestamp || Date.now() + Math.random(),
              agent: agentId,
              type: 'reflection',
              message: event.message || event.memory || 'Recalling similar case from memory...',
              caseId: event.caseId,
              timestamp: baseTimestamp
            });
          }
          // FEATURE 1: Steering acknowledgment from agents
          else if (event.type === 'steering_acknowledgment' || event.type === 'constraint_acknowledged') {
            messages.push({
              id: event.timestamp || Date.now() + Math.random(),
              agent: agentId,
              type: 'steering_acknowledgment',
              message: event.message,
              isFlashing: true,
              timestamp: baseTimestamp
            });
          }
          // Renegotiation triggered
          else if (event.type === 'renegotiation_triggered' || event.type === 'renegotiation') {
            messages.push({
              id: event.timestamp || Date.now() + Math.random(),
              agent: 'system',
              type: 'renegotiation_triggered',
              message: event.message || 'Re-negotiation triggered based on new constraints...',
              timestamp: baseTimestamp
            });
          }
          // Standard agent events (proposals, vetos, etc.)
          else if (event.type === 'agent_start' || event.type === 'agent_reasoning' || 
              event.type === 'agent_insight' || event.type === 'agent_alert' ||
              event.type === 'agent_proposal' || event.type === 'agent_complete' ||
              event.type === 'agent_veto' || event.type === 'agent_approval') {
            
            let messageType = 'proposal';
            
            if (event.type === 'agent_veto') messageType = 'veto';
            else if (event.type === 'agent_alert' && event.severity === 'critical') messageType = 'alert';
            else if (event.type === 'agent_approval') messageType = 'approval';
            
            messages.push({
              id: event.timestamp || Date.now() + Math.random(),
              agent: agentId,
              type: messageType,
              message: event.message,
              timestamp: baseTimestamp,
              color: event.color
            });
          } 
          // Consensus reached
          else if (event.type === 'consensus_reached' || event.type === 'consensus_generated') {
            messages.push({
              id: event.timestamp || Date.now() + Math.random(),
              agent: 'coordinator',
              type: 'consensus',
              message: event.message,
              timestamp: baseTimestamp
            });
          }
        }
        
        // Animate messages appearing
        messages.forEach((msg, i) => {
          setTimeout(() => {
            setDeliberationMessages(prev => [...prev, msg]);
            if (feedRef.current) {
              setTimeout(() => {
                feedRef.current.scrollTop = feedRef.current.scrollHeight;
              }, 50);
            }
          }, (i + 1) * 800); // Faster animation since AI already took time
        });
        
        // Set consensus result from backend response
        // Note: Backend spreads result.result directly, so consensus is on response directly
        const consensus = response.consensus;
        const agentAnalyses = response.agentAnalyses;
        
        setTimeout(() => {
          if (consensus) {
            const consensusData = {
              protocol: consensus.recommendedProtocol || 'AI-Optimized Treatment Protocol',
              reasoning: consensus.protocolDetails || consensus.rationale || 'Multi-agent consensus achieved based on patient-specific analysis.',
              confidence: Math.round((consensus.confidence || 0.85) * 100),
              rounds: response.session?.rounds || 1,
              hasVeto: response.session?.vetoes?.length > 0,
              agentAgreement: consensus.agentAgreement || {
                geneticist: agentAnalyses?.geneticist ? 'agreed' : 'pending',
                pharmacologist: agentAnalyses?.pharmacologist ? 'agreed' : 'pending',
                endocrinologist: agentAnalyses?.endocrinologist ? 'agreed' : 'pending',
                hera: agentAnalyses?.hera?.veto?.issued ? 'adjusted' : 'validated'
              },
              medications: consensus.medications,
              monitoring: consensus.monitoring,
              precautions: consensus.precautions
            };
            
            setConsensusResult(consensusData);
            setConsensusStatus('consensus');
            setResult({ 
              recommendation: { 
                best: { 
                  name: consensusData.protocol, 
                  reason: consensusData.reasoning 
                } 
              } 
            });
          } else {
            // Fallback if no consensus in response
            setConsensusStatus('consensus');
          }
        }, (messages.length + 1) * 800);
        
      } else {
        // Fallback to demo mode if API fails
        console.warn('Negotiation API response invalid, falling back to demo mode');
        runDemoDeliberation();
      }
      
    } catch (error) {
      console.error('Negotiation API error:', error);
      // Fallback to demo mode on error
      setDeliberationMessages(prev => [...prev, {
        id: Date.now(),
        agent: 'system',
        type: 'system',
        message: `Note: Using simulated deliberation. Backend: ${error.message}`,
        timestamp: formatTimestamp()
      }]);
      runDemoDeliberation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, formatTimestamp]);
  
  // Fallback demo deliberation (when backend unavailable)
  const runDemoDeliberation = useCallback(() => {
    DEMO_RESPONSES.forEach((resp, i) => {
      setTimeout(() => {
        const newMessage = {
          ...resp,
          id: Date.now() + Math.random(),
          timestamp: formatTimestamp()
        };
        setDeliberationMessages(prev => [...prev, newMessage]);
        
        if (feedRef.current) {
          setTimeout(() => {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
          }, 50);
        }
      }, (i + 1) * 2000);
    });
    
    setTimeout(() => {
      setConsensusResult(DEMO_CONSENSUS_RESULT);
      setConsensusStatus('consensus');
      setResult({ recommendation: { best: { name: DEMO_CONSENSUS_RESULT.protocol, reason: DEMO_CONSENSUS_RESULT.reasoning } } });
    }, (DEMO_RESPONSES.length + 1) * 2000);
  }, [DEMO_RESPONSES, DEMO_CONSENSUS_RESULT, formatTimestamp]);

  // Reset consensus state
  const resetConsensus = useCallback(() => {
    setConsensusStatus('idle');
    setDeliberationMessages([]);
    setConsensusResult(null);
  }, []);

  // New sidebar sections
  const sections = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'workspace' },
    { key: 'divider1', divider: true, label: 'Case Context' },
    { key: 'profile', label: 'Patient Profile', icon: User, group: 'context' },
    { key: 'divider2', divider: true, label: 'Agent Perspectives' },
    { key: 'geneticist', label: 'Geneticist', icon: Dna, group: 'agents', color: '#a855f7' },
    { key: 'pharmacologist', label: 'Pharmacologist', icon: Pill, group: 'agents', color: '#22c55e' },
    { key: 'endocrinologist', label: 'Endocrinologist', icon: Zap, group: 'agents', color: '#f59e0b' },
    { key: 'hera', label: 'HERA Guardian', icon: Shield, group: 'agents', color: '#06b6d4' },
    { key: 'divider3', divider: true, label: 'Outcome' },
    { key: 'trajectory', label: 'Trajectory', icon: TrendingUp, group: 'outcome' },
    { key: 'recommendation', label: 'Recommendation', icon: FileCheck, group: 'outcome' },
  ];

  const currentTheme = sectionThemes[activeSection] || sectionThemes.overview;

  const openSection = (key) => {
    if (key.startsWith('divider')) return;
    navigate(`/dashboard/${id}/${key}`);
  };

  // Generate agent insights based on patient data
  const agentInsights = useMemo(() => {
    return generateAgentInsights(patient, drugIntel, result);
  }, [patient, drugIntel, result]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [patientRes, predictionRes, explainRes] = await Promise.allSettled([
          apiClient.get(`/patient/${id}`),
          apiClient.get(`/predict/${id}`),
          apiClient.post('/explain/insights', { patientId: id }),
        ]);

        if (patientRes.status !== 'fulfilled') throw patientRes.reason;

        const patientData = patientRes.value.data;
        setPatient(patientData);
        if (predictionRes.status === 'fulfilled') setPrediction(predictionRes.value.data);
        if (explainRes.status === 'fulfilled') setExplainability(explainRes.value.data);

        const [cohortRes, drugRes] = await Promise.allSettled([
          apiClient.post('/explain/cohort-match', { patientId: id, treatmentPlan }),
          apiClient.post('/explain/drug-intelligence', { patientId: id }),
        ]);

        if (cohortRes.status === 'fulfilled') setCohortData(cohortRes.value.data);
        if (drugRes.status === 'fulfilled') setDrugIntel(drugRes.value.data);
      } catch (loadError) {
        console.error(loadError);
        setError('Unable to load the digital twin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [id, treatmentPlan]);

  // Reserved for manual simulation trigger (currently uses consensus deliberation instead)
  const _runSimulation = async () => {
    setSimulating(true);
    setError('');
    try {
      const response = await apiClient.post('/simulate', { patientId: id, treatmentPlan });
      setResult(response.data);

      const [cohortRes, drugRes] = await Promise.allSettled([
        apiClient.post('/explain/cohort-match', { patientId: id, treatmentPlan }),
        apiClient.post('/explain/drug-intelligence', { patientId: id }),
      ]);
      if (cohortRes.status === 'fulfilled') setCohortData(cohortRes.value.data);
      if (drugRes.status === 'fulfilled') setDrugIntel(drugRes.value.data);
    } catch (simulationError) {
      console.error(simulationError);
      setError('Simulation failed. Please verify the patient profile and try again.');
    } finally {
      setSimulating(false);
    }
  };

  const exportClinicianReport = async () => {
    setExportingReport(true);
    try {
      const response = await apiClient.post('/explain/report', { patientId: id, treatmentPlan }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `biotwin-report-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (reportError) {
      console.error(reportError);
      setError('Clinician report export failed.');
    } finally {
      setExportingReport(false);
    }
  };

  // Generate trajectory data
  const generateConsensusTrajectory = () => {
    if (!result?.trajectory) return null;
    return result.trajectory.map(point => ({
      day: point.day,
      'Baseline (Pre-Consensus)': point['Without Treatment'] || point.baseline || 50,
      'Multi-Agent Consensus Protocol': point['Optimized Treatment'] || point.optimized || 70,
    }));
  };

  // =============================================================================
  // RENDER SECTIONS
  // =============================================================================

  // OVERVIEW: Executive summary with all agents
  const renderOverview = () => {
    const consensus = result?.recommendation;
    
    return (
      <div className="space-y-6">
        {/* Top Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${result ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              <span className="text-sm font-medium text-slate-600">
                {result ? 'Consensus Reached' : 'Awaiting Simulation'}
              </span>
            </div>
            {consensus && (
              <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">
                  {consensus.confidence || 87}% Confidence
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canSimulate && !result && (
              <button
                onClick={() => openSection('recommendation')}
                className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Play className="h-4 w-4" />
                Run Consensus
              </button>
            )}
            {result && (
              <button
                onClick={() => openSection('recommendation')}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                <FileCheck className="h-4 w-4" />
                View Recommendation
              </button>
            )}
          </div>
        </div>

        {/* Main 3-Column Layout */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* LEFT: Patient Summary */}
          <div className="xl:col-span-3 space-y-4">
            <Panel className="!p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{patient?.name || 'Patient'}</h3>
                  <p className="text-sm text-slate-500">{patient?.age}y {patient?.gender} | {patient?.disease}</p>
                </div>
              </div>
              
              {/* Key Constraints */}
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                  <span className="text-xs text-amber-700">Budget</span>
                  <span className="font-bold text-amber-800">${patient?.socioEconomic?.monthlyMedicationBudget || 150}/mo</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-600">Insurance</span>
                  <span className="font-medium text-slate-800">{patient?.socioEconomic?.insuranceTier || 'Basic'}</span>
                </div>
              </div>

              {/* Conditions */}
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 mb-2">CONDITIONS</p>
                <div className="flex flex-wrap gap-1">
                  {(patient?.conditions || ['Type 2 Diabetes', 'Hypertension']).map((c, i) => (
                    <span key={i} className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-100">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => openSection('profile')}
                className="mt-4 flex w-full items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200"
              >
                View Full Profile
                <ChevronRight className="h-4 w-4" />
              </button>
            </Panel>
          </div>

          {/* CENTER: Agent Summary Cards */}
          <div className="xl:col-span-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Agent Consensus Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(agentInsights).map(([key, agent]) => (
                <div
                  key={key}
                  onClick={() => openSection(key)}
                  className="cursor-pointer rounded-2xl border-2 bg-white p-4 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ borderColor: agent.color + '40' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: agent.bgColor }}
                      >
                        {agent.emoji}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{agent.name}</h4>
                        <p className="text-xs text-slate-500">{agent.shortName}</p>
                      </div>
                    </div>
                    <div
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: agent.isVeto ? '#fee2e2' : agent.bgColor,
                        color: agent.isVeto ? '#dc2626' : agent.color,
                      }}
                    >
                      {agent.isVeto ? 'VETO' : agent.status === 'consensus' ? 'Agreed' : 'Ready'}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{agent.recommendation}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${agent.confidence}%`, backgroundColor: agent.color }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: agent.color }}>
                        {agent.confidence}%
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Trajectory + Decision */}
          <div className="xl:col-span-3 space-y-4">
            {/* Mini Trajectory */}
            <Panel className="!p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-700">Outcome Trajectory</h4>
                <button
                  onClick={() => openSection('trajectory')}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Expand
                </button>
              </div>
              <div className="h-32 flex items-center justify-center bg-slate-50 rounded-lg">
                {result ? (
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">+23% projected improvement</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Run consensus to see trajectory</p>
                )}
              </div>
            </Panel>

            {/* Final Decision */}
            <Panel className={`!p-4 ${result ? 'bg-emerald-50 border-emerald-200' : ''}`}>
              <h4 className="font-semibold text-slate-700 mb-3">Final Recommendation</h4>
              {result ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-white p-3 border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-800">
                      {result.recommendation?.best?.name || 'Conservative Generic Protocol'}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      HERA-validated | Within budget
                    </p>
                  </div>
                  <button
                    onClick={() => openSection('recommendation')}
                    className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    View Full Recommendation
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Pending consensus</p>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>
    );
  };

  // PATIENT PROFILE - Full 2-column layout without scrolling
  const renderProfile = () => {
    const demographics = patient || {};
    const vitals = patient?.vitals || {};
    const biomarkers = patient?.biomarkers || {};
    const medications = patient?.medications || [];
    const conditions = patient?.conditions || [];
    const socioEconomic = patient?.socioEconomic || {};
    const lifestyle = patient?.lifestyle || {};
    const pharmacogenomics = biomarkers?.pharmacogenomics || {};
    
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Patient Header */}
          <Panel className="!p-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{demographics.name || 'Patient'}</h2>
                <p className="text-sm text-slate-500">{demographics.disease || 'Case Profile'}</p>
              </div>
            </div>
          </Panel>

          {/* Demographics */}
          <Panel className="!p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> Demographics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Age</p>
                <p className="font-semibold text-slate-800">{demographics.age || '--'} years</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Gender</p>
                <p className="font-semibold text-slate-800">{demographics.gender || demographics.sex || '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Blood Group</p>
                <p className="font-semibold text-slate-800">{demographics.bloodGroup || '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">BMI</p>
                <p className="font-semibold text-slate-800">{demographics.bmi || '--'}</p>
              </div>
            </div>
          </Panel>

          {/* Socio-Economic Profile */}
          <Panel className="!p-5 border-l-4 border-amber-400">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <span className="text-amber-500">$</span> Socio-Economic Profile
              </h3>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Constraints</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Insurance</p>
                <p className="font-semibold text-slate-800">{socioEconomic.insuranceTier || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Monthly Budget</p>
                <p className="font-bold text-emerald-600">${socioEconomic.monthlyMedicationBudget || 150}</p>
              </div>
            </div>
          </Panel>

          {/* Conditions */}
          <Panel className="!p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" /> Conditions
            </h3>
            <div className="flex flex-wrap gap-2">
              {conditions.length > 0 ? conditions.map((c, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                  {c}
                </span>
              )) : (
                <span className="text-slate-400 text-sm">No conditions recorded</span>
              )}
            </div>
          </Panel>

          {/* Current Medications */}
          <Panel className="!p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Pill className="h-4 w-4 text-green-500" /> Current Medications
            </h3>
            <div className="space-y-2">
              {medications.length > 0 ? medications.map((med, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                  <span className="font-medium text-slate-800">{med.name}</span>
                  <span className="text-sm text-slate-500">{med.dosage}</span>
                </div>
              )) : (
                <span className="text-slate-400 text-sm">No medications recorded</span>
              )}
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Vitals */}
          <Panel className="!p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> Vitals
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Blood Pressure</p>
                <p className="font-semibold text-slate-800">
                  {vitals.bpSystolic || vitals.bloodPressure?.systolic || '--'}/{vitals.bpDiastolic || vitals.bloodPressure?.diastolic || '--'} mmHg
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Heart Rate</p>
                <p className="font-semibold text-slate-800">{vitals.heartRate || '--'} bpm</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Glucose</p>
                <p className="font-semibold text-slate-800">{vitals.glucose || vitals.sugar || '--'} mg/dL</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">HbA1c</p>
                <p className="font-semibold text-slate-800">{biomarkers.hba1c || '--'}</p>
              </div>
            </div>
          </Panel>

          {/* Genomic Markers */}
          <Panel className="!p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Dna className="h-4 w-4 text-violet-500" /> Genomic Markers
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-slate-400">CYP2C19</p>
                <p className="font-semibold text-violet-700">{pharmacogenomics.cyp2c19 || pharmacogenomics.CYP2C19 || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">CYP2D6</p>
                <p className="font-semibold text-slate-800">{pharmacogenomics.cyp2d6 || pharmacogenomics.CYP2D6 || 'Normal'}</p>
              </div>
            </div>
            <div className="bg-violet-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Primary Variant</p>
              <p className="font-semibold text-violet-800">{biomarkers.genomicVariant || 'CYP2C19 reduced metabolizer'}</p>
            </div>
          </Panel>

          {/* Lifestyle */}
          <Panel className="!p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Lifestyle
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Smoking</p>
                <p className="font-semibold text-slate-800">{lifestyle.smoking || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Exercise</p>
                <p className="font-semibold text-slate-800">{lifestyle.exercise || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Alcohol</p>
                <p className="font-semibold text-slate-800">{lifestyle.alcohol || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Diet</p>
                <p className="font-semibold text-slate-800">{lifestyle.diet || 'Unknown'}</p>
              </div>
            </div>
          </Panel>

          {/* Family History */}
          <Panel className="!p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-500" /> Family History
            </h3>
            <div className="flex flex-wrap gap-2">
              {(patient?.familyHistory || ['Diabetes', 'Cardiovascular']).map((item, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium border border-cyan-200">
                  {item}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  };

  // INDIVIDUAL AGENT VIEW
  const renderAgentDetail = (agentKey) => {
    const agent = agentInsights[agentKey];
    if (!agent) return <div>Agent not found</div>;

    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Agent Header */}
          <Panel>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: agent.bgColor }}
              >
                {agent.emoji}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{agent.name}</h2>
                <p className="text-slate-500">{agent.description}</p>
              </div>
              <div className="ml-auto">
                <div
                  className="rounded-full px-4 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: agent.isVeto ? '#fee2e2' : agent.bgColor,
                    color: agent.isVeto ? '#dc2626' : agent.color,
                  }}
                >
                  {agent.isVeto ? 'VETO ISSUED' : agent.status === 'consensus' ? 'Consensus Agreed' : 'Ready'}
                </div>
              </div>
            </div>

            {/* Data Analyzed */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Data Analyzed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {agent.dataAnalyzed.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: agent.color }} />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rationale */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Rationale</h3>
              <div className="rounded-xl bg-slate-50 p-4 border-l-4" style={{ borderColor: agent.color }}>
                <p className="text-slate-700 leading-relaxed">{agent.rationale}</p>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Risk Assessment</h3>
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{agent.risk}</p>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recommendation</h3>
              <div
                className="rounded-xl p-4 border-2"
                style={{
                  backgroundColor: agent.isVeto ? '#fef2f2' : agent.bgColor,
                  borderColor: agent.isVeto ? '#fecaca' : agent.color + '40',
                }}
              >
                <p className="font-semibold" style={{ color: agent.isVeto ? '#dc2626' : agent.color }}>
                  {agent.recommendation}
                </p>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <Panel>
            <h3 className="font-semibold text-slate-800 mb-4">Confidence Score</h3>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={agent.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${agent.confidence * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: agent.color }}>{agent.confidence}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Based on analyzed data points</p>
                <p className="text-xs text-slate-400 mt-1">{agent.dataAnalyzed.length} factors evaluated</p>
              </div>
            </div>
          </Panel>

          <Panel>
            <h3 className="font-semibold text-slate-800 mb-4">Other Agents</h3>
            <div className="space-y-2">
              {Object.entries(agentInsights)
                .filter(([key]) => key !== agentKey)
                .map(([key, a]) => (
                  <button
                    key={key}
                    onClick={() => openSection(key)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: a.bgColor }}
                    >
                      {a.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{a.name}</p>
                      <p className="text-xs text-slate-400">{a.status}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  };

  // TRAJECTORY VIEW
  const renderTrajectory = () => (
    <div className="space-y-6">
      <OutcomeTrajectoryChart
        trajectory={generateConsensusTrajectory()}
        hasConsensus={!!result}
      />
      
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel>
          <h3 className="font-semibold text-slate-800 mb-4">Baseline Projection</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Starting Score</span>
              <span className="font-medium text-slate-800">65%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">30-Day Projection</span>
              <span className="font-medium text-amber-600">58%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Trend</span>
              <span className="font-medium text-red-600">Declining</span>
            </div>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-semibold text-slate-800 mb-4">Consensus Protocol</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Starting Score</span>
              <span className="font-medium text-slate-800">65%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">30-Day Projection</span>
              <span className="font-medium text-emerald-600">78%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Trend</span>
              <span className="font-medium text-emerald-600">Improving</span>
            </div>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-semibold text-slate-800 mb-4">Improvement Delta</h3>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-emerald-600">+20%</p>
            <p className="text-sm text-slate-500 mt-2">Projected improvement with consensus protocol</p>
          </div>
        </Panel>
      </div>
    </div>
  );

  // HITL Steering state
  const [steeringInput, setSteeringInput] = useState('');
  const [isSteeringActive, setIsSteeringActive] = useState(false);
  const [negotiationSessionId, setNegotiationSessionId] = useState(null);
  // Note: excludedMedications state is declared earlier with the useEffect

  // Common drug names for detection
  const KNOWN_DRUGS = [
    'metformin', 'gabapentin', 'lisinopril', 'atorvastatin', 'amlodipine',
    'omeprazole', 'losartan', 'simvastatin', 'levothyroxine', 'hydrochlorothiazide',
    'sertraline', 'clopidogrel', 'ticagrelor', 'warfarin', 'aspirin',
    'jardiance', 'empagliflozin', 'sitagliptin', 'januvia', 'glipizide',
    'levodopa', 'carbidopa', 'pregabalin', 'duloxetine', 'tramadol',
    'ibuprofen', 'naproxen', 'acetaminophen', 'prednisone', 'insulin',
    'glargine', 'lantus', 'humalog', 'novolog', 'metoprolol', 'carvedilol',
    'furosemide', 'spironolactone', 'pantoprazole', 'esomeprazole',
    'donepezil', 'aricept', 'memantine', 'namenda', 'topiramate', 'topamax',
    // Respiratory/COPD medications
    'tiotropium', 'spiriva', 'umeclidinium', 'incruse', 'aclidinium', 'tudorza',
    'ipratropium', 'atrovent', 'glycopyrrolate', 'seebri', 'revefenacin',
    'fluticasone', 'budesonide', 'salmeterol', 'formoterol', 'albuterol'
  ];

  // Extract drug name from text
  const extractDrugName = (text) => {
    const lowerText = text.toLowerCase();
    for (const drug of KNOWN_DRUGS) {
      if (lowerText.includes(drug)) {
        return drug.charAt(0).toUpperCase() + drug.slice(1);
      }
    }
    // Try to extract capitalized words that might be drug names
    const words = text.split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && /^[A-Z][a-z]+$/.test(word) && !['Patient', 'Doctor', 'Issue', 'With', 'History'].includes(word)) {
        return word;
      }
    }
    return null;
  };

  // Handle steering submission - FIXED to detect drug names and update recommendations
  const handleSteeringSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!steeringInput.trim()) return;
    
    const constraint = steeringInput.trim();
    setSteeringInput('');
    setIsSteeringActive(false);
    
    // Add steering message to feed
    const steeringMsg = {
      id: Date.now(),
      agent: 'clinician',
      type: 'steering_intervention',
      constraint: constraint,
      message: constraint,
      timestamp: formatTimestamp()
    };
    setDeliberationMessages(prev => [...prev, steeringMsg]);
    
    // Extract the drug name mentioned in the steering
    const detectedDrug = extractDrugName(constraint);
    const text = constraint.toLowerCase();
    
    // Determine the issue type
    const hasGIIssue = text.includes('gi') || text.includes('stomach') || text.includes('gastrointestinal') || text.includes('nausea') || text.includes('digestive');
    const hasAllergy = text.includes('allergy') || text.includes('allergic') || text.includes('reaction') || text.includes('rash');
    const hasCostIssue = text.includes('cost') || text.includes('expensive') || text.includes('afford') || text.includes('budget');
    const hasSideEffect = text.includes('side effect') || text.includes('intolerance') || text.includes('issue') || text.includes('problem');
    
    let respondingAgent = 'pharmacologist';
    let responseMsg = '';
    let alternativeDrug = null;
    
    if (detectedDrug) {
      // Drug-specific response
      if (hasGIIssue || hasSideEffect) {
        respondingAgent = 'pharmacologist';
        // Determine alternative based on the drug
        if (detectedDrug.toLowerCase() === 'metformin') {
          alternativeDrug = 'Sitagliptin (Januvia)';
          responseMsg = `🚨 CRITICAL: Withdrawing ${detectedDrug} due to GI intolerance. Recommending ${alternativeDrug} as alternative - DPP-4 inhibitor with better GI tolerability profile.`;
        } else if (detectedDrug.toLowerCase() === 'gabapentin') {
          alternativeDrug = 'Pregabalin';
          responseMsg = `🚨 CRITICAL: Withdrawing ${detectedDrug} due to reported GI issues. Recommending ${alternativeDrug} as alternative - similar mechanism with different GI profile. Also considering Duloxetine for neuropathic pain.`;
        } else if (detectedDrug.toLowerCase().includes('levodopa') || detectedDrug.toLowerCase().includes('carbidopa')) {
          alternativeDrug = 'Extended-release Carbidopa/Levodopa';
          responseMsg = `🚨 CRITICAL: Noting GI issues with ${detectedDrug}. Recommending ${alternativeDrug} (Rytary) - extended release formulation may reduce GI side effects. Consider taking with food.`;
        } else if (detectedDrug.toLowerCase() === 'tiotropium' || detectedDrug.toLowerCase() === 'spiriva') {
          alternativeDrug = 'Umeclidinium (Incruse Ellipta)';
          responseMsg = `🚨 CRITICAL: Withdrawing ${detectedDrug} due to GI intolerance. Recommending ${alternativeDrug} as alternative - LAMA with different formulation and potentially better GI tolerability. Also considering Aclidinium (Tudorza) as secondary option.`;
        } else {
          responseMsg = `🚨 CRITICAL: Withdrawing ${detectedDrug} from protocol due to patient intolerance. Searching for suitable alternatives...`;
        }
      } else if (hasAllergy) {
        respondingAgent = 'pharmacologist';
        responseMsg = `🚨 ALLERGY ALERT: ${detectedDrug} marked as contraindicated due to allergic reaction. Removing from all current and future recommendations. Updating patient allergy profile.`;
      } else if (hasCostIssue) {
        respondingAgent = 'hera';
        responseMsg = `🛡️ BUDGET OVERRIDE: ${detectedDrug} flagged as too expensive. Searching for generic alternatives or therapeutic substitutes within budget constraints.`;
      } else {
        responseMsg = `⚠️ ACKNOWLEDGED: Noting clinical concern regarding ${detectedDrug}. Re-evaluating recommendation and searching for alternatives.`;
      }
      
      // Add the drug to excluded list - the useEffect will handle updating consensusResult
      console.log('[Steering] Adding to excluded medications:', detectedDrug);
      setExcludedMedications(prev => {
        const drugLower = detectedDrug.toLowerCase();
        if (!prev.some(d => d.toLowerCase() === drugLower)) {
          console.log('[Steering] New exclusion list:', [...prev, detectedDrug]);
          return [...prev, detectedDrug];
        }
        return prev;
      });
      
    } else {
      // No specific drug detected - general response
      if (hasGIIssue) {
        respondingAgent = 'endocrinologist';
        responseMsg = '⚠️ INTERCEPTING: Patient history of GI intolerance noted. Please specify which medication is causing issues so we can adjust the protocol.';
      } else if (hasCostIssue) {
        respondingAgent = 'hera';
        responseMsg = '🛡️ CONSTRAINT OVERRIDE: Budget concern noted. Enforcing generic-first policy. Please specify any medications that are too expensive.';
      } else if (hasAllergy) {
        respondingAgent = 'pharmacologist';
        responseMsg = '🚨 SAFETY FLAG: Allergy concern noted. Please specify the medication causing allergic reaction for immediate removal from protocol.';
      } else {
        responseMsg = 'Acknowledged constraint. Please provide more details about which medication needs adjustment.';
      }
    }
    
    // Agent acknowledgment with delay
    setTimeout(() => {
      setDeliberationMessages(prev => [...prev, {
        id: Date.now(),
        agent: respondingAgent,
        type: 'steering_acknowledgment',
        isFlashing: true,
        message: responseMsg,
        timestamp: formatTimestamp()
      }]);
    }, 1000);
    
    // Re-negotiation signal
    setTimeout(() => {
      setDeliberationMessages(prev => [...prev, {
        id: Date.now(),
        agent: 'system',
        type: 'renegotiation_triggered',
        message: detectedDrug 
          ? `🔄 Protocol updated: ${detectedDrug} removed from recommendations per clinician steering.`
          : '🔄 Re-negotiation initiated based on clinician steering...',
        timestamp: formatTimestamp()
      }]);
    }, 2500);
    
    // Send to backend if session exists
    if (negotiationSessionId) {
      try {
        await injectIntervention(negotiationSessionId, { 
          type: 'custom', 
          message: constraint,
          constraint: constraint,
          excludedDrug: detectedDrug,
          impact: detectedDrug ? `Remove ${detectedDrug} from protocol` : 'Clinician steering - workflow re-evaluation required'
        });
      }       catch (err) {
        console.warn('Failed to send steering to backend:', err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steeringInput, negotiationSessionId, formatTimestamp]);

  // RECOMMENDATION VIEW - Integrated with Live Agent Deliberation + All 5 Features
  const renderRecommendation = () => {
    // Agent avatar configurations for the feed
    const AGENT_CONFIG_FEED = {
      geneticist: { name: 'Geneticist', emoji: '🧬', bgColor: '#f3e8ff', borderColor: '#a855f7', color: '#a855f7' },
      pharmacologist: { name: 'Pharmacologist', emoji: '💊', bgColor: '#dcfce7', borderColor: '#22c55e', color: '#22c55e' },
      endocrinologist: { name: 'Endocrinologist', emoji: '⚡', bgColor: '#fef3c7', borderColor: '#f59e0b', color: '#f59e0b' },
      hera: { name: 'HERA Guardian', emoji: '🛡️', bgColor: '#cffafe', borderColor: '#06b6d4', color: '#06b6d4' },
      coordinator: { name: 'Coordinator', emoji: '🎯', bgColor: '#f5f3ff', borderColor: '#8b5cf6', color: '#8b5cf6' },
      system: { name: 'System', emoji: '⚙️', bgColor: '#f1f5f9', borderColor: '#64748b', color: '#64748b' },
      clinician: { name: 'You (Clinician)', emoji: '👨‍⚕️', bgColor: '#fef9c3', borderColor: '#eab308', color: '#eab308' },
      cardiologist: { name: 'Cardiologist', emoji: '❤️', bgColor: '#fce7f3', borderColor: '#ec4899', color: '#ec4899' },
      nephrologist: { name: 'Nephrologist', emoji: '🫘', bgColor: '#e0f2fe', borderColor: '#0ea5e9', color: '#0ea5e9' },
    };

    const getAgentConfig = (agentKey) => {
      const key = agentKey?.toLowerCase().replace(/[^a-z_]/g, '') || 'system';
      return AGENT_CONFIG_FEED[key] || AGENT_CONFIG_FEED.system;
    };

    // Render a single message in the feed - ENHANCED with all 5 features
    const renderMessage = (msg, index) => {
      const agent = getAgentConfig(msg.agent);
      const isVeto = msg.type === 'veto';
      const isConsensus = msg.type === 'consensus';
      // isSystem is computed but used implicitly via fallback rendering
      const isToolUse = msg.type === 'tool_use';
      const isReflection = msg.type === 'reflection';
      const isSubAgent = msg.type === 'sub_agent';
      const isSubAgentResponse = msg.type === 'sub_agent_response';
      const isSteering = msg.type === 'steering_intervention';
      const isSteeringAck = msg.type === 'steering_acknowledgment';
      const isRenegotiation = msg.type === 'renegotiation_triggered';

      // FEATURE 1: Steering intervention (from clinician)
      if (isSteering) {
        return (
          <div key={msg.id || index} className="rounded-xl p-4 bg-amber-50 border-2 border-amber-400 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-amber-700">CLINICIAN STEERING</span>
              <span className="text-xs text-amber-500 ml-auto">{msg.timestamp}</span>
            </div>
            <p className="text-sm text-amber-800 font-medium pl-10 italic">
              "{msg.constraint || msg.message}"
            </p>
          </div>
        );
      }

      // FEATURE 1: Steering acknowledgment (agent response)
      if (isSteeringAck) {
        return (
          <div 
            key={msg.id || index}
            className={`rounded-xl p-4 border-l-4 border-amber-400 ${msg.isFlashing ? 'bg-amber-100' : 'bg-amber-50'}`}
            style={msg.isFlashing ? { animation: 'steeringGlow 1s ease-in-out infinite' } : {}}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0 animate-pulse"
                style={{ backgroundColor: agent.bgColor, borderColor: agent.borderColor }}
              >
                {agent.emoji}
              </div>
              <span className="text-sm font-semibold text-amber-800">{agent.name}</span>
              <span className="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                ⚡ STEERING RESPONSE
              </span>
              <span className="text-xs text-amber-500 ml-auto">{msg.timestamp}</span>
            </div>
            <p className="text-sm text-amber-800 font-medium pl-11">
              {msg.message}
            </p>
          </div>
        );
      }

      // Renegotiation triggered
      if (isRenegotiation) {
        return (
          <div key={msg.id || index} className="rounded-xl p-3 bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-blue-700">{msg.message}</span>
            </div>
          </div>
        );
      }

      // FEATURE 3: Tool Use Action
      if (isToolUse) {
        return (
          <div key={msg.id || index} className="rounded-xl p-4 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 border-2 border-sky-400 flex items-center justify-center text-sky-600 animate-pulse">
                <Search className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-sky-800">{agent.name}</span>
                  <span className="text-xs bg-sky-200 text-sky-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {msg.tool}
                  </span>
                </div>
                <div className="text-xs font-mono text-sky-600 mt-1 bg-sky-100/70 px-2 py-1 rounded inline-flex items-center gap-1">
                  <span className="animate-pulse">🔍</span>
                  {msg.action}
                </div>
              </div>
              <span className="text-xs text-sky-500">{msg.timestamp}</span>
            </div>
          </div>
        );
      }

      // FEATURE 2: Sub-Agent Summon
      if (isSubAgent) {
        return (
          <div key={msg.id || index} className="rounded-xl p-4 bg-gradient-to-r from-fuchsia-50 to-pink-50 border-l-4 border-fuchsia-400">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-fuchsia-200 flex items-center justify-center animate-pulse">
                <Sparkles className="w-3 h-3 text-fuchsia-600" />
              </div>
              <span className="text-sm font-bold text-fuchsia-700">🚀 SUB-AGENT SUMMONED</span>
              {msg.subAgentName && (
                <span className="text-xs bg-fuchsia-200 text-fuchsia-700 px-2 py-0.5 rounded-full font-medium">
                  {msg.subAgentEmoji} {msg.subAgentName}
                </span>
              )}
              <span className="text-xs text-fuchsia-500 ml-auto">{msg.timestamp}</span>
            </div>
            <p className="text-sm text-fuchsia-800 pl-8">
              {msg.message}
            </p>
          </div>
        );
      }

      // FEATURE 2: Sub-Agent Response
      if (isSubAgentResponse) {
        return (
          <div key={msg.id || index} className="rounded-xl p-4 bg-violet-50 border border-violet-200 ml-4">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2"
                style={{ 
                  backgroundColor: msg.color ? `${msg.color}20` : '#ede9fe',
                  borderColor: msg.color || '#8b5cf6'
                }}
              >
                {msg.agentName?.includes('Cardio') ? '❤️' :
                 msg.agentName?.includes('Neuro') ? '🧠' :
                 msg.agentName?.includes('Nephro') ? '🫘' : '👤'}
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-violet-800">{msg.agentName || 'Specialist'}</span>
                <span className="text-xs text-violet-500 ml-2">Sub-Agent Ruling</span>
              </div>
              <span className="text-xs text-violet-500">{msg.timestamp}</span>
            </div>
            <p className="text-sm text-violet-800 pl-11">{msg.message}</p>
            {msg.recommendations?.length > 0 && (
              <div className="pl-11 mt-2">
                <p className="text-xs text-violet-600 font-medium">Recommendations:</p>
                <ul className="text-xs text-violet-700 list-disc list-inside">
                  {msg.recommendations.slice(0, 2).map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      // FEATURE 5: Reflection / Memory Action
      if (isReflection) {
        return (
          <div key={msg.id || index} className="rounded-xl p-4 bg-gradient-to-r from-slate-50 to-indigo-50 border-l-4 border-indigo-300 border-dashed">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0" 
                style={{ backgroundColor: agent.bgColor, borderColor: agent.borderColor }}
              >
                {agent.emoji}
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {agent.name} <span className="text-indigo-500 font-normal italic">recalled memory</span>
              </span>
              <span className="text-xs text-slate-400 ml-auto">{msg.timestamp}</span>
            </div>
            <div className="pl-11">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-600 mb-1">
                <Brain className="w-3 h-3" />
                💭 Past Case Learning
              </div>
              <p className="text-sm text-indigo-700 italic bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                "{msg.message}"
              </p>
            </div>
          </div>
        );
      }

      // Default message card (proposals, veto, consensus)
      return (
        <div
          key={msg.id || index}
          className={`
            rounded-xl p-4 transition-all duration-300 animate-[slideIn_0.3s_ease-out]
            ${isVeto ? 'bg-red-50 border-l-4 border-red-400' : ''}
            ${isConsensus ? 'bg-emerald-50 border-l-4 border-emerald-400' : ''}
            ${!isVeto && !isConsensus ? 'bg-white border border-slate-200 shadow-sm' : ''}
          `}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0"
              style={{ backgroundColor: agent.bgColor, borderColor: agent.borderColor }}
            >
              {agent.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-800">{agent.name}</span>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">{msg.timestamp}</span>
          </div>
          <div className="pl-11">
            {(isVeto || isConsensus) && (
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${
                  isVeto ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isVeto && <><AlertTriangle className="w-3 h-3" /> VETO</>}
                {isConsensus && <><CheckCircle2 className="w-3 h-3" /> CONSENSUS REACHED</>}
              </div>
            )}
            <p className={`text-sm leading-relaxed ${
              isVeto ? 'text-red-800' : isConsensus ? 'text-emerald-800' : 'text-slate-600'
            }`}>
              {msg.message}
            </p>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Final Recommendation Card - Shows at TOP after consensus */}
        {consensusResult && (
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-lg animate-[fadeSlide_0.5s_ease-out]">
            <div className="flex items-start gap-4 mb-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${consensusResult.hasVeto ? 'bg-amber-400' : 'bg-emerald-500'}`}>
                {consensusResult.hasVeto ? (
                  <AlertTriangle className="h-6 w-6 text-white" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${consensusResult.hasVeto ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {consensusResult.hasVeto ? 'Adjusted Recommendation' : 'Final Recommendation'}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">RECOMMENDED PROTOCOL</h3>
                <h2 className="text-xl font-bold text-slate-900">{consensusResult.protocol}</h2>
              </div>
            </div>
            
            <p className="text-slate-700 mb-4">{consensusResult.reasoning}</p>
            
            {/* Display medications if available */}
            {consensusResult.medications && consensusResult.medications.length > 0 && (
              <div className="mb-4 p-4 bg-white/60 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Medication Protocol</h4>
                <div className="space-y-2">
                  {consensusResult.medications.map((med, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-slate-800">{med.name}</span>
                      </div>
                      <span className="text-slate-600">{med.dose} {med.frequency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {consensusResult.hasVeto && (
              <div className="flex items-center gap-3 px-3 py-2 bg-amber-100 rounded-lg mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  {excludedMedications.length > 0 
                    ? `Protocol adjusted: ${excludedMedications.join(', ')} removed per clinician steering.`
                    : 'Protocol adjusted due to safety, budget, or clinician constraints.'
                  }
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-slate-700">Confidence: <span className="text-emerald-600">{consensusResult.confidence}%</span></span>
                <span className="font-semibold text-slate-700">Rounds: <span className="text-slate-600">{consensusResult.rounds}</span></span>
              </div>
              <button
                onClick={() => {
                  // Future: Apply to treatment plan
                  alert('Protocol applied to treatment plan!');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                Apply to Treatment Plan
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* LEFT: Live Agent Deliberation Feed */}
          <div className="xl:col-span-2 space-y-4">
            <Panel>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Live Agent Deliberation</h2>
                    <p className="text-sm text-slate-500">Watch AI specialists collaborate in real-time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {consensusStatus === 'running' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs font-medium text-blue-700">Live</span>
                    </div>
                  )}
                  {consensusStatus === 'consensus' && (
                    <button
                      onClick={resetConsensus}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Run Again
                    </button>
                  )}
                  {consensusStatus === 'idle' && (
                    <button
                      onClick={runConsensusDeliberation}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Start Consensus
                    </button>
                  )}
                </div>
              </div>

              {/* Feed Container */}
              <div
                ref={feedRef}
                className="h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                {deliberationMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <FileCheck className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="text-sm font-medium text-slate-600 mb-1">
                      {consensusStatus === 'idle' ? 'Ready to Start' : 'Connecting to Agents...'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-[240px]">
                      Click "Start Consensus" to begin multi-agent deliberation and generate treatment recommendation
                    </p>
                  </div>
                ) : (
                  deliberationMessages.map((msg, i) => renderMessage(msg, i))
                )}
              </div>

              {/* FEATURE 1: HITL Steering Command Line */}
              <div className={`mt-3 border-t pt-3 transition-all duration-200 ${
                isSteeringActive ? 'bg-amber-50 border-amber-200 -mx-6 -mb-6 px-6 pb-4 rounded-b-[28px]' : 'border-slate-100'
              }`}>
                <form onSubmit={handleSteeringSubmit} className="flex items-center gap-2">
                  <span className="text-amber-500 font-mono text-sm font-bold">&gt;</span>
                  <input
                    type="text"
                    value={steeringInput}
                    onChange={(e) => setSteeringInput(e.target.value)}
                    onFocus={() => setIsSteeringActive(true)}
                    onBlur={() => !steeringInput && setIsSteeringActive(false)}
                    placeholder={consensusStatus === 'running' ? "Inject constraint... (e.g., 'Patient had GI issues with Metformin')" : "Start consensus to enable steering..."}
                    disabled={consensusStatus !== 'running'}
                    className={`flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-slate-400 disabled:opacity-50 ${
                      isSteeringActive ? 'text-amber-800' : 'text-slate-600'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={consensusStatus !== 'running' || !steeringInput.trim()}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      steeringInput.trim() && consensusStatus === 'running'
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Inject
                  </button>
                </form>
                {isSteeringActive && (
                  <p className="text-xs text-amber-600 mt-2 pl-4">
                    💡 Type a constraint to steer agents in real-time (e.g., "avoid expensive drugs", "patient is allergic to penicillin")
                  </p>
                )}
              </div>

              {/* Message Count */}
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>{deliberationMessages.length} messages</span>
                {consensusStatus === 'consensus' && (
                  <span className="text-emerald-600 font-medium">Consensus achieved</span>
                )}
              </div>
            </Panel>
          </div>

          {/* RIGHT: Metrics & Actions */}
          <div className="space-y-4">
            <Panel>
              <h3 className="font-semibold text-slate-800 mb-4">Consensus Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Confidence</span>
                    <span className="font-semibold text-emerald-600">{consensusResult ? `${consensusResult.confidence}%` : '--'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: consensusResult ? `${consensusResult.confidence}%` : '0%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Agreement</span>
                    <span className="font-semibold text-emerald-600">{consensusResult ? '4/4 agents' : '--'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: consensusResult ? '100%' : '0%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Rounds</span>
                    <span className="font-semibold text-slate-700">{consensusResult ? consensusResult.rounds : '--'}</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Agent Status Cards */}
            <Panel>
              <h3 className="font-semibold text-slate-800 mb-4">Agent Status</h3>
              <div className="space-y-2">
                {Object.entries(agentInsights).map(([key, agent]) => {
                  const isActive = deliberationMessages.some(m => m.agent === key);
                  const hasAgreed = consensusResult?.agentAgreement?.[key];
                  
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                        hasAgreed ? 'bg-emerald-50' : isActive ? 'bg-blue-50' : 'bg-slate-50'
                      }`}
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: agent.bgColor }}
                      >
                        {agent.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{agent.name}</p>
                      </div>
                      <div
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          hasAgreed ? 'bg-emerald-100 text-emerald-700' :
                          isActive ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {hasAgreed ? (hasAgreed === 'adjusted' ? 'Adjusted' : hasAgreed.charAt(0).toUpperCase() + hasAgreed.slice(1)) :
                         isActive ? 'Active' : 'Waiting'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    );
  };

  // Section Router
  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfile();
      case 'geneticist':
      case 'pharmacologist':
      case 'endocrinologist':
      case 'hera':
        return renderAgentDetail(activeSection);
      case 'trajectory':
        return renderTrajectory();
      case 'recommendation':
        return renderRecommendation();
      default:
        return renderOverview();
    }
  };

  // =============================================================================
  // LOADING & ERROR STATES
  // =============================================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#e8f5e9_0%,#c8e6c9_100%)] text-slate-900">
        <div className="space-y-4 text-center">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-emerald-500" />
          <p className="text-lg font-semibold">Loading BioTwin AI...</p>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#e8f5e9_0%,#c8e6c9_100%)] px-4 text-slate-900">
        <Panel className="max-w-lg text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
          <p className="mb-4 text-lg font-semibold">{error}</p>
          <button onClick={() => navigate('/')} className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
            Back Home
          </button>
        </Panel>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e8f5e9_0%,#c8e6c9_100%)] p-4 text-slate-900 md:p-6">
      <div className="mx-auto flex max-w-[1600px] gap-4 rounded-[38px] border border-white/60 bg-[#f5f5f0]/90 p-4 shadow-[0_24px_80px_rgba(80,110,88,0.12)] md:p-6">
        {/* NEW SIDEBAR */}
        <div className="hidden w-[220px] shrink-0 flex-col rounded-[28px] bg-white/70 p-4 md:flex">
          {/* Logo */}
          <div className="mb-5 flex items-center gap-3 rounded-[22px] bg-emerald-100 px-4 py-4">
            <BrainCircuit className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-emerald-700">BioTwin AI</p>
              <p className="font-semibold text-sm">Digital Twin</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-1 flex-1">
            {sections.map((item) => {
              if (item.divider) {
                return (
                  <div key={item.key} className="px-2 py-2 mt-4 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                  </div>
                );
              }

              const Icon = item.icon;
              const active = item.key === activeSection;
              const isAgent = item.group === 'agents';

              return (
                <button
                  key={item.key}
                  onClick={() => openSection(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-transparent text-slate-600 hover:bg-emerald-50'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      active ? 'bg-emerald-500' : isAgent ? '' : 'bg-slate-100'
                    }`}
                    style={
                      isAgent && !active
                        ? { backgroundColor: item.color + '20' }
                        : undefined
                    }
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-500'}`}
                      style={isAgent && !active ? { color: item.color } : undefined}
                    />
                  </span>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-4 space-y-2">
            <button
              onClick={() => navigate('/')}
              className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-slate-600 hover:bg-white text-sm"
            >
              <Home className="h-4 w-4" /> Back Home
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className={`mb-2 inline-flex items-center gap-2 rounded-full ${currentTheme.accentBg} px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ${currentTheme.accentText}`}>
                <Sparkles className="h-3.5 w-3.5" /> {currentTheme.layer}
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
                {sections.find((item) => item.key === activeSection)?.label || 'Consensus Overview'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{currentTheme.description}</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">
                <User className="h-4 w-4" /> {role}
              </div>
              {canExport && (
                <button
                  onClick={exportClinicianReport}
                  disabled={exportingReport}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm disabled:opacity-60"
                >
                  <Download className="h-4 w-4" /> {exportingReport ? 'Exporting...' : 'Export'}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex gap-2 overflow-auto pb-1 md:hidden">
            {sections
              .filter((s) => !s.divider)
              .map((item) => (
                <button
                  key={item.key}
                  onClick={() => openSection(item.key)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                    item.key === activeSection
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Main Content Area */}
          <div className={`rounded-[32px] bg-white/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]`}>
            <div key={activeSection} className="animate-[fadeSlide_280ms_ease]">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes steeringGlow {
          0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.3); background-color: rgba(254, 243, 199, 0.5); }
          50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); background-color: rgba(254, 243, 199, 1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
