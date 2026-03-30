import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

/**
 * LiveTerminal - Glass Box reasoning display with typing effects
 * Server log style display of agent deliberations
 */

// Type indicators for different log types
const TYPE_CONFIG = {
  proposal: { prefix: '📊', color: '#8b5cf6' },    // Amethyst
  veto: { prefix: '🛑', color: '#ef4444' },        // Crimson
  consensus: { prefix: '✅', color: '#10b981' },   // Emerald
  intervention: { prefix: '⚡', color: '#f59e0b' }, // Amber
  system: { prefix: '⚙️', color: '#64748b' },      // Gray
  error: { prefix: '❌', color: '#ef4444' },       // Crimson
};

// Agent colors for visual distinction
const AGENT_COLORS = {
  GENETICIST: '#a855f7',
  ONCOLOGIST: '#f43f5e',
  CARDIOLOGIST: '#ec4899',
  ENDOCRINOLOGIST: '#f59e0b',
  PHARMACOLOGIST: '#22c55e',
  HERA: '#06b6d4',
  COORDINATOR: '#8b5cf6',
  CLINICIAN: '#fbbf24',
  SYSTEM: '#64748b',
};

export default function LiveTerminal({ lines, status, theme }) {
  const terminalRef = useRef(null);
  const [displayedLines, setDisplayedLines] = useState([]);
  const [typingLine, setTypingLine] = useState(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedLines, typingLine]);

  // Process new lines with typing effect
  useEffect(() => {
    if (lines.length > displayedLines.length) {
      const newLines = lines.slice(displayedLines.length);
      processNewLines(newLines);
    }
  }, [lines]);

  async function processNewLines(newLines) {
    for (const line of newLines) {
      // Start typing effect
      setTypingLine(line);
      
      // Simulate typing delay based on message length
      const typingDuration = Math.min(line.message.length * 15, 800);
      await new Promise(resolve => setTimeout(resolve, typingDuration));
      
      // Add to displayed lines
      setDisplayedLines(prev => [...prev, line]);
      setTypingLine(null);
      
      // Small gap between lines
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const isEmpty = displayedLines.length === 0 && !typingLine;

  return (
    <div 
      className="h-full flex flex-col"
      style={{ background: theme.bg.primary }}
    >
      {/* Terminal Header */}
      <div 
        className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b"
        style={{ 
          background: theme.bg.elevated,
          borderColor: theme.bg.surface 
        }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" style={{ color: theme.accent.cyan }} />
          <span 
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: theme.text.muted }}
          >
            Glass Box Terminal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-xs font-mono"
            style={{ color: theme.text.muted }}
          >
            {displayedLines.length} events
          </span>
          {status === 'running' && (
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: theme.accent.emerald }}
            />
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm"
        style={{ 
          background: `linear-gradient(180deg, ${theme.bg.primary} 0%, #0a0f1a 100%)`,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
        }}
      >
        {isEmpty ? (
          <EmptyState status={status} theme={theme} />
        ) : (
          <div className="space-y-1">
            {displayedLines.map((line, i) => (
              <LogLine key={line.id || i} line={line} theme={theme} />
            ))}
            {typingLine && (
              <TypingLine line={typingLine} theme={theme} />
            )}
          </div>
        )}
      </div>

      {/* Scanline Effect Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          mixBlendMode: 'overlay'
        }}
      />
    </div>
  );
}

function EmptyState({ status, theme }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div 
        className="text-4xl mb-4 opacity-20"
      >
        🧠
      </div>
      <p 
        className="text-sm"
        style={{ color: theme.text.muted }}
      >
        {status === 'idle' 
          ? 'Initialize to begin agent deliberation'
          : status === 'initializing'
            ? 'Connecting to agents...'
            : 'Awaiting agent response...'}
      </p>
      {status === 'idle' && (
        <p 
          className="text-xs mt-2 max-w-[200px]"
          style={{ color: theme.text.muted, opacity: 0.6 }}
        >
          Press Initialize to start multi-agent consensus protocol
        </p>
      )}
    </div>
  );
}

function LogLine({ line, theme }) {
  const typeConfig = TYPE_CONFIG[line.type] || TYPE_CONFIG.system;
  const agentColor = AGENT_COLORS[line.agent] || AGENT_COLORS.SYSTEM;
  
  // Check if this is a divider line
  if (line.message.includes('───')) {
    return (
      <div 
        className="py-2 text-center text-xs opacity-60"
        style={{ color: theme.text.muted }}
      >
        {line.message}
      </div>
    );
  }

  return (
    <div 
      className={`
        flex items-start gap-2 py-1 px-2 rounded
        transition-all duration-300
        hover:bg-white/5
      `}
    >
      {/* Timestamp */}
      <span 
        className="flex-shrink-0 text-xs opacity-50"
        style={{ color: theme.text.muted }}
      >
        [{line.timestamp}]
      </span>
      
      {/* Agent Badge */}
      <span 
        className="flex-shrink-0 text-xs font-semibold px-1.5 rounded"
        style={{ 
          color: agentColor,
          background: `${agentColor}15`
        }}
      >
        [{line.agent}]
      </span>
      
      {/* Type Prefix */}
      <span className="flex-shrink-0">{typeConfig.prefix}</span>
      
      {/* Message */}
      <span 
        className="flex-1 text-xs leading-relaxed break-words"
        style={{ 
          color: line.type === 'veto' ? theme.accent.crimson :
                 line.type === 'consensus' ? theme.accent.emerald :
                 line.type === 'intervention' ? theme.accent.amber :
                 theme.text.secondary
        }}
      >
        {line.type === 'veto' && <strong>VETO: </strong>}
        {line.type === 'intervention' && <strong>INJECT: </strong>}
        {line.message}
      </span>
      
      {/* Confidence Badge (if present) */}
      {line.confidence && (
        <span 
          className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded"
          style={{ 
            background: theme.bg.surface,
            color: theme.accent.emerald 
          }}
        >
          {(line.confidence * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

function TypingLine({ line, theme }) {
  const typeConfig = TYPE_CONFIG[line.type] || TYPE_CONFIG.system;
  const agentColor = AGENT_COLORS[line.agent] || AGENT_COLORS.SYSTEM;
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= line.message.length) {
        setDisplayText(line.message.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 12);
    
    return () => clearInterval(interval);
  }, [line.message]);

  return (
    <div 
      className="flex items-start gap-2 py-1 px-2 rounded"
      style={{ background: `${theme.accent.amethyst}10` }}
    >
      <span 
        className="flex-shrink-0 text-xs opacity-50"
        style={{ color: theme.text.muted }}
      >
        [{line.timestamp}]
      </span>
      
      <span 
        className="flex-shrink-0 text-xs font-semibold px-1.5 rounded"
        style={{ 
          color: agentColor,
          background: `${agentColor}15`
        }}
      >
        [{line.agent}]
      </span>
      
      <span className="flex-shrink-0">{typeConfig.prefix}</span>
      
      <span 
        className="flex-1 text-xs leading-relaxed"
        style={{ color: theme.text.secondary }}
      >
        {displayText}
        <span 
          className="inline-block w-2 h-4 ml-0.5 animate-pulse"
          style={{ background: theme.accent.cyan }}
        />
      </span>
    </div>
  );
}
