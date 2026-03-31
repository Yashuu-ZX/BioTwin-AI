import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { User, Activity, Dna, FileText, Pill, HeartPulse, Microscope, Target, ArrowRight, ArrowLeft, Loader2, Bot, CheckCircle2, AlertTriangle, BrainCircuit, Sparkles, Shuffle } from 'lucide-react';
import { getRandomPatient } from '../data/patientDataset';

const steps = [
  { id: 1, title: 'Basic Profile', icon: User },
  { id: 2, title: 'Symptoms', icon: Activity },
  { id: 3, title: 'Medical History', icon: FileText },
  { id: 4, title: 'Medications', icon: Pill },
  { id: 5, title: 'Lifestyle', icon: Dna },
  { id: 6, title: 'Vitals Input', icon: HeartPulse },
  { id: 7, title: 'Biomarkers', icon: BrainCircuit },
  { id: 8, title: 'Disease Mapping', icon: Microscope },
  { id: 9, title: 'Treatment Goal', icon: Target }
];

const PatientForm = ({ role = 'doctor', darkMode = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [labPanelText, setLabPanelText] = useState('');
  const [parsingLab, setParsingLab] = useState(false);
  
  // State for all 9 steps
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', height: '', weight: '', bloodGroup: 'A+',
    symptoms: [], symptomSeverity: 5, symptomDuration: '',
    medicalHistory: { conditions: [], surgeries: '', familyHistory: '' },
    medications: [{ name: '', dosage: '', frequency: '' }],
    biomarkers: {
      genomicVariant: 'Not Assessed',
      therapyTarget: 'Broad Standard of Care',
      expressionLevel: 'Unknown',
      resistanceMarker: 'None reported',
      immuneProfile: 'Baseline',
      // Structured genomics for clinical trial matching
      genomics: {
        variants: [], // Array of { gene, mutation, significance }
        tumorMutationBurden: '',
        microsatelliteStatus: 'Unknown', // MSS, MSI-L, MSI-H
        pdL1Expression: '',
        herStatus: 'Unknown', // Positive, Negative, Equivocal, Unknown
        hormoneReceptors: { er: 'Unknown', pr: 'Unknown' }
      },
      // Pharmacogenomics for drug dosing
      pharmacogenomics: {
        cyp2d6: 'Unknown',
        cyp2c19: 'Unknown',
        cyp2c9: 'Unknown',
        vkorc1: 'Unknown',
        tpmt: 'Unknown'
      }
    },
    // Allergies for safety checking
    allergies: [], // Array of { allergen, reaction, severity }
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

  const autoFill = useCallback(() => {
    // Get a random patient from the 100-patient dataset
    const randomPatient = getRandomPatient();
    
    setFormData({
      name: randomPatient.name,
      age: randomPatient.age,
      gender: randomPatient.gender,
      height: randomPatient.height,
      weight: randomPatient.weight,
      bloodGroup: randomPatient.bloodGroup,
      symptoms: randomPatient.symptoms,
      symptomSeverity: randomPatient.symptomSeverity,
      symptomDuration: randomPatient.symptomDuration,
      medicalHistory: randomPatient.medicalHistory,
      medications: randomPatient.medications,
      biomarkers: randomPatient.biomarkers,
      allergies: randomPatient.allergies,
      lifestyle: randomPatient.lifestyle,
      vitals: randomPatient.vitals,
      disease: randomPatient.disease,
      treatmentGoal: randomPatient.treatmentGoal
    });
    setCurrentStep(9);
    setSubmitStatus({ 
      type: 'info', 
      message: `Loaded: ${randomPatient.name} (${randomPatient.age}yo ${randomPatient.gender}, ${randomPatient.disease}). Click again for a different patient.` 
    });
  }, []);

  useEffect(() => {
    if (searchParams.get('demo') === '1' && role !== 'patient') {
      autoFill();
    }
  }, [searchParams, role, autoFill]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus({ type: 'loading', message: 'Digitizing profile and constructing patient twin...' });
    try {
      const response = await apiClient.post('/patient/intake', formData);
      setSubmitStatus({ type: 'success', message: 'Digital twin created. Opening the clinical dashboard...' });
      navigate(`/dashboard/${response.data.patientId}`);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || err?.message || 'Failed to construct Digital Health Profile. Please try again.';
      setSubmitStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const parseLabPanel = async () => {
    if (!labPanelText.trim()) return;
    setParsingLab(true);
    setSubmitStatus({ type: 'loading', message: 'Parsing lab panel into structured biomarkers...' });
    try {
      const response = await apiClient.post('/patient/parse-lab', { rawText: labPanelText });
      const { parsedVitals, parsedBiomarkers, summary } = response.data;
      setFormData((prev) => ({
        ...prev,
        vitals: { ...prev.vitals, ...parsedVitals },
        biomarkers: { ...prev.biomarkers, ...parsedBiomarkers },
      }));
      setSubmitStatus({ type: 'success', message: summary });
    } catch (err) {
      console.error(err);
      setSubmitStatus({ type: 'error', message: err?.response?.data?.error || err?.message || 'Failed to parse lab panel text.' });
    } finally {
      setParsingLab(false);
    }
  };

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, 9));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

  // Helper arrays
  const conditionList = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'CAD', 'Obesity', 'Arrhythmia'];
  const symptomList = ['Fever', 'Cough', 'Fatigue', 'Chest Pain', 'Shortness of Breath', 'Nausea'];

  const toggleArray = (arr, item) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const shellClass = darkMode
    ? 'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_26%),linear-gradient(180deg,_#07111f_0%,_#0f172a_100%)]'
    : 'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,255,102,0.24),_transparent_26%),linear-gradient(180deg,_#edf5e8_0%,_#deefd2_100%)]';
  const heroCardClass = darkMode
    ? 'border-slate-800 bg-slate-900/75 text-white'
    : 'border-white/70 bg-[#f6f3ee]/88 text-slate-900 shadow-[0_24px_80px_rgba(80,110,88,0.12)]';
  const bigCardClass = darkMode
    ? 'glass-panel border-slate-700/50'
    : 'border border-white/70 bg-[#f6f3ee]/92 shadow-[0_24px_80px_rgba(80,110,88,0.12)]';
  const sidebarClass = darkMode
    ? 'bg-slate-900/80 border-slate-800 text-white'
    : 'bg-white/65 border-black/5 text-slate-900';
  const contentClass = darkMode
    ? 'bg-[#0f172a] text-white'
    : 'bg-[linear-gradient(180deg,#f8f6f0_0%,#f3f8ed_100%)] text-slate-900';
  const inputClass = darkMode
    ? 'w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white'
    : 'w-full bg-[#f1eee7] border border-black/5 rounded-xl p-3 text-slate-900 placeholder:text-slate-400';
  const labelClass = darkMode ? 'text-sm text-slate-400' : 'text-sm text-slate-500';
  const mutedTextClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const chipIdleClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
    : 'bg-white border-black/10 text-slate-600 hover:border-lime-300 hover:bg-lime-50';
  const sectionCardClass = darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-white/80 border-black/5';

  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Full Name</label><input type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)} className={inputClass} placeholder="John Doe" /></div>
            <div><label className={labelClass}>Age</label><input type="number" value={formData.age} onChange={e => updateForm('age', e.target.value)} className={inputClass} placeholder="45" /></div>
            <div><label className={labelClass}>Gender</label><select value={formData.gender} onChange={e => updateForm('gender', e.target.value)} className={inputClass}><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label className={labelClass}>Blood Group</label><select value={formData.bloodGroup} onChange={e => updateForm('bloodGroup', e.target.value)} className={inputClass}><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option></select></div>
            <div><label className={labelClass}>Height (cm)</label><input type="number" value={formData.height} onChange={e => updateForm('height', e.target.value)} className={inputClass} placeholder="175" /></div>
            <div><label className={labelClass}>Weight (kg)</label><input type="number" value={formData.weight} onChange={e => updateForm('weight', e.target.value)} className={inputClass} placeholder="70" /></div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <label className={`${labelClass} block mb-2`}>Select Primary Symptoms</label>
            <div className="flex flex-wrap gap-2">
              {symptomList.map(sym => (
                <button key={sym} type="button" onClick={() => updateForm('symptoms', toggleArray(formData.symptoms, sym))} className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.symptoms.includes(sym) ? (darkMode ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-lime-100 border-lime-300 text-lime-700') : chipIdleClass}`}>{sym}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={`${labelClass} block mb-2 flex justify-between`}><span>Symptom Severity (1-10)</span> <span className={darkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{formData.symptomSeverity}</span></label>
            <input type="range" min="1" max="10" value={formData.symptomSeverity} onChange={e => updateForm('symptomSeverity', parseInt(e.target.value, 10) || 5)} className="w-full accent-blue-500" />
          </div>
          <div><label className={labelClass}>Duration (Days)</label><input type="number" value={formData.symptomDuration} onChange={e => updateForm('symptomDuration', e.target.value)} className={`${inputClass} mt-1`} placeholder="e.g. 5" /></div>
        </div>
      );
      case 3: return (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <label className={`${labelClass} block mb-2`}>Pre-existing Conditions</label>
            <div className="flex flex-wrap gap-2">
              {conditionList.map(cond => (
                 <button key={cond} type="button" onClick={() => updateNested('medicalHistory', 'conditions', toggleArray(formData.medicalHistory.conditions, cond))} className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.medicalHistory.conditions.includes(cond) ? (darkMode ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-lime-100 border-lime-300 text-lime-700') : chipIdleClass}`}>{cond}</button>
              ))}
            </div>
          </div>
          <div><label className={`${labelClass} block mb-1`}>Past Surgeries / Operations</label><textarea value={formData.medicalHistory.surgeries} onChange={e => updateNested('medicalHistory', 'surgeries', e.target.value)} className={`${inputClass} h-24`} placeholder="None" /></div>
          <div><label className={`${labelClass} block mb-1`}>Family History</label><textarea value={formData.medicalHistory.familyHistory} onChange={e => updateNested('medicalHistory', 'familyHistory', e.target.value)} className={`${inputClass} h-24`} placeholder="Mother: Hypertension" /></div>
        </div>
      );
      case 4: return (
        <div className="space-y-4 animate-fadeIn">
           {formData.medications.map((med, idx) => (
             <div key={idx} className={`grid grid-cols-12 gap-2 pb-4 border-b ${darkMode ? 'border-slate-700/50' : 'border-black/5'}`}>
                <div className="col-span-12 md:col-span-5"><label className="text-xs text-slate-500">Drug Name</label><input type="text" value={med.name} onChange={e => {
                   const newMeds = formData.medications.map((m, i) => i === idx ? { ...m, name: e.target.value } : m); updateForm('medications', newMeds);
                }} className={inputClass} placeholder="Drug Name" /></div>
                <div className="col-span-6 md:col-span-3"><label className="text-xs text-slate-500">Dosage</label><input type="text" value={med.dosage} onChange={e => {
                   const newMeds = formData.medications.map((m, i) => i === idx ? { ...m, dosage: e.target.value } : m); updateForm('medications', newMeds);
                }} className={inputClass} placeholder="20mg" /></div>
                <div className="col-span-6 md:col-span-4"><label className="text-xs text-slate-500">Frequency</label><input type="text" value={med.frequency} onChange={e => {
                   const newMeds = formData.medications.map((m, i) => i === idx ? { ...m, frequency: e.target.value } : m); updateForm('medications', newMeds);
                }} className={inputClass} placeholder="Once daily" /></div>
              </div>
            ))}
            <button type="button" onClick={() => updateForm('medications', [...formData.medications, { name: '', dosage: '', frequency: '' }])} className={`text-sm font-semibold ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-lime-700 hover:text-lime-800'}`}>+ Add Medication</button>
         </div>
      );
      case 5: return (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Smoking</label><select value={formData.lifestyle.smoking} onChange={e => updateNested('lifestyle', 'smoking', e.target.value)} className={inputClass}><option>No</option><option>Past</option><option>Yes</option></select></div>
            <div><label className={labelClass}>Alcohol</label><select value={formData.lifestyle.alcohol} onChange={e => updateNested('lifestyle', 'alcohol', e.target.value)} className={inputClass}><option>No</option><option>Rarely</option><option>Occasionally</option><option>Frequently</option></select></div>
            <div><label className={labelClass}>Exercise</label><select value={formData.lifestyle.exercise} onChange={e => updateNested('lifestyle', 'exercise', e.target.value)} className={inputClass}><option>None</option><option>Rarely</option><option>Moderate</option><option>Active</option></select></div>
            <div><label className={labelClass}>Diet</label><select value={formData.lifestyle.diet} onChange={e => updateNested('lifestyle', 'diet', e.target.value)} className={inputClass}><option>Poor</option><option>Average</option><option>Healthy</option></select></div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-4 animate-fadeIn">
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className={labelClass}>Heart Rate (bpm)</label><input type="number" value={formData.vitals.heartRate} onChange={e => updateNested('vitals', 'heartRate', parseInt(e.target.value, 10) || 0)} className={inputClass} /></div>
            <div><label className={labelClass}>BP Systolic</label><input type="number" value={formData.vitals.bpSystolic} onChange={e => updateNested('vitals', 'bpSystolic', parseInt(e.target.value, 10) || 0)} className={inputClass} /></div>
            <div><label className={labelClass}>BP Diastolic</label><input type="number" value={formData.vitals.bpDiastolic} onChange={e => updateNested('vitals', 'bpDiastolic', parseInt(e.target.value, 10) || 0)} className={inputClass} /></div>
            <div><label className={labelClass}>Fasting Sugar (mg/dL)</label><input type="number" value={formData.vitals.sugar} onChange={e => updateNested('vitals', 'sugar', parseInt(e.target.value, 10) || 0)} className={inputClass} /></div>
            <div><label className={labelClass}>SpO2 (%)</label><input type="number" value={formData.vitals.spO2} onChange={e => updateNested('vitals', 'spO2', parseInt(e.target.value, 10) || 0)} className={inputClass} /></div>
            <div><label className={labelClass}>Body Temp (°F)</label><input type="number" value={formData.vitals.temperature} onChange={e => updateNested('vitals', 'temperature', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
           </div>
        </div>
      );
      case 7: return (
        <div className="space-y-4 animate-fadeIn">
          <div className={`rounded-2xl border p-4 text-sm ${darkMode ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100' : 'border-lime-200 bg-lime-50 text-lime-700'}`}>
            Capture high-value biomarker context to make the twin more useful for specialized treatment selection and clinical trial matching.
          </div>
          
          {/* Lab Panel Parser */}
          <div className={`rounded-2xl border p-4 space-y-3 ${sectionCardClass}`}>
            <label className={`text-sm flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}><Microscope size={16} className={darkMode ? 'text-cyan-300' : 'text-lime-600'} /> Mock Lab Panel Parser</label>
            <textarea value={labPanelText} onChange={e => setLabPanelText(e.target.value)} className={`${inputClass} h-20`} placeholder="Paste text like: Glucose 144, BP 145/92, SpO2 95, Variant EGFR exon 19" />
            <button type="button" onClick={parseLabPanel} disabled={parsingLab || !labPanelText.trim()} className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:bg-slate-700 disabled:text-slate-400 ${darkMode ? 'bg-cyan-500 text-slate-950' : 'bg-lime-500 text-slate-900'}`}>
              {parsingLab ? 'Parsing...' : 'Parse Lab Panel'}
            </button>
          </div>

          {/* Legacy Biomarkers */}
          <div className={`rounded-2xl border p-4 space-y-3 ${sectionCardClass}`}>
            <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>General Biomarkers</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className={labelClass}>Genomic Variant (Free Text)</label><input type="text" value={formData.biomarkers.genomicVariant} onChange={e => updateNested('biomarkers', 'genomicVariant', e.target.value)} className={inputClass} placeholder="e.g. EGFR exon 19, CYP2C19" /></div>
              <div><label className={labelClass}>Therapy Target</label><input type="text" value={formData.biomarkers.therapyTarget} onChange={e => updateNested('biomarkers', 'therapyTarget', e.target.value)} className={inputClass} placeholder="e.g. HER2, inflammatory axis" /></div>
              <div><label className={labelClass}>Expression Level</label><select value={formData.biomarkers.expressionLevel} onChange={e => updateNested('biomarkers', 'expressionLevel', e.target.value)} className={inputClass}><option>Unknown</option><option>High</option><option>Medium</option><option>Low</option><option>Elevated inflammatory burden</option></select></div>
              <div><label className={labelClass}>Immune Profile</label><select value={formData.biomarkers.immuneProfile} onChange={e => updateNested('biomarkers', 'immuneProfile', e.target.value)} className={inputClass}><option>Baseline</option><option>Immune-cold</option><option>Inflamed</option><option>Chronic low-grade inflammation</option></select></div>
            </div>
          </div>

          {/* Structured Genomics for Clinical Trials */}
          <div className={`rounded-2xl border p-4 space-y-3 ${sectionCardClass}`}>
            <label className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><Dna size={16} className={darkMode ? 'text-purple-400' : 'text-purple-600'} /> Structured Genomics (for Trial Matching)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={labelClass}>MSI Status</label><select value={formData.biomarkers.genomics?.microsatelliteStatus || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, microsatelliteStatus: e.target.value }}}))} className={inputClass}><option>Unknown</option><option>MSS</option><option>MSI-L</option><option>MSI-H</option></select></div>
              <div><label className={labelClass}>HER2 Status</label><select value={formData.biomarkers.genomics?.herStatus || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, herStatus: e.target.value }}}))} className={inputClass}><option>Unknown</option><option>Positive</option><option>Negative</option><option>Equivocal</option></select></div>
              <div><label className={labelClass}>PD-L1 Expression (%)</label><input type="text" value={formData.biomarkers.genomics?.pdL1Expression || ''} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, pdL1Expression: e.target.value }}}))} className={inputClass} placeholder="e.g. 50%" /></div>
              <div><label className={labelClass}>TMB (mut/Mb)</label><input type="text" value={formData.biomarkers.genomics?.tumorMutationBurden || ''} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, tumorMutationBurden: e.target.value }}}))} className={inputClass} placeholder="e.g. 12" /></div>
              <div><label className={labelClass}>ER Status</label><select value={formData.biomarkers.genomics?.hormoneReceptors?.er || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, hormoneReceptors: { ...prev.biomarkers.genomics?.hormoneReceptors, er: e.target.value }}}}))} className={inputClass}><option>Unknown</option><option>Positive</option><option>Negative</option></select></div>
              <div><label className={labelClass}>PR Status</label><select value={formData.biomarkers.genomics?.hormoneReceptors?.pr || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, hormoneReceptors: { ...prev.biomarkers.genomics?.hormoneReceptors, pr: e.target.value }}}}))} className={inputClass}><option>Unknown</option><option>Positive</option><option>Negative</option></select></div>
            </div>
            {/* Genomic Variants List */}
            <div className="mt-3">
              <label className={labelClass}>Known Genomic Variants</label>
              {(formData.biomarkers.genomics?.variants || []).map((variant, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mt-2">
                  <div className="col-span-4"><input type="text" value={variant.gene} onChange={e => { const newVariants = formData.biomarkers.genomics.variants.map((v, i) => i === idx ? { ...v, gene: e.target.value } : v); setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, variants: newVariants }}})); }} className={inputClass} placeholder="Gene (e.g. EGFR)" /></div>
                  <div className="col-span-4"><input type="text" value={variant.mutation} onChange={e => { const newVariants = formData.biomarkers.genomics.variants.map((v, i) => i === idx ? { ...v, mutation: e.target.value } : v); setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, variants: newVariants }}})); }} className={inputClass} placeholder="Mutation (e.g. L858R)" /></div>
                  <div className="col-span-4"><input type="text" value={variant.significance} onChange={e => { const newVariants = formData.biomarkers.genomics.variants.map((v, i) => i === idx ? { ...v, significance: e.target.value } : v); setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, variants: newVariants }}})); }} className={inputClass} placeholder="Significance" /></div>
                </div>
              ))}
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, genomics: { ...prev.biomarkers.genomics, variants: [...(prev.biomarkers.genomics?.variants || []), { gene: '', mutation: '', significance: '' }] }}}))} className={`text-sm font-semibold mt-2 ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-800'}`}>+ Add Variant</button>
            </div>
          </div>

          {/* Pharmacogenomics */}
          <div className={`rounded-2xl border p-4 space-y-3 ${sectionCardClass}`}>
            <label className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><Pill size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} /> Pharmacogenomics (Drug Metabolism)</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div><label className={labelClass}>CYP2D6</label><select value={formData.biomarkers.pharmacogenomics?.cyp2d6 || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, pharmacogenomics: { ...prev.biomarkers.pharmacogenomics, cyp2d6: e.target.value }}}))} className={inputClass}><option>Unknown</option><option>Poor Metabolizer</option><option>Intermediate</option><option>Normal</option><option>Ultrarapid</option></select></div>
              <div><label className={labelClass}>CYP2C19</label><select value={formData.biomarkers.pharmacogenomics?.cyp2c19 || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, pharmacogenomics: { ...prev.biomarkers.pharmacogenomics, cyp2c19: e.target.value }}}))} className={inputClass}><option>Unknown</option><option>Poor Metabolizer</option><option>Intermediate</option><option>Normal</option><option>Ultrarapid</option></select></div>
              <div><label className={labelClass}>CYP2C9</label><select value={formData.biomarkers.pharmacogenomics?.cyp2c9 || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, pharmacogenomics: { ...prev.biomarkers.pharmacogenomics, cyp2c9: e.target.value }}}))} className={inputClass}><option>Unknown</option><option>Poor Metabolizer</option><option>Intermediate</option><option>Normal</option></select></div>
              <div><label className={labelClass}>VKORC1</label><select value={formData.biomarkers.pharmacogenomics?.vkorc1 || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, pharmacogenomics: { ...prev.biomarkers.pharmacogenomics, vkorc1: e.target.value }}}))} className={inputClass}><option>Unknown</option><option>Normal</option><option>Low Dose Required</option><option>Very Low Dose</option></select></div>
              <div><label className={labelClass}>TPMT</label><select value={formData.biomarkers.pharmacogenomics?.tpmt || 'Unknown'} onChange={e => setFormData(prev => ({ ...prev, biomarkers: { ...prev.biomarkers, pharmacogenomics: { ...prev.biomarkers.pharmacogenomics, tpmt: e.target.value }}}))} className={inputClass}><option>Unknown</option><option>Poor Metabolizer</option><option>Intermediate</option><option>Normal</option></select></div>
            </div>
          </div>

          {/* Allergies */}
          <div className={`rounded-2xl border p-4 space-y-3 ${sectionCardClass}`}>
            <label className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><HeartPulse size={16} className={darkMode ? 'text-rose-400' : 'text-rose-600'} /> Drug Allergies & Intolerances</label>
            {(formData.allergies || []).map((allergy, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <div className="col-span-5"><input type="text" value={allergy.allergen} onChange={e => { const newAllergies = formData.allergies.map((a, i) => i === idx ? { ...a, allergen: e.target.value } : a); updateForm('allergies', newAllergies); }} className={inputClass} placeholder="Allergen (e.g. Penicillin)" /></div>
                <div className="col-span-4"><input type="text" value={allergy.reaction} onChange={e => { const newAllergies = formData.allergies.map((a, i) => i === idx ? { ...a, reaction: e.target.value } : a); updateForm('allergies', newAllergies); }} className={inputClass} placeholder="Reaction (e.g. Rash)" /></div>
                <div className="col-span-3"><select value={allergy.severity} onChange={e => { const newAllergies = formData.allergies.map((a, i) => i === idx ? { ...a, severity: e.target.value } : a); updateForm('allergies', newAllergies); }} className={inputClass}><option value="Mild">Mild</option><option value="Moderate">Moderate</option><option value="Severe">Severe</option><option value="Life-threatening">Life-threatening</option></select></div>
              </div>
            ))}
            <button type="button" onClick={() => updateForm('allergies', [...(formData.allergies || []), { allergen: '', reaction: '', severity: 'Moderate' }])} className={`text-sm font-semibold ${darkMode ? 'text-rose-400 hover:text-rose-300' : 'text-rose-700 hover:text-rose-800'}`}>+ Add Allergy</button>
          </div>
        </div>
      );
      case 8: return (
        <div className="space-y-4 animate-fadeIn">
            <label className={labelClass}>Primary Classification Pathway</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {['Cardiac', 'Respiratory', 'Metabolic', 'Neurological', 'Oncology', 'Unknown'].map(d => (
                <div key={d} onClick={() => updateForm('disease', d)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${formData.disease === d ? (darkMode ? 'border-purple-500 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-lime-300 bg-lime-100 text-slate-900 shadow-[0_10px_20px_rgba(163,230,53,0.2)]') : (darkMode ? 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700' : 'border-black/5 bg-white text-slate-600 hover:bg-lime-50')}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.disease === d ? (darkMode ? 'border-purple-400' : 'border-lime-500') : (darkMode ? 'border-slate-500' : 'border-slate-300')}`}>
                    {formData.disease === d && <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-lime-500'}`} />}
                  </div>
                  {d}
                </div>
              ))}
            </div>
        </div>
      );
      case 9: return (
        <div className="space-y-4 animate-fadeIn">
            <label className={labelClass}>Optimization Goal for Simulation AI</label>
            <select value={formData.treatmentGoal} onChange={e => updateForm('treatmentGoal', e.target.value)} className={`${inputClass} font-medium text-lg`}>
              <optgroup label="Clinical Goals">
                 <option>Low Risk / Conservative</option>
                 <option>Fast Recovery</option>
              </optgroup>
              <optgroup label="Logistical Goals">
                 <option>Cost-effective</option>
                 <option>Experimental / High Risk</option>
              </optgroup>
            </select>
            
            <div className={`mt-8 p-6 rounded-xl text-center ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-lime-50 border border-lime-200'}`}>
               <Bot className={`mx-auto mb-3 animate-pulse ${darkMode ? 'text-blue-400' : 'text-lime-600'}`} size={32} />
               <h3 className={`font-bold mb-1 ${darkMode ? 'text-blue-200' : 'text-lime-700'}`}>Ready to synthesize Twin Profile</h3>
               <p className={`text-xs max-w-sm mx-auto ${darkMode ? 'text-blue-300/70' : 'text-lime-700/70'}`}>This securely compiles 42+ biological data points into a unique signature for inference engine simulation.</p>
            </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className={`${shellClass} pt-16 pb-12 flex justify-center items-center px-4 md:px-0`}>
      <div className="w-full max-w-6xl space-y-6">
        <div className={`rounded-[2rem] border p-6 md:p-8 ${heroCardClass}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] ${darkMode ? 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-300' : 'bg-lime-100 text-lime-700'}`}>
                <Sparkles className="h-3.5 w-3.5" /> Precision Intake Studio
              </div>
              <h1 className={`text-3xl md:text-5xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Build a clinically meaningful digital twin</h1>
              <p className={`mt-3 max-w-3xl text-base md:text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{role === 'patient' ? 'Share your symptoms, vitals, and care context so the clinical team can prepare a personalized twin.' : 'Capture phenotype, vitals, lifestyle, and biomarker intelligence before sending the case into treatment simulation.'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <div className={`rounded-2xl border p-4 ${sectionCardClass}`}><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Workflow</p><p className={`mt-2 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>9-step precision intake</p></div>
              <div className={`rounded-2xl border p-4 ${sectionCardClass}`}><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Biology layer</p><p className={`mt-2 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Biomarkers enabled</p></div>
              <div className={`rounded-2xl border p-4 ${sectionCardClass}`}><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Role</p><p className={`mt-2 font-semibold capitalize ${darkMode ? 'text-white' : 'text-slate-900'}`}>{role}</p></div>
            </div>
          </div>
        </div>

      <div className={`w-full max-w-6xl p-0 overflow-hidden relative rounded-2xl sm:rounded-3xl flex flex-col md:flex-row ${bigCardClass}`}>
        
        {/* Left Sidebar - Progress */}
        <div className={`md:w-1/3 p-6 md:p-8 border-r ${sidebarClass}`}>
           <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-8 tracking-wide">
              Intake Protocol
            </h2>
           
           <div className="hidden md:flex flex-col gap-6 relative">
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-slate-700 z-0"></div>
               {steps.map((step) => {
                 const Icon = step.icon;
                 const active = currentStep === step.id;
                 const past = currentStep > step.id;
                 
                 return (
                   <div 
                     key={step.id} 
                     className="relative z-10 flex items-center gap-4 cursor-pointer group"
                     onClick={() => setCurrentStep(step.id)}
                     role="button"
                     tabIndex={0}
                     onKeyDown={(e) => e.key === 'Enter' && setCurrentStep(step.id)}
                   >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${active ? (darkMode ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-lime-500 shadow-[0_0_12px_rgba(163,230,53,0.45)]') : past ? (darkMode ? 'bg-purple-500/50' : 'bg-lime-300') : (darkMode ? 'bg-slate-800 border-2 border-slate-700 group-hover:border-slate-500' : 'bg-[#f1eee7] border-2 border-black/10 group-hover:border-lime-300')}`}>
                        {active && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className={`text-sm font-medium transition-all group-hover:translate-x-1 ${active ? (darkMode ? 'text-white translate-x-1' : 'text-slate-900 translate-x-1') : past ? mutedTextClass : darkMode ? 'text-slate-600 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-slate-600'}`}>
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
         <div className={`p-6 md:p-10 flex-1 flex flex-col min-h-[500px] relative ${contentClass}`}>
          
          <div className="flex justify-between items-start mb-6 align-top">
            <div>
               <h3 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                 {React.createElement(steps[currentStep-1].icon, { className: darkMode ? 'text-blue-500' : 'text-lime-600', size: 24 })} 
                 {steps[currentStep-1].title}
               </h3>
               <p className={`text-xs mt-1 uppercase tracking-wider ${mutedTextClass}`}>Layer 1 Collection</p>
             </div>
            
            {role !== 'patient' && (
               <button type="button" onClick={autoFill} className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1 font-semibold ${darkMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30' : 'bg-lime-100 text-lime-700 border border-lime-200 hover:bg-lime-200'}`}>
                 <Shuffle size={12} /> Random Patient
               </button>
            )}
          </div>

           <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
             <div className="flex-1">
               {renderStep()}

               {submitStatus.message && (
                 <div className={`mt-6 rounded-2xl border p-4 text-sm ${
                   submitStatus.type === 'success'
                    ? (darkMode ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700')
                     : submitStatus.type === 'error'
                     ? (darkMode ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700')
                     : (darkMode ? 'border-blue-500/30 bg-blue-500/10 text-blue-200' : 'border-lime-200 bg-lime-50 text-lime-700')
                 }`}>
                   <div className="flex items-start gap-3">
                     {submitStatus.type === 'success' ? (
                       <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />
                     ) : submitStatus.type === 'error' ? (
                       <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
                     ) : (
                       <Loader2 className={`mt-0.5 h-5 w-5 flex-none ${submitStatus.type === 'loading' ? 'animate-spin' : ''}`} />
                     )}
                     <div>
                       <p className="font-semibold">
                         {submitStatus.type === 'success'
                           ? 'Twin ready'
                           : submitStatus.type === 'error'
                           ? 'Submission failed'
                           : 'Processing status'}
                       </p>
                       <p className="mt-1 opacity-90">{submitStatus.message}</p>
                     </div>
                   </div>
                 </div>
               )}
             </div>
            
             <div className={`mt-8 pt-6 border-t flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-black/5'}`}>
                <button 
                  type="button" 
                  onClick={prevStep}
                  className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                >
                  <ArrowLeft size={16} /> Back
                </button>
               
               {currentStep < 9 ? (
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className={`px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-lime-500 hover:bg-lime-400 text-slate-900 shadow-[0_10px_25px_rgba(163,230,53,0.35)]'}`}
                  >
                    Next Step <ArrowRight size={16} />
                  </button>
               ) : (
                 <button 
                   type="submit" 
                   disabled={loading || !formData.name}
                   className={`px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 
                     ${loading || !formData.name ? (darkMode ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : (darkMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-gradient-to-r from-lime-400 to-emerald-300 text-slate-900 hover:from-lime-300 hover:to-emerald-200 shadow-[0_12px_30px_rgba(163,230,53,0.35)]')}`}
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
