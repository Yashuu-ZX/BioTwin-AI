import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, Play, RotateCcw, ArrowLeft } from 'lucide-react';
import apiClient, { startNegotiation, injectIntervention } from '../api/apiClient';
import useAgentTelemetry from '../hooks/useAgentTelemetry';
import PatientSnapshotCard from '../components/consensus/PatientSnapshotCard';
import FinalDecisionCard from '../components/consensus/FinalDecisionCard';
import AgentActivityFeed from '../components/consensus/AgentActivityFeed';
import LightTrajectoryChart from '../components/consensus/LightTrajectoryChart';
import LightHITLPanel from '../components/consensus/LightHITLPanel';

/**
 * ConsensusWorkspace - Single Pane of Glass Medical AI Interface
 * 
 * Layout:
 * - Left (35%): Patient Data (Intake compressed) + Final Decision
 * - Right (65%): Live Agent Feed + Chart + HITL Controls
 * 
 * Features:
 * - Clinical Update Injections trigger dramatic agent re-evaluations
 * - HERA vetoes for budget violations
 * - Research Agent appears when standard treatments exhausted
 */

// Simulated agent responses for demo (when backend isn't available)
const DEMO_AGENT_RESPONSES = {
  initial: [
    { agent: 'pharmacologist', message: 'Reviewing patient medication profile. Detected CYP2C19 Poor Metabolizer status - standard Clopidogrel dosing poses high toxicity risk. Recommending alternative antiplatelet or dose titration.' },
    { agent: 'endocrinologist', message: 'HbA1c at 7.8% indicates suboptimal glycemic control. Current Metformin 500mg BID may be insufficient. Evaluating addition of SGLT2 inhibitor for cardiovascular benefit.' },
    { agent: 'cardiologist', message: 'BP 138/88 with existing hypertension. Current Lisinopril 10mg providing moderate control. May need uptitration or combination therapy.' },
    { agent: 'hera', type: 'veto', message: 'BUDGET CONSTRAINT VIOLATION: Proposed SGLT2 inhibitor (Jardiance) costs $580/month. Patient budget is $150/month. Vetoing this recommendation. Agents must propose generic alternatives.' },
    { agent: 'endocrinologist', message: 'Acknowledged. Pivoting to Metformin dose increase (1000mg BID) + lifestyle intervention. Cost-effective approach within budget constraints.' },
    { agent: 'pharmacologist', message: 'Confirming drug-drug interaction check complete. Metformin increase is safe with current medications. No CYP2C19 concerns with this pathway.' },
  ],
  consensus: { 
    protocol: 'Generic Metformin (1000mg BID) + Lisinopril (20mg QD) + Diet Counseling',
    reasoning: 'Multi-agent consensus achieved balancing efficacy with $150/month budget constraint. HERA validated all recommendations meet socioeconomic requirements.',
    confidence: 87,
    rounds: 3,
    hasVeto: true
  }
};

export default function ConsensusWorkspace() {
  const navigate = useNavigate();
  const { id: patientId } = useParams();
  
  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Consensus result
  const [consensus, setConsensus] = useState(null);
  
  // Messages for the activity feed
  const [messages, setMessages] = useState([]);
  
  // Trajectory data for chart
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [activeProtocol, setActiveProtocol] = useState('multiAgent');
  
  // Demo mode flag (when backend unavailable)
  const [demoMode, setDemoMode] = useState(false);
  
  // WebSocket telemetry
  const {
    isConnected,
    subscribe,
    clearEvents
  } = useAgentTelemetry(sessionId, {
    autoConnect: true,
    onEvent: handleTelemetryEvent
  });

  // Load patient data
  useEffect(() => {
    if (patientId) {
      setIsLoading(true);
      apiClient.get(`/patient/${patientId}`)
        .then(res => {
          setPatient(res.data);
          initializeTrajectory();
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to load patient:', err);
          // Use demo patient data
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
            vitals: { bpSystolic: 138, bpDiastolic: 88, heartRate: 78, glucose: 142, spO2: 97 },
            biomarkers: { hba1c: '7.8%', pharmacogenomics: { CYP2C19: '*1/*2 Poor Metabolizer' } },
            socioEconomic: { monthlyMedicationBudget: 150 }
          });
          initializeTrajectory();
          setIsLoading(false);
          setDemoMode(true);
        });
    }
  }, [patientId]);

  // Initialize trajectory chart
  function initializeTrajectory() {
    const baseline = [];
    for (let week = 0; week <= 12; week++) {
      baseline.push({
        week,
        standard: 65 + Math.random() * 5 + week * 1.5,
        multiAgent: 65 + Math.random() * 3 + week * 2.2,
        baseline: 65,
      });
    }
    setTrajectoryData(baseline);
  }

  // Handle incoming telemetry events
  function handleTelemetryEvent(event) {
    const timestamp = formatTimestamp();

    if (event.type === 'agent_proposal' || event.type === 'agent_start') {
      addMessage({
        timestamp,
        agent: event.agent || 'system',
        type: 'proposal',
        message: event.proposal?.recommendation || event.message || 'Analyzing patient data...',
        confidence: event.proposal?.confidence
      });
    }
    
    if (event.type === 'veto_issued') {
      addMessage({
        timestamp,
        agent: 'hera',
        type: 'veto',
        message: event.reason || 'Constraint violation detected. Recommendation vetoed.',
      });
      shiftTrajectory('conservative');
    }
    
    if (event.type === 'consensus_reached') {
      addMessage({
        timestamp,
        agent: 'coordinator',
        type: 'consensus',
        message: `All agents have reached agreement. Consensus score: ${((event.consensusScore || 0.85) * 100).toFixed(0)}%`
      });
      
      setConsensus({
        protocol: event.recommendation || 'Generic Treatment Protocol',
        reasoning: event.reasoning || 'Multi-agent consensus achieved.',
        confidence: Math.round((event.consensusScore || 0.85) * 100),
        rounds: event.rounds || 3,
        hasVeto: event.hasVeto || false,
        action: 'Apply to Treatment Plan'
      });
      
      setStatus('consensus');
    }
    
    if (event.type === 'intervention_received') {
      addMessage({
        timestamp,
        agent: 'clinician',
        type: 'intervention',
        message: event.constraint
      });
      shiftTrajectory('recalculating');
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
    setTrajectoryData(prev => prev.map(point => ({
      ...point,
      multiAgent: protocol === 'conservative' 
        ? point.multiAgent * 0.85 
        : protocol === 'recalculating'
          ? point.multiAgent * (0.9 + Math.random() * 0.1)
          : point.multiAgent
    })));
  }

  // Start consensus - with demo fallback
  const handleStartConsensus = useCallback(async () => {
    if (!patientId && !demoMode) return;
    
    setStatus('initializing');
    setError(null);
    clearEvents();
    setMessages([]);
    setConsensus(null);
    
    addMessage({
      timestamp: formatTimestamp(),
      agent: 'system',
      type: 'system',
      message: 'Initializing multi-agent consensus protocol...'
    });
    
    try {
      if (!demoMode) {
        const result = await startNegotiation(patientId, { maxRounds: 5, consensusThreshold: 0.7 });
        setSessionId(result.sessionId);
        subscribe(result.sessionId);
      }
      setStatus('running');
      
      // Run demo simulation if in demo mode or as fallback
      if (demoMode || !isConnected) {
        runDemoSimulation();
      }
      
    } catch (err) {
      console.error('Failed to start negotiation:', err);
      setDemoMode(true);
      setStatus('running');
      runDemoSimulation();
    }
  }, [patientId, demoMode, clearEvents, subscribe, isConnected]);

  // Demo simulation - shows agent deliberation without backend
  function runDemoSimulation() {
    const responses = DEMO_AGENT_RESPONSES.initial;
    
    responses.forEach((resp, i) => {
      setTimeout(() => {
        addMessage({
          timestamp: formatTimestamp(),
          agent: resp.agent,
          type: resp.type || 'proposal',
          message: resp.message
        });
        
        if (resp.type === 'veto') {
          shiftTrajectory('conservative');
        }
      }, (i + 1) * 2000);
    });
    
    // Final consensus
    setTimeout(() => {
      addMessage({
        timestamp: formatTimestamp(),
        agent: 'coordinator',
        type: 'consensus',
        message: 'Multi-agent consensus achieved after 3 rounds of deliberation. All constraints satisfied.'
      });
      setConsensus(DEMO_AGENT_RESPONSES.consensus);
      setStatus('consensus');
    }, (responses.length + 1) * 2000);
  }

  // Handle clinical update injection (vital spikes)
  const handleClinicalInjection = useCallback((injection) => {
    // First: Add the system alert
    addMessage({
      timestamp: formatTimestamp(),
      agent: 'system',
      type: 'alert',
      isAlert: true,
      message: injection.alert
    });
    
    // Invalidate current consensus
    setConsensus(null);
    setStatus('running');
    
    // Shift trajectory to recalculating
    shiftTrajectory('recalculating');
    
    // After a delay: Add the agent response
    setTimeout(() => {
      if (injection.agentResponse) {
        addMessage({
          timestamp: formatTimestamp(),
          agent: injection.agentResponse.agent,
          type: 'proposal',
          message: injection.agentResponse.message
        });
      }
      
      // Trigger re-evaluation cascade
      setTimeout(() => {
        addMessage({
          timestamp: formatTimestamp(),
          agent: 'hera',
          type: 'proposal',
          message: 'Re-validating all recommendations against safety constraints given new clinical data...'
        });
      }, 1500);
      
      // Eventually reach new consensus (for demo)
      setTimeout(() => {
        addMessage({
          timestamp: formatTimestamp(),
          agent: 'coordinator',
          type: 'consensus',
          message: 'Agents have re-evaluated. New consensus reached incorporating clinical update.'
        });
        setConsensus({
          protocol: 'Adjusted Protocol: Immediate stabilization + Modified maintenance therapy',
          reasoning: 'Treatment plan adjusted based on acute clinical change. Prioritizing patient safety.',
          confidence: 82,
          rounds: 2,
          hasVeto: true,
          action: 'Apply Emergency Protocol'
        });
        setStatus('consensus');
      }, 4000);
      
    }, 1000);
    
    // Also send to backend if available
    if (sessionId) {
      injectIntervention(sessionId, {
        type: 'vital_change',
        vital: injection.vital,
        value: injection.value,
        source: injection.source,
        timestamp: new Date().toISOString()
      }).catch(console.error);
    }
  }, [sessionId]);

  // Handle regular constraint intervention
  const handleIntervention = useCallback(async (intervention) => {
    if (!sessionId && !demoMode) {
      await handleStartConsensus();
      return;
    }
    
    // Check if this is actually a clinical injection disguised as intervention
    if (intervention.isAlert && intervention.agentResponse) {
      handleClinicalInjection(intervention);
      return;
    }
    
    addMessage({
      timestamp: formatTimestamp(),
      agent: 'clinician',
      type: 'intervention',
      message: intervention.constraint
    });
    
    // Check if this triggers the Research Agent
    if (intervention.triggersResearchAgent && intervention.researchResponse) {
      setTimeout(() => {
        addMessage({
          timestamp: formatTimestamp(),
          agent: 'coordinator',
          type: 'system',
          message: 'Standard treatments flagged as exhausted. Activating Research Agent...'
        });
      }, 500);
      
      setTimeout(() => {
        addMessage({
          timestamp: formatTimestamp(),
          agent: intervention.researchResponse.agent,
          type: intervention.researchResponse.type || 'research',
          message: intervention.researchResponse.message
        });
      }, 2000);
      
      setTimeout(() => {
        setConsensus({
          protocol: 'Clinical Trial Enrollment: NCT04821934',
          reasoning: 'Standard treatment options exhausted. Research Agent identified eligible clinical trial for novel therapy.',
          confidence: 78,
          rounds: 1,
          hasVeto: false,
          action: 'Discuss Trial with Patient'
        });
        setStatus('consensus');
      }, 4000);
      
      return;
    }
    
    // Demo: Show agents responding to intervention
    setTimeout(() => {
      addMessage({
        timestamp: formatTimestamp(),
        agent: 'coordinator',
        type: 'system',
        message: 'Constraint received. Notifying all agents to re-evaluate recommendations...'
      });
    }, 500);
    
    setTimeout(() => {
      const responders = ['pharmacologist', 'endocrinologist', 'cardiologist'];
      const responder = responders[Math.floor(Math.random() * responders.length)];
      addMessage({
        timestamp: formatTimestamp(),
        agent: responder,
        type: 'proposal',
        message: `Acknowledged new constraint: "${intervention.constraint.slice(0, 50)}..." Adjusting my recommendations accordingly.`
      });
    }, 1500);
    
    if (sessionId) {
      try {
        await injectIntervention(sessionId, {
          type: 'constraint',
          constraint: intervention.constraint,
          source: intervention.source || 'hitl',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Intervention failed:', err);
      }
    }
  }, [sessionId, demoMode, handleStartConsensus, handleClinicalInjection]);

  // Reset workspace
  const handleReset = useCallback(() => {
    setSessionId(null);
    setStatus('idle');
    clearEvents();
    setMessages([]);
    setConsensus(null);
    initializeTrajectory();
    setActiveProtocol('multiAgent');
  }, [clearEvents]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
          <span className="text-sm text-slate-500">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">AI Consensus Builder</h1>
              <p className="text-xs text-slate-500">Multi-agent treatment optimization {demoMode && '(Demo Mode)'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <div className={`w-2 h-2 rounded-full ${isConnected && !demoMode ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-xs text-slate-600">
                {isConnected && !demoMode ? 'Connected' : 'Demo Mode'}
              </span>
            </div>
            
            {status !== 'idle' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
            
            <button
              onClick={handleStartConsensus}
              disabled={status === 'running' || status === 'initializing'}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all
                ${status === 'idle' || status === 'failed'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : status === 'consensus'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              <Play className="w-4 h-4" />
              {status === 'initializing' ? 'Starting...' : 
               status === 'running' ? 'In Progress...' :
               status === 'consensus' ? 'Run Again' : 'Start Consensus'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 2 Column Layout */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT COLUMN - Patient & Decision */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <PatientSnapshotCard patient={patient} />
            <FinalDecisionCard consensus={consensus} status={status} />
          </div>

          {/* RIGHT COLUMN - Agent Feed + Chart + HITL */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Live Agent Activity Feed */}
            <div className="h-[420px]">
              <AgentActivityFeed messages={messages} status={status} />
            </div>
            
            {/* Bottom: Chart + HITL */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-7 h-[280px]">
                <LightTrajectoryChart 
                  data={trajectoryData} 
                  activeProtocol={activeProtocol} 
                />
              </div>
              
              <div className="col-span-12 md:col-span-5">
                <LightHITLPanel 
                  onIntervene={handleIntervention}
                  onClinicalInjection={handleClinicalInjection}
                  status={status} 
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <p className="text-sm font-medium">Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
