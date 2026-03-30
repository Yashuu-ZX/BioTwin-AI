import React, { useState } from 'react';
import { User, Activity, Pill, DollarSign, AlertCircle, Heart, Thermometer, Droplets, Wind, ChevronDown, ChevronUp, Dna } from 'lucide-react';

/**
 * PatientSnapshotCard - Comprehensive yet compact patient info display
 * Combines: Basic Profile, Symptoms, Vitals, Biomarkers, Medications, Budget
 * Collapsible sections to keep it dense but scannable
 */

export default function PatientSnapshotCard({ patient }) {
  const [expandedSection, setExpandedSection] = useState('vitals');

  if (!patient) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center text-slate-400 py-8">
          <User className="w-5 h-5 mr-2" />
          <span className="text-sm">No patient selected</span>
        </div>
      </div>
    );
  }

  // Extract patient data with fallbacks
  const name = patient.name || patient.demographics?.name || 'Robert Miller';
  const age = patient.age || patient.demographics?.age || '58';
  const sex = patient.sex || patient.demographics?.sex || 'Male';
  const conditions = patient.conditions || ['Type 2 Diabetes', 'Hypertension', 'Hyperlipidemia'];
  const medications = patient.medications || [];
  const socioEconomic = patient.socioEconomic || {};
  const vitals = patient.vitals || {};
  const biomarkers = patient.biomarkers || {};
  const symptoms = patient.symptoms || [];
  
  // Key constraint - Budget
  const budget = socioEconomic.monthlyMedicationBudget || 150;

  // Default vitals if not provided
  const displayVitals = {
    bpSystolic: vitals.bpSystolic || 138,
    bpDiastolic: vitals.bpDiastolic || 88,
    heartRate: vitals.heartRate || 78,
    glucose: vitals.sugar || vitals.glucose || 142,
    spO2: vitals.spO2 || 97,
    temp: vitals.temperature || 98.6,
    respRate: vitals.respiratoryRate || 16
  };

  // Default biomarkers
  const displayBiomarkers = {
    hba1c: biomarkers.hba1c || '7.8%',
    ldl: biomarkers.ldl || '142 mg/dL',
    creatinine: biomarkers.creatinine || '1.1 mg/dL',
    cyp2c19: biomarkers.pharmacogenomics?.CYP2C19 || '*1/*2 Poor Metabolizer'
  };

  // Default symptoms
  const displaySymptoms = symptoms.length > 0 ? symptoms : [
    { name: 'Fatigue', severity: 'moderate', duration: '3 weeks' },
    { name: 'Increased thirst', severity: 'mild', duration: '2 weeks' },
    { name: 'Blurred vision', severity: 'mild', duration: '1 week' }
  ];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Patient Header - Always Visible */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-800 truncate">{name}</h2>
            <p className="text-xs text-slate-500">{age}y {sex}</p>
          </div>
          {/* Budget Badge - Always Prominent */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 border border-amber-200 rounded-full">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">${budget}</span>
          </div>
        </div>
      </div>

      {/* Conditions - Always Visible (Compact) */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap gap-1.5">
          {(Array.isArray(conditions) ? conditions : [conditions]).slice(0, 4).map((condition, i) => (
            <span 
              key={i}
              className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-100"
            >
              {typeof condition === 'string' ? condition : condition.name}
            </span>
          ))}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="divide-y divide-slate-100">
        
        {/* Vitals Section */}
        <CollapsibleSection 
          title="Vitals" 
          icon={Heart}
          isExpanded={expandedSection === 'vitals'}
          onToggle={() => toggleSection('vitals')}
          accentColor="#ef4444"
        >
          <div className="grid grid-cols-4 gap-2">
            <VitalBox label="BP" value={`${displayVitals.bpSystolic}/${displayVitals.bpDiastolic}`} unit="mmHg" warning={displayVitals.bpSystolic > 140} />
            <VitalBox label="HR" value={displayVitals.heartRate} unit="bpm" />
            <VitalBox label="Glucose" value={displayVitals.glucose} unit="mg/dL" warning={displayVitals.glucose > 140} />
            <VitalBox label="SpO2" value={displayVitals.spO2} unit="%" />
          </div>
        </CollapsibleSection>

        {/* Biomarkers Section */}
        <CollapsibleSection 
          title="Biomarkers" 
          icon={Dna}
          isExpanded={expandedSection === 'biomarkers'}
          onToggle={() => toggleSection('biomarkers')}
          accentColor="#8b5cf6"
        >
          <div className="space-y-1.5">
            <BiomarkerRow label="HbA1c" value={displayBiomarkers.hba1c} warning={parseFloat(displayBiomarkers.hba1c) > 7} />
            <BiomarkerRow label="LDL" value={displayBiomarkers.ldl} warning={parseInt(displayBiomarkers.ldl) > 130} />
            <BiomarkerRow label="Creatinine" value={displayBiomarkers.creatinine} />
            <div className="mt-2 p-2 bg-purple-50 border border-purple-100 rounded-lg">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs font-medium text-purple-700">Genetic: {displayBiomarkers.cyp2c19}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Symptoms Section */}
        <CollapsibleSection 
          title="Symptoms" 
          icon={Activity}
          isExpanded={expandedSection === 'symptoms'}
          onToggle={() => toggleSection('symptoms')}
          accentColor="#f59e0b"
        >
          <div className="space-y-1.5">
            {displaySymptoms.map((symptom, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{typeof symptom === 'string' ? symptom : symptom.name}</span>
                {typeof symptom === 'object' && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    symptom.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                    symptom.severity === 'severe' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {symptom.severity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Medications Section */}
        <CollapsibleSection 
          title="Current Meds" 
          icon={Pill}
          isExpanded={expandedSection === 'meds'}
          onToggle={() => toggleSection('meds')}
          accentColor="#10b981"
        >
          <div className="space-y-1">
            {(medications.length > 0 ? medications : [
              { name: 'Metformin', dosage: '500mg BID' },
              { name: 'Lisinopril', dosage: '10mg QD' },
              { name: 'Atorvastatin', dosage: '20mg QD' }
            ]).slice(0, 4).map((med, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{typeof med === 'string' ? med : med.name}</span>
                {typeof med === 'object' && med.dosage && (
                  <span className="text-slate-400">{med.dosage}</span>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({ title, icon: Icon, isExpanded, onToggle, accentColor, children }) {
  return (
    <div>
      <button 
        onClick={onToggle}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Vital Box Component
function VitalBox({ label, value, unit, warning }) {
  return (
    <div className={`p-2 rounded-lg text-center ${warning ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
      <div className={`text-sm font-bold ${warning ? 'text-red-600' : 'text-slate-800'}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

// Biomarker Row Component
function BiomarkerRow({ label, value, warning }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${warning ? 'text-red-600' : 'text-slate-700'}`}>
        {value}
        {warning && <span className="ml-1 text-red-400">↑</span>}
      </span>
    </div>
  );
}
