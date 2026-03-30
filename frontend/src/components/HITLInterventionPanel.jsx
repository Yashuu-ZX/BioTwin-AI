import React, { useState } from 'react';
import { 
  UserCog, 
  AlertTriangle, 
  Ban, 
  DollarSign, 
  Syringe, 
  Pill, 
  Heart,
  Clock,
  Send,
  RefreshCw,
  Pause,
  Play,
  Zap
} from 'lucide-react';

/**
 * HITLInterventionPanel - Human-in-the-Loop intervention controls
 * Allows clinicians to inject constraints during agent negotiation
 */

// Predefined intervention templates for common clinical scenarios
const INTERVENTION_TEMPLATES = [
  {
    id: 'insurance_lost',
    label: 'Insurance Changed',
    description: 'Patient lost coverage or changed insurance plan',
    icon: DollarSign,
    constraint: 'Patient insurance coverage has changed. Prefer cost-effective alternatives and generic medications where clinically appropriate.',
    category: 'financial',
    color: 'amber'
  },
  {
    id: 'refuses_injections',
    label: 'Refuses Injections',
    description: 'Patient refuses injectable medications',
    icon: Syringe,
    constraint: 'Patient refuses injectable medications. Only consider oral, topical, or non-invasive administration routes.',
    category: 'preference',
    color: 'rose'
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy Confirmed',
    description: 'Patient is pregnant or planning pregnancy',
    icon: Heart,
    constraint: 'Patient is pregnant or planning pregnancy. Exclude all teratogenic medications and prioritize fetal safety.',
    category: 'safety',
    color: 'pink'
  },
  {
    id: 'allergy_new',
    label: 'New Allergy Reported',
    description: 'Patient reports new drug allergy',
    icon: AlertTriangle,
    constraint: 'Patient has reported a new drug allergy. Re-evaluate all proposed medications for cross-reactivity.',
    category: 'safety',
    color: 'red'
  },
  {
    id: 'adherence_concern',
    label: 'Adherence Concern',
    description: 'Complex regimen may affect compliance',
    icon: Pill,
    constraint: 'Simplify the treatment regimen. Patient has expressed difficulty with complex medication schedules. Prefer once-daily dosing.',
    category: 'preference',
    color: 'blue'
  },
  {
    id: 'urgent_timeline',
    label: 'Urgent Timeline',
    description: 'Treatment needs to start immediately',
    icon: Clock,
    constraint: 'Treatment must begin within 48 hours. Prioritize immediately available therapies over those requiring prior authorization.',
    category: 'logistics',
    color: 'orange'
  },
  {
    id: 'contraindication',
    label: 'New Contraindication',
    description: 'New lab results show contraindication',
    icon: Ban,
    constraint: 'New lab results indicate potential contraindication. Re-evaluate renal/hepatic function requirements for all proposed treatments.',
    category: 'safety',
    color: 'red'
  },
  {
    id: 'quality_of_life',
    label: 'QoL Priority',
    description: 'Prioritize quality of life over aggressive treatment',
    icon: UserCog,
    constraint: 'Patient prioritizes quality of life over aggressive treatment. Minimize side effect burden and treatment intensity.',
    category: 'preference',
    color: 'purple'
  }
];

const CATEGORY_COLORS = {
  financial: 'from-amber-500/20 to-amber-600/20 border-amber-500/40',
  preference: 'from-blue-500/20 to-blue-600/20 border-blue-500/40',
  safety: 'from-red-500/20 to-red-600/20 border-red-500/40',
  logistics: 'from-orange-500/20 to-orange-600/20 border-orange-500/40'
};

function InterventionButton({ template, onClick, disabled }) {
  const Icon = template.icon;
  const colorClasses = {
    amber: 'hover:border-amber-400/60 hover:bg-amber-500/10',
    rose: 'hover:border-rose-400/60 hover:bg-rose-500/10',
    pink: 'hover:border-pink-400/60 hover:bg-pink-500/10',
    red: 'hover:border-red-400/60 hover:bg-red-500/10',
    blue: 'hover:border-blue-400/60 hover:bg-blue-500/10',
    orange: 'hover:border-orange-400/60 hover:bg-orange-500/10',
    purple: 'hover:border-purple-400/60 hover:bg-purple-500/10',
  };

  const iconColorClasses = {
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    pink: 'text-pink-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
  };

  return (
    <button
      onClick={() => onClick(template)}
      disabled={disabled}
      className={`
        group flex items-start gap-3 p-3 rounded-xl border border-slate-700/60 
        bg-slate-800/50 transition-all duration-200
        ${colorClasses[template.color]}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 disabled:hover:border-slate-700/60
      `}
    >
      <div className={`flex-shrink-0 p-2 rounded-lg bg-slate-700/50 ${iconColorClasses[template.color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
          {template.label}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
          {template.description}
        </p>
      </div>
    </button>
  );
}

function CustomInterventionInput({ onSubmit, disabled }) {
  const [customConstraint, setCustomConstraint] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (customConstraint.trim()) {
      onSubmit(customConstraint.trim());
      setCustomConstraint('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={customConstraint}
        onChange={(e) => setCustomConstraint(e.target.value)}
        placeholder="Enter a custom constraint or clinical note for the agents to consider..."
        disabled={disabled}
        className="
          w-full h-24 px-4 py-3 rounded-xl 
          bg-slate-800/70 border border-slate-700/60 
          text-slate-200 placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none text-sm
        "
      />
      <button
        type="submit"
        disabled={disabled || !customConstraint.trim()}
        className="
          flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl
          bg-gradient-to-r from-cyan-500 to-blue-500 
          text-white font-medium text-sm
          hover:from-cyan-400 hover:to-blue-400
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-500
          transition-all duration-200
        "
      >
        <Send className="w-4 h-4" />
        Inject Custom Constraint
      </button>
    </form>
  );
}

export default function HITLInterventionPanel({
  sessionId,
  onIntervene,
  onPause,
  onResume,
  onRestart,
  status = 'idle',
  className = ''
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lastIntervention, setLastIntervention] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isActive = status === 'negotiating' || status === 'intervention';
  const canIntervene = isActive && !isSubmitting;

  const handleTemplateClick = async (template) => {
    if (!canIntervene) return;
    
    setIsSubmitting(true);
    setLastIntervention(template.label);
    
    try {
      await onIntervene({
        type: 'constraint',
        constraint: template.constraint,
        source: `template:${template.id}`,
        category: template.category,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to submit intervention:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (constraint) => {
    if (!canIntervene) return;
    
    setIsSubmitting(true);
    setLastIntervention('Custom constraint');
    
    try {
      await onIntervene({
        type: 'constraint',
        constraint,
        source: 'custom',
        category: 'custom',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to submit custom intervention:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? INTERVENTION_TEMPLATES 
    : INTERVENTION_TEMPLATES.filter(t => t.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'safety', label: 'Safety' },
    { id: 'preference', label: 'Preference' },
    { id: 'financial', label: 'Financial' },
    { id: 'logistics', label: 'Logistics' }
  ];

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <UserCog className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Human-in-the-Loop</h3>
            <p className="text-xs text-slate-400">Inject clinical constraints</p>
          </div>
        </div>

        {/* Session Controls */}
        <div className="flex items-center gap-2">
          {status === 'negotiating' && onPause && (
            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-slate-700/50 text-amber-400 hover:bg-amber-500/20 transition-colors"
              title="Pause negotiation"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {status === 'paused' && onResume && (
            <button
              onClick={onResume}
              className="p-2 rounded-lg bg-slate-700/50 text-green-400 hover:bg-green-500/20 transition-colors"
              title="Resume negotiation"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {onRestart && (
            <button
              onClick={onRestart}
              className="p-2 rounded-lg bg-slate-700/50 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              title="Restart negotiation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {!isActive && (
        <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-700/40">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4" />
            <span className="text-sm">
              {status === 'idle' 
                ? 'Start a negotiation session to enable interventions' 
                : status === 'consensus' 
                  ? 'Consensus reached - restart to modify' 
                  : 'Negotiation ended'}
            </span>
          </div>
        </div>
      )}

      {/* Last Intervention Feedback */}
      {lastIntervention && isSubmitting && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="flex items-center gap-2 text-yellow-300 text-sm">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Injecting: {lastIntervention}...</span>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="px-4 py-3 border-b border-slate-700/40">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                ${selectedCategory === cat.id 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/40 hover:text-slate-200'}
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Intervention Buttons */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[350px]">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Quick Interventions
        </p>
        <div className="grid grid-cols-1 gap-2">
          {filteredTemplates.map((template) => (
            <InterventionButton
              key={template.id}
              template={template}
              onClick={handleTemplateClick}
              disabled={!canIntervene}
            />
          ))}
        </div>
      </div>

      {/* Custom Intervention Input */}
      <div className="p-4 border-t border-slate-700/60 bg-slate-800/30">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Custom Constraint
        </p>
        <CustomInterventionInput 
          onSubmit={handleCustomSubmit}
          disabled={!canIntervene}
        />
      </div>

      {/* Session Info Footer */}
      {sessionId && (
        <div className="px-4 py-2 border-t border-slate-700/40 bg-slate-900/50">
          <p className="text-xs text-slate-500">
            Session: <span className="font-mono text-slate-400">{sessionId.slice(0, 12)}...</span>
          </p>
        </div>
      )}
    </div>
  );
}
