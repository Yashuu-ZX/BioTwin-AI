import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, Play, RotateCcw, ArrowLeft, Zap } from 'lucide-react';
import apiClient, { startNegotiation, injectIntervention } from '../api/apiClient';
import useAgentTelemetry from '../hooks/useAgentTelemetry';

// Components
import PatientSnapshotCard from '../components/consensus/PatientSnapshotCard';
import FinalDecisionCard from '../components/consensus/FinalDecisionCard';
import CompactTrajectoryChart from '../components/consensus/CompactTrajectoryChart';
import AgentActivityFeed from '../components/consensus/AgentActivityFeed';
import AgentInsightsPanel from '../components/consensus/AgentInsightsPanel';
import SidebarHITLPanel from '../components/consensus/SidebarHITLPanel';

/**
 * ConsensusWorkspace (Mission Control) - Live Multi-Agent Deliberation View
 * 
 * A 3-column layout for real-time consensus building:
 * - Column 1: Patient Context + Trajectory Chart + Final Decision
 * - Column 2: Live Agent Deliberation Feed (main focus)
 * - Column 3: Agent Insights Panel + HITL Controls
 * 
 * Design: Light clinical theme consistent with Dashboard.jsx
 * Agent Colors: Geneticist (violet), Pharmacologist (green), Endocrinologist (amber), HERA (cyan)
 */

// Demo agent responses
const DEMO_RESPONSES = [
  { agent: 'geneticist', message: 'Analyzing pharmacogenomic profile. CYP2C19 *1/*2 genotype confirmed - patient is an Intermediate Metabolizer. This affects ~15% of common medications.' },
  { agent: 'pharmacologist', message: 'Cross-referencing current medications with genetic data. WARNING: Standard Clopidogrel dosing poses efficacy concerns. Recommending Ticagrelor or dose adjustment.' },
  { agent: 'endocrinologist', message: 'HbA1c 7.8% indicates suboptimal control. Current Metformin 500mg BID insufficient. Evaluating SGLT2 inhibitor for cardiovascular co-benefit.' },
  { agent: 'hera', type: 'veto', message: 'BUDGET VIOLATION: Proposed Jardiance costs $580/month. Patient budget is $150/month. VETOING this recommendation. Agents must propose generic alternatives within budget.' },
  { agent: 'endocrinologist', message: 'Acknowledged. Pivoting recommendation: Increase Metformin to 1000mg BID + structured lifestyle intervention. Total cost: $15/month.' },
  { agent: 'pharmacologist', message: 'Confirming safety: Metformin increase compatible with current regimen. No CYP2C19 interaction. Recommending addition of generic ACE inhibitor for renal protection.' },
];

const DEMO_CONSENSUS = {
  protocol: 'Generic Metformin (1000mg BID) + Lisinopril (20mg QD) + Lifestyle Counseling',
  reasoning: 'Multi-agent consensus achieved. HERA validated all recommendations meet the $150/month budget constraint while optimizing therapeutic outcomes.',
  confidence: 87,
  rounds: 3,
  hasVeto: true,
  action: 'Apply to Treatment Plan'
};

// Generate dynamic agent insights from patient data
function generateAgentInsights(patient) {
  if (!patient) return null;
  
  const medications = patient.medications || [];
  const conditions = patient.conditions || [];
  const socioEconomic = patient.socioEconomic || {};
  const biomarkers = patient.biomarkers || {};
  const vitals = patient.vitals || {};
  const pharmacogenomics = biomarkers.pharmacogenomics || {};
  
  return {
    geneticist: {
      dataAnalyzed: [
        pharmacogenomics.CYP2C19 ? `CYP2C19 genotype: ${pharmacogenomics.CYP2C19}` : 'Pharmacogenomic panel pending',
        pharmacogenomics.CYP2D6 ? `CYP2D6 status: ${pharmacogenomics.CYP2D6}` : 'CYP2D6 analysis available',
        'Drug metabolism predictions',
        'Hereditary risk factors from family history'
      ],
      rationale: pharmacogenomics.CYP2C19 
        ? `Genetic analysis reveals ${pharmacogenomics.CYP2C19} genotype, affecting metabolism of ~15% of commonly prescribed drugs including PPIs, antidepressants, and antiplatelets.`
        : 'Genetic profiling recommended to identify drug metabolism variations that may affect treatment efficacy.',
      recommendation: pharmacogenomics.CYP2C19?.includes('Poor') ? 'Flag CYP2C19-dependent drugs' : 'Standard genetic screening',
      risk: pharmacogenomics.CYP2C19?.includes('Poor') ? 'Drug metabolism variation' : 'No significant genetic risk identified',
      confidence: pharmacogenomics.CYP2C19 ? 95 : 70
    },
    pharmacologist: {
      dataAnalyzed: [
        `Current medication regimen (${medications.length} active drugs)`,
        pharmacogenomics.CYP2C19 ? `${pharmacogenomics.CYP2C19} - affects drug metabolism` : 'Genetic data pending',
        'Drug-drug interaction database',
        vitals.glucose ? `Glucose: ${vitals.glucose} mg/dL` : 'Metabolic markers'
      ],
      rationale: medications.length > 0
        ? `Reviewing ${medications.map(m => m.name).join(', ')} for interactions and optimization based on patient profile.`
        : 'No current medications on file. Establishing baseline for therapy recommendations.',
      recommendation: medications.length > 2 ? 'Optimize polypharmacy regimen' : 'Monitor for interactions',
      risk: medications.length > 3 ? 'Polypharmacy interaction risk' : 'Low interaction risk',
      confidence: medications.length > 0 ? 88 : 60
    },
    endocrinologist: {
      dataAnalyzed: [
        biomarkers.hba1c ? `HbA1c: ${biomarkers.hba1c}` : 'HbA1c pending',
        vitals.glucose ? `Fasting glucose: ${vitals.glucose} mg/dL` : 'Glucose monitoring needed',
        medications.find(m => m.name?.toLowerCase().includes('metformin')) ? 'Current Metformin therapy' : 'No diabetes medications',
        conditions.includes('Type 2 Diabetes') ? 'T2D management focus' : 'Metabolic risk assessment'
      ],
      rationale: biomarkers.hba1c 
        ? `HbA1c of ${biomarkers.hba1c} ${parseFloat(biomarkers.hba1c) > 7 ? 'indicates suboptimal glycemic control' : 'shows good glycemic control'}. ${conditions.includes('Type 2 Diabetes') ? 'Optimizing diabetes management.' : ''}`
        : 'Recommend baseline metabolic panel to assess glycemic status and cardiovascular risk.',
      recommendation: parseFloat(biomarkers.hba1c) > 7.5 ? 'Intensify glycemic therapy' : 'Maintain current approach',
      risk: parseFloat(biomarkers.hba1c) > 8 ? 'Poor glycemic control risk' : 'Moderate metabolic risk',
      confidence: biomarkers.hba1c ? 85 : 65
    },
    hera: {
      dataAnalyzed: [
        socioEconomic.monthlyMedicationBudget ? `Budget constraint: $${socioEconomic.monthlyMedicationBudget}/month` : 'Budget not specified',
        socioEconomic.insuranceTier ? `Insurance tier: ${socioEconomic.insuranceTier}` : 'Insurance status unknown',
        socioEconomic.transportationAccess || 'Transportation access not specified',
        'Socioeconomic risk factors assessment'
      ],
      rationale: socioEconomic.monthlyMedicationBudget
        ? `Enforcing strict budget compliance at $${socioEconomic.monthlyMedicationBudget}/month. HERA will veto any recommendation that creates financial toxicity risk.`
        : 'Monitoring for socioeconomic barriers that may affect treatment adherence.',
      recommendation: socioEconomic.monthlyMedicationBudget ? 'Enforce formulary compliance' : 'Assess financial barriers',
      risk: socioEconomic.monthlyMedicationBudget && socioEconomic.monthlyMedicationBudget < 200 ? 'Financial toxicity risk' : 'Adherence barrier risk',
      confidence: 100,
      isGuardian: true
    }
  };
}

export default function ConsensusWorkspace() {
  const navigate = useNavigate();
  const { id: patientId } = useParams();
  
  // Core state
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, initializing, running, consensus
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  
  // Agent states for insights panel
  const [agentStates, setAgentStates] = useState({
    geneticist: 'ready',
    pharmacologist: 'ready',
    endocrinologist: 'ready',
    hera: 'monitoring'
  });
  
  // Results
  const [consensus, setConsensus] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Chart data
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [activeProtocol, setActiveProtocol] = useState('multiAgent');
  
  // Generate dynamic agent insights from patient data
  const agentInsights = useMemo(() => generateAgentInsights(patient), [patient]);
  
  // WebSocket
  const { isConnected, subscribe, clearEvents } = useAgentTelemetry(sessionId, {
    autoConnect: true,
    onEvent: handleTelemetryEvent
  });

  // Load patient
  useEffect(() => {
    if (patientId) {
      setIsLoading(true);
      apiClient.get(`/patient/${patientId}`)
        .then(res => {
          setPatient(res.data);
          initializeTrajectory();
          setIsLoading(false);
        })
        .catch(() => {
          // Demo patient
          setPatient({
            name: 'Robert Miller',
            age: 58,
            sex: 'Male',
            conditions: ['Type 2 Diabetes', 'Hypertension', 'Hyperlipidemia'],
            medications: [
              { name: 'Metformin', dosage: '500mg BID' },
              { name: 'Lisinopril', dosage: '10mg QD' },
              { name: 'Atorvastatin', dosage: '20mg QD' }
            ],
            vitals: { bpSystolic: 138, bpDiastolic: 88, heartRate: 78, glucose: 142 },
            biomarkers: { hba1c: '7.8%', pharmacogenomics: { CYP2C19: '*1/*2 Poor Metabolizer' } },
            socioEconomic: { monthlyMedicationBudget: 150 }
          });
          initializeTrajectory();
          setIsLoading(false);
          setDemoMode(true);
        });
    }
  }, [patientId]);

  function initializeTrajectory() {
    const data = [];
    for (let week = 0; week <= 12; week++) {
      data.push({
        week,
        standard: 65 + Math.random() * 5 + week * 1.5,
        multiAgent: 65 + Math.random() * 3 + week * 2.2,
      });
    }
    setTrajectoryData(data);
  }

  function handleTelemetryEvent(event) {
    const timestamp = formatTimestamp();
    
    if (event.type === 'agent_proposal') {
      setAgentStates(prev => ({ ...prev, [event.agent]: 'deliberating' }));
      addMessage({ timestamp, agent: event.agent, type: 'proposal', message: event.proposal?.recommendation || event.message });
    }
    
    if (event.type === 'veto_issued') {
      setAgentStates(prev => ({ ...prev, hera: 'blocked' }));
      addMessage({ timestamp, agent: 'hera', type: 'veto', message: event.reason });
      shiftTrajectory('conservative');
    }
    
    if (event.type === 'consensus_reached') {
      Object.keys(agentStates).forEach(k => setAgentStates(prev => ({ ...prev, [k]: 'consensus' })));
      addMessage({ timestamp, agent: 'coordinator', type: 'consensus', message: 'Consensus achieved.' });
      setConsensus({
        protocol: event.recommendation,
        reasoning: event.reasoning,
        confidence: Math.round((event.consensusScore || 0.85) * 100),
        rounds: event.rounds,
        hasVeto: event.hasVeto,
        action: 'Apply to Treatment Plan'
      });
      setStatus('consensus');
    }
  }

  function formatTimestamp() {
    return new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
  }

  function addMessage(msg) {
    setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }

  function shiftTrajectory(protocol) {
    setActiveProtocol(protocol);
    setTrajectoryData(prev => prev.map(p => ({
      ...p,
      multiAgent: protocol === 'conservative' ? p.multiAgent * 0.85 : p.multiAgent * (0.9 + Math.random() * 0.1)
    })));
  }

  // Start consensus
  const handleStart = useCallback(async () => {
    setStatus('initializing');
    clearEvents();
    setMessages([]);
    setConsensus(null);
    setAgentStates({ geneticist: 'deliberating', pharmacologist: 'deliberating', endocrinologist: 'deliberating', hera: 'monitoring' });
    
    addMessage({ timestamp: formatTimestamp(), agent: 'system', type: 'system', message: 'Initializing multi-agent consensus protocol...' });
    
    try {
      if (!demoMode) {
        const result = await startNegotiation(patientId, { maxRounds: 5, consensusThreshold: 0.7 });
        setSessionId(result.sessionId);
        subscribe(result.sessionId);
      }
      setStatus('running');
      
      if (demoMode || !isConnected) {
        runDemoSimulation();
      }
    } catch {
      setDemoMode(true);
      setStatus('running');
      runDemoSimulation();
    }
  }, [patientId, demoMode, clearEvents, subscribe, isConnected]);

  function runDemoSimulation() {
    DEMO_RESPONSES.forEach((resp, i) => {
      setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [resp.agent]: resp.type === 'veto' ? 'blocked' : 'deliberating' }));
        addMessage({ timestamp: formatTimestamp(), agent: resp.agent, type: resp.type || 'proposal', message: resp.message });
        if (resp.type === 'veto') shiftTrajectory('conservative');
      }, (i + 1) * 2500);
    });
    
    setTimeout(() => {
      setAgentStates({ geneticist: 'consensus', pharmacologist: 'consensus', endocrinologist: 'consensus', hera: 'consensus' });
      addMessage({ timestamp: formatTimestamp(), agent: 'coordinator', type: 'consensus', message: 'All agents have reached agreement. Consensus score: 87%' });
      setConsensus(DEMO_CONSENSUS);
      setStatus('consensus');
    }, (DEMO_RESPONSES.length + 1) * 2500);
  }

  // Clinical injection handler
  const handleClinicalInjection = useCallback((injection) => {
    addMessage({ timestamp: formatTimestamp(), agent: 'system', type: 'alert', isAlert: true, message: injection.alert });
    setConsensus(null);
    setStatus('running');
    shiftTrajectory('recalculating');
    setAgentStates(prev => ({ ...prev, [injection.agentResponse?.agent || 'cardiologist']: 'deliberating' }));
    
    setTimeout(() => {
      if (injection.agentResponse) {
        addMessage({ timestamp: formatTimestamp(), agent: injection.agentResponse.agent, type: 'proposal', message: injection.agentResponse.message });
      }
    }, 1200);
    
    setTimeout(() => {
      addMessage({ timestamp: formatTimestamp(), agent: 'hera', type: 'proposal', message: 'Re-validating safety constraints with new clinical data...' });
    }, 2500);
    
    setTimeout(() => {
      addMessage({ timestamp: formatTimestamp(), agent: 'coordinator', type: 'consensus', message: 'New consensus reached incorporating clinical update.' });
      setConsensus({
        protocol: 'Adjusted Protocol: Stabilization + Modified Maintenance',
        reasoning: 'Treatment adjusted for acute clinical change.',
        confidence: 82,
        rounds: 2,
        hasVeto: true,
        action: 'Apply Emergency Protocol'
      });
      setStatus('consensus');
      setAgentStates({ geneticist: 'consensus', pharmacologist: 'consensus', endocrinologist: 'consensus', hera: 'consensus' });
    }, 5000);
    
    if (sessionId) {
      injectIntervention(sessionId, { type: 'vital_change', ...injection }).catch(() => {});
    }
  }, [sessionId]);

  // Constraint intervention handler
  const handleIntervention = useCallback((intervention) => {
    addMessage({ timestamp: formatTimestamp(), agent: 'clinician', type: 'intervention', message: intervention.constraint });
    
    if (intervention.triggersResearchAgent && intervention.researchResponse) {
      setTimeout(() => {
        addMessage({ timestamp: formatTimestamp(), agent: 'coordinator', type: 'system', message: 'Standard treatments exhausted. Activating Research Agent...' });
      }, 800);
      setTimeout(() => {
        addMessage({ timestamp: formatTimestamp(), agent: intervention.researchResponse.agent, type: 'research', message: intervention.researchResponse.message });
      }, 2500);
      setTimeout(() => {
        setConsensus({
          protocol: 'Clinical Trial Enrollment: NCT04821934',
          reasoning: 'Research Agent identified eligible trial for novel therapy.',
          confidence: 78,
          rounds: 1,
          hasVeto: false,
          action: 'Discuss Trial with Patient'
        });
        setStatus('consensus');
      }, 4500);
      return;
    }
    
    setTimeout(() => {
      addMessage({ timestamp: formatTimestamp(), agent: 'pharmacologist', type: 'proposal', message: `Acknowledged constraint. Adjusting recommendations accordingly.` });
    }, 1500);
    
    if (sessionId) {
      injectIntervention(sessionId, { type: 'constraint', constraint: intervention.constraint }).catch(() => {});
    }
  }, [sessionId]);

  // Reset
  const handleReset = useCallback(() => {
    setSessionId(null);
    setStatus('idle');
    clearEvents();
    setMessages([]);
    setConsensus(null);
    initializeTrajectory();
    setActiveProtocol('multiAgent');
    setAgentStates({ geneticist: 'ready', pharmacologist: 'ready', endocrinologist: 'ready', hera: 'monitoring' });
  }, [clearEvents]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-blue-500 animate-pulse mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header - Light clinical theme */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/dashboard/${patientId}`)} 
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-slate-800">Mission Control</h1>
                  <p className="text-xs text-slate-500">
                    {demoMode ? 'Demo Mode' : isConnected ? 'Live Connected' : 'Offline'} 
                    {patient?.name && ` | ${patient.name}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              ${status === 'idle' ? 'bg-slate-100 text-slate-600' :
                status === 'running' ? 'bg-blue-100 text-blue-700' :
                status === 'consensus' ? 'bg-emerald-100 text-emerald-700' :
                'bg-amber-100 text-amber-700'}
            `}>
              <span className={`w-2 h-2 rounded-full ${
                status === 'idle' ? 'bg-slate-400' :
                status === 'running' ? 'bg-blue-500 animate-pulse' :
                status === 'consensus' ? 'bg-emerald-500' :
                'bg-amber-500 animate-pulse'
              }`} />
              {status === 'idle' ? 'Ready' :
               status === 'initializing' ? 'Initializing...' :
               status === 'running' ? 'Deliberating' : 'Consensus Reached'}
            </div>
            
            {status !== 'idle' && (
              <button 
                onClick={handleReset} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="max-w-[1800px] mx-auto p-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-88px)]">
          
          {/* COLUMN 1: Patient Context + Chart + Decision (col-span-3) */}
          <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
            <PatientSnapshotCard patient={patient} />
            <CompactTrajectoryChart data={trajectoryData} activeProtocol={activeProtocol} />
            <FinalDecisionCard consensus={consensus} status={status} />
          </div>

          {/* COLUMN 2: Live Agent Feed (col-span-5) - MAIN FOCUS */}
          <div className="col-span-5 flex flex-col gap-3">
            {/* Start Button Header */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Live Agent Deliberation</h2>
                <p className="text-xs text-slate-500">Watch AI specialists collaborate in real-time</p>
              </div>
              <button
                onClick={handleStart}
                disabled={status === 'running' || status === 'initializing'}
                className={`
                  flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm
                  ${status === 'idle' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white' :
                    status === 'consensus' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white' :
                    'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'}
                `}
              >
                <Play className="w-4 h-4" />
                {status === 'idle' ? 'Start Consensus' :
                 status === 'initializing' ? 'Starting...' :
                 status === 'running' ? 'In Progress...' : 'Run Again'}
              </button>
            </div>
            
            {/* Live Feed */}
            <div className="flex-1 min-h-0">
              <AgentActivityFeed messages={messages} status={status} />
            </div>
          </div>

          {/* COLUMN 3: Agent Insights + HITL (col-span-4) */}
          <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pl-1">
            {/* Agent Insights - Top Half */}
            <div className="flex-1 min-h-0">
              <AgentInsightsPanel 
                agentInsights={agentInsights}
                agentStates={agentStates} 
              />
            </div>
            
            {/* HITL Controls - Bottom */}
            <SidebarHITLPanel 
              onIntervene={handleIntervention}
              onClinicalInjection={handleClinicalInjection}
              status={status}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
