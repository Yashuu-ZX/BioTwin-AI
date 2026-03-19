import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Download,
  FileSearch,
  HeartPulse,
  Info,
  Microscope,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Upload,
  User,
  Waves,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import apiClient from '../api/apiClient';

const defaultTreatmentPlan = { type: 'Standard', dosage: 'Medium', duration: 30 };
const defaultWhatIf = { bpSystolic: 120, sugar: 100, spO2: 98, smoking: 'No', exercise: 'Moderate' };

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
// formatPercent is kept for potential future use in metric displays
// eslint-disable-next-line no-unused-vars
const formatPercent = (value) => `${Math.round(clamp(value))}%`;

const sectionThemes = {
  overview: {
    layer: 'Command Layer',
    description: 'High-level precision twin summary, readiness, and specialist snapshot.',
    accentBg: 'bg-lime-100',
    accentText: 'text-lime-700',
    accentSoft: 'bg-[linear-gradient(180deg,#ebff78_0%,#f3ffc1_100%)]',
    accentRing: 'ring-lime-200',
    buttonClass: 'bg-black text-white hover:bg-lime-950',
    chipClass: 'bg-lime-100 text-lime-700',
    chartSelected: '#bde7e0',
    chartOptimized: '#dfff6d',
    chartLine: '#111111',
  },
  intake: {
    layer: 'Layer 1',
    description: 'Patient phenotype, symptoms, vitals, and biomarker intake view.',
    accentBg: 'bg-sky-100',
    accentText: 'text-sky-700',
    accentSoft: 'bg-[linear-gradient(180deg,#dff5ff_0%,#eefbff_100%)]',
    accentRing: 'ring-sky-200',
    buttonClass: 'bg-sky-600 text-white hover:bg-sky-700',
    chipClass: 'bg-sky-100 text-sky-700',
    chartSelected: '#93c5fd',
    chartOptimized: '#38bdf8',
    chartLine: '#0369a1',
  },
  simulation: {
    layer: 'Layer 2',
    description: 'Treatment controls, protocol tuning, and projected disease path.',
    accentBg: 'bg-emerald-100',
    accentText: 'text-emerald-700',
    accentSoft: 'bg-[linear-gradient(180deg,#dcfce7_0%,#effdf4_100%)]',
    accentRing: 'ring-emerald-200',
    buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-700',
    chipClass: 'bg-emerald-100 text-emerald-700',
    chartSelected: '#86efac',
    chartOptimized: '#34d399',
    chartLine: '#047857',
  },
  insights: {
    layer: 'Layers 3-6',
    description: 'Explainability, cohort matching, molecular drivers, and recommendations.',
    accentBg: 'bg-violet-100',
    accentText: 'text-violet-700',
    accentSoft: 'bg-[linear-gradient(180deg,#efe7ff_0%,#f7f1ff_100%)]',
    accentRing: 'ring-violet-200',
    buttonClass: 'bg-violet-600 text-white hover:bg-violet-700',
    chipClass: 'bg-violet-100 text-violet-700',
    chartSelected: '#c4b5fd',
    chartOptimized: '#a78bfa',
    chartLine: '#6d28d9',
  },
  whatif: {
    layer: 'Preventive Lab',
    description: 'Preventive scenario modeling and adaptive response testing.',
    accentBg: 'bg-amber-100',
    accentText: 'text-amber-700',
    accentSoft: 'bg-[linear-gradient(180deg,#fef3c7_0%,#fffbeb_100%)]',
    accentRing: 'ring-amber-200',
    buttonClass: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
    chipClass: 'bg-amber-100 text-amber-700',
    chartSelected: '#fcd34d',
    chartOptimized: '#f59e0b',
    chartLine: '#b45309',
  },
  learning: {
    layer: 'Learning Loop',
    description: 'Outcome evidence feedback and ongoing model calibration.',
    accentBg: 'bg-rose-100',
    accentText: 'text-rose-700',
    accentSoft: 'bg-[linear-gradient(180deg,#ffe4e6_0%,#fff1f2_100%)]',
    accentRing: 'ring-rose-200',
    buttonClass: 'bg-rose-600 text-white hover:bg-rose-700',
    chipClass: 'bg-rose-100 text-rose-700',
    chartSelected: '#fda4af',
    chartOptimized: '#fb7185',
    chartLine: '#be123c',
  },
  connectors: {
    layer: 'Layer 5',
    description: 'EHR, wearable, and operational access to live clinical context.',
    accentBg: 'bg-cyan-100',
    accentText: 'text-cyan-700',
    accentSoft: 'bg-[linear-gradient(180deg,#cffafe_0%,#ecfeff_100%)]',
    accentRing: 'ring-cyan-200',
    buttonClass: 'bg-cyan-600 text-white hover:bg-cyan-700',
    chipClass: 'bg-cyan-100 text-cyan-700',
    chartSelected: '#67e8f9',
    chartOptimized: '#22d3ee',
    chartLine: '#0e7490',
  },
  history: {
    layer: 'Audit Trail',
    description: 'Historical treatment runs, outcomes, and simulation traceability.',
    accentBg: 'bg-slate-200',
    accentText: 'text-slate-700',
    accentSoft: 'bg-[linear-gradient(180deg,#e2e8f0_0%,#f8fafc_100%)]',
    accentRing: 'ring-slate-200',
    buttonClass: 'bg-slate-800 text-white hover:bg-slate-900',
    chipClass: 'bg-slate-200 text-slate-700',
    chartSelected: '#cbd5e1',
    chartOptimized: '#94a3b8',
    chartLine: '#475569',
  },
  alerts: {
    layer: 'Safety Layer',
    description: 'Real-time clinical alerts, deterioration monitoring, and early warning scores.',
    accentBg: 'bg-rose-100',
    accentText: 'text-rose-700',
    accentSoft: 'bg-[linear-gradient(180deg,#ffe4e6_0%,#fff1f2_100%)]',
    accentRing: 'ring-rose-200',
    buttonClass: 'bg-rose-600 text-white hover:bg-rose-700',
    chipClass: 'bg-rose-100 text-rose-700',
    chartSelected: '#fda4af',
    chartOptimized: '#fb7185',
    chartLine: '#be123c',
  },
  trials: {
    layer: 'Research Layer',
    description: 'Clinical trial matching based on patient genomics, biomarkers, and eligibility criteria.',
    accentBg: 'bg-indigo-100',
    accentText: 'text-indigo-700',
    accentSoft: 'bg-[linear-gradient(180deg,#e0e7ff_0%,#eef2ff_100%)]',
    accentRing: 'ring-indigo-200',
    buttonClass: 'bg-indigo-600 text-white hover:bg-indigo-700',
    chipClass: 'bg-indigo-100 text-indigo-700',
    chartSelected: '#a5b4fc',
    chartOptimized: '#818cf8',
    chartLine: '#4f46e5',
  },
};

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

const Dashboard = ({ role = 'doctor' }) => {
  const { id, section } = useParams();
  const navigate = useNavigate();

  const activeSection = section || 'overview';
  const canSimulate = role === 'doctor' || role === 'admin';
  const canManageIntegrations = role === 'doctor' || role === 'admin';
  const canExport = role === 'doctor' || role === 'admin';
  const canSubmitFeedback = role === 'doctor';

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [runningWhatIf, setRunningWhatIf] = useState(false);
  const [syncingWearable, setSyncingWearable] = useState(false);
  const [loadingEhr, setLoadingEhr] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [error, setError] = useState('');

  const [patient, setPatient] = useState(null);
  const [learningState, setLearningState] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [explainability, setExplainability] = useState(null);
  const [cohortData, setCohortData] = useState(null);
  const [drugIntel, setDrugIntel] = useState(null);
  const [result, setResult] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  // ehrData and wearableStatus are fetched for future UI display
  // eslint-disable-next-line no-unused-vars
  const [ehrData, setEhrData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [wearableStatus, setWearableStatus] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [trialsData, setTrialsData] = useState(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingTrials, setLoadingTrials] = useState(false);

  const [treatmentPlan, setTreatmentPlan] = useState(defaultTreatmentPlan);
  const [feedbackForm, setFeedbackForm] = useState({ effectiveness: 78, sideEffects: 18, recoveryTime: 20 });
  const [whatIfForm, setWhatIfForm] = useState(defaultWhatIf);

  const deviceId = useMemo(() => `WT-${String(id || '').slice(-6).toUpperCase()}`, [id]);

  const sections = [
    { key: 'overview', label: 'Overview', icon: BrainCircuit },
    { key: 'intake', label: 'Layer 1 Intake', icon: User },
    { key: 'simulation', label: 'Layer 2 Simulation', icon: Stethoscope },
    { key: 'insights', label: 'Layer 3-6 Insights', icon: Microscope },
    { key: 'alerts', label: 'Clinical Alerts', icon: Bell },
    { key: 'trials', label: 'Trial Matching', icon: FileSearch },
    { key: 'whatif', label: 'What-If Lab', icon: Sparkles },
    { key: 'learning', label: 'Learning', icon: Upload },
    { key: 'connectors', label: 'Connectors', icon: Waves },
    { key: 'history', label: 'History', icon: Clock3 },
  ];

  const currentTheme = sectionThemes[activeSection] || sectionThemes.overview;
  const currentIndex = sections.findIndex((item) => item.key === activeSection);

  const openSection = (key) => navigate(`/dashboard/${id}/${key}`);

  const refreshLearningState = async () => {
    const response = await apiClient.get('/learning/status');
    setLearningState(response.data);
  };

  const refreshSimulationHistory = async () => {
    try {
      const response = await apiClient.get(`/simulate/${id}/history`);
      setSimulationHistory(response.data.history || []);
    } catch {
      setSimulationHistory([]);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [patientRes, learningRes, predictionRes, explainRes] = await Promise.allSettled([
          apiClient.get(`/patient/${id}`),
          apiClient.get('/learning/status'),
          apiClient.get(`/predict/${id}`),
          apiClient.post('/explain/insights', { patientId: id }),
        ]);

        if (patientRes.status !== 'fulfilled') throw patientRes.reason;

        const patientData = patientRes.value.data;
        setPatient(patientData);
        if (learningRes.status === 'fulfilled') setLearningState(learningRes.value.data);
        if (predictionRes.status === 'fulfilled') setPrediction(predictionRes.value.data);
        if (explainRes.status === 'fulfilled') setExplainability(explainRes.value.data);

        const [cohortRes, drugRes] = await Promise.allSettled([
          apiClient.post('/explain/cohort-match', { patientId: id, treatmentPlan }),
          apiClient.post('/explain/drug-intelligence', { patientId: id }),
        ]);

        if (cohortRes.status === 'fulfilled') setCohortData(cohortRes.value.data);
        if (drugRes.status === 'fulfilled') setDrugIntel(drugRes.value.data);

        setWhatIfForm((current) => ({
          ...current,
          bpSystolic: patientData?.vitals?.bpSystolic ?? current.bpSystolic,
          sugar: patientData?.vitals?.sugar ?? current.sugar,
          spO2: patientData?.vitals?.spO2 ?? current.spO2,
          smoking: patientData?.lifestyle?.smoking ?? current.smoking,
          exercise: patientData?.lifestyle?.exercise ?? current.exercise,
        }));

        await refreshSimulationHistory();
      } catch (loadError) {
        console.error(loadError);
        setError('Unable to load the digital twin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // Note: treatmentPlan, refreshSimulationHistory are intentionally excluded - initial load uses defaults,
    // subsequent updates happen via runSimulation to avoid unnecessary re-fetches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runSimulation = async () => {
    setSimulating(true);
    setError('');
    try {
      const response = await apiClient.post('/simulate', { patientId: id, treatmentPlan });
      setResult(response.data);
      setFeedbackForm({
        effectiveness: Math.round(response.data.effectiveness),
        sideEffects: Math.round(response.data.sideEffects),
        recoveryTime: parseInt(response.data.recoveryTime, 10) || 20,
      });

      const [cohortRes, drugRes] = await Promise.allSettled([
        apiClient.post('/explain/cohort-match', { patientId: id, treatmentPlan }),
        apiClient.post('/explain/drug-intelligence', { patientId: id }),
      ]);
      if (cohortRes.status === 'fulfilled') setCohortData(cohortRes.value.data);
      if (drugRes.status === 'fulfilled') setDrugIntel(drugRes.value.data);

      await refreshSimulationHistory();
    } catch (simulationError) {
      console.error(simulationError);
      setError('Simulation failed. Please verify the patient profile and try again.');
    } finally {
      setSimulating(false);
    }
  };

  const submitFeedback = async () => {
    if (!result) return;
    setSubmittingFeedback(true);
    try {
      await apiClient.post('/learning/feedback', {
        patientId: id,
        treatmentUsed: treatmentPlan.type,
        predictedOutcome: { effectiveness: result.effectiveness, risk: result.risk },
        actualOutcome: {
          effectiveness: Number(feedbackForm.effectiveness),
          sideEffects: Number(feedbackForm.sideEffects),
          recoveryTime: `${feedbackForm.recoveryTime} days`,
        },
      });
      await refreshLearningState();
    } catch (feedbackError) {
      console.error(feedbackError);
      setError('Feedback could not be submitted.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const runWhatIf = async () => {
    setRunningWhatIf(true);
    try {
      const response = await apiClient.post('/explain/what-if', {
        patientId: id,
        treatmentPlan,
        modifications: {
          vitals: { bpSystolic: Number(whatIfForm.bpSystolic), sugar: Number(whatIfForm.sugar), spO2: Number(whatIfForm.spO2) },
          lifestyle: { smoking: whatIfForm.smoking, exercise: whatIfForm.exercise },
        },
      });
      setWhatIfResult(response.data);
    } catch (whatIfError) {
      console.error(whatIfError);
      setError('What-if simulation failed.');
    } finally {
      setRunningWhatIf(false);
    }
  };

  const fetchEhr = async () => {
    setLoadingEhr(true);
    try {
      // API key authentication is handled server-side via backend proxy
      // Never expose API keys on the client - the backend validates requests
      const response = await apiClient.get(`/external/ehr-data/${id}`);
      setEhrData(response.data.data);
    } catch (ehrError) {
      console.error(ehrError);
      setError('External EHR sync failed.');
    } finally {
      setLoadingEhr(false);
    }
  };

  const syncWearable = async () => {
    setSyncingWearable(true);
    try {
      const payload = { heartRate: patient?.vitals?.heartRate || 82, spO2: patient?.vitals?.spO2 || 97, steps: 6200, sleepHours: 7.1 };
      await apiClient.post('/external/wearable-stream', { deviceId, metrics: payload });
      const response = await apiClient.get(`/external/wearable-stream/${deviceId}`);
      setWearableStatus(response.data.history?.[0] || null);
    } catch (wearableError) {
      console.error(wearableError);
      setError('Wearable sync failed.');
    } finally {
      setSyncingWearable(false);
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

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      // Generate alerts based on current patient vitals
      const generateResponse = await apiClient.post(`/alerts/generate`, { patientId: id });
      // Then fetch all alerts for the patient
      const alertsResponse = await apiClient.get(`/alerts/${id}`);
      setAlertsData({
        alerts: alertsResponse.data.alerts || [],
        scores: generateResponse.data.scores || {},
        generated: generateResponse.data.alertsGenerated || 0
      });
    } catch (alertsError) {
      console.error(alertsError);
      // Set empty data on error so UI still renders
      setAlertsData({ alerts: [], scores: {}, generated: 0 });
    } finally {
      setLoadingAlerts(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await apiClient.post(`/alerts/acknowledge`, { 
        patientId: id, 
        alertId, 
        acknowledgedBy: role 
      });
      // Refresh alerts after acknowledgment
      await fetchAlerts();
    } catch (ackError) {
      console.error(ackError);
      setError('Failed to acknowledge alert.');
    }
  };

  const fetchTrials = async () => {
    setLoadingTrials(true);
    try {
      const response = await apiClient.post(`/trials/match/${id}`);
      setTrialsData(response.data);
    } catch (trialsError) {
      console.error(trialsError);
      // Set empty data on error so UI still renders
      setTrialsData({ eligibleTrials: [], partialMatches: [], totalTrialsScreened: 0 });
    } finally {
      setLoadingTrials(false);
    }
  };

  const molecularSummary = useMemo(() => (explainability?.featureImportance || []).slice(0, 4), [explainability]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#ecf4e6_0%,#dff1d2_100%)] text-slate-900">
        <div className="space-y-4 text-center">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-lime-500" />
          <p className="text-lg font-semibold">Loading BioTwin layers...</p>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#ecf4e6_0%,#dff1d2_100%)] px-4 text-slate-900">
        <Panel className="max-w-lg text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
          <p className="mb-4 text-lg font-semibold">{error}</p>
          <button onClick={() => navigate('/')} className="rounded-full bg-black px-5 py-3 font-semibold text-white">Back Home</button>
        </Panel>
      </div>
    );
  }

  const renderOverview = () => {
    // Core metrics - only what matters for clinical decisions
    const effectiveness = result?.effectiveness || 0;
    const risk = result?.risk || 0;
    const sideEffects = result?.sideEffects || 0;
    const recoveryTime = result?.recoveryTime || '--';
    const diseaseProgression = result?.diseaseProgression || 'Awaiting simulation';
    
    // Top risk drivers (max 3)
    const topDrivers = (explainability?.featureImportance || []).slice(0, 3);
    
    // Recommendation data
    const recommendation = result?.recommendation;
    const bestTreatment = recommendation?.best;
    const alternatives = recommendation?.alternatives || [];
    const avoid = recommendation?.avoid || [];

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* LEFT PANEL - Patient Summary */}
        <div className="xl:col-span-3">
          <Panel className={`h-full ${currentTheme.accentSoft}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center">
                <User className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{patient?.name}</h2>
                <p className="text-sm text-slate-600">{patient?.disease || 'Unknown'} Case</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Health Index</p>
                <p className="text-3xl font-bold mt-1">{Math.round(patient?.metrics?.baselineHealthIndex || 0)}<span className="text-lg text-slate-400">/100</span></p>
              </div>
              
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Risk Level</p>
                <p className={`text-2xl font-bold mt-1 ${
                  prediction?.riskLevel === 'High' ? 'text-rose-600' : 
                  prediction?.riskLevel === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                }`}>{prediction?.riskLevel || 'Medium'}</p>
              </div>
              
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Key Conditions</p>
                <div className="flex flex-wrap gap-1">
                  {(patient?.conditions || []).slice(0, 3).map((condition) => (
                    <span key={condition} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">{condition}</span>
                  ))}
                  {(!patient?.conditions || patient.conditions.length === 0) && (
                    <span className="text-xs text-slate-500">None reported</span>
                  )}
                </div>
              </div>
            </div>
            
            {canSimulate && (
              <button 
                onClick={runSimulation} 
                disabled={simulating} 
                className={`w-full mt-6 rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-60 ${currentTheme.buttonClass}`}
              >
                {simulating ? 'Running...' : 'Run Simulation'}
              </button>
            )}
          </Panel>
        </div>

        {/* CENTER PANEL - Core Metrics */}
        <div className="xl:col-span-5 space-y-5">
          {/* 5 Core Metrics Grid */}
          <Panel>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Clinical Decision Metrics</p>
                <h3 className="text-2xl font-bold">Treatment Analysis</h3>
              </div>
              {result && (
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  diseaseProgression === 'Improving' ? 'bg-emerald-100 text-emerald-700' :
                  diseaseProgression === 'Worsening' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {diseaseProgression}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Effectiveness */}
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-700">Effectiveness</p>
                </div>
                <p className="text-3xl font-bold text-emerald-700">{result ? `${Math.round(effectiveness)}%` : '--'}</p>
              </div>
              
              {/* Risk */}
              <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <p className="text-xs font-medium text-rose-700">Risk</p>
                </div>
                <p className="text-3xl font-bold text-rose-700">{result ? `${Math.round(risk)}%` : '--'}</p>
              </div>
              
              {/* Side Effects */}
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-medium text-amber-700">Side Effects</p>
                </div>
                <p className="text-3xl font-bold text-amber-700">{result ? `${Math.round(sideEffects)}%` : '--'}</p>
              </div>
              
              {/* Recovery Time */}
              <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock3 className="h-4 w-4 text-sky-600" />
                  <p className="text-xs font-medium text-sky-700">Recovery</p>
                </div>
                <p className="text-2xl font-bold text-sky-700">{recoveryTime}</p>
              </div>
            </div>
          </Panel>

          {/* Outcome Trajectory Graph */}
          <Panel>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Outcome Trajectory</p>
                <h3 className="text-xl font-bold">Projected Disease Path</h3>
              </div>
            </div>
            <div className="h-64 w-full">
              {result?.trajectory ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.trajectory}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '12px'
                      }} 
                    />
                    <Line type="monotone" dataKey="Without Treatment" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="No Treatment" />
                    <Line type="monotone" dataKey="Selected Treatment" stroke="#3b82f6" strokeWidth={3} dot={false} name="Selected" />
                    <Line type="monotone" dataKey="Optimized Treatment" stroke="#10b981" strokeWidth={3} dot={false} name="Optimized" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Run simulation to see trajectory</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* RIGHT PANEL - AI Recommendation (HERO) + Risk Drivers */}
        <div className="xl:col-span-4 space-y-5">
          {/* AI Recommendation - HERO SECTION */}
          <Panel className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-lime-400" />
              <p className="text-sm font-medium text-lime-400 uppercase tracking-wider">AI Recommendation</p>
            </div>
            
            {bestTreatment ? (
              <div className="space-y-4">
                {/* Recommended */}
                <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Recommended</span>
                  </div>
                  <h4 className="text-xl font-bold text-white">{bestTreatment.name} Protocol</h4>
                  <p className="text-sm text-slate-300 mt-1">{bestTreatment.reason}</p>
                </div>
                
                {/* Alternative */}
                {alternatives.length > 0 && (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400 uppercase">Alternative</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{alternatives[0].name} Protocol</p>
                    <p className="text-xs text-slate-400">{alternatives[0].reason}</p>
                  </div>
                )}
                
                {/* Avoid */}
                {avoid.length > 0 && (
                  <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-400 uppercase">Avoid</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{avoid[0].name} Protocol</p>
                    <p className="text-xs text-slate-400">{avoid[0].reason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Run simulation to get AI recommendation</p>
              </div>
            )}
          </Panel>

          {/* Top Risk Drivers - Simplified */}
          <Panel>
            <div className="flex items-center gap-2 mb-4">
              <HeartPulse className="h-5 w-5 text-rose-500" />
              <div>
                <p className="text-sm text-slate-500">Key Risk Drivers</p>
                <h3 className="text-lg font-bold">Top Contributing Factors</h3>
              </div>
            </div>
            
            {topDrivers.length > 0 ? (
              <div className="space-y-3">
                {topDrivers.map((driver, index) => (
                  <div key={driver.feature} className="rounded-xl bg-[#f5f3ee] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">{driver.feature}</span>
                      <span className="text-sm font-bold text-slate-900">{driver.normalizedWeight}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-rose-500' : index === 1 ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${clamp(driver.normalizedWeight)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <p className="text-sm">Run simulation to identify risk drivers</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    );
  };

  const renderIntake = () => (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <Panel className={`${currentTheme.accentRing} ring-1`}><p className="text-sm text-slate-500">Basic profile</p><h3 className="mt-2 text-3xl font-semibold">{patient?.name}</h3><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-[#f5f3ee] p-4">Age<br /><span className="text-2xl font-semibold">{patient?.age}</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">BMI<br /><span className="text-2xl font-semibold">{patient?.profile?.bmi}</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">Gender<br /><span className="font-semibold">{patient?.gender}</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">Disease<br /><span className="font-semibold">{patient?.disease}</span></div></div></Panel>
      <Panel><p className="text-sm text-slate-500">Symptoms</p><div className="mt-4 flex flex-wrap gap-2">{(patient?.symptoms || []).map((item) => <span key={item} className="rounded-full bg-[#f5f3ee] px-4 py-2 text-sm font-semibold text-slate-700">{item}</span>)}</div><p className="mt-6 text-sm text-slate-500">Conditions</p><div className="mt-3 flex flex-wrap gap-2">{(patient?.conditions || []).map((item) => <span key={item} className="rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-lime-700">{item}</span>)}</div></Panel>
      <Panel><p className="text-sm text-slate-500">Vitals + biomarkers</p><div className="mt-4 space-y-3 text-sm text-slate-700"><div className="rounded-2xl bg-[#f5f3ee] p-4">Heart rate: <span className="font-semibold">{patient?.vitals?.heartRate} bpm</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">Blood pressure: <span className="font-semibold">{patient?.vitals?.bpSystolic}/{patient?.vitals?.bpDiastolic}</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">Genomic variant: <span className="font-semibold">{patient?.biomarkers?.genomicVariant || 'Not assessed'}</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">Immune profile: <span className="font-semibold">{patient?.biomarkers?.immuneProfile || 'Baseline'}</span></div></div></Panel>
    </div>
  );

  const renderSimulation = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel className={`${currentTheme.accentRing} ring-1`}>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <p>Simulation controls</p>
          <InfoHint text="This layer configures the treatment plan that will be tested on the virtual patient before a real-world decision is made." />
        </div>
        <h3 className="mt-2 text-3xl font-semibold">Treatment protocol</h3>
        <p className="mt-2 text-sm text-slate-500">Set the treatment type, dose intensity, and time window for the simulation engine.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-500">Protocol type</label>
            <select disabled={!canSimulate} value={treatmentPlan.type} onChange={(event) => setTreatmentPlan({ ...treatmentPlan, type: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4 disabled:opacity-70"><option value="Conservative">Conservative</option><option value="Standard">Standard</option><option value="Aggressive">Aggressive</option></select>
            <p className="mt-2 text-xs text-slate-500">How strongly the treatment is applied to the digital twin.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-500">Dosage level</label>
            <select disabled={!canSimulate} value={treatmentPlan.dosage} onChange={(event) => setTreatmentPlan({ ...treatmentPlan, dosage: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4 disabled:opacity-70"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select>
            <p className="mt-2 text-xs text-slate-500">Relative dose level used for effectiveness and risk estimation.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-500">Duration in days</label>
            <input disabled={!canSimulate} type="number" min="7" max="120" value={treatmentPlan.duration} onChange={(event) => setTreatmentPlan({ ...treatmentPlan, duration: Number(event.target.value) })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4 disabled:opacity-70" />
            <p className="mt-2 text-xs text-slate-500">How long the treatment is modeled before outcome comparison.</p>
          </div>
        </div>
        <button onClick={runSimulation} disabled={simulating || !canSimulate} className={`mt-5 rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${currentTheme.buttonClass}`}>{simulating ? 'Running simulation...' : canSimulate ? 'Run precision twin' : 'Simulation locked'}</button>
      </Panel>
      <Panel>
        <div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Outcome path</p><h3 className="mt-2 text-3xl font-semibold">Projected disease path</h3></div><div className="rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-lime-700">{result?.diseaseProgression || 'Awaiting simulation'}</div></div>
        <div className="mt-5 h-80 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={result?.trajectory || []}><CartesianGrid stroke="#d9ded3" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} /><Tooltip /><Line type="monotone" dataKey="Without Treatment" stroke="#8da19b" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Selected Treatment" stroke={currentTheme.chartSelected} strokeWidth={4} dot={false} /><Line type="monotone" dataKey="Optimized Treatment" stroke={currentTheme.chartLine} strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
      </Panel>
    </div>
  );

  const renderInsights = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Panel className={`${currentTheme.accentSoft}`}><p className="text-sm text-slate-500">AI recommendation</p><h3 className="mt-2 text-3xl font-semibold">{result?.recommendation?.best?.name || 'Pending'}</h3><p className="mt-3 text-slate-600">{result?.recommendation?.best?.reason || 'Run the twin to generate a recommendation.'}</p></Panel>
      <Panel><p className="text-sm text-slate-500">Cohort matching</p><h3 className="mt-2 text-3xl font-semibold">{cohortData?.recommendedCohort?.label || 'Awaiting cohort map'}</h3><div className="mt-4 space-y-3">{(cohortData?.cohorts || []).slice(0, 3).map((cohort) => <div key={cohort.label} className="rounded-2xl bg-[#f5f3ee] p-4 text-sm"><div className="flex items-center justify-between"><span className="font-semibold">{cohort.label}</span><span className="rounded-full bg-lime-100 px-3 py-1 font-semibold text-lime-700">{cohort.similarityScore}%</span></div><div className="mt-2 flex justify-between text-slate-500"><span>Response {cohort.responseRate}%</span><span>Adverse {cohort.adverseEventRate}%</span></div></div>)}</div></Panel>
      <Panel><p className="text-sm text-slate-500">Drug intelligence</p><h3 className="mt-2 text-3xl font-semibold">Interaction overview</h3><div className="mt-4 space-y-3">{(drugIntel?.interactions || []).length ? drugIntel.interactions.slice(0, 3).map((item) => <div key={item.pair} className="rounded-2xl bg-[#f5f3ee] p-4 text-sm"><div className="flex items-center justify-between"><span className="font-semibold">{item.pair}</span><span className="rounded-full bg-[#efe7ff] px-3 py-1 font-semibold text-violet-700">{item.severity}</span></div><p className="mt-2 text-slate-600">{item.action}</p></div>) : <div className="rounded-2xl bg-[#f5f3ee] p-4 text-sm text-slate-500">No major interaction warnings detected.</div>}</div></Panel>
      <Panel className="xl:col-span-3"><p className="text-sm text-slate-500">Molecular signals</p><h3 className="mt-2 text-3xl font-semibold">Top drivers</h3><div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">{molecularSummary.map((factor, index) => <div key={factor.feature} className="rounded-2xl bg-[#f5f3ee] p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold">{factor.feature}</span><span>{factor.normalizedWeight}%</span></div><div className="mt-3 h-2 rounded-full bg-white"><div className={`${index % 2 === 0 ? 'bg-[#caf2d1]' : 'bg-[#e8ff6c]'} h-2 rounded-full`} style={{ width: `${clamp(factor.normalizedWeight)}%` }} /></div></div>)}</div></Panel>
    </div>
  );

  const renderWhatIf = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.7fr]">
      <Panel className={`${currentTheme.accentRing} ring-1`}>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <p>Adaptive what-if simulator</p>
          <InfoHint text="This experiment changes patient variables virtually to show whether prevention or lifestyle changes can improve the predicted treatment result." />
        </div>
        <h3 className="mt-2 text-3xl font-semibold">Scenario rehearsal</h3>
        <p className="mt-2 text-sm text-slate-500">Adjust selected patient values below and compare how the twin reacts before making a real clinical change.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-500">Systolic blood pressure</label><input value={whatIfForm.bpSystolic} onChange={(event) => setWhatIfForm({ ...whatIfForm, bpSystolic: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4" placeholder="e.g. 120" /><p className="mt-2 text-xs text-slate-500">Upper blood pressure value used in cardiovascular stress testing.</p></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-500">Fasting glucose</label><input value={whatIfForm.sugar} onChange={(event) => setWhatIfForm({ ...whatIfForm, sugar: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4" placeholder="e.g. 100" /><p className="mt-2 text-xs text-slate-500">Blood sugar estimate used to model metabolic risk.</p></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-500">SpO2 oxygen saturation</label><input value={whatIfForm.spO2} onChange={(event) => setWhatIfForm({ ...whatIfForm, spO2: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4" placeholder="e.g. 98" /><p className="mt-2 text-xs text-slate-500">Oxygen saturation used to estimate respiratory resilience.</p></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-500">Smoking status</label><select value={whatIfForm.smoking} onChange={(event) => setWhatIfForm({ ...whatIfForm, smoking: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4"><option>No</option><option>Past</option><option>Yes</option></select><p className="mt-2 text-xs text-slate-500">Lifestyle factor that changes cardio-respiratory treatment tolerance.</p></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-500">Exercise frequency</label><select value={whatIfForm.exercise} onChange={(event) => setWhatIfForm({ ...whatIfForm, exercise: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4"><option>None</option><option>Rarely</option><option>Moderate</option><option>Active</option></select><p className="mt-2 text-xs text-slate-500">Activity level used to test preventive improvement potential.</p></div>
        </div>
        <button onClick={runWhatIf} disabled={runningWhatIf} className={`mt-5 rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${currentTheme.buttonClass}`}>{runningWhatIf ? 'Simulating...' : 'Run what-if'}</button>
      </Panel>
      <Panel><p className="text-sm text-slate-500">Scenario result</p><h3 className="mt-2 text-3xl font-semibold">Delta response</h3><div className="mt-5 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-[#f5f3ee] p-4"><p className="text-sm text-slate-500">Effectiveness</p><p className="mt-2 text-4xl font-semibold">{whatIfResult ? `${whatIfResult.deltas.effectivenessChange >= 0 ? '+' : ''}${whatIfResult.deltas.effectivenessChange}` : '--'}</p></div><div className="rounded-2xl bg-[#f5f3ee] p-4"><p className="text-sm text-slate-500">Risk</p><p className="mt-2 text-4xl font-semibold">{whatIfResult ? `${whatIfResult.deltas.riskChange >= 0 ? '+' : ''}${whatIfResult.deltas.riskChange}` : '--'}</p></div></div></Panel>
    </div>
  );

  const renderLearning = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel className={`${currentTheme.accentRing} ring-1`}><div className="flex items-center gap-2 text-sm text-slate-500"><p>Feedback learning</p><InfoHint text="This layer sends real outcomes back into the system so the model can learn from prediction errors and improve future simulations." /></div><h3 className="mt-2 text-3xl font-semibold">Outcome evidence</h3><p className="mt-2 text-sm text-slate-500">Record what happened after treatment to calibrate the learning loop using real-world evidence.</p><div className="mt-5 grid grid-cols-2 gap-4"><div><label className="mb-2 block text-sm font-medium text-slate-500">Observed effectiveness</label><input disabled={!canSubmitFeedback} value={feedbackForm.effectiveness} onChange={(event) => setFeedbackForm({ ...feedbackForm, effectiveness: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4 disabled:opacity-70" /><p className="mt-2 text-xs text-slate-500">How effective the treatment was in reality, on a 0-100 scale.</p></div><div><label className="mb-2 block text-sm font-medium text-slate-500">Observed side effects</label><input disabled={!canSubmitFeedback} value={feedbackForm.sideEffects} onChange={(event) => setFeedbackForm({ ...feedbackForm, sideEffects: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4 disabled:opacity-70" /><p className="mt-2 text-xs text-slate-500">Estimated burden of side effects after real treatment use.</p></div><div className="col-span-2"><label className="mb-2 block text-sm font-medium text-slate-500">Recovery time in days</label><input disabled={!canSubmitFeedback} value={feedbackForm.recoveryTime} onChange={(event) => setFeedbackForm({ ...feedbackForm, recoveryTime: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-[#f5f3ee] px-4 py-4 disabled:opacity-70" /><p className="mt-2 text-xs text-slate-500">How long recovery or stabilization took after care was delivered.</p></div></div><button onClick={submitFeedback} disabled={!canSubmitFeedback || submittingFeedback || !result} className={`mt-5 rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${currentTheme.buttonClass}`}>{canSubmitFeedback ? (submittingFeedback ? 'Updating...' : 'Submit evidence') : 'Doctor only'}</button></Panel>
      <Panel><p className="text-sm text-slate-500">Learning state</p><h3 className="mt-2 text-3xl font-semibold">Calibration status</h3><div className="mt-5 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-[#f5f3ee] p-4"><p className="text-sm text-slate-500">Accuracy</p><p className="mt-2 text-4xl font-semibold">{learningState?.modelAccuracy || '--'}%</p></div><div className="rounded-2xl bg-[#f5f3ee] p-4"><p className="text-sm text-slate-500">Feedback</p><p className="mt-2 text-4xl font-semibold">{learningState?.totalFeedbackProcessed || 0}</p></div></div><div className="mt-4 rounded-2xl bg-[#f5f3ee] p-4 text-slate-600">{learningState?.learningStatus || 'Active'} with ongoing protocol adjustment from real-world evidence.</div></Panel>
    </div>
  );

  const renderConnectors = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Panel className={`${currentTheme.accentRing} ring-1`}><div className="flex items-center gap-2 text-sm text-slate-500"><p>Clinical connectors</p><InfoHint text="This layer connects the digital twin with external systems like hospital records and wearables to keep the patient model updated." /></div><h3 className="mt-2 text-3xl font-semibold">Live context</h3><p className="mt-2 text-sm text-slate-500">Sync external records and streaming physiology so the twin reflects current patient context.</p><div className="mt-5 space-y-4"><button onClick={fetchEhr} disabled={loadingEhr || !canManageIntegrations} className="flex w-full items-center justify-between rounded-2xl bg-[#f5f3ee] px-5 py-5 text-left disabled:opacity-60"><span><span className="block text-2xl font-semibold">EHR bridge</span><span className="text-sm text-slate-500">Pull visit history, diagnoses, and coded records from the mock EHR source.</span></span><span className={`rounded-full ${currentTheme.chipClass} px-4 py-2 text-sm font-semibold`}>{loadingEhr ? '...' : 'Sync'}</span></button><button onClick={syncWearable} disabled={syncingWearable || !canManageIntegrations} className="flex w-full items-center justify-between rounded-2xl bg-[#f5f3ee] px-5 py-5 text-left disabled:opacity-60"><span><span className="block text-2xl font-semibold">Wearable telemetry</span><span className="text-sm text-slate-500">Send live vital updates like heart rate and oxygen saturation into the twin.</span></span><span className={`rounded-full ${currentTheme.chipClass} px-4 py-2 text-sm font-semibold`}>{syncingWearable ? '...' : 'Send'}</span></button></div></Panel>
      <Panel><p className="text-sm text-slate-500">Role access</p><h3 className="mt-2 text-3xl font-semibold capitalize">{role} view</h3><div className="mt-5 space-y-3 text-sm text-slate-600"><div className="rounded-2xl bg-[#f5f3ee] p-4">Simulation: <span className="font-semibold text-slate-900">{canSimulate ? 'Enabled' : 'Locked'}</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">Feedback: <span className="font-semibold text-slate-900">{canSubmitFeedback ? 'Enabled' : 'Locked'}</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">Connectors: <span className="font-semibold text-slate-900">{canManageIntegrations ? 'Enabled' : 'Hidden'}</span></div><div className="rounded-2xl bg-[#f5f3ee] p-4">Report export: <span className="font-semibold text-slate-900">{canExport ? 'Enabled' : 'Hidden'}</span></div></div></Panel>
    </div>
  );

  const renderHistory = () => (
    <Panel><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Simulation ledger</p><h3 className="mt-2 text-3xl font-semibold">Recent hypotheses</h3></div><div className="rounded-full bg-[#f5f3ee] px-4 py-2 text-sm font-semibold text-slate-600">{simulationHistory.length} run(s)</div></div><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{simulationHistory.length ? simulationHistory.map((item, index) => <div key={`${item.timestamp}-${index}`} className="rounded-[26px] bg-[#f5f3ee] p-5"><div className="flex items-center justify-between"><div><p className="text-lg font-semibold">{item.treatmentPlan.type}</p><p className="text-sm text-slate-500">{item.treatmentPlan.dosage} dosage</p></div><Clock3 className="h-4 w-4 text-slate-400" /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-slate-500">Effectiveness</p><p className="mt-1 font-semibold">{item.effectiveness}%</p></div><div><p className="text-slate-500">Risk</p><p className="mt-1 font-semibold">{item.risk}%</p></div><div><p className="text-slate-500">Recovery</p><p className="mt-1 font-semibold">{item.recoveryTime}</p></div><div><p className="text-slate-500">State</p><p className="mt-1 font-semibold">{item.diseaseProgression}</p></div></div></div>) : <div className="rounded-[26px] bg-[#f5f3ee] p-5 text-sm text-slate-500">No simulations recorded yet.</div>}</div></Panel>
  );

  const renderAlerts = () => {
    const alerts = alertsData?.alerts || [];
    const scores = alertsData?.scores || {};
    const activeAlerts = alerts.filter(a => a.status === 'active');
    const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.8fr]">
        {/* Left - Alert List */}
        <Panel className={`${currentTheme.accentRing} ring-1`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <p>Patient Safety Monitoring</p>
                <InfoHint text="Real-time clinical alerts based on vital signs, early warning scores (NEWS2, qSOFA), and deterioration risk." />
              </div>
              <h3 className="mt-2 text-3xl font-semibold">Active Alerts</h3>
            </div>
            <button 
              onClick={fetchAlerts} 
              disabled={loadingAlerts}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${currentTheme.buttonClass}`}
            >
              {loadingAlerts ? 'Loading...' : 'Refresh Alerts'}
            </button>
          </div>
          
          {activeAlerts.length === 0 && !loadingAlerts && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
              <p className="text-emerald-700 font-semibold">No Active Alerts</p>
              <p className="text-sm text-emerald-600 mt-1">Patient vitals are within normal parameters.</p>
            </div>
          )}
          
          <div className="space-y-3 mt-4">
            {activeAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`rounded-2xl p-4 border ${
                  alert.severity === 'critical' ? 'bg-rose-50 border-rose-200' :
                  alert.severity === 'high' ? 'bg-amber-50 border-amber-200' :
                  'bg-sky-50 border-sky-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-full ${
                      alert.severity === 'critical' ? 'bg-rose-100' :
                      alert.severity === 'high' ? 'bg-amber-100' : 'bg-sky-100'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'critical' ? 'text-rose-600' :
                        alert.severity === 'high' ? 'text-amber-600' : 'text-sky-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{alert.type.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      alert.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                      alert.severity === 'high' ? 'bg-amber-100 text-amber-700' :
                      'bg-sky-100 text-sky-700'
                    }`}>
                      {alert.severity}
                    </span>
                    {canSimulate && (
                      <button 
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs text-slate-500 hover:text-slate-700 underline"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {acknowledgedAlerts.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-slate-500 mb-3">Recently Acknowledged ({acknowledgedAlerts.length})</p>
              <div className="space-y-2">
                {acknowledgedAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="rounded-xl bg-slate-100 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{alert.type.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-400">Ack by {alert.acknowledgedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Right - Early Warning Scores */}
        <Panel>
          <p className="text-sm text-slate-500">Early Warning Scores</p>
          <h3 className="mt-2 text-3xl font-semibold">Clinical Indices</h3>
          
          <div className="mt-5 space-y-4">
            {/* NEWS2 Score */}
            <div className="rounded-2xl bg-[#f5f3ee] p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-500">NEWS2 Score</p>
                  <p className="text-sm text-slate-400">National Early Warning Score</p>
                </div>
                <div className={`text-4xl font-bold ${
                  (scores.news2?.total || 0) >= 7 ? 'text-rose-600' :
                  (scores.news2?.total || 0) >= 5 ? 'text-amber-600' :
                  (scores.news2?.total || 0) >= 1 ? 'text-sky-600' : 'text-emerald-600'
                }`}>
                  {scores.news2?.total ?? '--'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex-1 h-2 rounded-full ${
                  (scores.news2?.total || 0) >= 7 ? 'bg-rose-200' :
                  (scores.news2?.total || 0) >= 5 ? 'bg-amber-200' :
                  (scores.news2?.total || 0) >= 1 ? 'bg-sky-200' : 'bg-emerald-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      (scores.news2?.total || 0) >= 7 ? 'bg-rose-500' :
                      (scores.news2?.total || 0) >= 5 ? 'bg-amber-500' :
                      (scores.news2?.total || 0) >= 1 ? 'bg-sky-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ((scores.news2?.total || 0) / 20) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">/20</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {(scores.news2?.total || 0) >= 7 ? 'Critical - Immediate escalation required' :
                 (scores.news2?.total || 0) >= 5 ? 'High - Urgent response needed' :
                 (scores.news2?.total || 0) >= 1 ? 'Low-Medium - Monitor closely' : 'Normal parameters'}
              </p>
            </div>

            {/* qSOFA Score */}
            <div className="rounded-2xl bg-[#f5f3ee] p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-500">qSOFA Score</p>
                  <p className="text-sm text-slate-400">Quick Sepsis Assessment</p>
                </div>
                <div className={`text-4xl font-bold ${
                  (scores.qsofa?.total || 0) >= 2 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {scores.qsofa?.total ?? '--'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className={`rounded-xl p-2 text-center text-xs ${
                  scores.qsofa?.components?.alteredMentation ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  Mental Status
                </div>
                <div className={`rounded-xl p-2 text-center text-xs ${
                  scores.qsofa?.components?.lowBP ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  Low BP
                </div>
                <div className={`rounded-xl p-2 text-center text-xs ${
                  scores.qsofa?.components?.highRR ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  High RR
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {(scores.qsofa?.total || 0) >= 2 ? 'Sepsis risk - Consider further assessment' : 'Low sepsis risk'}
              </p>
            </div>

            {/* Current Vitals Summary */}
            <div className="rounded-2xl bg-[#f5f3ee] p-5">
              <p className="text-sm text-slate-500 mb-3">Current Vitals</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Heart Rate</span>
                  <span className="font-semibold">{patient?.vitals?.heartRate || '--'} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SpO2</span>
                  <span className="font-semibold">{patient?.vitals?.spO2 || '--'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">BP</span>
                  <span className="font-semibold">{patient?.vitals?.bpSystolic || '--'}/{patient?.vitals?.bpDiastolic || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Temp</span>
                  <span className="font-semibold">{patient?.vitals?.temperature || '--'}°F</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    );
  };

  const renderTrials = () => {
    const eligibleTrials = trialsData?.eligibleTrials || [];
    const partialMatches = trialsData?.partialMatches || [];
    const totalScreened = trialsData?.totalTrialsScreened || 0;

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left - Trial Matches */}
        <Panel className={`${currentTheme.accentRing} ring-1`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <p>Clinical Trial Matching</p>
                <InfoHint text="Matches patient to eligible clinical trials based on disease, genomic markers, biomarkers, and demographics." />
              </div>
              <h3 className="mt-2 text-3xl font-semibold">Eligible Trials</h3>
            </div>
            <button 
              onClick={fetchTrials} 
              disabled={loadingTrials}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${currentTheme.buttonClass}`}
            >
              {loadingTrials ? 'Matching...' : 'Find Trials'}
            </button>
          </div>

          {trialsData && (
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                {eligibleTrials.length} Eligible
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                {partialMatches.length} Partial
              </span>
              <span className="text-sm text-slate-500">
                of {totalScreened} screened
              </span>
            </div>
          )}

          {eligibleTrials.length === 0 && !loadingTrials && trialsData && (
            <div className="rounded-2xl bg-slate-100 p-6 text-center">
              <FileSearch className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <p className="text-slate-600 font-semibold">No Fully Eligible Trials</p>
              <p className="text-sm text-slate-500 mt-1">Check partial matches below or update patient genomics.</p>
            </div>
          )}

          {!trialsData && !loadingTrials && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-6 text-center">
              <FileSearch className="mx-auto h-10 w-10 text-indigo-400 mb-3" />
              <p className="text-indigo-700 font-semibold">Click "Find Trials" to Match</p>
              <p className="text-sm text-indigo-600 mt-1">We'll search available clinical trials for this patient.</p>
            </div>
          )}

          <div className="space-y-4 mt-4">
            {eligibleTrials.map((trial) => (
              <div key={trial.nctId} className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{trial.nctId}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-semibold">{trial.phase}</span>
                      <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded">{trial.status}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 leading-tight">{trial.title}</h4>
                    <p className="text-sm text-slate-600 mt-2">{trial.summary}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {trial.interventions?.slice(0, 3).map((intervention) => (
                        <span key={intervention} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                          {intervention}
                        </span>
                      ))}
                    </div>
                    
                    {trial.matchReasons && (
                      <div className="mt-3 text-xs text-emerald-600">
                        <strong>Match reasons:</strong> {trial.matchReasons.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-indigo-600">{trial.matchScore}</div>
                    <div className="text-xs text-slate-500">match score</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Sponsor: {trial.sponsor}</span>
                  <a 
                    href={trial.clinicalTrialsGovUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    View on ClinicalTrials.gov
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Partial Matches */}
          {partialMatches.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-slate-500 mb-3">Partial Matches (may require additional criteria)</p>
              <div className="space-y-3">
                {partialMatches.map((trial) => (
                  <div key={trial.nctId} className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-1 rounded">{trial.nctId}</span>
                        <p className="font-semibold text-slate-800 mt-2 text-sm">{trial.title}</p>
                        {trial.missingCriteria && (
                          <p className="text-xs text-amber-600 mt-2">
                            <strong>Missing:</strong> {trial.missingCriteria.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-lg font-bold text-amber-600">{trial.matchScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Right - Patient Eligibility Profile */}
        <Panel>
          <p className="text-sm text-slate-500">Eligibility Profile</p>
          <h3 className="mt-2 text-3xl font-semibold">Patient Criteria</h3>
          
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-[#f5f3ee] p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Demographics</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Age</span>
                  <span className="font-semibold">{patient?.age || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender</span>
                  <span className="font-semibold">{patient?.gender || '--'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f5f3ee] p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Disease & Conditions</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Primary Disease</span>
                  <span className="font-semibold">{patient?.disease || '--'}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(patient?.conditions || []).map((condition) => (
                    <span key={condition} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">{condition}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f5f3ee] p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Genomic Markers</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Variant</span>
                  <span className="font-semibold text-right max-w-[60%] truncate">{patient?.biomarkers?.genomicVariant || 'Not assessed'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MSI Status</span>
                  <span className="font-semibold">{patient?.biomarkers?.genomics?.microsatelliteStatus || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">HER2</span>
                  <span className="font-semibold">{patient?.biomarkers?.genomics?.herStatus || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f5f3ee] p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Current Medications</p>
              <div className="space-y-1">
                {(patient?.medications || []).slice(0, 4).map((med, idx) => (
                  <div key={idx} className="text-sm flex justify-between">
                    <span className="text-slate-600">{med.name || 'Unknown'}</span>
                    <span className="text-slate-400">{med.dosage}</span>
                  </div>
                ))}
                {(!patient?.medications || patient.medications.length === 0) && (
                  <p className="text-sm text-slate-500">No medications recorded</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4">
              <p className="text-sm text-indigo-600">
                <strong>Tip:</strong> Add genomic markers and biomarkers in the Patient Form (Step 7) to improve trial matching accuracy.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'intake':
        return renderIntake();
      case 'simulation':
        return renderSimulation();
      case 'insights':
        return renderInsights();
      case 'alerts':
        return renderAlerts();
      case 'trials':
        return renderTrials();
      case 'whatif':
        return renderWhatIf();
      case 'learning':
        return renderLearning();
      case 'connectors':
        return renderConnectors();
      case 'history':
        return renderHistory();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ecf4e6_0%,#dff1d2_100%)] p-4 text-slate-900 md:p-6">
      <div className="mx-auto flex max-w-[1500px] gap-4 rounded-[38px] border border-white/60 bg-[#f5f3ee]/90 p-4 shadow-[0_24px_80px_rgba(80,110,88,0.12)] md:p-6">
        <div className="hidden w-[260px] shrink-0 flex-col rounded-[28px] bg-white/70 p-4 md:flex">
          <div className="mb-5 flex items-center gap-3 rounded-[22px] bg-lime-100 px-4 py-4">
            <BrainCircuit className="h-5 w-5 text-lime-700" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-lime-700">BioTwin</p>
              <p className="font-semibold">Layer Navigator</p>
            </div>
          </div>
          <div className="space-y-2">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = item.key === activeSection;
              return (
                <button key={item.key} onClick={() => openSection(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${active ? 'bg-black text-white' : 'bg-transparent text-slate-600 hover:bg-lime-100'}`}>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? `${currentTheme.accentBg} ${currentTheme.accentText}` : 'bg-[#f5f3ee] text-slate-500'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto pt-4">
            <button onClick={() => navigate('/')} className="flex w-full items-center gap-3 rounded-2xl bg-[#f5f3ee] px-4 py-3 text-slate-600 hover:bg-white">
              <ArrowLeft className="h-4 w-4" /> Back Home
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className={`mb-2 inline-flex items-center gap-2 rounded-full ${currentTheme.accentBg} px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] ${currentTheme.accentText}`}>
                <Sparkles className="h-3.5 w-3.5" /> BioTwin Overview
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{sections.find((item) => item.key === activeSection)?.label || 'Overview'}</h1>
              <p className="mt-2 text-slate-500">Navigate layer by layer through intake, simulation, explainability, learning, and connectors.</p>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">{currentTheme.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-white px-3 py-1 font-medium">BioTwin</span>
                <span>/</span>
                <span className={`rounded-full ${currentTheme.accentBg} px-3 py-1 font-medium ${currentTheme.accentText}`}>{currentTheme.layer}</span>
                <span>/</span>
                <span className="font-semibold text-slate-700">{sections.find((item) => item.key === activeSection)?.label || 'Overview'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 shadow-sm"><Search className="h-4 w-4 text-slate-400" /><span className="text-sm text-slate-400">Search anything...</span></div>
              <div className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white"><User className="h-4 w-4" /> {role}</div>
              {canExport && <button onClick={exportClinicianReport} disabled={exportingReport} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm disabled:opacity-60"><Download className="h-4 w-4" /> {exportingReport ? 'Exporting...' : 'Export report'}</button>}
            </div>
          </div>

          <div className="flex gap-2 overflow-auto pb-1 md:hidden">
            {sections.map((item) => (
              <button key={item.key} onClick={() => openSection(item.key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${item.key === activeSection ? 'bg-black text-white' : 'bg-white text-slate-600'}`}>
                {item.label}
              </button>
            ))}
          </div>

          <Panel className="bg-white/65 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Layer progress</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">Section {currentIndex + 1} of {sections.length}</p>
              </div>
              <div className="grid flex-1 grid-cols-4 gap-2 md:grid-cols-8">
                {sections.map((item, index) => (
                  <button
                    key={item.key}
                    onClick={() => openSection(item.key)}
                    className={`h-3 rounded-full transition-all ${index < currentIndex ? 'bg-slate-900' : index === currentIndex ? 'bg-lime-400' : 'bg-slate-200 hover:bg-slate-300'}`}
                    title={item.label}
                  />
                ))}
              </div>
            </div>
          </Panel>

          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className={`rounded-[32px] bg-white/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:p-3 ${currentTheme.accentRing} ring-1`}>
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
