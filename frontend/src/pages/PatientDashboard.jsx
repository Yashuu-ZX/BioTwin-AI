import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  Heart,
  HeartPulse,
  Info,
  Pill,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
} from 'lucide-react';
import apiClient from '../api/apiClient';

// Simple Panel component
const Panel = ({ children, className = '' }) => (
  <div className={`rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

// Metric Card for patient vitals
// eslint-disable-next-line no-unused-vars
const MetricCard = ({ icon: Icon, label, value, unit, status, trend }) => {
  const statusColors = {
    normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    critical: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <div className={`rounded-2xl border p-4 ${statusColors[status] || 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5" />
        {trend === 'up' && <TrendingUp className="h-4 w-4" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4" />}
      </div>
      <p className="text-2xl font-bold">{value}<span className="text-sm font-normal ml-1">{unit}</span></p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
};

const PatientDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatientData = async () => {
      setLoading(true);
      setError('');
      try {
        const [patientRes, predictionRes, alertsRes] = await Promise.allSettled([
          apiClient.get(`/patient/${id}`),
          apiClient.get(`/predict/${id}`),
          apiClient.get(`/alerts/${id}`),
        ]);

        if (patientRes.status === 'fulfilled') {
          setPatient(patientRes.value.data);
        } else {
          throw new Error('Patient not found');
        }

        if (predictionRes.status === 'fulfilled') {
          setPrediction(predictionRes.value.data);
        }

        if (alertsRes.status === 'fulfilled') {
          setAlerts(alertsRes.value.data.alerts || []);
        }

        // Generate preventive guidelines based on patient data
        generateGuidelines(patientRes.value?.data, predictionRes.value?.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load your health data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [id]);

  // eslint-disable-next-line no-unused-vars
  const generateGuidelines = (patientData, _predictionData) => {
    const guidelines = [];
    
    if (patientData?.vitals?.bpSystolic > 130) {
      guidelines.push({
        id: 1,
        category: 'Blood Pressure',
        icon: HeartPulse,
        title: 'Monitor Blood Pressure',
        description: 'Your blood pressure is slightly elevated. Consider reducing sodium intake and increasing physical activity.',
        priority: 'high',
      });
    }

    if (patientData?.lifestyle?.smoking === 'Current') {
      guidelines.push({
        id: 2,
        category: 'Lifestyle',
        icon: ShieldCheck,
        title: 'Smoking Cessation',
        description: 'Quitting smoking can significantly improve your cardiovascular health and treatment outcomes.',
        priority: 'high',
      });
    }

    if (patientData?.lifestyle?.exerciseFrequency === 'None') {
      guidelines.push({
        id: 3,
        category: 'Exercise',
        icon: Activity,
        title: 'Increase Physical Activity',
        description: 'Aim for at least 150 minutes of moderate aerobic activity per week.',
        priority: 'medium',
      });
    }

    if (patientData?.vitals?.sugar > 126) {
      guidelines.push({
        id: 4,
        category: 'Blood Sugar',
        icon: Pill,
        title: 'Blood Sugar Management',
        description: 'Your blood sugar levels require attention. Follow your dietary plan and medication schedule.',
        priority: 'high',
      });
    }

    // Add general wellness guidelines
    guidelines.push({
      id: 5,
      category: 'Wellness',
      icon: Heart,
      title: 'Regular Check-ups',
      description: 'Schedule regular appointments with your healthcare provider to monitor your health progress.',
      priority: 'low',
    });

    guidelines.push({
      id: 6,
      category: 'Education',
      icon: BookOpen,
      title: 'Stay Informed',
      description: 'Learn about your condition and treatment options to be an active participant in your care.',
      priority: 'low',
    });

    setGuidelines(guidelines);
  };

  const vitalStatus = (type, value) => {
    const thresholds = {
      bpSystolic: { normal: [90, 120], warning: [120, 140] },
      heartRate: { normal: [60, 100], warning: [50, 110] },
      spO2: { normal: [95, 100], warning: [90, 95] },
      sugar: { normal: [70, 100], warning: [100, 126] },
    };

    const t = thresholds[type];
    if (!t) return 'normal';
    if (value >= t.normal[0] && value <= t.normal[1]) return 'normal';
    if (value >= t.warning[0] && value <= t.warning[1]) return 'warning';
    return 'critical';
  };

  const riskLevel = useMemo(() => {
    if (!prediction?.diseaseProbabilities) return { level: 'Unknown', color: 'slate' };
    const maxProb = Math.max(...Object.values(prediction.diseaseProbabilities));
    if (maxProb > 0.7) return { level: 'High', color: 'rose' };
    if (maxProb > 0.4) return { level: 'Moderate', color: 'amber' };
    return { level: 'Low', color: 'emerald' };
  }, [prediction]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f0f7eb_0%,#e3f2d8_100%)]">
        <div className="space-y-4 text-center">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-emerald-500" />
          <p className="text-lg font-semibold text-slate-700">Loading your health summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f0f7eb_0%,#e3f2d8_100%)] px-4">
        <Panel className="max-w-lg text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
          <p className="mb-4 text-lg font-semibold text-slate-800">{error}</p>
          <button onClick={() => navigate('/')} className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
            Back Home
          </button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0f7eb_0%,#e3f2d8_100%)] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
            <User className="h-4 w-4" />
            Patient View
          </div>
        </div>

        {/* Welcome Section */}
        <Panel className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Hello, {patient?.demographics?.name || 'Patient'}
              </h1>
              <p className="mt-2 text-slate-600">
                Here's your personalized health summary and preventive guidance.
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 bg-${riskLevel.color}-100 text-${riskLevel.color}-700`}>
              <ShieldCheck className="h-5 w-5" />
              <span className="font-semibold">Risk Level: {riskLevel.level}</span>
            </div>
          </div>
        </Panel>

        {/* Vitals Overview */}
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Your Vitals</h2>
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={HeartPulse}
            label="Blood Pressure"
            value={patient?.vitals?.bpSystolic || '--'}
            unit="mmHg"
            status={vitalStatus('bpSystolic', patient?.vitals?.bpSystolic)}
          />
          <MetricCard
            icon={Heart}
            label="Heart Rate"
            value={patient?.vitals?.heartRate || '--'}
            unit="bpm"
            status={vitalStatus('heartRate', patient?.vitals?.heartRate)}
          />
          <MetricCard
            icon={Activity}
            label="Oxygen Level"
            value={patient?.vitals?.spO2 || '--'}
            unit="%"
            status={vitalStatus('spO2', patient?.vitals?.spO2)}
          />
          <MetricCard
            icon={Pill}
            label="Blood Sugar"
            value={patient?.vitals?.sugar || '--'}
            unit="mg/dL"
            status={vitalStatus('sugar', patient?.vitals?.sugar)}
          />
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <>
            <h2 className="mb-4 text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Important Notifications
            </h2>
            <div className="mb-6 space-y-3">
              {alerts.filter(a => !a.acknowledged).slice(0, 3).map((alert, idx) => (
                <Panel key={idx} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-rose-500 bg-rose-50' :
                  alert.severity === 'warning' ? 'border-l-amber-500 bg-amber-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-rose-500' :
                      alert.severity === 'warning' ? 'text-amber-500' :
                      'text-blue-500'
                    }`} />
                    <div>
                      <p className="font-semibold text-slate-800">{alert.type}</p>
                      <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          </>
        )}

        {/* Preventive Guidelines */}
        <h2 className="mb-4 text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          Personalized Health Recommendations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {guidelines.map((guideline) => {
            const Icon = guideline.icon;
            const priorityColors = {
              high: 'border-l-rose-400 bg-rose-50',
              medium: 'border-l-amber-400 bg-amber-50',
              low: 'border-l-emerald-400 bg-emerald-50',
            };
            return (
              <Panel key={guideline.id} className={`border-l-4 ${priorityColors[guideline.priority]}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 shadow-sm">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {guideline.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800">{guideline.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{guideline.description}</p>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>

        {/* Treatment Summary (Read-only) */}
        {patient?.medications && patient.medications.length > 0 && (
          <>
            <h2 className="mb-4 text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-500" />
              Your Medications
            </h2>
            <Panel className="mb-6">
              <div className="space-y-3">
                {patient.medications.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-800">{med.name}</p>
                      <p className="text-sm text-slate-500">{med.dosage} - {med.frequency}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}

        {/* Information Notice */}
        <Panel className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800">About Your Digital Twin</p>
              <p className="text-sm text-blue-700 mt-1">
                Your digital twin is a personalized health model created from your medical data. 
                It helps your healthcare team simulate treatments and predict outcomes before making decisions. 
                For any questions about your care, please contact your healthcare provider.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default PatientDashboard;
