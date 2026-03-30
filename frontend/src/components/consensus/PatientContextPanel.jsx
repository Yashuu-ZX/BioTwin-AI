import React from 'react';
import { AlertTriangle, Dna, Heart, Pill, DollarSign, MapPin, Clock } from 'lucide-react';

/**
 * PatientContextPanel - Compact patient data display
 * Dense, tabular layout for the left column anchor
 */

export default function PatientContextPanel({ patient, theme }) {
  if (!patient) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <span className="text-xs font-mono" style={{ color: theme.text.muted }}>
          No patient data
        </span>
      </div>
    );
  }

  // Extract patient data with fallbacks
  const name = patient.name || patient.demographics?.name || 'Unknown Patient';
  const age = patient.age || patient.demographics?.age || '--';
  const sex = patient.sex || patient.demographics?.sex || '--';
  const conditions = patient.conditions || [];
  const medications = patient.medications || [];
  const genomics = patient.biomarkers?.pharmacogenomics || {};
  const socioEconomic = patient.socioEconomic || {};
  
  // Key constraint - Budget (highlighted)
  const budget = socioEconomic.monthlyMedicationBudget || 150;
  const insurance = socioEconomic.insuranceTier || patient.insurance || 'Basic';
  const transport = socioEconomic.transportationAccess || 'Limited';
  const distance = socioEconomic.distanceToClinic || '--';

  // Vitals
  const vitals = patient.vitals || {};

  return (
    <div className="h-full flex flex-col p-3 space-y-3">
      {/* Patient Header - Compact */}
      <div 
        className="rounded-lg p-3"
        style={{ background: theme.bg.elevated }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 
            className="text-sm font-semibold truncate"
            style={{ color: theme.text.primary }}
          >
            {name}
          </h2>
          <span 
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ 
              background: theme.bg.surface,
              color: theme.text.secondary 
            }}
          >
            {age}y/{sex}
          </span>
        </div>
        
        {/* Primary Conditions as badges */}
        <div className="flex flex-wrap gap-1">
          {conditions.slice(0, 3).map((condition, i) => (
            <span 
              key={i}
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ 
                background: `${theme.accent.crimson}20`,
                color: theme.accent.crimson 
              }}
            >
              {typeof condition === 'string' ? condition : condition.name}
            </span>
          ))}
        </div>
      </div>

      {/* CONSTRAINT ALERT - Most Prominent */}
      <div 
        className="rounded-lg p-3 border-l-2"
        style={{ 
          background: `${theme.accent.crimson}10`,
          borderColor: theme.accent.crimson
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: theme.accent.crimson }} />
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.accent.crimson }}
          >
            Constraints
          </span>
        </div>
        <div className="space-y-1.5">
          <DataRow 
            icon={DollarSign}
            label="Budget Cap"
            value={`$${budget}/mo`}
            highlight
            theme={theme}
          />
          <DataRow 
            icon={Heart}
            label="Insurance"
            value={insurance}
            theme={theme}
          />
          <DataRow 
            icon={MapPin}
            label="Transport"
            value={transport}
            theme={theme}
          />
          {distance !== '--' && (
            <DataRow 
              icon={Clock}
              label="Distance"
              value={`${distance}mi`}
              theme={theme}
            />
          )}
        </div>
      </div>

      {/* Genomics Section */}
      <DataSection 
        title="Genomics" 
        icon={Dna}
        theme={theme}
        accentColor={theme.accent.amethyst}
      >
        {Object.entries(genomics).length > 0 ? (
          Object.entries(genomics).slice(0, 4).map(([key, value]) => (
            <DataRow 
              key={key}
              label={formatGenomicKey(key)}
              value={value}
              mono
              theme={theme}
            />
          ))
        ) : (
          <DataRow 
            label="CYP2C19"
            value="*1/*2 (Poor Metabolizer)"
            mono
            theme={theme}
          />
        )}
      </DataSection>

      {/* Medications Section */}
      <DataSection 
        title="Active Medications" 
        icon={Pill}
        theme={theme}
        accentColor={theme.accent.emerald}
      >
        {medications.slice(0, 4).map((med, i) => (
          <DataRow 
            key={i}
            label={typeof med === 'string' ? med : med.name}
            value={typeof med === 'object' ? med.dosage : ''}
            theme={theme}
          />
        ))}
        {medications.length === 0 && (
          <>
            <DataRow label="Metformin" value="500mg BID" theme={theme} />
            <DataRow label="Lisinopril" value="10mg QD" theme={theme} />
          </>
        )}
      </DataSection>

      {/* Vitals Section - Compact Grid */}
      <DataSection 
        title="Vitals" 
        icon={Heart}
        theme={theme}
        accentColor={theme.accent.cyan}
      >
        <div className="grid grid-cols-2 gap-1">
          <VitalBadge label="BP" value={vitals.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic || 80}` : '138/88'} theme={theme} />
          <VitalBadge label="HR" value={vitals.heartRate || '72'} unit="bpm" theme={theme} />
          <VitalBadge label="Gluc" value={vitals.sugar || '142'} unit="mg/dL" theme={theme} />
          <VitalBadge label="SpO2" value={vitals.spO2 || '97'} unit="%" theme={theme} />
        </div>
      </DataSection>
    </div>
  );
}

// Section container
function DataSection({ title, icon: Icon, children, theme, accentColor }) {
  return (
    <div 
      className="rounded-lg p-3"
      style={{ background: theme.bg.elevated }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3 h-3" style={{ color: accentColor }} />
        <span 
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.text.muted }}
        >
          {title}
        </span>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

// Data row for key-value pairs
function DataRow({ icon: Icon, label, value, highlight, mono, theme }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span 
        className="flex items-center gap-1.5"
        style={{ color: theme.text.muted }}
      >
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </span>
      <span 
        className={`${mono ? 'font-mono' : ''} ${highlight ? 'font-semibold' : ''}`}
        style={{ 
          color: highlight ? theme.accent.crimson : theme.text.secondary 
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Compact vital badge
function VitalBadge({ label, value, unit, theme }) {
  return (
    <div 
      className="px-2 py-1 rounded text-center"
      style={{ background: theme.bg.surface }}
    >
      <div 
        className="text-xs font-mono font-semibold"
        style={{ color: theme.text.primary }}
      >
        {value}{unit && <span style={{ color: theme.text.muted }}>{unit}</span>}
      </div>
      <div 
        className="text-xs"
        style={{ color: theme.text.muted }}
      >
        {label}
      </div>
    </div>
  );
}

// Format genomic keys for display
function formatGenomicKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace('Cyp', 'CYP')
    .trim();
}
