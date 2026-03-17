import React, { useState, useEffect } from 'react';

const ResultsCharts = () => {
  const [simulationActive, setSimulationActive] = useState(false);
  const [metrics, setMetrics] = useState({ effectiveness: 0, risk: 0 });

  useEffect(() => {
    const handleSimulation = (e) => {
      const result = e.detail;
      setMetrics({
        effectiveness: result.effectiveness,
        risk: result.risk
      });
      setSimulationActive(true);
    };

    window.addEventListener('simulationComplete', handleSimulation);
    return () => window.removeEventListener('simulationComplete', handleSimulation);
  }, []);

  // Baseline severity starts around 50 for the visual.
  // We map coordinates to a 100x100 SVG viewbox where (0,100) is bottom-left, (100,0) is top-right.
  const startY = 100 - 50; 
  
  // No Treatment: Severity climbs up towards 95
  const pathNoTreatment = `M0,${startY} Q50,30 100,5`; 

  // Optimized Recommendation: Severity drops down towards 10 (cured)
  const pathOptimized = `M0,${startY} Q40,80 100,90`;

  // Current Treatment: Mapped using effectiveness and risk
  // Higher effectiveness means severity drops lower (closer to 100 in svg coords which is Y=0 conceptually, but remember SVG Y goes down).
  // Wait, SVG Y=0 is top (Severity 100). SVG Y=100 is bottom (Severity 0).
  // So startY = 50 (Severity 50).
  const currentSeverityEnd = 100 - metrics.effectiveness; 
  const currentYEnd = currentSeverityEnd; // e.g. Effectiveness 80 -> Severity 20 -> SVG Y=80
  const currentMidY = (startY + currentYEnd) / 2 + (metrics.risk / 2); // adding bounce based on risk
  
  const pathCurrent = simulationActive 
    ? `M0,${startY} Q50,${currentMidY} 100,${currentYEnd}`
    : `M0,${startY} L0,${startY}`; // invisible line if not active

  return (
    <div className="w-full min-h-[350px] flex flex-col gap-6">
      <div className="flex-1 bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 shadow-inner flex flex-col relative overflow-hidden min-h-[300px]">
        
        <div className="absolute top-0 right-0 left-0 p-4 flex justify-between items-center z-10">
          <h4 className="text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-600/50 backdrop-blur-md">
            Disease Progression Trajectory (90 Days)
          </h4>
          
          <div className="flex flex-col gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-700/50 text-xs font-medium">
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Without Treatment</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Current Simulation</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Optimized Path</div>
          </div>
        </div>

        <div className="flex-1 relative mt-16 flex items-stretch border-l border-b border-slate-700/50">
          {/* Y Axis Labels */}
          <div className="absolute -left-12 top-0 bottom-0 w-10 flex flex-col justify-between text-[10px] text-slate-500 font-bold items-end py-2">
            <span>100% (Critical)</span>
            <span>50%</span>
            <span>0% (Remission)</span>
          </div>
          
          {/* X Axis Labels */}
          <div className="absolute -bottom-6 left-0 right-0 h-6 flex justify-between text-[10px] text-slate-500 font-bold px-2">
            <span>Day 0</span>
            <span>Day 45</span>
            <span>Day 90</span>
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between">
            <div className="border-t border-slate-500 w-full h-0"></div>
            <div className="border-t border-slate-500 w-full h-0"></div>
            <div className="border-t border-slate-500 w-full h-0"></div>
          </div>

          <div className="w-full h-full relative z-0">
             <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible p-1">
                {/* Without Treatment */}
                <path d={pathNoTreatment} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" vectorEffect="non-scaling-stroke" />
                
                {/* Optimized */}
                <path d={pathOptimized} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4,2" opacity="0.5" vectorEffect="non-scaling-stroke" />

                {/* Current Simulation */}
                {simulationActive && (
                  <>
                    {/* Glow effect */}
                    <path d={pathCurrent} fill="none" stroke="#3b82f6" strokeWidth="8" opacity="0.2" vectorEffect="non-scaling-stroke" className="animate-pulse" />
                    {/* Main Line */}
                    <path 
                       d={pathCurrent} fill="none" stroke="#3b82f6" strokeWidth="3" vectorEffect="non-scaling-stroke" 
                       style={{ strokeDasharray: 200, strokeDashoffset: 0, animation: 'draw 2s ease-out forwards' }} 
                    />
                  </>
                )}
             </svg>
          </div>
        </div>

        <style>{`
          @keyframes draw {
            from { stroke-dashoffset: 200; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ResultsCharts;
