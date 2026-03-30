import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Bell,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Download,
  FileSearch,
  Home,
  Info,
  Search,
  Sparkles,
  User,
  LayoutDashboard,
  Layers,
  FlaskConical,
  Lightbulb,
  History,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import MultiSpecialistConsensus from '../components/MultiSpecialistConsensus';
import PatientProfilePanel from '../components/PatientProfilePanel';
import OutcomeTrajectoryChart from '../components/OutcomeTrajectoryChart';

const defaultTreatmentPlan = { type: 'Standard', dosage: 'Medium', duration: 30 };
const defaultWhatIf = { bpSystolic: 120, sugar: 100, spO2: 98, smoking: 'No', exercise: 'Moderate' };

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

const sectionThemes = {
  overview: {
    layer: 'Multi-Agent Consensus',
    description: 'Clinical specialists + HERA constraint agent deliberate for personalized, viable treatment.',
    accentBg: 'bg-emerald-100',
    accentText: 'text-emerald-700',
    accentSoft: 'bg-[linear-gradient(180deg,#dcfce7_0%,#f0fdf4_100%)]',
    accentRing: 'ring-emerald-200',
    buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-700',
    chipClass: 'bg-emerald-100 text-emerald-700',
  },
  intake: {
    layer: 'Patient Intake',
    description: 'Patient phenotype, symptoms, vitals, biomarkers, and socio-economic profile.',
    accentBg: 'bg-sky-100',
    accentText: 'text-sky-700',
    accentSoft: 'bg-[linear-gradient(180deg,#dff5ff_0%,#eefbff_100%)]',
    accentRing: 'ring-sky-200',
    buttonClass: 'bg-sky-600 text-white hover:bg-sky-700',
    chipClass: 'bg-sky-100 text-sky-700',
  },
  insights: {
    layer: 'Insights',
    description: 'Cohort matching, drug intelligence, and key contributing factors.',
    accentBg: 'bg-violet-100',
    accentText: 'text-violet-700',
    accentSoft: 'bg-[linear-gradient(180deg,#efe7ff_0%,#f7f1ff_100%)]',
    accentRing: 'ring-violet-200',
    buttonClass: 'bg-violet-600 text-white hover:bg-violet-700',
    chipClass: 'bg-violet-100 text-violet-700',
  },
  alerts: {
    layer: 'Alerts',
    description: 'Real-time clinical alerts, deterioration monitoring, and early warning scores.',
    accentBg: 'bg-rose-100',
    accentText: 'text-rose-700',
    accentSoft: 'bg-[linear-gradient(180deg,#ffe4e6_0%,#fff1f2_100%)]',
    accentRing: 'ring-rose-200',
    buttonClass: 'bg-rose-600 text-white hover:bg-rose-700',
    chipClass: 'bg-rose-100 text-rose-700',
  },
  trials: {
    layer: 'Trial Matching',
    description: 'Clinical trial matching based on patient genomics, biomarkers, and eligibility.',
    accentBg: 'bg-indigo-100',
    accentText: 'text-indigo-700',
    accentSoft: 'bg-[linear-gradient(180deg,#e0e7ff_0%,#eef2ff_100%)]',
    accentRing: 'ring-indigo-200',
    buttonClass: 'bg-indigo-600 text-white hover:bg-indigo-700',
    chipClass: 'bg-indigo-100 text-indigo-700',
  },
  whatif: {
    layer: 'What-If Lab',
    description: 'Preventive scenario modeling and adaptive response testing.',
    accentBg: 'bg-amber-100',
    accentText: 'text-amber-700',
    accentSoft: 'bg-[linear-gradient(180deg,#fef3c7_0%,#fffbeb_100%)]',
    accentRing: 'ring-amber-200',
    buttonClass: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
    chipClass: 'bg-amber-100 text-amber-700',
  },
  history: {
    layer: 'History',
    description: 'Historical simulation runs, outcomes, and traceability.',
    accentBg: 'bg-slate-200',
    accentText: 'text-slate-700',
    accentSoft: 'bg-[linear-gradient(180deg,#e2e8f0_0%,#f8fafc_100%)]',
    accentRing: 'ring-slate-200',
    buttonClass: 'bg-slate-800 text-white hover:bg-slate-900',
    chipClass: 'bg-slate-200 text-slate-700',
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
  const canExport = role === 'doctor' || role === 'admin';

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [runningWhatIf, setRunningWhatIf] = useState(false);
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
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [trialsData, setTrialsData] = useState(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingTrials, setLoadingTrials] = useState(false);

  const [treatmentPlan, setTreatmentPlan] = useState(defaultTreatmentPlan);
  const [whatIfForm, setWhatIfForm] = useState(defaultWhatIf);

  // Updated navigation sections matching the new design - STREAMLINED for hackathon
  const sections = [
    { key: 'overview', label: 'Consensus Builder', icon: LayoutDashboard },
    { key: 'navigator', label: 'Layer Navigator', icon: Layers, divider: true },
    { key: 'intake', label: 'Patient Intake', icon: User },
    { key: 'insights', label: 'Insights', icon: Lightbulb },
    { key: 'alerts', label: 'Alerts', icon: Bell },
    { key: 'trials', label: 'Trial Matching', icon: FileSearch },
    { key: 'whatif', label: 'What-If Lab', icon: FlaskConical },
    { key: 'history', label: 'History', icon: History },
  ];

  const currentTheme = sectionThemes[activeSection] || sectionThemes.overview;

  const openSection = (key) => {
    if (key === 'navigator') return; // Navigator is just a label
    navigate(`/dashboard/${id}/${key}`);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

      await refreshSimulationHistory();
    } catch (simulationError) {
      console.error(simulationError);
      setError('Simulation failed. Please verify the patient profile and try again.');
    } finally {
      setSimulating(false);
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
      const generateResponse = await apiClient.post(`/alerts/generate`, { patientId: id });
      const alertsResponse = await apiClient.get(`/alerts/${id}`);
      setAlertsData({
        alerts: alertsResponse.data.alerts || [],
        scores: generateResponse.data.scores || {},
        generated: generateResponse.data.alertsGenerated || 0
      });
    } catch (alertsError) {
      console.error(alertsError);
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
      setTrialsData({ eligibleTrials: [], partialMatches: [], totalTrialsScreened: 0 });
    } finally {
      setLoadingTrials(false);
    }
  };

  const molecularSummary = useMemo(() => (explainability?.featureImportance || []).slice(0, 4), [explainability]);

  // Generate trajectory data for the consensus chart
  const generateConsensusTrajectory = () => {
    if (!result?.trajectory) return null;
    return result.trajectory.map(point => ({
      day: point.day,
      'Baseline (Pre-Consensus)': point['Without Treatment'] || point.baseline || 50,
      'Multi-Agent Consensus Protocol': point['Optimized Treatment'] || point.optimized || 70,
    }));
  };

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
          <button onClick={() => navigate('/')} className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">Back Home</button>
        </Panel>
      </div>
    );
  }

  // NEW: Overview section with Multi-Specialist Consensus Builder
  const renderOverview = () => {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT - Patient Profile Panel (Simplified, no numerical metrics) */}
        <div className="xl:col-span-3">
          <PatientProfilePanel patient={patient} />
        </div>

        {/* CENTER - Multi-Specialist Consensus Builder */}
        <div className="xl:col-span-6">
          <Panel className="h-full">
            <MultiSpecialistConsensus
              patient={patient}
              simulationResult={result}
              drugIntel={drugIntel}
              isSimulating={simulating}
              onRunSimulation={runSimulation}
              canSimulate={canSimulate}
            />
          </Panel>
        </div>

        {/* RIGHT - Outcome Trajectory Chart */}
        <div className="xl:col-span-3">
          <OutcomeTrajectoryChart
            trajectory={generateConsensusTrajectory()}
            hasConsensus={!!result}
          />
        </div>
      </div>
    );
  };

  const renderIntake = () => (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <Panel className={`${currentTheme.accentRing} ring-1`}>
        <p className="text-sm text-slate-500">Basic profile</p>
        <h3 className="mt-2 text-3xl font-semibold">{patient?.name}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-4">Age<br /><span className="text-2xl font-semibold">{patient?.age}</span></div>
          <div className="rounded-2xl bg-slate-50 p-4">BMI<br /><span className="text-2xl font-semibold">{patient?.profile?.bmi}</span></div>
          <div className="rounded-2xl bg-slate-50 p-4">Gender<br /><span className="font-semibold">{patient?.gender}</span></div>
          <div className="rounded-2xl bg-slate-50 p-4">Disease<br /><span className="font-semibold">{patient?.disease}</span></div>
        </div>
      </Panel>
      <Panel>
        <p className="text-sm text-slate-500">Symptoms</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(patient?.symptoms || []).map((item) => (
            <span key={item} className="rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">{item}</span>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">Conditions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(patient?.conditions || []).map((item) => (
            <span key={item} className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">{item}</span>
          ))}
        </div>
      </Panel>
      <Panel>
        <p className="text-sm text-slate-500">Vitals + biomarkers</p>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <div className="rounded-2xl bg-slate-50 p-4">Heart rate: <span className="font-semibold">{patient?.vitals?.heartRate} bpm</span></div>
          <div className="rounded-2xl bg-slate-50 p-4">Blood pressure: <span className="font-semibold">{patient?.vitals?.bpSystolic}/{patient?.vitals?.bpDiastolic}</span></div>
          <div className="rounded-2xl bg-slate-50 p-4">Genomic variant: <span className="font-semibold">{patient?.biomarkers?.genomicVariant || 'Not assessed'}</span></div>
          <div className="rounded-2xl bg-slate-50 p-4">Pharmacogenomics: <span className="font-semibold">{patient?.biomarkers?.pharmacogenomics?.cyp2c19 || 'Not assessed'}</span></div>
        </div>
      </Panel>
    </div>
  );

  const renderInsights = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Panel className={`${currentTheme.accentSoft}`}>
        <p className="text-sm text-slate-500">Consensus Recommendation</p>
        <h3 className="mt-2 text-3xl font-semibold">{result?.recommendation?.best?.name || 'Pending'}</h3>
        <p className="mt-3 text-slate-600">{result?.recommendation?.best?.reason || 'Run the multi-agent consensus to generate a recommendation.'}</p>
      </Panel>
      <Panel>
        <p className="text-sm text-slate-500">Cohort matching</p>
        <h3 className="mt-2 text-3xl font-semibold">{cohortData?.recommendedCohort?.label || 'Awaiting cohort map'}</h3>
        <div className="mt-4 space-y-3">
          {(cohortData?.cohorts || []).slice(0, 3).map((cohort) => (
            <div key={cohort.label} className="rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{cohort.label}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">{cohort.similarityScore}%</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-500">
                <span>Response {cohort.responseRate}%</span>
                <span>Adverse {cohort.adverseEventRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <p className="text-sm text-slate-500">Drug intelligence</p>
        <h3 className="mt-2 text-3xl font-semibold">Interaction overview</h3>
        <div className="mt-4 space-y-3">
          {(drugIntel?.interactions || []).length ? drugIntel.interactions.slice(0, 3).map((item) => (
            <div key={item.pair} className="rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.pair}</span>
                <span className="rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-700">{item.severity}</span>
              </div>
              <p className="mt-2 text-slate-600">{item.action}</p>
            </div>
          )) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No major interaction warnings detected.</div>
          )}
        </div>
      </Panel>
      <Panel className="xl:col-span-3">
        <p className="text-sm text-slate-500">Key Contributing Factors</p>
        <h3 className="mt-2 text-3xl font-semibold">Top drivers analyzed by agents</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {molecularSummary.map((factor, index) => (
            <div key={factor.feature} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{factor.feature}</span>
                <span>{factor.normalizedWeight}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div className={`${index % 2 === 0 ? 'bg-emerald-400' : 'bg-cyan-400'} h-2 rounded-full`} style={{ width: `${clamp(factor.normalizedWeight)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
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
        <p className="mt-2 text-sm text-slate-500">Adjust selected patient values below and compare how the agents would react before making a real clinical change.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-500">Systolic blood pressure</label>
            <input value={whatIfForm.bpSystolic} onChange={(event) => setWhatIfForm({ ...whatIfForm, bpSystolic: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-slate-50 px-4 py-4" placeholder="e.g. 120" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-500">Fasting glucose</label>
            <input value={whatIfForm.sugar} onChange={(event) => setWhatIfForm({ ...whatIfForm, sugar: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-slate-50 px-4 py-4" placeholder="e.g. 100" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-500">SpO2 oxygen saturation</label>
            <input value={whatIfForm.spO2} onChange={(event) => setWhatIfForm({ ...whatIfForm, spO2: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-slate-50 px-4 py-4" placeholder="e.g. 98" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-500">Smoking status</label>
            <select value={whatIfForm.smoking} onChange={(event) => setWhatIfForm({ ...whatIfForm, smoking: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-slate-50 px-4 py-4">
              <option>No</option>
              <option>Past</option>
              <option>Yes</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-500">Exercise frequency</label>
            <select value={whatIfForm.exercise} onChange={(event) => setWhatIfForm({ ...whatIfForm, exercise: event.target.value })} className="w-full rounded-2xl border border-black/5 bg-slate-50 px-4 py-4">
              <option>None</option>
              <option>Rarely</option>
              <option>Moderate</option>
              <option>Active</option>
            </select>
          </div>
        </div>
        <button onClick={runWhatIf} disabled={runningWhatIf} className={`mt-5 rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${currentTheme.buttonClass}`}>{runningWhatIf ? 'Simulating...' : 'Run what-if'}</button>
      </Panel>
      <Panel>
        <p className="text-sm text-slate-500">Scenario result</p>
        <h3 className="mt-2 text-3xl font-semibold">Delta response</h3>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Effectiveness</p>
            <p className="mt-2 text-4xl font-semibold">{whatIfResult ? `${whatIfResult.deltas.effectivenessChange >= 0 ? '+' : ''}${whatIfResult.deltas.effectivenessChange}` : '--'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Risk</p>
            <p className="mt-2 text-4xl font-semibold">{whatIfResult ? `${whatIfResult.deltas.riskChange >= 0 ? '+' : ''}${whatIfResult.deltas.riskChange}` : '--'}</p>
          </div>
        </div>
      </Panel>
    </div>
  );

  const renderHistory = () => (
    <Panel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Simulation ledger</p>
          <h3 className="mt-2 text-3xl font-semibold">Recent consensus runs</h3>
        </div>
        <div className="rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">{simulationHistory.length} run(s)</div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {simulationHistory.length ? simulationHistory.map((item, index) => (
          <div key={`${item.timestamp}-${index}`} className="rounded-[26px] bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{item.treatmentPlan.type}</p>
                <p className="text-sm text-slate-500">{item.treatmentPlan.dosage} dosage</p>
              </div>
              <Clock3 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Effectiveness</p>
                <p className="mt-1 font-semibold">{item.effectiveness}%</p>
              </div>
              <div>
                <p className="text-slate-500">Risk</p>
                <p className="mt-1 font-semibold">{item.risk}%</p>
              </div>
              <div>
                <p className="text-slate-500">Recovery</p>
                <p className="mt-1 font-semibold">{item.recoveryTime}</p>
              </div>
              <div>
                <p className="text-slate-500">State</p>
                <p className="mt-1 font-semibold">{item.diseaseProgression}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-[26px] bg-slate-50 p-5 text-sm text-slate-500">No simulations recorded yet.</div>
        )}
      </div>
    </Panel>
  );

  const renderAlerts = () => {
    const alerts = alertsData?.alerts || [];
    const scores = alertsData?.scores || {};
    const activeAlerts = alerts.filter(a => a.status === 'active');
    const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.8fr]">
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

        <Panel>
          <p className="text-sm text-slate-500">Early Warning Scores</p>
          <h3 className="mt-2 text-3xl font-semibold">Clinical Indices</h3>
          
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-5">
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
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
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
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
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

        <Panel>
          <p className="text-sm text-slate-500">Eligibility Profile</p>
          <h3 className="mt-2 text-3xl font-semibold">Patient Criteria</h3>
          
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
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

            <div className="rounded-2xl bg-slate-50 p-4">
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

            <div className="rounded-2xl bg-slate-50 p-4">
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

            <div className="rounded-2xl bg-slate-50 p-4">
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
          </div>
        </Panel>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'intake':
        return renderIntake();
      case 'insights':
        return renderInsights();
      case 'alerts':
        return renderAlerts();
      case 'trials':
        return renderTrials();
      case 'whatif':
        return renderWhatIf();
      case 'history':
        return renderHistory();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e8f5e9_0%,#c8e6c9_100%)] p-4 text-slate-900 md:p-6">
      <div className="mx-auto flex max-w-[1600px] gap-4 rounded-[38px] border border-white/60 bg-[#f5f5f0]/90 p-4 shadow-[0_24px_80px_rgba(80,110,88,0.12)] md:p-6">
        {/* Sidebar Navigation */}
        <div className="hidden w-[240px] shrink-0 flex-col rounded-[28px] bg-white/70 p-4 md:flex">
          <div className="mb-5 flex items-center gap-3 rounded-[22px] bg-emerald-100 px-4 py-4">
            <BrainCircuit className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-emerald-700">BioTwin AI</p>
              <p className="font-semibold text-sm">Digital Twin</p>
            </div>
          </div>
          
          <div className="space-y-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = item.key === activeSection;
              const isLabel = item.key === 'navigator';
              
              if (isLabel) {
                return (
                  <div key={item.key} className="px-4 py-2 mt-4 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                  </div>
                );
              }
              
              return (
                <button 
                  key={item.key} 
                  onClick={() => openSection(item.key)} 
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-emerald-600 text-white' : 'bg-transparent text-slate-600 hover:bg-emerald-50'}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                  </span>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="mt-auto pt-4 space-y-2">
            <button onClick={() => navigate('/')} className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-slate-600 hover:bg-white text-sm">
              <Home className="h-4 w-4" /> Back Home
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className={`mb-2 inline-flex items-center gap-2 rounded-full ${currentTheme.accentBg} px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ${currentTheme.accentText}`}>
                <Sparkles className="h-3.5 w-3.5" /> {currentTheme.layer}
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
                {sections.find((item) => item.key === activeSection)?.label || 'Biotwin Overview'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{currentTheme.description}</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Search anything...</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">
                <User className="h-4 w-4" /> {role}
              </div>
              {canExport && (
                <button onClick={exportClinicianReport} disabled={exportingReport} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm disabled:opacity-60">
                  <Download className="h-4 w-4" /> {exportingReport ? 'Exporting...' : 'Export'}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex gap-2 overflow-auto pb-1 md:hidden">
            {sections.filter(s => s.key !== 'navigator').map((item) => (
              <button 
                key={item.key} 
                onClick={() => openSection(item.key)} 
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${item.key === activeSection ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {/* Main Content Area */}
          <div className={`rounded-[32px] bg-white/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${currentTheme.accentRing} ring-1`}>
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
