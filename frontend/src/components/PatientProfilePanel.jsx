import React from 'react';
import { User, Heart, Pill, Activity, Dna, FileText, DollarSign, Car, MapPin } from 'lucide-react';

const PatientProfilePanel = ({ patient = null, className = '' }) => {
  if (!patient) {
    return (
      <div className={`premium-surface p-6 ${className}`}>
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No patient data available</p>
          </div>
        </div>
      </div>
    );
  }

  const medications = patient.medications || [];
  const conditions = patient.conditions || [];
  const genomics = patient.biomarkers?.pharmacogenomics || {};
  const lifestyle = patient.lifestyle || {};
  const socioEconomic = patient.socioEconomic || {};

  // Extract socio-economic data with fallbacks
  const insuranceTier = socioEconomic.insuranceTier || patient.insurance || 'Unknown';
  const monthlyBudget = socioEconomic.monthlyMedicationBudget || 150;
  const copayTolerance = socioEconomic.copayTolerance;
  const transportationAccess = socioEconomic.transportationAccess;
  const distanceToClinic = socioEconomic.distanceToClinic;
  const pharmacyAccess = socioEconomic.pharmacyAccess;
  // Reserved for future caregiver support features
  const _workScheduleFlexibility = socioEconomic.workScheduleFlexibility;
  const _caregiverSupport = socioEconomic.caregiverSupport;

  // Determine if there are economic constraints (for visual indicator)
  const hasEconomicConstraints = 
    ['none', 'basic', 'catastrophic'].includes(insuranceTier?.toLowerCase()) ||
    (monthlyBudget && monthlyBudget < 200) ||
    ['none', 'limited'].includes(transportationAccess?.toLowerCase()) ||
    (distanceToClinic && distanceToClinic > 25);

  return (
    <div className={`premium-surface p-6 ${className}`}>
      {/* Patient Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
          <User className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{patient.name || 'Unknown Patient'}</h2>
          <p className="text-sm text-slate-500">{patient.disease || 'Condition'} Case</p>
        </div>
      </div>

      {/* Key Patient Data */}
      <div className="space-y-4">
        {/* Demographics */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demographics</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Age</span>
              <p className="font-semibold text-slate-900">{patient.age || '--'} years</p>
            </div>
            <div>
              <span className="text-slate-500">Gender</span>
              <p className="font-semibold text-slate-900">{patient.gender || '--'}</p>
            </div>
            <div>
              <span className="text-slate-500">Blood Group</span>
              <p className="font-semibold text-slate-900">{patient.profile?.bloodGroup || '--'}</p>
            </div>
            <div>
              <span className="text-slate-500">BMI</span>
              <p className="font-semibold text-slate-900">{patient.profile?.bmi || '--'}</p>
            </div>
          </div>
        </div>

        {/* Socio-Economic Profile (NEW - for HERA) */}
        <div className={`rounded-xl p-4 ${hasEconomicConstraints ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className={`h-4 w-4 ${hasEconomicConstraints ? 'text-rose-500' : 'text-slate-400'}`} />
            <p className={`text-xs font-semibold uppercase tracking-wider ${hasEconomicConstraints ? 'text-rose-600' : 'text-slate-500'}`}>
              Socio-Economic Profile
            </p>
            {hasEconomicConstraints && (
              <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-rose-200 text-rose-700 rounded-full">
                Constraints
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className={hasEconomicConstraints ? 'text-rose-600' : 'text-slate-500'}>Insurance</span>
              <p className={`font-semibold ${hasEconomicConstraints ? 'text-rose-800' : 'text-slate-900'}`}>
                {insuranceTier || '--'}
              </p>
            </div>
            <div>
              <span className={hasEconomicConstraints ? 'text-rose-600' : 'text-slate-500'}>Monthly Budget</span>
              <p className={`font-semibold ${monthlyBudget && monthlyBudget < 200 ? 'text-rose-800' : 'text-slate-900'}`}>
                {monthlyBudget ? `$${monthlyBudget}` : '--'}
              </p>
            </div>
            {copayTolerance && (
              <div>
                <span className="text-slate-500">Copay Tolerance</span>
                <p className="font-semibold text-slate-900">${copayTolerance}</p>
              </div>
            )}
            {pharmacyAccess && (
              <div>
                <span className="text-slate-500">Pharmacy Access</span>
                <p className="font-semibold text-slate-900 capitalize">{pharmacyAccess.replace('-', ' ')}</p>
              </div>
            )}
          </div>
          
          {/* Transportation & Access Row */}
          {(transportationAccess || distanceToClinic) && (
            <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-2 gap-3 text-sm">
              {transportationAccess && (
                <div className="flex items-center gap-2">
                  <Car className={`h-3.5 w-3.5 ${['none', 'limited'].includes(transportationAccess?.toLowerCase()) ? 'text-rose-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-slate-500 text-xs">Transport</span>
                    <p className={`font-semibold text-sm capitalize ${['none', 'limited'].includes(transportationAccess?.toLowerCase()) ? 'text-rose-700' : 'text-slate-900'}`}>
                      {transportationAccess}
                    </p>
                  </div>
                </div>
              )}
              {distanceToClinic && (
                <div className="flex items-center gap-2">
                  <MapPin className={`h-3.5 w-3.5 ${distanceToClinic > 25 ? 'text-rose-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-slate-500 text-xs">Distance</span>
                    <p className={`font-semibold text-sm ${distanceToClinic > 25 ? 'text-rose-700' : 'text-slate-900'}`}>
                      {distanceToClinic} miles
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-rose-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conditions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {conditions.length > 0 ? (
              conditions.map((condition, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 rounded-full border border-rose-100"
                >
                  {condition}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">No conditions recorded</span>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="h-4 w-4 text-violet-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Medications</p>
          </div>
          <div className="space-y-2">
            {medications.length > 0 ? (
              medications.slice(0, 4).map((med, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{med.name || 'Unknown'}</span>
                  <span className="text-slate-400">{med.dosage || '--'}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-slate-400">No medications recorded</span>
            )}
          </div>
        </div>

        {/* Genomic Markers */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Dna className="h-4 w-4 text-cyan-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Genomic Markers</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {genomics.cyp2c19 && (
              <div className="px-3 py-2 bg-cyan-50 rounded-lg">
                <span className="text-xs text-cyan-600">CYP2C19</span>
                <p className="font-medium text-cyan-800">{genomics.cyp2c19}</p>
              </div>
            )}
            {genomics.cyp2d6 && (
              <div className="px-3 py-2 bg-cyan-50 rounded-lg">
                <span className="text-xs text-cyan-600">CYP2D6</span>
                <p className="font-medium text-cyan-800">{genomics.cyp2d6}</p>
              </div>
            )}
            {patient.biomarkers?.genomicVariant && (
              <div className="col-span-2 px-3 py-2 bg-cyan-50 rounded-lg">
                <span className="text-xs text-cyan-600">Primary Variant</span>
                <p className="font-medium text-cyan-800 truncate">{patient.biomarkers.genomicVariant}</p>
              </div>
            )}
            {!genomics.cyp2c19 && !genomics.cyp2d6 && !patient.biomarkers?.genomicVariant && (
              <span className="col-span-2 text-sm text-slate-400">No genomic data available</span>
            )}
          </div>
        </div>

        {/* Lifestyle Factors */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lifestyle</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">Smoking</span>
              <p className="font-medium text-slate-700">{lifestyle.smoking || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-slate-500">Exercise</span>
              <p className="font-medium text-slate-700">{lifestyle.exercise || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-slate-500">Alcohol</span>
              <p className="font-medium text-slate-700">{lifestyle.alcohol || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-slate-500">Diet</span>
              <p className="font-medium text-slate-700">{lifestyle.diet || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePanel;
