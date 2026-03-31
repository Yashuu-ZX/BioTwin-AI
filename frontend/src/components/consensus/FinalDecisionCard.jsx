import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, ArrowRight, Pill, Activity, Sparkles, Database, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * FinalDecisionCard - Displays the consensus result
 * Shows the final recommended treatment once agents reach agreement
 */

export default function FinalDecisionCard({ consensus, status }) {
  const [expanded, setExpanded] = useState(false);
  // Not yet reached consensus
  if (!consensus || status === 'idle') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Final Recommendation</h3>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">
            {status === 'running' || status === 'initializing' 
              ? 'Agents are deliberating...' 
              : 'Start consensus to see recommendation'}
          </p>
        </div>
      </div>
    );
  }

  const hasVeto = consensus.hasVeto;
  const isSuccess = !hasVeto && consensus.protocol;

  return (
    <div className={`
      rounded-xl border-2 overflow-hidden transition-all
      ${hasVeto ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}
    `}>
      {/* Header */}
      <div className={`
        px-5 py-3 flex items-center gap-2
        ${hasVeto ? 'bg-amber-100' : 'bg-emerald-100'}
      `}>
        {hasVeto ? (
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        ) : (
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        )}
        <h3 className={`text-sm font-semibold ${hasVeto ? 'text-amber-800' : 'text-emerald-800'}`}>
          {hasVeto ? 'Adjusted Recommendation' : 'Consensus Reached'}
        </h3>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Main Protocol */}
        <div className="mb-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
            Recommended Protocol
          </span>
          <h4 className={`text-lg font-bold ${hasVeto ? 'text-amber-900' : 'text-emerald-900'}`}>
            {consensus.protocol || 'Generic Lisinopril + Diet Plan'}
          </h4>
        </div>

        {/* Reasoning */}
        {consensus.reasoning && (
          <p className={`text-sm mb-4 ${hasVeto ? 'text-amber-700' : 'text-emerald-700'}`}>
            {consensus.reasoning}
          </p>
        )}

        {/* Veto Notice */}
        {hasVeto && (
          <div className="flex items-start gap-2 p-3 bg-amber-100 rounded-lg mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-amber-800">
              {consensus.vetoReason || 'HERA Guardian adjusted the original recommendation due to budget or safety constraints.'}
            </span>
          </div>
        )}

        {/* AI/Mock Indicator */}
        <div className={`flex items-center gap-1.5 mb-4 px-2 py-1 rounded-md text-xs w-fit ${
          consensus.aiGenerated 
            ? 'bg-violet-100 text-violet-700' 
            : 'bg-slate-100 text-slate-600'
        }`}>
          {consensus.aiGenerated ? (
            <>
              <Sparkles className="w-3 h-3" />
              <span>AI-Generated Recommendation</span>
            </>
          ) : (
            <>
              <Database className="w-3 h-3" />
              <span>Rule-Based Analysis</span>
            </>
          )}
        </div>

        {/* Medications Section */}
        {consensus.medications && consensus.medications.length > 0 && (
          <div className="mb-4">
            <button 
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Medications ({consensus.medications.length})</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {expanded && (
              <div className="mt-2 space-y-2">
                {consensus.medications.map((med, idx) => (
                  <div key={idx} className="p-2 bg-white/60 rounded-lg border border-slate-200/50">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-slate-800">{med.name}</span>
                      <span className="text-xs text-slate-500">{med.dose}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {med.frequency} {med.duration && `• ${med.duration}`}
                    </div>
                    {med.notes && (
                      <p className="text-xs text-slate-400 mt-1 italic">{med.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Monitoring Section */}
        {expanded && consensus.monitoring && consensus.monitoring.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Monitoring Required</span>
            </div>
            <ul className="space-y-1">
              {consensus.monitoring.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-200/50">
          {consensus.confidence && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Confidence:</span>
              <span className={`text-sm font-semibold ${hasVeto ? 'text-amber-700' : 'text-emerald-700'}`}>
                {consensus.confidence}%
              </span>
            </div>
          )}
          {consensus.rounds && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Rounds:</span>
              <span className="text-sm font-medium text-slate-700">{consensus.rounds}</span>
            </div>
          )}
          {consensus.consensusLevel && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Agreement:</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                consensus.consensusLevel === 'Full' 
                  ? 'bg-emerald-200 text-emerald-800' 
                  : consensus.consensusLevel === 'Majority'
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-amber-200 text-amber-800'
              }`}>
                {consensus.consensusLevel}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button className={`
          w-full mt-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors
          ${hasVeto 
            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }
        `}>
          {consensus.action || 'Apply to Treatment Plan'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
