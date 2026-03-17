import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PatientForm from './components/PatientForm';
import { Activity, ArrowRight, BrainCircuit, ShieldCheck, Waves } from 'lucide-react';

function Home() {
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
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#07111f_0%,_#0f172a_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-10">
        <div className="glass-panel overflow-hidden rounded-[2rem] border border-slate-700/60">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="p-8 md:p-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                <Activity className="h-4 w-4" /> Precision Medicine Workspace
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
                BioTwin AI turns patient data into a treatment-safe digital twin.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Ingest clinical data, simulate treatment protocols, compare projected outcomes, and learn from real-world recovery signals in one end-to-end platform.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => navigate('/new')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-7 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Create Digital Twin <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-l border-slate-800/70 bg-slate-950/50 p-8 md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">System Layers</p>
              <div className="mt-6 space-y-4">
                {['Patient Intake', 'Digital Twin Engine', 'Clinical Dashboard', 'Learning Loop', 'Secure Integration', 'Explainable AI'].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Layer {index + 1}</p>
                    <p className="mt-2 font-semibold text-white">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="mb-4 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-white">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{pillar.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<PatientForm />} />
          <Route path="/dashboard/:id" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
