import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import { Play, Loader2, Info, Activity, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';

const MAX_HISTORY_SIZE = 20; // Limit history to prevent memory issues

const TreatmentSimulator = ({ patientId }) => {
  const [treatment, setTreatment] = useState('Standard Protocol');
  const [dosage, setDosage] = useState('Medium');
  const [duration, setDuration] = useState('30 days');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/simulate', {
        patientId,
        treatmentOption: treatment,
        dosage,
        duration
      });
      
      const newResult = response.data;
      // Bound history size to prevent unbounded memory growth
      setHistory(prev => [newResult, ...prev].slice(0, MAX_HISTORY_SIZE));

      // Dispatch event to update the charts
      window.dispatchEvent(new CustomEvent('simulationComplete', { detail: newResult }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDpiColor = (dpi) => {
    if (dpi === 'Improving') return 'text-green-400';
    if (dpi === 'Stable') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
      
      {/* Dynamic Controls Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#1e293b]/50 p-4 rounded-2xl border border-slate-700/50">
        <div className="md:col-span-4 space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protocol</label>
          <select 
            value={treatment} onChange={e => setTreatment(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium text-sm hover:bg-slate-700/80"
          >
            <option>Standard Protocol</option>
            <option>Conservative Protocol</option>
            <option>Aggressive Protocol</option>
            <option>Experimental Therapy A</option>
          </select>
        </div>
        
        <div className="md:col-span-3 space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dosage</label>
          <select 
            value={dosage} onChange={e => setDosage(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium text-sm hover:bg-slate-700/80"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
        
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</label>
          <select 
            value={duration} onChange={e => setDuration(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium text-sm hover:bg-slate-700/80"
          >
            <option>7 days</option>
            <option>30 days</option>
            <option>90 days</option>
          </select>
        </div>
        
        <div className="md:col-span-3">
          <button 
            onClick={handleSimulate}
            disabled={loading}
            className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all duration-300 transform flex justify-center items-center gap-2 text-sm
              ${loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-500 text-white hover:scale-[1.02] shadow-[0_0_15px_rgba(236,72,153,0.4)]'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {loading && history.length === 0 && (
         <div className="py-10 text-center text-pink-400 flex flex-col items-center gap-3">
           <Activity className="animate-pulse" size={32} />
           <span className="font-semibold tracking-wider uppercase text-sm">Processing Multi-Variable Neural Models...</span>
         </div>
      )}

      {/* Comparison Dashboard */}
      {history.length > 0 && (
        <div className="mt-2 space-y-6">
          <h3 className="text-sm text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 justify-between">
            <span>Simulation Comparison History</span>
            <span className="bg-slate-800 px-3 py-1 rounded-full text-xs border border-slate-700">{history.length} Run(s)</span>
          </h3>
          
          <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory hide-scrollbars" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {history.map((res, index) => (
              <div key={index} className={`min-w-[340px] md:min-w-[380px] snap-center bg-gradient-to-br ${index === 0 ? 'from-slate-800 to-slate-900 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.15)] ring-1 ring-pink-500/30' : 'from-slate-800/60 to-slate-900/60 border-slate-700/50 opacity-80 scale-95'} border rounded-2xl p-5 transition-all duration-500`}>
                <div className="flex justify-between items-start mb-4 border-b border-slate-700/50 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-lg leading-tight">{res.treatmentOption}</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{res.dosage} Dosage • {res.duration}</p>
                  </div>
                  {index === 0 && <span className="text-[10px] uppercase tracking-wider font-bold bg-pink-500/20 text-pink-400 px-2 py-1 rounded">Latest Result</span>}
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Effectiveness</span>
                    <span className={`text-xl font-bold ${res.effectiveness > 70 ? 'text-green-400' : 'text-yellow-400'} flex items-center gap-1`}>
                      {res.effectiveness}% {index === 0 && <Activity size={14} className="opacity-50" />}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Risk Exposure</span>
                    <span className={`text-xl font-bold ${res.risk > 40 ? 'text-red-400' : 'text-green-400'}`}>{res.risk}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Side Effects</span>
                    <span className="text-xl font-bold text-orange-400">{res.sideEffects}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Survival Prob.</span>
                    <span className="text-xl font-bold text-blue-400">{res.survivalProbability}%</span>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-xl bg-black/20 border border-slate-700/50 grid grid-cols-2 gap-3">
                   <div className="col-span-2">
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Disease Progression (DPI)</span>
                     <span className={`font-bold text-sm flex items-center gap-2 ${getDpiColor(res.diseaseProgression)}`}>
                        {res.diseaseProgression}
                     </span>
                   </div>
                   <div>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Recovery Time</span>
                     <span className="font-semibold text-slate-200 text-sm">{res.recoveryTime}</span>
                   </div>
                   <div>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">AI Confidence</span>
                     <span className="font-semibold text-slate-200 text-sm">{res.confidenceScore}%</span>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Recommendation Block - Based on latest run */}
          {history[0] && (
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-700 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <BrainCircuit size={100} />
               </div>
               <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-white relative z-10">
                 <BrainCircuit className="text-blue-400" size={20} /> Smart Clinical Recommendation
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 text-sm">
                 <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-green-400 uppercase tracking-wider text-xs">
                      <CheckCircle size={14} /> Recommended
                    </div>
                    <div className="font-semibold text-white">{history[0].recommendation.best}</div>
                    <p className="text-slate-400 text-xs">Optimized trajectory with balanced efficacy profile and suppressed disease progression index.</p>
                 </div>

                 <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-yellow-400 uppercase tracking-wider text-xs">
                       <Info size={14} /> Alternative
                    </div>
                    <div className="font-semibold text-white">{history[0].recommendation.alternatives[0] || "None"}</div>
                    <p className="text-slate-400 text-xs">Viable backup depending on real-world patient tolerance and side-effect emergence.</p>
                 </div>

                 <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-red-400 uppercase tracking-wider text-xs">
                       <AlertTriangle size={14} /> Avoid
                    </div>
                    <div className="font-semibold text-white">{history[0].recommendation.avoid[0] || "None"}</div>
                    <p className="text-slate-400 text-xs">Critical threshold breached for severity risk or counter-indicated for current baseline vitals.</p>
                 </div>
               </div>
            </div>
          )}
        </div>
      )}
      
      {/* Hide native scrollbars CSS injected inline for safety container */}
      <style>{`
        .hide-scrollbars::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default TreatmentSimulator;
