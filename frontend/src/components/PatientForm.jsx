import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { User, Activity, Dna, FileText, Pill, HeartPulse, Microscope, Target, ArrowRight, ArrowLeft, Loader2, Bot } from 'lucide-react';

const steps = [
  { id: 1, title: 'Basic Profile', icon: User },
  { id: 2, title: 'Symptoms', icon: Activity },
  { id: 3, title: 'Medical History', icon: FileText },
  { id: 4, title: 'Medications', icon: Pill },
  { id: 5, title: 'Lifestyle', icon: Dna },
  { id: 6, title: 'Vitals Input', icon: HeartPulse },
  { id: 7, title: 'Lab Reports', icon: Microscope },
  { id: 8, title: 'Disease Mapping', icon: Dna },
  { id: 9, title: 'Treatment Goal', icon: Target }
];

const PatientForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State for all 9 steps
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', height: '', weight: '', bloodGroup: 'A+',
    symptoms: [], symptomSeverity: 5, symptomDuration: '',
    medicalHistory: { conditions: [], surgeries: '', familyHistory: '' },
    medications: [{ name: '', dosage: '', frequency: '' }],
    lifestyle: { smoking: 'No', alcohol: 'No', exercise: 'None', diet: 'Average' },
    vitals: { heartRate: 80, bpSystolic: 120, bpDiastolic: 80, sugar: 100, spO2: 98, temperature: 98.6 },
    disease: 'Unknown',
    treatmentGoal: 'Low Risk'
  });

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const updateNested = (parent, key, value) => setFormData(prev => ({
    ...prev,
    [parent]: { ...prev[parent], [key]: value }
  }));

  const autoFill = () => {
    setFormData({
      name: 'Robert Miller', age: 62, gender: 'Male', height: 175, weight: 88, bloodGroup: 'O+',
      symptoms: ['Chest Pain', 'Shortness of Breath'], symptomSeverity: 8, symptomDuration: 3,
      medicalHistory: { conditions: ['Hypertension', 'Type 2 Diabetes'], surgeries: 'Appendectomy (2010)', familyHistory: 'Father had early CAD.' },
      medications: [{ name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }, { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' }],
      lifestyle: { smoking: 'Past', alcohol: 'Occasionally', exercise: 'Rarely', diet: 'Poor' },
      vitals: { heartRate: 88, bpSystolic: 145, bpDiastolic: 92, sugar: 142, spO2: 95, temperature: 98.4 },
      disease: 'Cardiac',
      treatmentGoal: 'Fast Recovery'
    });
    setCurrentStep(9);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/patient/intake', formData);
      navigate(`/dashboard/${response.data.patientId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to construct Digital Health Profile. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, 9));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

  // Helper arrays
  const conditionList = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'CAD', 'Obesity', 'Arrhythmia'];
  const symptomList = ['Fever', 'Cough', 'Fatigue', 'Chest Pain', 'Shortness of Breath', 'Nausea'];

  const toggleArray = (arr, item) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-slate-400">Full Name</label><input type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" placeholder="John Doe" /></div>
            <div><label className="text-sm text-slate-400">Age</label><input type="number" value={formData.age} onChange={e => updateForm('age', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" placeholder="45" /></div>
            <div><label className="text-sm text-slate-400">Gender</label><select value={formData.gender} onChange={e => updateForm('gender', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label className="text-sm text-slate-400">Blood Group</label><select value={formData.bloodGroup} onChange={e => updateForm('bloodGroup', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option></select></div>
            <div><label className="text-sm text-slate-400">Height (cm)</label><input type="number" value={formData.height} onChange={e => updateForm('height', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" placeholder="175" /></div>
            <div><label className="text-sm text-slate-400">Weight (kg)</label><input type="number" value={formData.weight} onChange={e => updateForm('weight', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" placeholder="70" /></div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Select Primary Symptoms</label>
            <div className="flex flex-wrap gap-2">
              {symptomList.map(sym => (
                <button key={sym} type="button" onClick={() => updateForm('symptoms', toggleArray(formData.symptoms, sym))} className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.symptoms.includes(sym) ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>{sym}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2 flex justify-between"><span>Symptom Severity (1-10)</span> <span className="text-white font-bold">{formData.symptomSeverity}</span></label>
            <input type="range" min="1" max="10" value={formData.symptomSeverity} onChange={e => updateForm('symptomSeverity', parseInt(e.target.value))} className="w-full accent-blue-500" />
          </div>
          <div><label className="text-sm text-slate-400">Duration (Days)</label><input type="number" value={formData.symptomDuration} onChange={e => updateForm('symptomDuration', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white mt-1" placeholder="e.g. 5" /></div>
        </div>
      );
      case 3: return (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Pre-existing Conditions</label>
            <div className="flex flex-wrap gap-2">
              {conditionList.map(cond => (
                 <button key={cond} type="button" onClick={() => updateNested('medicalHistory', 'conditions', toggleArray(formData.medicalHistory.conditions, cond))} className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.medicalHistory.conditions.includes(cond) ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>{cond}</button>
              ))}
            </div>
          </div>
          <div><label className="text-sm text-slate-400 block mb-1">Past Surgeries / Operations</label><textarea value={formData.medicalHistory.surgeries} onChange={e => updateNested('medicalHistory', 'surgeries', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24" placeholder="None" /></div>
          <div><label className="text-sm text-slate-400 block mb-1">Family History</label><textarea value={formData.medicalHistory.familyHistory} onChange={e => updateNested('medicalHistory', 'familyHistory', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24" placeholder="Mother: Hypertension" /></div>
        </div>
      );
      case 4: return (
        <div className="space-y-4 animate-fadeIn">
           {formData.medications.map((med, idx) => (
             <div key={idx} className="grid grid-cols-12 gap-2 pb-4 border-b border-slate-700/50">
               <div className="col-span-12 md:col-span-5"><label className="text-xs text-slate-500">Drug Name</label><input type="text" value={med.name} onChange={e => {
                  const newMeds = [...formData.medications]; newMeds[idx].name = e.target.value; updateForm('medications', newMeds);
               }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" placeholder="Drug Name" /></div>
               <div className="col-span-6 md:col-span-3"><label className="text-xs text-slate-500">Dosage</label><input type="text" value={med.dosage} onChange={e => {
                  const newMeds = [...formData.medications]; newMeds[idx].dosage = e.target.value; updateForm('medications', newMeds);
               }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" placeholder="20mg" /></div>
               <div className="col-span-6 md:col-span-4"><label className="text-xs text-slate-500">Frequency</label><input type="text" value={med.frequency} onChange={e => {
                  const newMeds = [...formData.medications]; newMeds[idx].frequency = e.target.value; updateForm('medications', newMeds);
               }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" placeholder="Once daily" /></div>
             </div>
           ))}
           <button type="button" onClick={() => updateForm('medications', [...formData.medications, { name: '', dosage: '', frequency: '' }])} className="text-sm text-blue-400 hover:text-blue-300">+ Add Medication</button>
        </div>
      );
      case 5: return (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-slate-400">Smoking</label><select value={formData.lifestyle.smoking} onChange={e => updateNested('lifestyle', 'smoking', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"><option>No</option><option>Past</option><option>Yes</option></select></div>
            <div><label className="text-sm text-slate-400">Alcohol</label><select value={formData.lifestyle.alcohol} onChange={e => updateNested('lifestyle', 'alcohol', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"><option>No</option><option>Rarely</option><option>Occasionally</option><option>Frequently</option></select></div>
            <div><label className="text-sm text-slate-400">Exercise</label><select value={formData.lifestyle.exercise} onChange={e => updateNested('lifestyle', 'exercise', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"><option>None</option><option>Rarely</option><option>Moderate</option><option>Active</option></select></div>
            <div><label className="text-sm text-slate-400">Diet</label><select value={formData.lifestyle.diet} onChange={e => updateNested('lifestyle', 'diet', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"><option>Poor</option><option>Average</option><option>Healthy</option></select></div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-4 animate-fadeIn">
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="text-sm text-slate-400">Heart Rate (bpm)</label><input type="number" value={formData.vitals.heartRate} onChange={e => updateNested('vitals', 'heartRate', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" /></div>
            <div><label className="text-sm text-slate-400">BP Systolic</label><input type="number" value={formData.vitals.bpSystolic} onChange={e => updateNested('vitals', 'bpSystolic', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-red-400" /></div>
            <div><label className="text-sm text-slate-400">BP Diastolic</label><input type="number" value={formData.vitals.bpDiastolic} onChange={e => updateNested('vitals', 'bpDiastolic', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-blue-400" /></div>
            <div><label className="text-sm text-slate-400">Fasting Sugar (mg/dL)</label><input type="number" value={formData.vitals.sugar} onChange={e => updateNested('vitals', 'sugar', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" /></div>
            <div><label className="text-sm text-slate-400">SpO2 (%)</label><input type="number" value={formData.vitals.spO2} onChange={e => updateNested('vitals', 'spO2', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" /></div>
            <div><label className="text-sm text-slate-400">Body Temp (°F)</label><input type="number" value={formData.vitals.temperature} onChange={e => updateNested('vitals', 'temperature', parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" /></div>
           </div>
        </div>
      );
      case 7: return (
        <div className="h-48 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center text-slate-400 animate-fadeIn hover:border-slate-400 hover:text-slate-300 transition-all cursor-pointer bg-slate-800/50">
           <div className="text-center">
             <Microscope size={36} className="mx-auto mb-2 text-indigo-400" />
             <p className="font-medium">Upload Lab PDF Reports (Optional)</p>
             <p className="text-xs mt-1">AI will parse biochemistry markers automatically.</p>
           </div>
        </div>
      );
      case 8: return (
        <div className="space-y-4 animate-fadeIn">
            <label className="text-sm text-slate-400">Primary Classification Pathway</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {['Cardiac', 'Respiratory', 'Metabolic', 'Neurological', 'Oncology', 'Unknown'].map(d => (
                <div key={d} onClick={() => updateForm('disease', d)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${formData.disease === d ? 'border-purple-500 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.disease === d ? 'border-purple-400' : 'border-slate-500'}`}>
                    {formData.disease === d && <div className="w-2 h-2 bg-purple-400 rounded-full" />}
                  </div>
                  {d}
                </div>
              ))}
            </div>
        </div>
      );
      case 9: return (
        <div className="space-y-4 animate-fadeIn">
            <label className="text-sm text-slate-400">Optimization Goal for Simulation AI</label>
            <select value={formData.treatmentGoal} onChange={e => updateForm('treatmentGoal', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-medium text-lg">
              <optgroup label="Clinical Goals">
                 <option>Low Risk / Conservative</option>
                 <option>Fast Recovery</option>
              </optgroup>
              <optgroup label="Logistical Goals">
                 <option>Cost-effective</option>
                 <option>Experimental / High Risk</option>
              </optgroup>
            </select>
            
            <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
               <Bot className="mx-auto mb-3 text-blue-400 animate-pulse" size={32} />
               <h3 className="text-blue-200 font-bold mb-1">Ready to synthesize Twin Profile</h3>
               <p className="text-xs text-blue-300/70 max-w-sm mx-auto">This securely compiles 42+ biological data points into a unique signature for inference engine simulation.</p>
            </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex justify-center items-center px-4 md:px-0">
      <div className="glass-panel w-full max-w-4xl p-0 overflow-hidden relative rounded-2xl sm:rounded-3xl border-slate-700/50 flex flex-col md:flex-row">
        
        {/* Left Sidebar - Progress */}
        <div className="bg-slate-900/80 md:w-1/3 p-6 md:p-8 border-r border-slate-800">
           <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-8 tracking-wide">
             Intake Protocol
           </h2>
           
           <div className="hidden md:flex flex-col gap-6 relative">
             <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-slate-700 z-0"></div>
             {steps.map((step, idx) => {
                const Icon = step.icon;
                const active = currentStep === step.id;
                const past = currentStep > step.id;
                
                return (
                  <div key={step.id} className="relative z-10 flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${active ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : past ? 'bg-purple-500/50' : 'bg-slate-800 border-2 border-slate-700'}`}>
                      {active && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm font-medium transition-all ${active ? 'text-white translate-x-1' : past ? 'text-slate-400' : 'text-slate-600'}`}>
                      {step.title}
                    </span>
                  </div>
                )
             })}
           </div>
           
           {/* Mobile mini progress */}
           <div className="md:hidden flex justify-between items-center text-sm font-bold text-blue-400">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{steps[currentStep-1].title}</span>
           </div>
        </div>

        {/* Right Content - Form */}
        <div className="p-6 md:p-10 flex-1 flex flex-col min-h-[500px] relative bg-[#0f172a]">
          
          <div className="flex justify-between items-start mb-6 align-top">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                {React.createElement(steps[currentStep-1].icon, { className: "text-blue-500", size: 24 })} 
                {steps[currentStep-1].title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Layer 1 Collection</p>
            </div>
            
            {currentStep === 1 && (
              <button type="button" onClick={autoFill} className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-full hover:bg-purple-500/30 transition-all flex items-center gap-1 font-semibold">
                Auto-fill Sample
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1">
              {renderStep()}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
               <button 
                 type="button" 
                 onClick={prevStep}
                 className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
               >
                 <ArrowLeft size={16} /> Back
               </button>
               
               {currentStep < 9 ? (
                 <button 
                   type="button" 
                   onClick={nextStep}
                   className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                 >
                   Next Step <ArrowRight size={16} />
                 </button>
               ) : (
                 <button 
                   type="submit" 
                   disabled={loading || !formData.name}
                   className={`px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 
                    ${loading || !formData.name ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]'}`}
                 >
                   {loading ? (
                     <><Loader2 size={16} className="animate-spin" /> Digitizing Profile...</>
                   ) : (
                     <><Dna size={16} /> Generate Twin Model</>
                   )}
                 </button>
               )}
            </div>
          </form>
        </div>
      </div>
      
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PatientForm;
