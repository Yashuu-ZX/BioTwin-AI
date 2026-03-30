import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

/**
 * LightTrajectoryChart - Clean, light-themed outcome projection chart
 * Shows projected disease path that updates dynamically
 */

export default function LightTrajectoryChart({ data, activeProtocol }) {
  // Protocol styling
  const protocolStyles = useMemo(() => ({
    standard: { label: 'Standard Care', color: '#94a3b8', opacity: 0.6 },
    multiAgent: { label: 'AI-Optimized', color: '#10b981', opacity: 1 },
    conservative: { label: 'HERA Adjusted', color: '#f59e0b', opacity: 1 },
    recalculating: { label: 'Updating...', color: '#3b82f6', opacity: 0.8 }
  }), []);

  const currentProtocol = protocolStyles[activeProtocol] || protocolStyles.multiAgent;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Projected Disease Path</h3>
        </div>
        <span 
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{ 
            backgroundColor: `${currentProtocol.color}15`,
            color: currentProtocol.color
          }}
        >
          {currentProtocol.label}
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMultiAgent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentProtocol.color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={currentProtocol.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e2e8f0"
              vertical={false}
            />
            
            <XAxis 
              dataKey="week" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(value) => `W${value}`}
            />
            
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[60, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            
            <Tooltip content={<CustomTooltip currentProtocol={currentProtocol} />} />
            
            {/* Baseline Reference */}
            <ReferenceLine 
              y={65} 
              stroke="#cbd5e1"
              strokeDasharray="5 5"
            />
            
            {/* Standard Care Line - Dashed */}
            <Line 
              type="monotone" 
              dataKey="standard" 
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              name="Standard Care"
            />
            
            {/* AI-Optimized Area + Line */}
            <Area
              type="monotone"
              dataKey="multiAgent"
              stroke="transparent"
              fill="url(#colorMultiAgent)"
            />
            <Line 
              type="monotone" 
              dataKey="multiAgent" 
              stroke={currentProtocol.color}
              strokeWidth={2.5}
              dot={false}
              name={currentProtocol.label}
              className={activeProtocol === 'recalculating' ? 'animate-pulse' : ''}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-slate-100 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-400" style={{ borderStyle: 'dashed' }} />
          <span className="text-xs text-slate-500">Standard Care</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5" style={{ backgroundColor: currentProtocol.color }} />
          <span className="text-xs text-slate-500">{currentProtocol.label}</span>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, currentProtocol }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">Week {label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-slate-600">
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}:</span>
          <span className="font-medium">{entry.value?.toFixed(1)}%</span>
        </p>
      ))}
    </div>
  );
}
