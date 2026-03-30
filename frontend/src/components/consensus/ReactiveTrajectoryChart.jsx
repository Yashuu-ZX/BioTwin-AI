import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * ReactiveTrajectoryChart - Dynamic outcome projection
 * Visually responds to agent negotiations and protocol changes
 */

export default function ReactiveTrajectoryChart({ data, activeProtocol, theme }) {
  // Protocol-specific styling
  const protocolConfig = useMemo(() => ({
    standard: {
      label: 'Standard Protocol',
      color: theme.accent.emerald,
      opacity: 0.4
    },
    multiAgent: {
      label: 'Multi-Agent Protocol',
      color: theme.accent.amethyst,
      opacity: 1
    },
    conservative: {
      label: 'Conservative (HERA Adjusted)',
      color: theme.accent.amber,
      opacity: 1
    },
    recalculating: {
      label: 'Recalculating...',
      color: theme.accent.cyan,
      opacity: 0.7
    }
  }), [theme]);

  const currentProtocol = protocolConfig[activeProtocol] || protocolConfig.standard;

  return (
    <div 
      className="h-full flex flex-col p-3"
      style={{ background: theme.bg.primary }}
    >
      {/* Header */}
      <div 
        className="flex-shrink-0 flex items-center justify-between mb-2 px-1"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: theme.accent.cyan }} />
          <span 
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: theme.text.muted }}
          >
            Outcome Trajectory
          </span>
        </div>
        
        {/* Protocol Badge */}
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
          style={{ 
            background: `${currentProtocol.color}20`,
            color: currentProtocol.color,
            border: `1px solid ${currentProtocol.color}40`
          }}
        >
          {activeProtocol === 'recalculating' && (
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: currentProtocol.color }} />
          )}
          {activeProtocol === 'conservative' && (
            <AlertTriangle className="w-3 h-3" />
          )}
          {currentProtocol.label}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme.bg.surface}
              opacity={0.5}
            />
            <XAxis 
              dataKey="week" 
              tick={{ fill: theme.text.muted, fontSize: 10 }}
              tickLine={{ stroke: theme.bg.surface }}
              axisLine={{ stroke: theme.bg.surface }}
              label={{ 
                value: 'Weeks', 
                position: 'bottom', 
                offset: -5,
                fill: theme.text.muted,
                fontSize: 10
              }}
            />
            <YAxis 
              tick={{ fill: theme.text.muted, fontSize: 10 }}
              tickLine={{ stroke: theme.bg.surface }}
              axisLine={{ stroke: theme.bg.surface }}
              domain={[60, 100]}
              label={{ 
                value: 'Health Score', 
                angle: -90, 
                position: 'insideLeft',
                fill: theme.text.muted,
                fontSize: 10
              }}
            />
            <Tooltip 
              content={<CustomTooltip theme={theme} />}
              cursor={{ stroke: theme.accent.cyan, strokeDasharray: '3 3' }}
            />
            
            {/* Baseline Reference */}
            <ReferenceLine 
              y={65} 
              stroke={theme.text.muted}
              strokeDasharray="5 5"
              label={{ 
                value: 'Baseline', 
                fill: theme.text.muted, 
                fontSize: 9,
                position: 'right'
              }}
            />
            
            {/* Standard Protocol Line */}
            <Line 
              type="monotone" 
              dataKey="standard" 
              stroke={protocolConfig.standard.color}
              strokeWidth={1.5}
              strokeOpacity={protocolConfig.standard.opacity}
              dot={false}
              strokeDasharray="4 4"
              name="Standard"
            />
            
            {/* Multi-Agent Protocol Line - Main */}
            <Line 
              type="monotone" 
              dataKey="multiAgent" 
              stroke={currentProtocol.color}
              strokeWidth={2.5}
              strokeOpacity={currentProtocol.opacity}
              dot={false}
              name={currentProtocol.label}
              className={activeProtocol === 'recalculating' ? 'animate-pulse' : ''}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div 
        className="flex-shrink-0 flex items-center justify-center gap-4 pt-2 border-t"
        style={{ borderColor: theme.bg.surface }}
      >
        <LegendItem 
          color={protocolConfig.standard.color} 
          label="Standard" 
          dashed 
          theme={theme}
        />
        <LegendItem 
          color={currentProtocol.color} 
          label={activeProtocol === 'conservative' ? 'HERA Adjusted' : 'Multi-Agent'} 
          theme={theme}
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, theme }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div 
      className="px-3 py-2 rounded shadow-lg text-xs"
      style={{ 
        background: theme.bg.elevated,
        border: `1px solid ${theme.bg.surface}`
      }}
    >
      <p className="font-semibold mb-1" style={{ color: theme.text.primary }}>
        Week {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span 
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}: {entry.value?.toFixed(1)}
        </p>
      ))}
    </div>
  );
}

function LegendItem({ color, label, dashed, theme }) {
  return (
    <div className="flex items-center gap-1.5">
      <div 
        className="w-4 h-0.5"
        style={{ 
          background: color,
          borderStyle: dashed ? 'dashed' : 'solid'
        }}
      />
      <span 
        className="text-xs"
        style={{ color: theme.text.muted }}
      >
        {label}
      </span>
    </div>
  );
}
