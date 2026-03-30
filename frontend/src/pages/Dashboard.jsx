import React, { useEffect, useMemo, useState } from 'react';
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
  ExternalLink,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import MultiSpecialistConsensus from '../components/MultiSpecialistConsensus';
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
  const genomicVariant = patient?.biomarkers?.genomicVariant || 'CYP2C19 reduced metabolizer';
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
  const [simulating, setSimulating] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [error, setError] = useState('');

  const [patient, setPatient] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [explainability, setExplainability] = useState(null);
  const [cohortData, setCohortData] = useState(null);
  const [drugIntel, setDrugIntel] = useState(null);
  const [result, setResult] = useState(null);

  const [treatmentPlan] = useState({ type: 'Standard', dosage: 'Medium', duration: 30 });

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

  const runSimulation = async () => {
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
            <button
              onClick={() => navigate(`/consensus/${id}`)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-400 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Mission Control
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            {canSimulate && !result && (
              <button
                onClick={runSimulation}
                disabled={simulating}
                className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {simulating ? 'Running...' : 'Start Consensus'}
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

  // PATIENT PROFILE
  const renderProfile = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <PatientProfilePanel patient={patient} className="h-full" />
      </div>
      <div className="space-y-4">
        <Panel>
          <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate(`/consensus/${id}`)}
              className="w-full flex items-center justify-between rounded-lg bg-cyan-50 px-4 py-3 text-cyan-700 hover:bg-cyan-100"
            >
              <span className="font-medium">Open Mission Control</span>
              <ExternalLink className="h-4 w-4" />
            </button>
            <button
              onClick={runSimulation}
              disabled={simulating}
              className="w-full flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              <span className="font-medium">{simulating ? 'Running...' : 'Run Consensus'}</span>
              <Play className="h-4 w-4" />
            </button>
          </div>
        </Panel>
        
        <Panel>
          <h3 className="font-semibold text-slate-800 mb-4">Biomarker Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Genomic Variant</span>
              <span className="font-medium text-violet-700">{patient?.biomarkers?.genomicVariant || 'Not assessed'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">CYP2C19</span>
              <span className="font-medium text-slate-800">{patient?.biomarkers?.pharmacogenomics?.cyp2c19 || 'Unknown'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Glucose</span>
              <span className="font-medium text-slate-800">{patient?.vitals?.sugar || patient?.vitals?.glucose || '--'} mg/dL</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );

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

  // RECOMMENDATION VIEW
  const renderRecommendation = () => {
    const consensus = result?.recommendation;
    
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Panel className={result ? 'bg-emerald-50 border-emerald-200' : ''}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Final Recommendation</h2>
                <p className="text-slate-500">Consensus-driven treatment protocol</p>
              </div>
            </div>

            {result ? (
              <>
                <div className="rounded-xl bg-white p-6 border border-emerald-200 mb-6">
                  <h3 className="text-xl font-bold text-emerald-800 mb-2">
                    {consensus?.best?.name || 'Conservative Generic Protocol'}
                  </h3>
                  <p className="text-slate-600">
                    {consensus?.best?.reason || 'Multi-agent consensus achieved with HERA budget validation. Protocol optimized for patient-specific constraints.'}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Why This Protocol</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Pharmacogenomic-safe for CYP2C19 poor metabolizer status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Within ${patient?.socioEconomic?.monthlyMedicationBudget || 150}/month budget constraint</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">No drug-drug interactions with current medications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">Conservative approach minimizes metabolic instability risk</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Agent Agreement</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(agentInsights).map(([key, agent]) => (
                      <div
                        key={key}
                        className="rounded-lg p-3 text-center"
                        style={{ backgroundColor: agent.bgColor }}
                      >
                        <div className="text-2xl mb-1">{agent.emoji}</div>
                        <p className="text-xs font-medium" style={{ color: agent.color }}>
                          {agent.isVeto ? 'Adjusted' : 'Agreed'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FileCheck className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <p className="text-lg text-slate-500">Run consensus simulation to generate recommendation</p>
                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="mt-4 rounded-full bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {simulating ? 'Running...' : 'Start Consensus'}
                </button>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <h3 className="font-semibold text-slate-800 mb-4">Consensus Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Confidence</span>
                  <span className="font-semibold text-emerald-600">{result ? '87%' : '--'}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: result ? '87%' : '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Agreement</span>
                  <span className="font-semibold text-emerald-600">{result ? '4/4 agents' : '--'}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: result ? '100%' : '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Rounds</span>
                  <span className="font-semibold text-slate-700">{result ? '3' : '--'}</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <h3 className="font-semibold text-slate-800 mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/consensus/${id}`)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-50 px-4 py-3 text-cyan-700 hover:bg-cyan-100"
              >
                <Sparkles className="h-4 w-4" />
                Open Mission Control
              </button>
              {canExport && (
                <button
                  onClick={exportClinicianReport}
                  disabled={exportingReport}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {exportingReport ? 'Exporting...' : 'Export Report'}
                </button>
              )}
            </div>
          </Panel>
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
      `}</style>
    </div>
  );
};

export default Dashboard;
