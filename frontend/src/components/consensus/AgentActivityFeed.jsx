import React, { useEffect, useRef, useState } from 'react';
import { User, AlertTriangle, CheckCircle, Zap, Info, AlertOctagon, FlaskConical } from 'lucide-react';

/**
 * AgentActivityFeed - Clean, chat-style agent deliberation display
 * Supports:
 * - Normal agent messages (proposals)
 * - HERA vetoes (red highlight)
 * - System alerts (dramatic red flash for vital changes)
 * - Consensus reached (green highlight)
 * - Research agent suggestions (purple)
 */

// Agent avatar configurations
const AGENT_CONFIG = {
  geneticist: { 
    name: 'Geneticist', 
    emoji: '🧬', 
    bgColor: '#f3e8ff', 
    borderColor: '#a855f7' 
  },
  oncologist: { 
    name: 'Oncologist', 
    emoji: '🔬', 
    bgColor: '#ffe4e6', 
    borderColor: '#f43f5e' 
  },
  cardiologist: { 
    name: 'Cardiologist', 
    emoji: '❤️', 
    bgColor: '#fce7f3', 
    borderColor: '#ec4899' 
  },
  endocrinologist: { 
    name: 'Endocrinologist', 
    emoji: '⚡', 
    bgColor: '#fef3c7', 
    borderColor: '#f59e0b' 
  },
  pharmacologist: { 
    name: 'Pharmacologist', 
    emoji: '💊', 
    bgColor: '#dcfce7', 
    borderColor: '#22c55e' 
  },
  hera: { 
    name: 'HERA Guardian', 
    emoji: '🛡️', 
    bgColor: '#cffafe', 
    borderColor: '#06b6d4' 
  },
  patient_advocate: { 
    name: 'Patient Advocate', 
    emoji: '🤝', 
    bgColor: '#e0e7ff', 
    borderColor: '#6366f1' 
  },
  coordinator: { 
    name: 'Coordinator', 
    emoji: '🎯', 
    bgColor: '#f5f3ff', 
    borderColor: '#8b5cf6' 
  },
  clinician: { 
    name: 'You (Clinician)', 
    emoji: '👨‍⚕️', 
    bgColor: '#fef9c3', 
    borderColor: '#eab308' 
  },
  research: { 
    name: 'Research Agent', 
    emoji: '🔬', 
    bgColor: '#fae8ff', 
    borderColor: '#d946ef' 
  },
  system: { 
    name: 'System', 
    emoji: '⚙️', 
    bgColor: '#f1f5f9', 
    borderColor: '#64748b' 
  },
};

// Message type styling
const MESSAGE_TYPES = {
  proposal: { icon: Info, accentColor: '#8b5cf6' },
  veto: { icon: AlertTriangle, accentColor: '#ef4444' },
  consensus: { icon: CheckCircle, accentColor: '#10b981' },
  intervention: { icon: Zap, accentColor: '#f59e0b' },
  alert: { icon: AlertOctagon, accentColor: '#dc2626' },
  research: { icon: FlaskConical, accentColor: '#d946ef' },
  system: { icon: Info, accentColor: '#64748b' },
  error: { icon: AlertTriangle, accentColor: '#ef4444' },
};

export default function AgentActivityFeed({ messages, status }) {
  const feedRef = useRe  tool_use: { icon: FlaskConical, accentColor: '#0ea5e9' },
  reflection: { icon: Info, accentColor: '#8b5cf6' },
  sub_agent: { icon: Zap, accentColor: '#a855f7' },
};

export default function AgentActivityFeed({ messages, status }) {
  const feedRef = useRef(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [flashingAlert, setFlashingAlert] = useState(false);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  // Animate new messages in
  useEffect(() => {
    if (messages.length > displayedMessages.length) {
      const newMessages = messages.slice(displayedMessages.length);
      newMessages.forEach((msg, i) => {
        setTimeout(() => {
          // Check if this is an alert message
          if (msg.type === 'alert' || msg.isAlert) {
            setFlashingAlert(true);
            setTimeout(() => setFlashingAlert(false), 1500);
          }
          setDisplayedMessages(prev => [...prev, msg]);
        }, i * 150);
      });
    }
  }, [messages, displayedMessages.length]);

  const isEmpty = displayedMessages.length === 0;

  return (
    <div className={`
      h-full flex flex-col bg-white rounded-xl border overflow-hidden transition-all duration-300
      ${flashingAlert ? 'border-red-400 shadow-lg shadow-red-100' : 'border-slate-200'}
    `}>
      {/* Feed Header */}
      <div className={`
        flex-shrink-0 flex items-center justify-between px-4 py-3 border-b transition-colors duration-300
        ${flashingAlert ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}
      `}>
        <h3 className={`text-sm font-semibold ${flashingAlert ? 'text-red-700' : 'text-slate-700'}`}>
          {flashingAlert ? '⚠️ ALERT: Agent Re-evaluation' : 'Live Agent Deliberation'}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {displayedMessages.length} messages
          </span>
          {status === 'running' && (
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${flashingAlert ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <span className={`text-xs font-medium ${flashingAlert ? 'text-red-600' : 'text-emerald-600'}`}>
                {flashingAlert ? 'Alert' : 'Live'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {isEmpty ? (
          <EmptyState status={status} />
        ) : (
          displayedMessages.map((msg, i) => (
            <MessageCard key={msg.id || i} message={msg} />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ status }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-12">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <span className="text-3xl">🧠</span>
      </div>
      <h4 className="text-sm font-medium text-slate-600 mb-1">
        {status === 'idle' && 'Ready to Start'}
        {status === 'initializing' && 'Connecting to Agents...'}
        {status === 'running' && 'Waiting for Agents...'}
      </h4>
      <p className="text-xs text-slate-400 max-w-[200px]">
        {status === 'idle' 
          ? 'Click "Start Consensus" to begin multi-agent deliberation'
          : 'Agent messages will appear here as they deliberate'}
      </p>
    </div>
  );
}

function MessageCard({ message }) {
  const agentKey = message.agent?.toLowerCase().replace(/[^a-z_]/g, '') || 'system';
  const agent = AGENT_CONFIG[agentKey] || AGENT_CONFIG.system;
  const typeConfig = MESSAGE_TYPES[message.type] || MESSAGE_TYPES.system;
  const Icon = typeConfig.icon;
  
  // Check message type for styling
  const isVeto = message.type === 'veto';
  const isConsensus = message.type === 'consensus';
  const isIntervention = message.type === 'intervention';
  const isAlert = message.type === 'alert' || message.isAlert;
  const isResearch = message.type === 'research';
  const isToolUse = message.type === 'tool_use';
  const isReflection = message.type === 'reflection';
  const isSubAgent = message.type === 'sub_agent';

  // Alert messages get dramatic red styling
  if (isAlert) {
    return (
      <div 
        className="rounded-xl p-4 bg-red-50 border-2 border-red-300 animate-alertPulse"
        style={{ animation: 'alertPulse 0.5s ease-in-out' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-red-700">SYSTEM ALERT</span>
          <span className="text-xs text-red-500 ml-auto">{message.timestamp}</span>
        </div>
        <p className="text-sm text-red-800 font-medium pl-10">
          {message.message}
        </p>
      </div>
    );
  }

  // Research agent messages
  if (isResearch) {
    return (
      <div className="rounded-xl p-4 bg-purple-50 border-l-4 border-purple-400">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-400 flex items-center justify-center">
            <span className="text-sm">🔬</span>
          </div>
          <span className="text-sm font-semibold text-purple-800">Research Agent</span>
          <span className="text-xs text-purple-500 ml-auto">{message.timestamp}</span>
        </div>
        <div className="pl-11">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 mb-2">
            <FlaskConical className="w-3 h-3" />
            CLINICAL TRIAL MATCH
          </div>
          <p className="text-sm text-purple-800">{message.message}</p>
        </div>
      </div>
    );
  }

  // Tool Use Action
  if (isToolUse) {
    return (
      <div className="rounded-xl p-4 bg-sky-50 border border-sky-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-100 border-2 border-sky-400 flex items-center justify-center text-sky-600">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-sky-800">{agent.name} is using a tool</span>
            <div className="text-xs font-mono text-sky-600 mt-1 bg-sky-100/50 px-2 py-1 rounded inline-block">
              &gt; {message.tool} ({message.action})
            </div>
          </div>
          <span className="text-xs text-sky-500 ml-auto">{message.timestamp}</span>
        </div>
      </div>
    );
  }

  // Sub Agent Action
  if (isSubAgent) {
    return (
      <div className="rounded-xl p-4 bg-fuchsia-50 border-l-4 border-fuchsia-400">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-fuchsia-200 flex items-center justify-center">
            <Zap className="w-3 h-3 text-fuchsia-600" />
          </div>
          <span className="text-sm font-bold text-fuchsia-700">SUB-AGENT SUMMONED</span>
          <span className="text-xs text-fuchsia-500 ml-auto">{message.timestamp}</span>
        </div>
        <p className="text-sm text-fuchsia-800 font-medium pl-8 italic">
          "{message.message}"
        </p>
      </div>
    );
  }

  // Reflection / Memory Action
  if (isReflection) {
    return (
      <div className="rounded-xl p-4 bg-slate-50 border-l-4 border-slate-400 border-dashed">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0" style={{ backgroundColor: agent.bgColor, borderColor: agent.borderColor }}>
            {agent.emoji}
          </div>
          <span className="text-sm font-semibold text-slate-700">{agent.name} <span className="text-slate-500 font-normal italic">accessed memory</span></span>
          <span className="text-xs text-slate-400 ml-auto">{message.timestamp}</span>
        </div>
        <div className="pl-11">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600 mb-1">
            <Info className="w-3 h-3" />
            Previous Case Reflection
          </div>
          <p className="text-sm text-slate-600 italic">
            "{message.message}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
 ? 'bg-amber-50 border-l-4 border-amber-400' : ''}
        ${!isVeto && !isConsensus && !isIntervention ? 'bg-white border border-slate-200 shadow-sm' : ''}
      `}
    >
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-center gap-3 mb-2">
        {/* Agent Avatar */}
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0"
          style={{ 
            backgroundColor: agent.bgColor,
            borderColor: agent.borderColor 
          }}
        >
          {agent.emoji}
        </div>
        
        {/* Agent Name */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-800">
            {agent.name}
          </span>
        </div>
        
        {/* Timestamp */}
        <span className="text-xs text-slate-400 flex-shrink-0">
          {message.timestamp}
        </span>
      </div>
      
      {/* Message Body */}
      <div className="pl-11">
        {/* Type Badge for special messages */}
        {(isVeto || isConsensus || isIntervention) && (
          <div 
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold mb-2"
            style={{ 
              backgroundColor: `${typeConfig.accentColor}15`,
              color: typeConfig.accentColor
            }}
          >
            <Icon className="w-3 h-3" />
            {isVeto && 'VETO'}
            {isConsensus && 'CONSENSUS REACHED'}
            {isIntervention && 'INTERVENTION'}
          </div>
        )}
        
        {/* Message Text */}
        <p className={`text-sm leading-relaxed ${
          isVeto ? 'text-red-800' : 
          isConsensus ? 'text-emerald-800' : 
          isIntervention ? 'text-amber-800' :
          'text-slate-600'
        }`}>
          {message.message}
        </p>
        
        {/* Confidence Badge (if present) */}
        {message.confidence && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
            <span className="font-medium">Confidence:</span>
            <span className="text-emerald-600 font-semibold">
              {(message.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Add animations via style tag
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes alertPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
    }
  }
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
  .animate-alertPulse {
    animation: alertPulse 0.5s ease-in-out 3;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('#agent-feed-styles')) {
  styleSheet.id = 'agent-feed-styles';
  document.head.appendChild(styleSheet);
}
