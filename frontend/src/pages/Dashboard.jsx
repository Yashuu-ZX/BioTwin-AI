import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Download,
  FlaskConical,
  HeartPulse,
  Info,
  Microscope,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TrendingDown,
  Upload,
  User,
  Waves,
} from 'lucide-react';
import {
  Bar,
  BarChart,
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

const buildExpertMode = ({ patient, result, whatIfResult }) => {
  const disease = patient?.disease || 'Unknown';
  const biomarkers = patient?.biomarkers || {};
  const vitals = patient?.vitals || {};
  const conditions = patient?.conditions || [];

  if (disease === 'Oncology') {
    return {
      title: 'Oncology Precision Twin',
      subtitle: 'Target fit, resistance pressure, and immune context.',
      metrics: [
        { label: 'Target match', value: clamp((result?.effectiveness || 40) * 0.5 + 35) },
        { label: 'Resistance control', value: clamp(100 - ((result?.risk || 30) * 0.6)) },
      ],
      bullets: [
        `Primary target: ${biomarkers.therapyTarget || 'No target recorded'}`,
        `Genomic driver: ${biomarkers.genomicVariant || 'Not assessed'}`,
        `Immune profile: ${biomarkers.immuneProfile || 'Baseline'}`,
      ],
    };
  }

  if (disease === 'Cardiac') {
    return {
      title: 'Cardiovascular Intervention Twin',
      subtitle: 'Hemodynamic load, reserve, and event containment.',
      metrics: [
        { label: 'Recovery reserve', value: clamp((patient?.metrics?.baselineHealthIndex || 40) * 0.6) },
        { label: 'Pressure control', value: clamp(100 - (((vitals.bpSystolic || 120) - 110) * 1.4)) },
      ],
      bullets: [
        `BP profile: ${vitals.bpSystolic || '--'}/${vitals.bpDiastolic || '--'}`,
        `Symptoms: ${(patient?.symptoms || []).slice(0, 2).join(', ') || 'None logged'}`,
        `Comorbidities: ${conditions.join(', ') || 'None reported'}`,
      ],
    };
  }

  return {
    title: 'Metabolic Regulation Twin',
    subtitle: 'Glycemic control, adaptation, and lifestyle leverage.',
    metrics: [
      { label: 'Adaptation gain', value: clamp(50 + ((whatIfResult?.deltas?.effectivenessChange || 0) * 6)) },
      { label: 'Metabolic control', value: clamp(100 - (((vitals.sugar || 100) - 90) * 0.9)) },
    ],
    bullets: [
      `Fasting glucose: ${vitals.sugar || '--'} mg/dL`,
      `Lifestyle: ${patient?.lifestyle?.exercise || 'Unknown'} activity, ${patient?.lifestyle?.diet || 'Unknown'} diet`,
      `Target axis: ${biomarkers.therapyTarget || 'Broad metabolic care'}`,
    ],
  };
};

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
  const [ehrData, setEhrData] = useState(null);
  const [wearableStatus, setWearableStatus] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);

  const [treatmentPlan, setTreatmentPlan] = useState(defaultTreatmentPlan);
  const [feedbackForm, setFeedbackForm] = useState({ effectiveness: 78, sideEffects: 18, recoveryTime: 20 });
  const [whatIfForm, setWhatIfForm] = useState(defaultWhatIf);

  const deviceId = useMemo(() => `WT-${String(id || '').slice(-6).toUpperCase()}`, [id]);

  const sections = [
    { key: 'overview', label: 'Overview', icon: BrainCircuit },
    { key: 'intake', label: 'Layer 1 Intake', icon: User },
    { key: 'simulation', label: 'Layer 2 Simulation', icon: Stethoscope },
    { key: 'insights', label: 'Layer 3-6 Insights', icon: Microscope },
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
      // API key should be configured on the backend or passed via environment variable
      const apiKey = import.meta.env.VITE_HMS_API_KEY || '';
      const headers = apiKey ? { 'x-api-key': apiKey } : {};
      const response = await apiClient.get(`/external/ehr-data/${id}`, { headers });
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

  const precisionBoard = useMemo(() => {
    const benefit = result?.effectiveness || patient?.metrics?.baselineHealthIndex || 0;
    const safety = 100 - clamp(result?.risk || (patient?.metrics?.riskScore || 0) * 100);
    const recovery = clamp(100 - (parseInt(result?.recoveryTime || '60', 10) / 60) * 100);
    const readiness = clamp((benefit * 0.45) + (safety * 0.35) + (recovery * 0.2));
    return { benefit, safety, recovery, readiness };
  }, [patient, result]);

  const expertMode = useMemo(() => buildExpertMode({ patient, result, whatIfResult }), [patient, result, whatIfResult]);

  const responseBars = useMemo(() => {
    const optimized = result?.recommendation?.comparisons?.find((item) => item.type === result?.recommendation?.best?.name)?.metrics;
    return [
      { label: 'Safety', selected: clamp(100 - (result?.risk || 35)), optimized: clamp(100 - (optimized?.risk || 32)) },
      { label: 'Benefit', selected: clamp(result?.effectiveness || 45), optimized: clamp(optimized?.effectiveness || 55) },
      { label: 'Recovery', selected: clamp(100 - (parseInt(result?.recoveryTime || '40', 10) / 60) * 100), optimized: clamp(100 - (parseInt(optimized?.recoveryTime || '35', 10) / 60) * 100) },
      { label: 'Tolerance', selected: clamp(100 - (result?.sideEffects || 40)), optimized: clamp(100 - (optimized?.sideEffects || 36)) },
    ];
  }, [result]);

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

  const renderOverview = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className={`rounded-[26px] ${currentTheme.accentSoft} p-6`}>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Adaptive twin</p>
          <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">{patient?.name}'s personalized care path</h2>
          <button onClick={() => openSection('simulation')} className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${currentTheme.buttonClass}`}>Open simulation</button>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/70 p-4"><p className="text-slate-500">Readiness</p><p className="mt-1 text-3xl font-semibold">{formatPercent(precisionBoard.readiness)}</p></div>
            <div className="rounded-2xl bg-white/70 p-4"><p className="text-slate-500">Urgency</p><p className="mt-1 text-3xl font-semibold">{prediction?.riskLevel || 'Medium'}</p></div>
          </div>
        </div>
        <div className="space-y-5">
          <Panel className="bg-[#f8f6f0]"><p className="text-sm text-slate-500">Treatment readiness</p><p className="mt-3 text-5xl font-semibold">{formatPercent(precisionBoard.readiness)}</p></Panel>
          <Panel className="bg-[#f8f6f0]"><p className="text-sm text-slate-500">Calibration</p><p className="mt-3 text-5xl font-semibold">{learningState?.modelAccuracy || '--'}%</p></Panel>
          <Panel className="bg-[#eef4f3]">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-2xl font-semibold">Response bars</p><p className="text-sm text-slate-500">Selected vs optimized treatment quality.</p></div>{canSimulate && <button onClick={runSimulation} disabled={simulating} className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${currentTheme.buttonClass}`}>{simulating ? 'Running...' : 'Run twin'}</button>}</div>
            <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={responseBars}><CartesianGrid stroke="#d9ded3" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis hide domain={[0, 100]} /><Tooltip /><Bar dataKey="selected" fill={currentTheme.chartSelected} radius={[14, 14, 14, 14]} /><Bar dataKey="optimized" fill={currentTheme.chartOptimized} radius={[14, 14, 14, 14]} /></BarChart></ResponsiveContainer></div>
          </Panel>
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel>
          <p className="text-sm text-slate-500">Specialist mode</p>
          <h3 className="mt-2 text-3xl font-semibold">{expertMode.title}</h3>
          <p className="mt-2 text-slate-500">{expertMode.subtitle}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">{expertMode.metrics.map((metric) => <div key={metric.label} className="rounded-2xl bg-[#f5f3ee] p-4"><p className="text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-3xl font-semibold">{formatPercent(metric.value)}</p></div>)}</div>
        </Panel>
        <Panel>
          <p className="text-sm text-slate-500">Biomarker translation</p>
          <h3 className="mt-2 text-3xl font-semibold">{patient?.biomarkers?.therapyTarget || 'Broad Standard of Care'}</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-[#f5f3ee] p-4">Variant: <span className="font-semibold text-slate-900">{patient?.biomarkers?.genomicVariant || 'Not assessed'}</span></div>
            <div className="rounded-2xl bg-[#f5f3ee] p-4">Resistance: <span className="font-semibold text-slate-900">{patient?.biomarkers?.resistanceMarker || 'None reported'}</span></div>
          </div>
        </Panel>
      </div>
    </div>
  );

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

  const renderSection = () => {
    switch (activeSection) {
      case 'intake':
        return renderIntake();
      case 'simulation':
        return renderSimulation();
      case 'insights':
        return renderInsights();
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
