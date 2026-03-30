import React, { useState } from 'react';
import { 
  Dna, 
  Pill, 
  Activity, 
  Shield, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain
} from 'lucide-react';

/**
 * AgentInsightsPanel - Tabbed/Accordion view of agent-specific insights
 * Shows detailed rationale and data analyzed by each specialist agent
 * 
 * @param {Object} agentInsights - Dynamic agent data (optional, falls back to defaults)
 * @param {Object} agentStates - Current state of each agent (idle, ready, deliberating, etc.)
 * @param {Function} onAgentSelect - Callback when an agent is selected
 */

// Default agent configurations (used as fallback)
const DEFAULT_AGENT_CONFIG = {
  pharmacologist: {
    name: 'Pharmacologist',
    icon: Pill,
    emoji: '💊',
    color: '#22c55e',
    bgColor: '#dcfce7',
    dataAnalyzed: ['No data available'],
    rationale: 'Awaiting patient data for analysis.',
    recommendation: 'Pending analysis',
    confidence: 0
  },
  endocrinologist: {
    name: 'Endocrinologist',
    icon: Activity,
    emoji: '⚡',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    dataAnalyzed: ['No data available'],
    rationale: 'Awaiting patient data for analysis.',
    recommendation: 'Pending analysis',
    confidence: 0
  },
  geneticist: {
    name: 'Geneticist',
    icon: Dna,
    emoji: '🧬',
    color: '#a855f7',
    bgColor: '#f3e8ff',
    dataAnalyzed: ['No data available'],
    rationale: 'Awaiting patient data for analysis.',
    recommendation: 'Pending analysis',
    confidence: 0
  },
  hera: {
    name: 'HERA Guardian',
    icon: Shield,
    emoji: '🛡️',
    color: '#06b6d4',
    bgColor: '#cffafe',
    dataAnalyzed: ['No data available'],
    rationale: 'Awaiting patient data for analysis.',
    recommendation: 'Pending analysis',
    confidence: 0,
    isGuardian: true
  }
};

// Merge provided agent insights with defaults
function mergeAgentInsights(providedInsights) {
  if (!providedInsights) return DEFAULT_AGENT_CONFIG;
  
  const merged = {};
  for (const key of Object.keys(DEFAULT_AGENT_CONFIG)) {
    merged[key] = {
      ...DEFAULT_AGENT_CONFIG[key],
      ...(providedInsights[key] || {})
    };
  }
  return merged;
}

export default function AgentInsightsPanel({ agentInsights, agentStates = {}, onAgentSelect }) {
  // Merge provided insights with defaults
  const AGENT_INSIGHTS = mergeAgentInsights(agentInsights);
  const [expandedAgent, setExpandedAgent] = useState('geneticist');

  const toggleAgent = (agentKey) => {
    setExpandedAgent(expandedAgent === agentKey ? null : agentKey);
    if (onAgentSelect) onAgentSelect(agentKey);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Agent Insights</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Click to expand detailed analysis</p>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(AGENT_INSIGHTS).map(([key, agent]) => {
          const Icon = agent.icon;
          const isExpanded = expandedAgent === key;
          const state = agentStates[key] || 'idle';
          
          return (
            <div key={key} className="border-b border-slate-100 last:border-b-0">
              {/* Accordion Header */}
              <button
                onClick={() => toggleAgent(key)}
                className={`
                  w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                  ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}
                `}
              >
                {/* Agent Avatar */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                  style={{ 
                    backgroundColor: agent.bgColor,
                    borderColor: agent.color 
                  }}
                >
                  <span className="text-sm">{agent.emoji}</span>
                </div>
                
                {/* Name & Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{agent.name}</span>
                    {agent.isGuardian && (
                      <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-medium rounded">
                        Guardian
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{agent.recommendation}</span>
                </div>
                
                {/* Status Indicator */}
                <StatusBadge state={state} />
                
                {/* Expand Icon */}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-slate-50/50">
                  {/* Data Analyzed */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Data Analyzed
                    </h4>
                    <ul className="space-y-1">
                      {agent.dataAnalyzed.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Rationale */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Rationale
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      {agent.rationale}
                    </p>
                  </div>
                  
                  {/* Confidence */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${agent.confidence}%`,
                            backgroundColor: agent.color 
                          }}
                        />
                      </div>
                      <span 
                        className="text-xs font-semibold"
                        style={{ color: agent.color }}
                      >
                        {agent.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ state }) {
  const configs = {
    idle: { icon: Clock, color: '#94a3b8', bg: '#f1f5f9', label: 'Idle' },
    ready: { icon: CheckCircle, color: '#22c55e', bg: '#dcfce7', label: 'Ready' },
    deliberating: { icon: Activity, color: '#3b82f6', bg: '#dbeafe', label: 'Thinking' },
    blocked: { icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2', label: 'Veto' },
    consensus: { icon: CheckCircle, color: '#10b981', bg: '#d1fae5', label: 'Agreed' },
    monitoring: { icon: Shield, color: '#06b6d4', bg: '#cffafe', label: 'Active' },
  };
  
  const config = configs[state] || configs.idle;
  const Icon = config.icon;
  
  return (
    <div 
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon className="w-3 h-3" />
      <span className="font-medium">{config.label}</span>
    </div>
  );
}
