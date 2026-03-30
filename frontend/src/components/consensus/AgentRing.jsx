import React from 'react';

/**
 * AgentRing - Horizontal agent avatars with LED status indicators
 * Shows all agents in a compact row with real-time status
 */

const AGENTS = [
  { id: 'geneticist', name: 'Geneticist', avatar: '🧬', short: 'GEN' },
  { id: 'oncologist', name: 'Oncologist', avatar: '🎗️', short: 'ONC' },
  { id: 'cardiologist', name: 'Cardiologist', avatar: '❤️', short: 'CAR' },
  { id: 'endocrinologist', name: 'Endocrinologist', avatar: '⚗️', short: 'END' },
  { id: 'pharmacologist', name: 'Pharmacologist', avatar: '💊', short: 'PHR' },
  { id: 'hera', name: 'HERA', avatar: '🛡️', short: 'HERA' },
  { id: 'patient_advocate', name: 'Advocate', avatar: '👤', short: 'ADV' },
];

// LED status colors
const STATUS_COLORS = {
  idle: { bg: '#64748b', glow: 'none' },           // Gray
  deliberating: { bg: '#3b82f6', glow: '0 0 8px #3b82f6' }, // Blue with glow
  consensus: { bg: '#10b981', glow: '0 0 8px #10b981' },    // Green with glow
  blocked: { bg: '#ef4444', glow: '0 0 8px #ef4444' },      // Red with glow
};

export default function AgentRing({ agentStates, theme }) {
  return (
    <div 
      className="flex-shrink-0 px-4 py-3 border-b"
      style={{ 
        background: theme.bg.elevated,
        borderColor: theme.bg.surface 
      }}
    >
      {/* Section Label */}
      <div className="flex items-center justify-between mb-3">
        <span 
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: theme.text.muted }}
        >
          Agent Collective
        </span>
        <StatusLegend theme={theme} />
      </div>
      
      {/* Agent Row */}
      <div className="flex items-center justify-between gap-2">
        {AGENTS.map((agent) => (
          <AgentNode 
            key={agent.id}
            agent={agent}
            status={agentStates[agent.id] || 'idle'}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

function AgentNode({ agent, status, theme }) {
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.idle;
  const isActive = status === 'deliberating';
  const isHera = agent.id === 'hera';
  
  return (
    <div className="flex flex-col items-center gap-1.5 relative group">
      {/* Avatar Circle */}
      <div 
        className={`
          relative w-10 h-10 rounded-full flex items-center justify-center
          transition-all duration-300
          ${isActive ? 'scale-110' : 'scale-100'}
        `}
        style={{ 
          background: isHera && status === 'blocked' 
            ? `${theme.accent.crimson}20` 
            : theme.bg.surface,
          boxShadow: isActive 
            ? `0 0 20px ${theme.accent.amethyst}40`
            : status === 'blocked'
              ? `0 0 16px ${theme.accent.crimson}40`
              : 'none',
          border: `2px solid ${
            status === 'blocked' ? theme.accent.crimson :
            status === 'consensus' ? theme.accent.emerald :
            isActive ? theme.accent.amethyst :
            theme.bg.surface
          }`
        }}
      >
        {/* Avatar Emoji */}
        <span className="text-lg">{agent.avatar}</span>
        
        {/* Pulse Animation for Active */}
        {isActive && (
          <div 
            className="absolute inset-0 rounded-full animate-ping"
            style={{ 
              background: theme.accent.amethyst,
              opacity: 0.2
            }}
          />
        )}
      </div>
      
      {/* LED Status Indicator */}
      <div 
        className={`
          w-2 h-2 rounded-full transition-all duration-300
          ${status === 'deliberating' ? 'animate-pulse' : ''}
        `}
        style={{ 
          background: statusStyle.bg,
          boxShadow: statusStyle.glow
        }}
      />
      
      {/* Agent Name */}
      <span 
        className="text-xs font-mono"
        style={{ 
          color: isActive ? theme.text.primary : 
                 status === 'blocked' ? theme.accent.crimson :
                 theme.text.muted 
        }}
      >
        {agent.short}
      </span>
      
      {/* Tooltip on Hover */}
      <div 
        className="
          absolute -bottom-8 left-1/2 -translate-x-1/2 
          px-2 py-1 rounded text-xs whitespace-nowrap
          opacity-0 group-hover:opacity-100 transition-opacity
          pointer-events-none z-10
        "
        style={{ 
          background: theme.bg.primary,
          color: theme.text.secondary,
          border: `1px solid ${theme.bg.surface}`
        }}
      >
        {agent.name}
      </div>
    </div>
  );
}

function StatusLegend({ theme }) {
  const statuses = [
    { label: 'Idle', color: STATUS_COLORS.idle.bg },
    { label: 'Active', color: STATUS_COLORS.deliberating.bg },
    { label: 'OK', color: STATUS_COLORS.consensus.bg },
    { label: 'Veto', color: STATUS_COLORS.blocked.bg },
  ];
  
  return (
    <div className="flex items-center gap-3">
      {statuses.map(s => (
        <div key={s.label} className="flex items-center gap-1">
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: s.color }}
          />
          <span 
            className="text-xs"
            style={{ color: theme.text.muted }}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
