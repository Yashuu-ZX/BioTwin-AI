import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

const generateData = () => Array.from({ length: 40 }).map((_, i) => ({
  time: i,
  value: 70 + Math.random() * 20
}));

const TwinVisualizer = ({ patient }) => {
  const [data, setData] = useState(generateData());

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: prev[prev.length - 1].time + 1,
          value: 70 + Math.random() * 20 + (patient?.conditions?.includes('Hypertension') ? 10 : 0)
        });
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [patient]);

  return (
    <div className="w-full h-full relative p-4 flex flex-col justify-between overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-48 h-48 rounded-full border-4 border-blue-500 animate-ping"></div>
        <div className="absolute w-32 h-32 rounded-full border-4 border-purple-500 animate-pulse"></div>
      </div>
      
      <div className="z-10 bg-slate-800/80 p-3 rounded-lg w-max mb-4 backdrop-blur-md border border-slate-700/50">
        <span className="text-xs text-slate-400 font-bold tracking-widest uppercase block mb-1">Live ECG Stream</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xl font-mono text-green-400 font-medium">BPM: {Math.round(data[data.length - 1]?.value || 0)}</span>
        </div>
      </div>

      <div className="flex-1 w-full relative z-10 bottom-0 left-0 bg-slate-900 border-t border-slate-700/50 flex items-end">
        {data.map((d, index) => (
          <div 
             key={index} 
             className="flex-1 bg-green-500/50 border-r border-green-400/20 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-300 ease-in-out"
             style={{ height: `${d.value}%`, opacity: (index + 1) / 40 }}
          />
        ))}
      </div>
    </div>
  );
};

export default TwinVisualizer;
