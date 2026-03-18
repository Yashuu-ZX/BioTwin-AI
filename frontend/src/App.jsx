import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, BrainCircuit, ShieldCheck, Waves, FlaskConical, UserRoundCog, Presentation } from 'lucide-react';
import apiClient from './api/apiClient';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PatientForm = lazy(() => import('./components/PatientForm'));

const RouteLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-slate-100">
    <div className="space-y-4 text-center">
      <Activity className="mx-auto h-10 w-10 animate-pulse text-cyan-400" />
      <p className="text-lg font-semibold">Loading BioTwin workspace...</p>
    </div>
  </div>
);

const authStorageKey = 'biotwin-user-role';
function Login({ onLogin, darkMode }) {
  const navigate = useNavigate();
  const roles = [
    { id: 'doctor', label: 'Clinician', note: 'Full simulation, twin controls, and report export.' },
    { id: 'patient', label: 'Patient', note: 'Review twin summary and preventive guidance.' },
    { id: 'admin', label: 'Administrator', note: 'Manage demo flows and platform oversight.' },
  ];

  return (
    <div className={`min-h-screen px-6 py-10 ${darkMode ? 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0b1320_100%)] text-white' : 'bg-[radial-gradient(circle_at_top,_rgba(217,255,102,0.32),_transparent_28%),linear-gradient(180deg,_#edf5e8_0%,_#deefd2_100%)] text-slate-900'}`}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className={`grid w-full gap-6 rounded-[2.4rem] border p-8 shadow-[0_24px_80px_rgba(80,110,88,0.12)] md:grid-cols-[1fr_1.1fr] md:p-10 ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-white/70 bg-[#f6f3ee]/88'}`}>
          <div>
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] ${darkMode ? 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-300' : 'bg-lime-100 text-lime-700'}`}>
              <UserRoundCog className="h-4 w-4" /> Secure Role Access
            </div>
            <h1 className={`text-4xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Enter BioTwin with the right clinical lens.</h1>
            <p className={`mt-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Choose a role to unlock the matching workspace. This is a mock auth layer for demo and workflow validation.</p>
            <div className={`mt-6 rounded-[28px] p-5 ${darkMode ? 'bg-slate-950/60' : 'bg-[linear-gradient(180deg,#ebff78_0%,#f4ffc4_100%)]'}`}>
              <p className={`text-sm uppercase tracking-[0.22em] ${darkMode ? 'text-cyan-300' : 'text-lime-700'}`}>Precision access</p>
              <p className={`mt-3 text-3xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Login feels like the dashboard now.</p>
              <p className={`mt-3 text-sm leading-7 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>A softer editorial layout, rounded premium surfaces, and role-first entry make the first screen feel part of the same product system.</p>
            </div>
          </div>

          <div className="space-y-4">
            {roles.map((role) => (
              <button key={role.id} onClick={() => { onLogin(role.id); navigate('/'); }} className={`w-full rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 ${darkMode ? 'border-slate-800 bg-slate-950/70 hover:border-cyan-500/30 hover:bg-slate-900' : 'border-black/5 bg-white/85 hover:border-lime-300 hover:bg-white'}`}>
                <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{role.label}</p>
                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{role.note}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ role, children }) {
  if (!role) return <Navigate to="/login" replace />;
  return children;
}

function Home({ role, onLogout, darkMode }) {
  const navigate = useNavigate();

  const pillars = [
    {
      icon: BrainCircuit,
      title: 'Digital Twin Simulation',
      text: 'Model each patient with a virtual health profile and test multiple treatment strategies before clinical execution.',
    },
    {
      icon: Waves,
      title: 'Continuous Learning',
      text: 'Capture real outcomes, feed them back into the platform, and steadily improve prediction accuracy.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Clinical Workflow',
      text: 'Bridge intake, explainability, EHR sync, and wearable telemetry in one protected decision environment.',
    },
    {
      icon: FlaskConical,
      title: 'Biomarker Translation',
      text: 'Bring lab panels and biomarker context into targetability, cohort match, and drug intelligence layers.',
    },
  ];

  const [demoCases, setDemoCases] = React.useState([]);

  React.useEffect(() => {
    apiClient.get('/patient/demo-cases').then((response) => setDemoCases(response.data)).catch(() => setDemoCases([]));
  }, []);

  const launchDemoCase = async (slug) => {
    const response = await apiClient.post(`/patient/demo-seed/${slug}`);
    navigate(`/dashboard/${response.data.patientId}`);
  };

  return (
    <div className={`min-h-screen px-6 py-10 ${darkMode ? 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#07111f_0%,_#0f172a_100%)] text-white' : 'bg-[radial-gradient(circle_at_top,_rgba(217,255,102,0.26),_transparent_32%),linear-gradient(180deg,_#edf5e8_0%,_#deefd2_100%)] text-slate-900'}`}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-10">
        <div className={`overflow-hidden rounded-[2rem] border ${darkMode ? 'glass-panel border-slate-700/60' : 'border-white/70 bg-[#f6f3ee]/88 shadow-[0_24px_80px_rgba(80,110,88,0.12)]'}`}>
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="p-8 md:p-12">
              <div className={`mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] ${darkMode ? 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-300' : 'bg-lime-100 text-lime-700'}`}>
                <Activity className="h-4 w-4" /> Precision Medicine Workspace
              </div>
              <h1 className={`max-w-3xl text-4xl font-bold tracking-tight md:text-6xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                BioTwin AI turns patient data into a treatment-safe digital twin.
              </h1>
              <p className={`mt-6 max-w-2xl text-lg leading-8 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Ingest clinical data, simulate treatment protocols, compare projected outcomes, and learn from real-world recovery signals in one end-to-end platform.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => navigate('/new')}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 font-semibold transition ${darkMode ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-black text-white hover:bg-slate-800'}`}
                >
                  Create Digital Twin <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/new?demo=1')}
                  className={`inline-flex items-center justify-center gap-2 rounded-full border px-7 py-4 font-semibold transition ${darkMode ? 'border-slate-600 bg-slate-900/70 text-white hover:border-cyan-400/40 hover:bg-slate-800' : 'border-black/10 bg-white/80 text-slate-900 hover:bg-white'}`}
                >
                  Open Demo Patient
                </button>
              </div>
              <div className={`mt-6 flex flex-wrap items-center gap-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>Logged in as:</span>
                <span className={`rounded-full px-3 py-1 font-semibold ${darkMode ? 'border border-slate-700 bg-slate-900/70 text-white' : 'bg-white text-slate-900'}`}>{role}</span>
                <button onClick={onLogout} className={`rounded-full border px-3 py-1 transition ${darkMode ? 'border-slate-700 hover:border-cyan-500/30 hover:text-white' : 'border-black/10 hover:bg-white'}`}>Sign out</button>
              </div>
            </div>

            <div className={`p-8 md:p-10 ${darkMode ? 'border-l border-slate-800/70 bg-slate-950/50' : 'border-l border-black/5 bg-white/35'}`}>
              <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>System Layers</p>
              <div className="mt-6 space-y-4">
                {[
                  { name: 'Patient Intake', description: 'Collect and structure patient medical history, demographics, and clinical data into a comprehensive health profile.' },
                  { name: 'Digital Twin Engine', description: 'Create a virtual replica of the patient to simulate disease progression and compare treatment outcomes.' },
                  { name: 'Clinical Dashboard', description: 'Visualize patient metrics, risk scores, treatment recommendations, and simulation history in real-time.' },
                  { name: 'Learning Loop', description: 'Continuously improve predictions by feeding real-world outcomes back into the AI model.' },
                  { name: 'Secure Integration', description: 'Connect with EHR systems and wearable devices through encrypted, HIPAA-compliant API endpoints.' },
                  { name: 'Explainable AI', description: 'Provide transparent insights into AI decisions with feature importance and what-if scenario analysis.' },
                ].map((layer, index) => (
                  <div key={layer.name} className={`group rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${darkMode ? 'border-slate-800 bg-slate-900/80 hover:border-cyan-500/30' : 'border-black/5 bg-white/80 hover:border-lime-300'}`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${darkMode ? 'text-cyan-400' : 'text-lime-700'}`}>Layer {index + 1}</p>
                    <p className={`mt-2 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{layer.name}</p>
                    <p className={`mt-2 text-sm leading-relaxed max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-24 group-hover:opacity-100 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{layer.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {pillars
            .filter((pillar) => role !== 'patient' || pillar.title !== 'Secure Clinical Workflow')
            .map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className={`rounded-3xl border p-6 transition hover:-translate-y-1 ${darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-black/5 bg-white/80 shadow-sm'}`}>
                <div className={`mb-4 inline-flex rounded-2xl p-3 ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-lime-100 text-lime-700'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{pillar.title}</h2>
                <p className={`mt-3 text-sm leading-7 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{pillar.text}</p>
              </div>
            );
          })}
        </div>

        {(role === 'doctor' || role === 'admin') && (
        <div className={`rounded-[2rem] border p-6 ${darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-black/5 bg-white/80 shadow-sm'}`}>
          <div className="mb-5 flex items-center gap-3">
            <div className={`rounded-2xl p-3 ${darkMode ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-100 text-violet-700'}`}><Presentation className="h-5 w-5" /></div>
            <div>
              <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Presentation Mode</h2>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Launch seeded domain cases instantly for demos, judging, or stakeholder walkthroughs.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {demoCases.map((demo) => (
              <button key={demo.slug} onClick={() => launchDemoCase(demo.slug)} className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 ${darkMode ? 'border-slate-800 bg-slate-950/70 hover:border-violet-500/30 hover:bg-slate-900' : 'border-black/5 bg-[#f8f6f0] hover:border-violet-300 hover:bg-white'}`}>
                <p className={`text-xs uppercase tracking-[0.2em] ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>{demo.disease}</p>
                <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{demo.title}</p>
                <p className={`mt-3 inline-flex items-center gap-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Launch case <ArrowRight className="h-4 w-4" /></p>
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [role, setRole] = React.useState(() => localStorage.getItem(authStorageKey) || '');
  const darkMode = false;

  const handleLogin = (nextRole) => {
    localStorage.setItem(authStorageKey, nextRole);
    setRole(nextRole);
  };

  const handleLogout = () => {
    localStorage.removeItem(authStorageKey);
    setRole('');
  };

  return (
    <Router>
      <div className={`min-h-screen font-sans ${darkMode ? 'bg-[#0f172a] text-slate-50' : 'bg-[#edf5e8] text-slate-900'}`}>
        <Suspense fallback={<RouteLoader />}> 
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} darkMode={darkMode} />} />
            <Route path="/" element={<ProtectedRoute role={role}><Home role={role} onLogout={handleLogout} darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/new" element={<ProtectedRoute role={role}><PatientForm role={role} darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/dashboard/:id" element={<ProtectedRoute role={role}><Dashboard role={role} /></ProtectedRoute>} />
            <Route path="/dashboard/:id/:section" element={<ProtectedRoute role={role}><Dashboard role={role} /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
