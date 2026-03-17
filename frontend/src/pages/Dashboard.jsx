import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Activity, ShieldAlert, Cpu, CircleCheck, FlaskConical, ArrowLeft, User } from 'lucide-react';
import TwinVisualizer from '../components/TwinVisualizer';
import TreatmentSimulator from '../components/TreatmentSimulator';
import ResultsCharts from '../components/ResultsCharts';

const Dashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [basePrediction, setBasePrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [errorBoundaryError, setErrorBoundaryError] = useState(null);

  useEffect(() => {
    const handleErr = (e) => setErrorBoundaryError(e.message);
    window.addEventListener('error', handleErr);
    return () => window.removeEventListener('error', handleErr);
  }, []);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const patientRes = await apiClient.get(`/patient/${id}`);
        setPatient(patientRes.data);
        
        // Fetch base prediction
        const predictRes = await apiClient.post('/predict', { patientData: patientRes.data });
        setBasePrediction(predictRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load patient data.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex justify-center items-center">
      <div className="flex flex-col items-center gap-4 text-blue-400">
        <Activity size={48} className="animate-pulse" />
        <h2 className="text-xl font-semibold tracking-wider">Syncing Neural Pathways...</h2>
      </div>
    </div>
  );

  if (error || !patient) return (
    <div className="min-h-screen bg-[#0f172a] flex justify-center items-center text-red-500">
      <div className="glass-panel p-8 rounded-xl flex flex-col items-center gap-4">
        <ShieldAlert size={48} />
        <h2 className="text-xl">{error || 'Patient not found'}</h2>
        <button onClick={() => navigate('/new')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">Go Back</button>
      </div>
    </div>
  );

  if (errorBoundaryError) return (
    <div className="min-h-screen bg-[#0f172a] text-white p-10 font-mono text-sm break-words">
      <h1 className="text-red-500 mb-4">CRASH DETECTED</h1>
      <p>{errorBoundaryError}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Cpu className="text-blue-500" /> Digital Twin Analytics
            </h1>
            <p className="text-slate-400 mt-1">ID: {patient.id.split('-')[0]}</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-3 rounded-2xl border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-[#1e293b]/80">
            <span className="text-sm text-slate-400 block mb-1 font-medium">Base Health Risk</span>
            <div className={`text-2xl font-bold flex items-center gap-2 ${basePrediction?.baseRiskScore > 50 ? 'text-red-400' : 'text-green-400'}`}>
              {basePrediction ? `${basePrediction.baseRiskScore}%` : '--'}
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="glass-panel px-6 py-3 rounded-2xl border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-[#1e293b]/80">
            <span className="text-sm text-slate-400 block mb-1 font-medium">AI Status</span>
            <div className="text-purple-400 font-bold flex items-center gap-2">
              Assimilated <CircleCheck size={18} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Patient Model & Data */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h2 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2">
              <User className="text-blue-400" size={20} /> Identity Matrix
            </h2>
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-slate-400 font-medium">Name</span>
                <span className="text-white font-semibold text-lg">{patient.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                <span className="text-slate-400 font-medium">Age / Gender</span>
                <span className="text-white font-semibold">{patient.age} y/o • {patient.gender}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 font-medium block mb-2">Pre-existing Conditions</span>
                <div className="flex flex-wrap gap-2">
                  {patient.conditions?.length > 0 ? patient.conditions.map((c, i) => (
                    <span key={i} className="text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full">
                      {c}
                    </span>
                  )) : <span className="text-slate-500 text-sm">None documented</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 flex-none">
              <Activity className="text-green-400" size={20} /> Vitals Simulation
            </h2>
            <div className="flex-1 relative bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 shadow-inner">
               <TwinVisualizer patient={patient} />
            </div>
          </div>
        </div>

        {/* Right Column - Simulation Engine & Results */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/80 to-[#0f172a] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
               <FlaskConical className="text-pink-500" /> Treatment Simulation Engine
             </h2>
             <TreatmentSimulator patientId={id} />
          </div>
          
          <div className="glass-panel p-6 sm:p-8 rounded-3xl flex-1 bg-gradient-to-br from-slate-900/80 to-[#0f172a]">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
               <Activity className="text-purple-500" /> Outcome Trajectory
             </h2>
             <ResultsCharts />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
