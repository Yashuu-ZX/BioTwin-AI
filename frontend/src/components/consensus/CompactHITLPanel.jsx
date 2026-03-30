import React, { useState } from 'react';
import { 
  Zap, 
  DollarSign, 
  Syringe, 
  Heart, 
  AlertTriangle, 
  Pill, 
  Clock,
  Send
} from 'lucide-react';

/**
 * CompactHITLPanel - Streamlined Human-in-the-Loop intervention controls
 * Quick intervention buttons + custom constraint input
 */

// Intervention templates - condensed
const INTERVENTIONS = [
  {
    id: 'insurance_lost',
    label: 'Insurance Changed',
    icon: DollarSign,
    constraint: 'Patient insurance coverage changed. Prefer cost-effective alternatives.',
    color: '#f59e0b' // Amber
  },
  {
    id: 'refuses_injections',
    label: 'No Injections',
    icon: Syringe,
    constraint: 'Patient refuses injectable medications. Oral/topical only.',
    color: '#f43f5e' // Rose
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy',
    icon: Heart,
    constraint: 'Patient is pregnant. Exclude teratogenic medications.',
    color: '#ec4899' // Pink
  },
  {
    id: 'new_allergy',
    label: 'New Allergy',
    icon: AlertTriangle,
    constraint: 'New drug allergy reported. Re-evaluate cross-reactivity.',
    color: '#ef4444' // Red
  },
  {
    id: 'simplify',
    label: 'Simplify Regimen',
    icon: Pill,
    constraint: 'Simplify regimen. Prefer once-daily dosing for adherence.',
    color: '#3b82f6' // Blue
  },
  {
    id: 'urgent',
    label: 'Urgent Start',
    icon: Clock,
    constraint: 'Treatment must begin within 48 hours. Prioritize availability.',
    color: '#f97316' // Orange
  },
];

export default function CompactHITLPanel({ onIntervene, status, theme }) {
  const [customInput, setCustomInput] = useState('');
  const [lastInjected, setLastInjected] = useState(null);
  
  const isActive = status === 'running' || status === 'initializing';

  const handleQuickIntervention = (intervention) => {
    setLastInjected(intervention.id);
    onIntervene({
      ...intervention,
      source: `quick:${intervention.id}`,
      timestamp: new Date().toISOString()
    });
    
    // Clear highlight after animation
    setTimeout(() => setLastInjected(null), 1000);
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
    <div 
      className="h-full flex flex-col p-3"
      style={{ background: theme.bg.primary }}
    >
      {/* Header */}
      <div 
        className="flex-shrink-0 flex items-center gap-2 mb-3"
      >
        <Zap className="w-3.5 h-3.5" style={{ color: theme.accent.amber }} />
        <span 
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: theme.text.muted }}
        >
          HITL Interventions
        </span>
      </div>

      {/* Quick Intervention Buttons */}
      <div className="flex-shrink-0 grid grid-cols-2 gap-2 mb-4">
        {INTERVENTIONS.map((intervention) => {
          const Icon = intervention.icon;
          const isInjected = lastInjected === intervention.id;
          
          return (
            <button
              key={intervention.id}
              onClick={() => handleQuickIntervention(intervention)}
              disabled={!isActive}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-left
                transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isInjected ? 'scale-95' : 'hover:scale-[1.02]'}
              `}
              style={{ 
                background: isInjected ? `${intervention.color}30` : theme.bg.elevated,
                border: `1px solid ${isInjected ? intervention.color : theme.bg.surface}`,
                boxShadow: isInjected ? `0 0 12px ${intervention.color}40` : 'none'
              }}
            >
              <Icon 
                className="w-3.5 h-3.5 flex-shrink-0" 
                style={{ color: intervention.color }} 
              />
              <span 
                className="text-xs font-medium truncate"
                style={{ color: theme.text.secondary }}
              >
                {intervention.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Constraint Input */}
      <div 
        className="flex-1 flex flex-col rounded-lg p-3"
        style={{ background: theme.bg.elevated }}
      >
        <label 
          className="text-xs font-mono uppercase tracking-wider mb-2"
          style={{ color: theme.text.muted }}
        >
          Custom Constraint
        </label>
        
        <form onSubmit={handleCustomSubmit} className="flex-1 flex flex-col">
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter clinical constraint..."
            disabled={!isActive}
            className="
              flex-1 w-full px-3 py-2 rounded-lg text-xs resize-none
              focus:outline-none focus:ring-1 
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{ 
              background: theme.bg.surface,
              color: theme.text.primary,
              border: 'none',
              minHeight: '60px'
            }}
          />
          
          <button
            type="submit"
            disabled={!isActive || !customInput.trim()}
            className="
              mt-2 flex items-center justify-center gap-2 
              px-4 py-2 rounded-lg text-xs font-semibold
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:opacity-90
            "
            style={{ 
              background: isActive && customInput.trim() 
                ? theme.accent.amber 
                : theme.bg.surface,
              color: isActive && customInput.trim() 
                ? '#000' 
                : theme.text.muted
            }}
          >
            <Send className="w-3 h-3" />
            Inject Constraint
          </button>
        </form>
      </div>

      {/* Status Footer */}
      <div 
        className="flex-shrink-0 mt-3 pt-3 border-t flex items-center justify-between"
        style={{ borderColor: theme.bg.surface }}
      >
        <span 
          className="text-xs"
          style={{ color: theme.text.muted }}
        >
          {isActive 
            ? 'Agents will process interventions immediately'
            : 'Initialize session to enable interventions'}
        </span>
        <div 
          className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`}
          style={{ 
            background: isActive ? theme.accent.emerald : theme.bg.surface 
          }}
        />
      </div>
    </div>
  );
}
