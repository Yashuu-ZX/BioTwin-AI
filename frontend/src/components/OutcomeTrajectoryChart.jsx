import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-slate-200">
        <p className="text-sm font-semibold text-slate-700 mb-2">Day {label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-semibold text-slate-900">{Math.round(entry.value)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const OutcomeTrajectoryChart = ({
  trajectory = null,
  hasConsensus = false,
  className = '',
}) => {
  // Generate sample trajectory if none provided
  const generateSampleTrajectory = () => {
    const days = [0, 7, 14, 21, 30, 45, 60, 90];
    return days.map(day => ({
      day: `Day ${day}`,
      'Baseline (Pre-Consensus)': Math.max(20, 85 - day * 0.5 + Math.random() * 5),
      'Multi-Agent Consensus Protocol': Math.min(95, 45 + day * 0.6 + Math.random() * 3),
    }));
  };

  const chartData = trajectory || generateSampleTrajectory();

  return (
    <div className={`premium-surface p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outcome Trajectory
            </p>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Projected Disease Path following Multi-Agent Consensus
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Comparing baseline trajectory vs. consensus-driven protocol outcome
          </p>
        </div>
        {hasConsensus && (
          <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
            Consensus Applied
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="consensusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-slate-600">{value}</span>
                )}
              />
              <ReferenceLine
                y={50}
                stroke="#cbd5e1"
                strokeDasharray="6 6"
                label={{
                  value: 'Threshold',
                  position: 'right',
                  fill: '#94a3b8',
                  fontSize: 11,
                }}
              />
              {/* Baseline (Pre-Consensus) Line */}
              <Line
                type="monotone"
                dataKey="Baseline (Pre-Consensus)"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 4, fill: '#94a3b8' }}
              />
              {/* Multi-Agent Consensus Protocol Line */}
              <Line
                type="monotone"
                dataKey="Multi-Agent Consensus Protocol"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Run consensus simulation to see trajectory</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend explanation */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-slate-400" style={{ borderStyle: 'dashed' }} />
            <span className="text-slate-500">Baseline (Pre-Consensus)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-emerald-500 rounded-full" />
            <span className="text-slate-700 font-medium">Multi-Agent Consensus Protocol</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Higher values indicate better health outcomes. The consensus protocol shows projected improvement over baseline trajectory.
        </p>
      </div>
    </div>
  );
};

export default OutcomeTrajectoryChart;
