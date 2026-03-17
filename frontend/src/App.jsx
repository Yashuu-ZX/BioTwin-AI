import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PatientForm from './components/PatientForm';
import { Activity } from 'lucide-react';

function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6">
      <div className="glass-panel p-12 rounded-3xl text-center max-w-2xl w-full">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-500/20 rounded-full">
            <Activity size={48} className="text-blue-400" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-6 gradient-text tracking-tight">BioTwin AI</h1>
        <p className="text-xl text-slate-300 mb-10 leading-relaxed">
          Digital Twin for Personalized Medicine. Simulate treatment outcomes with AI-driven predictions.
        </p>
        <button 
          onClick={() => navigate('/new')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        >
          Create Digital Twin
        </button>
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
