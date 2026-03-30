import React, { useState } from 'react';
import { 
  DollarSign, 
  Syringe, 
  AlertTriangle, 
  Send,
  Plus,
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Zap,
  FlaskConical
} from 'lucide-react';

/**
 * LightHITLPanel - Human-in-the-Loop controls with Clinical Update Injection
 * 
 * Two sections:
 * 1. Quick Constraints (insurance, allergies, etc.)
 * 2. Clinical Update Injections (vital spikes that trigger alerts)
 */

// Quick constraint interventions
const QUICK_CONSTRAINTS = [
  {
    id: 'insurance_lost',
    label: 'Lost Insurance',
    icon: DollarSign,
    constraint: 'Patient insurance coverage changed. Restrict to generic medications under $50/month.',
    color: '#f59e0b'
  },
  {
    id: 'new_allergy',
    label: 'New Allergy',
    icon: AlertTriangle,
    constraint: 'New sulfa drug allergy reported. Re-evaluate all medications for cross-reactivity.',
    color: '#ef4444'
  },
  {
    id: 'treatment_failed',
    label: 'Treatment Failed',
    icon: FlaskConical,
    constraint: 'Standard treatment pathways exhausted. Patient not responding to conventional therapy.',
    color: '#d946ef',
    triggersResearchAgent: true,
    researchResponse: {
      agent: 'research',
      type: 'research',
      message: 'Standard treatment pathways exhausted. Scanning clinical trial database... MATCH FOUND: Patient meets eligibility criteria for Trial NCT04821934 - "Novel GLP-1/GIP dual agonist for treatment-resistant T2DM." Recommend enrollment discussion with patient.'
    }
  },
];

// Clinical update injections (vital spikes)
const CLINICAL_INJECTIONS = [
  {
    id: 'glucose_spike',
    label: 'Glucose Spike → 180',
    icon: Droplets,
    type: 'vital_change',
    vital: 'glucose',
    value: 180,
    alert: '[SYSTEM ALERT] Glucose spiked to 180 mg/dL. Hyperglycemic event detected.',
    agentResponse: {
      agent: 'endocrinologist',
      message: 'ALERT: Acute hyperglycemia detected. Previous consensus void. Recommend immediate pivot to sliding-scale insulin and hold oral hypoglycemics pending stabilization.'
    },
    color: '#dc2626'
  },
  {
    id: 'bp_spike',
    label: 'BP Spike → 165/100',
    icon: Heart,
    type: 'vital_change',
    vital: 'bloodPressure',
    value: { systolic: 165, diastolic: 100 },
    alert: '[SYSTEM ALERT] Blood pressure elevated to 165/100. Hypertensive urgency.',
    agentResponse: {
      agent: 'cardiologist',
      message: 'CRITICAL: Hypertensive urgency detected. Suspending current protocol. Recommend IV labetalol and continuous monitoring. All non-essential medications on hold.'
    },
    color: '#dc2626'
  },
  {
    id: 'hr_spike',
    label: 'Heart Rate → 112',
    icon: Activity,
    type: 'vital_change',
    vital: 'heartRate',
    value: 112,
    alert: '[SYSTEM ALERT] NEWS2 Score elevated. Tachycardia detected (HR: 112).',
    agentResponse: {
      agent: 'cardiologist',
      message: 'WARNING: Tachycardia indicates possible adverse drug reaction or underlying deterioration. Forcing agent re-evaluation for acute cardiac stress.'
    },
    color: '#dc2626'
  },
  {
    id: 'fever',
    label: 'Fever → 101.2°F',
    icon: Thermometer,
    type: 'vital_change',
    vital: 'temperature',
    value: 101.2,
    alert: '[SYSTEM ALERT] Febrile episode detected. Temperature 101.2°F.',
    agentResponse: {
      agent: 'pharmacologist',
      message: 'ALERT: New fever suggests possible infection or drug reaction. Recommend blood cultures and hold immunosuppressive agents pending workup.'
    },
    color: '#f97316'
  },
];

export default function LightHITLPanel({ onIntervene, onClinicalInjection, status }) {
  const [customInput, setCustomInput] = useState('');
  const [activeButton, setActiveButton] = useState(null);
  const [injectionFlash, setInjectionFlash] = useState(null);
  
  const isActive = status === 'running' || status === 'initializing';

  const handleQuickClick = (intervention) => {
    setActiveButton(intervention.id);
    onIntervene({
      ...intervention,
      source: `quick:${intervention.id}`,
      timestamp: new Date().toISOString()
    });
    setTimeout(() => setActiveButton(null), 600);
  };

  const handleClinicalInjection = (injection) => {
    setInjectionFlash(injection.id);
    
    // Trigger the clinical injection handler with full context
    if (onClinicalInjection) {
      onClinicalInjection({
        ...injection,
        source: `clinical:${injection.id}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fallback to regular intervene with alert styling
      onIntervene({
        label: injection.label,
        constraint: injection.alert,
        isAlert: true,
        agentResponse: injection.agentResponse,
        source: `clinical:${injection.id}`,
        timestamp: new Date().toISOString()
      });
    }
    
    setTimeout(() => setInjectionFlash(null), 1000);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    
    onIntervene({
      label: 'Custom Constraint',
      constraint: customInput.trim(),
      source: 'custom',
      timestamp: new Date().toISOString()
    });
    
    setCustomInput('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Section 1: Clinical Update Injections (Most Important for Demo) */}
      <div className="border-b border-slate-200">
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Inject Clinical Update
            </span>
          </div>
          <p className="text-xs text-red-600 mt-0.5">Simulate vital changes to trigger agent re-evaluation</p>
        </div>
        
        <div className="p-3 grid grid-cols-2 gap-2">
          {CLINICAL_INJECTIONS.map((injection) => {
            const Icon = injection.icon;
            const isFlashing = injectionFlash === injection.id;
            
            return (
              <button
                key={injection.id}
                onClick={() => handleClinicalInjection(injection)}
                disabled={!isActive}
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-lg text-left
                  transition-all duration-200 border-2
                  ${isFlashing 
                    ? 'bg-red-100 border-red-400 scale-95' 
                    : 'bg-white border-red-200 hover:border-red-300 hover:bg-red-50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isFlashing ? 'bg-red-500' : 'bg-red-100'}`}>
                  <Icon className={`w-3.5 h-3.5 ${isFlashing ? 'text-white' : 'text-red-500'}`} />
                </div>
                <span className="text-xs font-medium text-slate-700 leading-tight">
                  {injection.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Quick Constraints */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Quick Constraints
          </span>
        </div>
        
        <div className="p-3 space-y-2">
          {QUICK_CONSTRAINTS.map((intervention) => {
            const Icon = intervention.icon;
            const isPressed = activeButton === intervention.id;
            
            return (
              <button
                key={intervention.id}
                onClick={() => handleQuickClick(intervention)}
                disabled={!isActive}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                  transition-all duration-200 border
                  ${isPressed 
                    ? 'border-transparent scale-[0.98]' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                style={{
                  backgroundColor: isPressed ? `${intervention.color}15` : undefined,
                  borderColor: isPressed ? intervention.color : undefined
                }}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${intervention.color}15` }}
                >
                  <Icon className="w-3 h-3" style={{ color: intervention.color }} />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {intervention.label}
                </span>
                <Plus className="w-3 h-3 text-slate-400 ml-auto" />
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <div className="mt-auto p-3 border-t border-slate-100">
          <form onSubmit={handleCustomSubmit} className="relative">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Custom constraint..."
              disabled={!isActive}
              className="
                w-full px-3 py-2 pr-10 rounded-lg text-xs
                bg-slate-100 border border-transparent
                focus:bg-white focus:border-slate-300 focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
                placeholder-slate-400 text-slate-700
              "
            />
            <button
              type="submit"
              disabled={!isActive || !customInput.trim()}
              className="
                absolute right-1.5 top-1/2 -translate-y-1/2
                w-6 h-6 rounded flex items-center justify-center
                bg-blue-500 text-white
                disabled:bg-slate-300 disabled:cursor-not-allowed
                hover:bg-blue-600 transition-colors
              "
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
