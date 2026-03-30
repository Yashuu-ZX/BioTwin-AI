import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

/**
 * CompactTrajectoryChart - Smaller chart for the left sidebar
 * Shows projected disease path in a condensed format
 */

export default function CompactTrajectoryChart({ data, activeProtocol }) {
  const protocolColors = {
    standard: '#94a3b8',
    multiAgent: '#10b981',
    conservative: '#f59e0b',
    recalculating: '#3b82f6'
  };

  const currentColor = protocolColors[activeProtocol] || protocolColors.multiAgent;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Disease Trajectory</span>
        </div>
        <span 
          className="text-xs font-medium px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${currentColor}20`, color: currentColor }}
        >
          {activeProtocol === 'conservative' ? 'Adjusted' : 'AI-Optimized'}
        </span>
      </div>

      {/* Compact Chart */}
      <div className="p-2 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentColor} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={currentColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="week" 
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              domain={[60, 100]}
              ticks={[70, 85, 100]}
            />
            
            {/* Standard care - dashed */}
            <Line 
              type="monotone" 
              dataKey="standard" 
              stroke="#cbd5e1"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
            />
            
            {/* AI-optimized - solid with area */}
            <Area
              type="monotone"
              dataKey="multiAgent"
              stroke="transparent"
              fill="url(#colorArea)"
            />
            <Line 
              type="monotone" 
              dataKey="multiAgent" 
              stroke={currentColor}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-slate-300" style={{ borderStyle: 'dashed' }} />
          <span className="text-xs text-slate-500">Standard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5" style={{ backgroundColor: currentColor }} />
          <span className="text-xs text-slate-500">AI-Optimized</span>
        </div>
      </div>
    </div>
  );
}
