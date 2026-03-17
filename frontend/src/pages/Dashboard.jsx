import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle,
  Clock3,
  HeartPulse,
  Microscope,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Waves,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import apiClient from '../api/apiClient';

const defaultTreatmentPlan = {
  type: 'Standard',
  dosage: 'Medium',
  duration: 30,
};

const defaultWhatIf = {
  bpSystolic: 120,
  sugar: 100,
  spO2: 98,
  smoking: 'No',
  exercise: 'Moderate',
};

const metricTone = (kind, value) => {
  if (kind === 'positive') {
    if (value >= 75) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (value >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  }

  if (value <= 30) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
  if (value <= 60) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
  return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
};

const Dashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [runningWhatIf, setRunningWhatIf] = useState(false);
  const [syncingWearable, setSyncingWearable] = useState(false);
  const [loadingEhr, setLoadingEhr] = useState(false);

  const [patient, setPatient] = useState(null);
  const [learningState, setLearningState] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [explainability, setExplainability] = useState(null);
  const [result, setResult] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [ehrData, setEhrData] = useState(null);
  const [wearableStatus, setWearableStatus] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [error, setError] = useState('');

  const [treatmentPlan, setTreatmentPlan] = useState(defaultTreatmentPlan);
  const [feedbackForm, setFeedbackForm] = useState({ effectiveness: 78, sideEffects: 18, recoveryTime: 20 });
  const [whatIfForm, setWhatIfForm] = useState(defaultWhatIf);

  const deviceId = useMemo(() => `WT-${String(id || '').slice(-6).toUpperCase()}`, [id]);

  const refreshLearningState = async () => {
    const response = await apiClient.get('/learning/status');
    setLearningState(response.data);
  };

  const refreshSimulationHistory = async () => {
    try {
      const response = await apiClient.get(`/simulate/${id}/history`);
      setSimulationHistory(response.data.history || []);
    } catch (historyError) {
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

        if (patientRes.status !== 'fulfilled') {
          throw patientRes.reason;
        }

        const patientData = patientRes.value.data;

        setPatient(patientData);

        if (learningRes.status === 'fulfilled') {
          setLearningState(learningRes.value.data);
        }

        if (predictionRes.status === 'fulfilled') {
          setPrediction(predictionRes.value.data);
        }

        if (explainRes.status === 'fulfilled') {
          setExplainability(explainRes.value.data);
        }

        setWhatIfForm((current) => ({
          ...current,
          bpSystolic: patientData?.vitals?.bpSystolic ?? current.bpSystolic,
          sugar: patientData?.vitals?.sugar ?? current.sugar,
          spO2: patientData?.vitals?.spO2 ?? current.spO2,
          smoking: patientData?.lifestyle?.smoking ?? current.smoking,
          exercise: patientData?.lifestyle?.exercise ?? current.exercise,
        }));

        await refreshSimulationHistory();

        if (learningRes.status !== 'fulfilled' || predictionRes.status !== 'fulfilled' || explainRes.status !== 'fulfilled') {
          setError('Patient profile loaded, but some advanced services are temporarily unavailable. Core simulation still works.');
        }
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
      const response = await apiClient.post('/simulate', {
        patientId: id,
        treatmentPlan,
      });

      setResult(response.data);
      setFeedbackForm({
        effectiveness: Math.round(response.data.effectiveness),
        sideEffects: Math.round(response.data.sideEffects),
        recoveryTime: parseInt(response.data.recoveryTime, 10) || 20,
      });
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
        predictedOutcome: {
          effectiveness: result.effectiveness,
          risk: result.risk,
        },
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
          vitals: {
            bpSystolic: Number(whatIfForm.bpSystolic),
            sugar: Number(whatIfForm.sugar),
            spO2: Number(whatIfForm.spO2),
          },
          lifestyle: {
            smoking: whatIfForm.smoking,
            exercise: whatIfForm.exercise,
          },
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
      const response = await apiClient.get(`/external/ehr-data/${id}`, {
        headers: { 'x-api-key': 'HMS-SECURE-KEY-2026' },
      });
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
      const payload = {
        heartRate: patient?.vitals?.heartRate || 82,
        spO2: patient?.vitals?.spO2 || 97,
        steps: 6200,
        sleepHours: 7.1,
      };

      await apiClient.post('/external/wearable-stream', {
        deviceId,
        metrics: payload,
      });

      const response = await apiClient.get(`/external/wearable-stream/${deviceId}`);
      setWearableStatus(response.data.history?.[0] || null);
    } catch (wearableError) {
      console.error(wearableError);
      setError('Wearable sync failed.');
    } finally {
      setSyncingWearable(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-cyan-400" />
          <p className="text-lg font-semibold">Preparing BioTwin clinical workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="min-h-screen bg-[#07111f] text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-lg rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-400" />
          <p className="mb-4 text-lg font-semibold">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              onClick={() => navigate('/')}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500/30 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              <BrainCircuit className="h-3.5 w-3.5" /> BioTwin Clinical Workspace
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">{patient?.name}'s Digital Twin</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              End-to-end personalized medicine console spanning intake, simulation, explainability, feedback learning, and secure clinical integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Model Accuracy</p>
              <p className="mt-2 text-2xl font-bold text-white">{learningState?.modelAccuracy || '--'}%</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk Baseline</p>
              <p className="mt-2 text-2xl font-bold text-white">{prediction?.riskLevel || patient?.metrics?.riskScore || '--'}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Primary Pathway</p>
              <p className="mt-2 text-2xl font-bold text-white">{patient?.disease || 'Unknown'}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="xl:col-span-4 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_45%),rgba(15,23,42,0.92)] p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Patient Snapshot</h2>
                  <p className="text-sm text-slate-400">Layer 1 intake profile</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-slate-900/70 p-4">
                  <p className="text-slate-500">Age</p>
                  <p className="mt-1 text-lg font-semibold text-white">{patient?.age || '--'}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/70 p-4">
                  <p className="text-slate-500">BMI</p>
                  <p className="mt-1 text-lg font-semibold text-white">{patient?.profile?.bmi || '--'}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/70 p-4">
                  <p className="text-slate-500">Health Index</p>
                  <p className="mt-1 text-lg font-semibold text-white">{patient?.metrics?.baselineHealthIndex || '--'}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/70 p-4">
                  <p className="text-slate-500">Risk Score</p>
                  <p className="mt-1 text-lg font-semibold text-white">{patient?.metrics?.riskScore || '--'}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div>
                  <p className="mb-2 text-slate-500">Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {(patient?.conditions || []).map((condition) => (
                      <span key={condition} className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-200">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-slate-500">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {(patient?.symptoms || []).map((symptom) => (
                      <span key={symptom} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Simulation Controls</h2>
                  <p className="text-sm text-slate-400">Layer 2 protocol testing</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Protocol</label>
                  <select
                    value={treatmentPlan.type}
                    onChange={(event) => setTreatmentPlan({ ...treatmentPlan, type: event.target.value })}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Standard">Standard</option>
                    <option value="Aggressive">Aggressive</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Dosage</label>
                    <select
                      value={treatmentPlan.dosage}
                      onChange={(event) => setTreatmentPlan({ ...treatmentPlan, dosage: event.target.value })}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Duration</label>
                    <input
                      type="number"
                      min="7"
                      max="120"
                      value={treatmentPlan.duration}
                      onChange={(event) => setTreatmentPlan({ ...treatmentPlan, duration: Number(event.target.value) })}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  <Activity className={`h-5 w-5 ${simulating ? 'animate-spin' : ''}`} />
                  {simulating ? 'Running simulation...' : 'Run Digital Twin'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-violet-400/10 p-3 text-violet-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Predictive Baseline</h2>
                  <p className="text-sm text-slate-400">Layer 6 preventive intelligence</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-slate-500">Base Risk Score</p>
                  <p className="mt-2 text-2xl font-bold text-white">{prediction?.baseRiskScore}%</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-slate-300">
                  <p className="text-slate-500">Recommended Action</p>
                  <p className="mt-2 font-medium text-white">{prediction?.recommendedAction}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="xl:col-span-8 space-y-6">
            {result ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {[
                  { label: 'Effectiveness', value: result.effectiveness, kind: 'positive', icon: TrendingUp },
                  { label: 'Risk Exposure', value: result.risk, kind: 'negative', icon: ShieldAlert },
                  { label: 'Side Effects', value: result.sideEffects, kind: 'negative', icon: AlertTriangle },
                  { label: 'Survival', value: result.survivalProbability, kind: 'positive', icon: HeartPulse },
                  { label: 'Confidence', value: result.confidenceScore, kind: 'positive', icon: Sparkles },
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-400">{metric.label}</p>
                        <span className={`rounded-xl border px-2 py-2 ${metricTone(metric.kind, metric.value)}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-white">{metric.value}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
                <Microscope className="mx-auto mb-4 h-10 w-10 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">Simulation results will appear here</h2>
                <p className="mt-2 text-slate-400">Run the digital twin engine to compare treatments, severity trajectory, and AI recommendations.</p>
              </div>
            )}

            {result && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 lg:col-span-2">
                  <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Outcome Trajectory</h2>
                      <p className="text-sm text-slate-400">Projected severity across untreated, selected, and optimized pathways.</p>
                    </div>
                    <div className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                      Disease state: <span className="font-semibold text-white">{result.diseaseProgression}</span>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.trajectory}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.35} />
                        <XAxis dataKey="day" stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#020617',
                            borderRadius: '16px',
                            border: '1px solid rgba(148,163,184,0.2)',
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Without Treatment" stroke="#fb7185" strokeWidth={2} dot={false} strokeDasharray="6 6" />
                        <Line type="monotone" dataKey="Selected Treatment" stroke="#22d3ee" strokeWidth={4} dot={false} />
                        <Line type="monotone" dataKey="Optimized Treatment" stroke="#34d399" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                  <h2 className="text-xl font-semibold text-white">AI Recommendation</h2>
                  <p className="mt-1 text-sm text-slate-400">Best-fit protocol generated from the digital twin comparison engine.</p>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                        <CheckCircle className="h-4 w-4" /> Recommended
                      </p>
                      <p className="text-lg font-semibold text-white">{result.recommendation.best.name}</p>
                      <p className="mt-2 text-sm text-emerald-50/80">{result.recommendation.best.reason}</p>
                    </div>

                    {result.recommendation.alternatives.map((item) => (
                      <div key={item.name} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Alternative</p>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="mt-2 text-sm text-slate-300">{item.reason}</p>
                      </div>
                    ))}

                    {result.recommendation.avoid.map((item) => (
                      <div key={item.name} className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-300">Avoid</p>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="mt-2 text-sm text-slate-300">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <h2 className="text-xl font-semibold text-white">Explainable Insights</h2>
                <p className="mt-1 text-sm text-slate-400">Layer 6 feature importance and preventive guidance.</p>

                <div className="mt-5 space-y-3">
                  {(explainability?.featureImportance || []).map((factor) => (
                    <div key={factor.feature} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{factor.feature}</p>
                          <p className="text-sm text-slate-400">Value: {factor.value}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${factor.impact === 'Negative' ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                          {factor.normalizedWeight}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Preventive Actions</p>
                  <div className="space-y-3 text-sm text-slate-300">
                    {(explainability?.preventiveInsights || []).map((insight) => (
                      <div key={insight} className="flex gap-3">
                        <TrendingDown className="mt-0.5 h-4 w-4 flex-none text-cyan-300" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <h2 className="text-xl font-semibold text-white">What-If Simulator</h2>
                <p className="mt-1 text-sm text-slate-400">Test preventive changes before applying them to the patient.</p>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Systolic BP</label>
                    <input type="number" value={whatIfForm.bpSystolic} onChange={(event) => setWhatIfForm({ ...whatIfForm, bpSystolic: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Glucose</label>
                    <input type="number" value={whatIfForm.sugar} onChange={(event) => setWhatIfForm({ ...whatIfForm, sugar: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">SpO2</label>
                    <input type="number" value={whatIfForm.spO2} onChange={(event) => setWhatIfForm({ ...whatIfForm, spO2: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Smoking</label>
                    <select value={whatIfForm.smoking} onChange={(event) => setWhatIfForm({ ...whatIfForm, smoking: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                      <option>No</option>
                      <option>Past</option>
                      <option>Yes</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">Exercise</label>
                    <select value={whatIfForm.exercise} onChange={(event) => setWhatIfForm({ ...whatIfForm, exercise: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                      <option>None</option>
                      <option>Rarely</option>
                      <option>Moderate</option>
                      <option>Active</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={runWhatIf}
                  disabled={runningWhatIf}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:bg-slate-700 disabled:text-slate-400"
                >
                  <Sparkles className={`h-5 w-5 ${runningWhatIf ? 'animate-spin' : ''}`} />
                  {runningWhatIf ? 'Analyzing scenario...' : 'Run What-If'}
                </button>

                {whatIfResult && (
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-sm text-slate-500">Effectiveness Delta</p>
                      <p className={`mt-2 text-2xl font-bold ${whatIfResult.deltas.effectivenessChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {whatIfResult.deltas.effectivenessChange >= 0 ? '+' : ''}{whatIfResult.deltas.effectivenessChange}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="text-sm text-slate-500">Risk Delta</p>
                      <p className={`mt-2 text-2xl font-bold ${whatIfResult.deltas.riskChange <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {whatIfResult.deltas.riskChange >= 0 ? '+' : ''}{whatIfResult.deltas.riskChange}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <h2 className="text-xl font-semibold text-white">Continuous Learning</h2>
                <p className="mt-1 text-sm text-slate-400">Submit actual outcomes to refine the simulation engine.</p>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Actual Effectiveness</label>
                    <input type="number" min="0" max="100" value={feedbackForm.effectiveness} onChange={(event) => setFeedbackForm({ ...feedbackForm, effectiveness: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Observed Side Effects</label>
                    <input type="number" min="0" max="100" value={feedbackForm.sideEffects} onChange={(event) => setFeedbackForm({ ...feedbackForm, sideEffects: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">Recovery Time (days)</label>
                    <input type="number" min="1" value={feedbackForm.recoveryTime} onChange={(event) => setFeedbackForm({ ...feedbackForm, recoveryTime: event.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                  </div>
                </div>

                <button
                  onClick={submitFeedback}
                  disabled={submittingFeedback || !result}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
                >
                  <Upload className={`h-5 w-5 ${submittingFeedback ? 'animate-pulse' : ''}`} />
                  {submittingFeedback ? 'Updating model...' : 'Submit Real-World Feedback'}
                </button>

                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  <p className="mb-2 font-semibold text-white">Learning Status</p>
                  <p>{learningState?.learningStatus || 'Active'} with {learningState?.totalFeedbackProcessed || 0} feedback events processed.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <h2 className="text-xl font-semibold text-white">Clinical Integrations</h2>
                <p className="mt-1 text-sm text-slate-400">Layer 5 secure connectivity for EHR and wearable streams.</p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">EHR Bridge</p>
                        <p className="mt-1 text-sm text-slate-400">Fetch mock hospital records through the secure API gateway.</p>
                      </div>
                      <button onClick={fetchEhr} disabled={loadingEhr} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
                        {loadingEhr ? 'Loading...' : 'Sync EHR'}
                      </button>
                    </div>
                    {ehrData && (
                      <div className="mt-4 text-sm text-slate-300">
                        <p>Last visit: <span className="text-white">{ehrData.lastVisit}</span></p>
                        <p>HL7 code: <span className="text-white">{ehrData.hl7_code}</span></p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">Wearable Telemetry</p>
                        <p className="mt-1 text-sm text-slate-400">Push a live vitals packet to keep the twin synchronized.</p>
                      </div>
                      <button onClick={syncWearable} disabled={syncingWearable} className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-700 disabled:text-slate-400">
                        {syncingWearable ? 'Syncing...' : 'Send Stream'}
                      </button>
                    </div>
                    {wearableStatus && (
                      <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                        <Waves className="h-4 w-4 text-violet-300" />
                        Latest packet: HR {wearableStatus.metrics.heartRate} bpm, SpO2 {wearableStatus.metrics.spO2}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Simulation History</h2>
                  <p className="text-sm text-slate-400">Recent digital twin treatment runs for this patient.</p>
                </div>
                <div className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                  {simulationHistory.length} recorded run(s)
                </div>
              </div>

              {simulationHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                  No simulations logged yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {simulationHistory.map((item, index) => (
                    <div key={`${item.timestamp}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{item.treatmentPlan.type}</p>
                          <p className="text-sm text-slate-500">{item.treatmentPlan.dosage} dosage</p>
                        </div>
                        <Clock3 className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">Effectiveness</p>
                          <p className="font-semibold text-white">{item.effectiveness}%</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Risk</p>
                          <p className="font-semibold text-white">{item.risk}%</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Recovery</p>
                          <p className="font-semibold text-white">{item.recoveryTime}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Status</p>
                          <p className="font-semibold text-white">{item.diseaseProgression}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
