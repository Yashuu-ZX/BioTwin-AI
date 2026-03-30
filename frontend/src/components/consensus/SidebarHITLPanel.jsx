import React, { useState } from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  Send,
  Zap,
  Activity,
  Heart,
  Droplets,
  FlaskConical
} from 'lucide-react';

/**
 * SidebarHITLPanel - Compact intervention controls for the right sidebar
 * Includes both quick constraints and clinical vital injections
 */

const INTERVENTIONS = [
  {
    id: 'insurance_lost',
    label: 'Lost Insurance',
    icon: DollarSign,
    constraint: 'Patient lost insurance coverage. Restrict to generics under $50/month.',
    color: '#f59e0b'
  },
  {
    id: 'new_allergy',
    label: 'New Allergy',
    icon: AlertTriangle,
    constraint: 'New drug allergy reported. Re-evaluate for cross-reactivity.',
    color: '#ef4444'
  },
  {
    id: 'treatment_failed',
    label: 'Treatment Failed',
    icon: FlaskConical,
    constraint: 'Standard treatments exhausted. Activate Research Agent.',
    color: '#d946ef',
    triggersResearchAgent: true,
    researchResponse: {
      agent: 'research',
      type: 'research',
      message: 'Standard pathways exhausted. MATCH FOUND: Trial NCT04821934 - Novel GLP-1/GIP dual agonist. Patient eligible for enrollment.'
    }
  },
];

const VITAL_INJECTIONS = [
  {
    id: 'glucose_spike',
    label: 'Glucose → 180',
    icon: Droplets,
    alert: '[ALERT] Glucose spiked to 180 mg/dL',
    agentResponse: { agent: 'endocrinologist', message: 'Hyperglycemia detected. Pivoting to insulin therapy.' },
    color: '#dc2626'
  },
  {
    id: 'bp_spike',
    label: 'BP → 165/100',
    icon: Heart,
    alert: '[ALERT] BP elevated to 165/100',
    agentResponse: { agent: 'cardiologist', message: 'Hypertensive urgency. Recommend IV intervention.' },
    color: '#dc2626'
  },
  {
    id: 'hr_spike',
    label: 'HR → 112',
    icon: Activity,
    alert: '[ALERT] Tachycardia detected (HR: 112)',
    agentResponse: { agent: 'cardiologist', message: 'NEWS2 elevated. Forcing cardiac re-evaluation.' },
    color: '#dc2626'
  },
];

export default function SidebarHITLPanel({ onIntervene, onClinicalInjection, status }) {
  const [customInput, setCustomInput] = useState('');
  const [activeId, setActiveId] = useState(null);
  
  const isActive = status === 'running' || status === 'initializing' || status === 'consensus';

  const handleClick = (item, isVital = false) => {
    setActiveId(item.id);
    
    if (isVital && onClinicalInjection) {
      onClinicalInjection({
        ...item,
        isAlert: true,
        source: `vital:${item.id}`,
        timestamp: new Date().toISOString()
      });
    } else {
      onIntervene({
        ...item,
        source: `quick:${item.id}`,
        timestamp: new Date().toISOString()
      });
    }
    
    setTimeout(() => setActiveId(null), 500);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onIntervene({
      label: 'Custom',
      constraint: customInput.trim(),
      source: 'custom',
      timestamp: new Date().toISOString()
    });
    setCustomInput('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-slate-700">Quick Interventions</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Clinical Vital Injections */}
        <div>
          <p className="text-xs text-red-600 font-medium mb-2">Inject Vital Change</p>
          <div className="grid grid-cols-3 gap-1.5">
            {VITAL_INJECTIONS.map((item) => {
              const Icon = item.icon;
              const isPressed = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item, true)}
                  disabled={!isActive}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-lg border transition-all
                    ${isPressed ? 'bg-red-100 border-red-300 scale-95' : 'bg-red-50 border-red-200 hover:border-red-300'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Icon className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-700 font-medium text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Constraint Interventions */}
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">Add Constraint</p>
          <div className="space-y-1.5">
            {INTERVENTIONS.map((item) => {
              const Icon = item.icon;
              const isPressed = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  disabled={!isActive}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all
                    ${isPressed ? 'scale-[0.98]' : 'hover:bg-slate-50'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  style={{
                    backgroundColor: isPressed ? `${item.color}15` : undefined,
                    borderColor: isPressed ? item.color : '#e2e8f0'
                  }}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Icon className="w-3 h-3" style={{ color: item.color }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <form onSubmit={handleCustomSubmit} className="relative">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Custom constraint..."
            disabled={!isActive}
            className="
              w-full px-3 py-2 pr-9 rounded-lg text-xs
              bg-slate-100 border border-transparent
              focus:bg-white focus:border-slate-300 focus:outline-none
              disabled:opacity-50 placeholder-slate-400
            "
          />
          <button
            type="submit"
            disabled={!isActive || !customInput.trim()}
            className="
              absolute right-1.5 top-1/2 -translate-y-1/2
              w-6 h-6 rounded flex items-center justify-center
              bg-blue-500 text-white disabled:bg-slate-300
              hover:bg-blue-600 transition-colors
            "
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
