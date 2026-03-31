/**
 * Clinical Trials Service
 * 
 * Matches patients to relevant clinical trials based on:
 * - Disease type and staging
 * - Genomic markers and biomarkers
 * - Prior treatment history
 * - Demographics and performance status
 * 
 * Supports AI-enhanced matching when OpenAI/OpenRouter is configured
 */

require('dotenv').config();

// Check for AI integration
let openaiClient = null;
let AI_ENABLED = false;

try {
  if (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) {
    openaiClient = require('./ai/openaiClient');
    AI_ENABLED = true;
    console.log('✅ AI-enhanced clinical trial matching enabled');
  }
} catch (error) {
  console.log('⚠️ AI not available for trial matching - using rule-based matching');
}

// Mock clinical trials database
const CLINICAL_TRIALS = [
  // Oncology Trials
  {
    nctId: 'NCT04567890',
    title: 'Phase III Study of Targeted Therapy in EGFR-Mutant NSCLC',
    phase: 'Phase 3',
    status: 'Recruiting',
    conditions: ['Non-Small Cell Lung Cancer', 'NSCLC', 'Lung Cancer'],
    interventions: ['Osimertinib', 'Standard Chemotherapy'],
    sponsor: 'National Cancer Institute',
    eligibility: {
      diseases: ['Oncology', 'Respiratory'],
      genomicMarkers: ['EGFR'],
      minAge: 18,
      maxAge: 85,
      ecogMax: 2,
      priorTreatments: { required: [], excluded: ['Osimertinib', 'Third-generation EGFR TKI'] }
    },
    locations: ['Memorial Sloan Kettering', 'MD Anderson', 'Mayo Clinic'],
    estimatedCompletion: '2026-12',
    summary: 'Comparing osimertinib to standard chemotherapy in patients with EGFR exon 19 deletion or L858R mutation.'
  },
  {
    nctId: 'NCT04789012',
    title: 'Immunotherapy Combination in MSI-H Solid Tumors',
    phase: 'Phase 2',
    status: 'Recruiting',
    conditions: ['Colorectal Cancer', 'Endometrial Cancer', 'Gastric Cancer', 'MSI-H Tumors'],
    interventions: ['Pembrolizumab', 'Lenvatinib'],
    sponsor: 'Merck Sharp & Dohme',
    eligibility: {
      diseases: ['Oncology'],
      genomicMarkers: ['MSI-H'],
      biomarkers: { microsatelliteStatus: 'MSI-H' },
      minAge: 18,
      maxAge: 99,
      ecogMax: 1,
      priorTreatments: { required: ['Prior systemic therapy'], excluded: ['Anti-PD-1', 'Anti-PD-L1'] }
    },
    locations: ['Dana-Farber', 'Johns Hopkins', 'Cleveland Clinic'],
    estimatedCompletion: '2025-06',
    summary: 'Evaluating the combination of pembrolizumab and lenvatinib in MSI-H/dMMR solid tumors.'
  },
  {
    nctId: 'NCT04901234',
    title: 'HER2-Targeted ADC in Breast Cancer',
    phase: 'Phase 3',
    status: 'Recruiting',
    conditions: ['Breast Cancer', 'HER2-Positive Breast Cancer'],
    interventions: ['Trastuzumab deruxtecan', 'Physician\'s Choice'],
    sponsor: 'AstraZeneca',
    eligibility: {
      diseases: ['Oncology'],
      biomarkers: { herStatus: 'Positive' },
      minAge: 18,
      maxAge: 99,
      ecogMax: 2,
      priorTreatments: { required: ['T-DM1'], excluded: [] }
    },
    locations: ['UCSF', 'Northwestern', 'Cedars-Sinai'],
    estimatedCompletion: '2027-03',
    summary: 'Comparing T-DXd to physician\'s choice in HER2+ metastatic breast cancer after T-DM1.'
  },
  
  // Cardiovascular Trials
  {
    nctId: 'NCT04234567',
    title: 'SGLT2 Inhibitor in Heart Failure with Preserved EF',
    phase: 'Phase 3',
    status: 'Recruiting',
    conditions: ['Heart Failure', 'HFpEF', 'Cardiac'],
    interventions: ['Empagliflozin', 'Placebo'],
    sponsor: 'Boehringer Ingelheim',
    eligibility: {
      diseases: ['Cardiac', 'Metabolic'],
      conditions: ['Heart Failure', 'HFpEF'],
      minAge: 40,
      maxAge: 85,
      ecogMax: 3,
      requiredConditions: ['Heart Failure'],
      excludedConditions: ['Type 1 Diabetes', 'eGFR < 20']
    },
    locations: ['Cleveland Clinic', 'Brigham and Women\'s', 'Duke'],
    estimatedCompletion: '2025-09',
    summary: 'Evaluating empagliflozin in patients with heart failure and preserved ejection fraction.'
  },
  {
    nctId: 'NCT04345678',
    title: 'Novel Anticoagulant in Atrial Fibrillation',
    phase: 'Phase 3',
    status: 'Recruiting',
    conditions: ['Atrial Fibrillation', 'AFib', 'Arrhythmia', 'Cardiac'],
    interventions: ['Novel Factor XIa Inhibitor', 'Apixaban'],
    sponsor: 'Bristol-Myers Squibb',
    eligibility: {
      diseases: ['Cardiac'],
      conditions: ['Atrial Fibrillation', 'Arrhythmia'],
      minAge: 55,
      maxAge: 90,
      requiredConditions: ['Atrial Fibrillation'],
      excludedMedications: ['Warfarin', 'Current anticoagulation'],
      excludedConditions: ['Active bleeding', 'Mechanical heart valve']
    },
    locations: ['Texas Heart Institute', 'Mount Sinai', 'Stanford'],
    estimatedCompletion: '2026-06',
    summary: 'Comparing a novel Factor XIa inhibitor to apixaban for stroke prevention in AFib.'
  },
  
  // Metabolic/Diabetes Trials
  {
    nctId: 'NCT04456789',
    title: 'GLP-1/GIP Dual Agonist in Type 2 Diabetes',
    phase: 'Phase 3',
    status: 'Recruiting',
    conditions: ['Type 2 Diabetes', 'Diabetes', 'Metabolic'],
    interventions: ['Tirzepatide', 'Semaglutide'],
    sponsor: 'Eli Lilly',
    eligibility: {
      diseases: ['Metabolic'],
      conditions: ['Type 2 Diabetes', 'Diabetes'],
      minAge: 18,
      maxAge: 75,
      requiredConditions: ['Type 2 Diabetes'],
      excludedConditions: ['Type 1 Diabetes', 'Pancreatitis history', 'MTC family history']
    },
    locations: ['Joslin Diabetes Center', 'UCLA', 'University of Michigan'],
    estimatedCompletion: '2025-12',
    summary: 'Head-to-head comparison of tirzepatide vs semaglutide in T2DM with inadequate glycemic control.'
  },
  
  // Respiratory Trials
  {
    nctId: 'NCT04567123',
    title: 'Biologic Therapy in Severe Eosinophilic Asthma',
    phase: 'Phase 3',
    status: 'Recruiting',
    conditions: ['Asthma', 'Severe Asthma', 'Eosinophilic Asthma', 'Respiratory'],
    interventions: ['Tezepelumab', 'Placebo'],
    sponsor: 'AstraZeneca',
    eligibility: {
      diseases: ['Respiratory'],
      conditions: ['Asthma'],
      minAge: 12,
      maxAge: 80,
      biomarkerRequirements: { eosinophils: { min: 150 } },
      requiredConditions: ['Severe Asthma'],
      excludedConditions: ['COPD', 'Current smoking']
    },
    locations: ['National Jewish Health', 'Partners Asthma Center', 'UCSF'],
    estimatedCompletion: '2025-08',
    summary: 'Evaluating tezepelumab in severe asthma regardless of eosinophil count.'
  },
  
  // Neurological Trials
  {
    nctId: 'NCT04678901',
    title: 'Anti-Amyloid Therapy in Early Alzheimer\'s Disease',
    phase: 'Phase 3',
    status: 'Recruiting',
    conditions: ['Alzheimer\'s Disease', 'Dementia', 'Neurological', 'MCI'],
    interventions: ['Lecanemab', 'Placebo'],
    sponsor: 'Eisai/Biogen',
    eligibility: {
      diseases: ['Neurological'],
      conditions: ['Alzheimer\'s Disease', 'MCI'],
      minAge: 50,
      maxAge: 90,
      biomarkerRequirements: { amyloidPositive: true },
      excludedConditions: ['Stroke within 1 year', 'Brain hemorrhage']
    },
    locations: ['Mass General', 'UCSF Memory Center', 'Mayo Clinic'],
    estimatedCompletion: '2027-06',
    summary: 'Long-term safety and efficacy of lecanemab in early Alzheimer\'s disease.'
  }
];

/**
 * Match a patient to eligible clinical trials
 * Uses AI-enhanced matching when available for better relevance scoring
 * @param {Object} patient - Full patient object
 * @returns {Object} Matching results with ranked trials
 */
async function matchPatientToTrials(patient) {
  const matches = [];
  const partialMatches = [];
  const ineligible = [];

  // First, run rule-based eligibility check
  for (const trial of CLINICAL_TRIALS) {
    const eligibilityResult = checkTrialEligibility(patient, trial);
    
    if (eligibilityResult.eligible) {
      matches.push({
        ...formatTrialSummary(trial),
        matchScore: eligibilityResult.score,
        matchReasons: eligibilityResult.matchReasons,
        eligibilityNotes: eligibilityResult.notes
      });
    } else if (eligibilityResult.partialMatch) {
      partialMatches.push({
        ...formatTrialSummary(trial),
        matchScore: eligibilityResult.score,
        missingCriteria: eligibilityResult.missingCriteria,
        exclusionReasons: eligibilityResult.exclusionReasons
      });
    } else {
      ineligible.push({
        nctId: trial.nctId,
        title: trial.title,
        exclusionReasons: eligibilityResult.exclusionReasons
      });
    }
  }

  // Sort matches by score
  matches.sort((a, b) => b.matchScore - a.matchScore);
  partialMatches.sort((a, b) => b.matchScore - a.matchScore);

  // If AI is available and we have matches, enhance with AI reasoning
  let aiEnhancement = null;
  if (AI_ENABLED && openaiClient && matches.length > 0) {
    try {
      aiEnhancement = await getAITrialRecommendation(patient, matches.slice(0, 5));
    } catch (error) {
      console.warn('AI trial enhancement failed:', error.message);
    }
  }

  return {
    patientId: patient.patientId,
    patientName: patient.name,
    disease: patient.disease,
    totalTrialsScreened: CLINICAL_TRIALS.length,
    eligibleTrials: matches,
    partialMatches: partialMatches.slice(0, 5),  // Top 5 partial matches
    ineligibleCount: ineligible.length,
    aiEnhancement: aiEnhancement,
    aiEnabled: AI_ENABLED,
    searchTimestamp: new Date().toISOString(),
    disclaimer: 'Trial matching is for informational purposes only. Confirm eligibility with study coordinators.'
  };
}

/**
 * AI-enhanced trial recommendation
 * Provides personalized reasoning for why specific trials are good matches
 */
async function getAITrialRecommendation(patient, topTrials) {
  const OpenAI = require('openai');
  
  const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: useOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1',
    defaultHeaders: useOpenRouter ? {
      'HTTP-Referer': 'https://biotwin.ai',
      'X-Title': 'BioTwin Clinical Trials'
    } : {}
  });
  
  const MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini';
  
  const patientSummary = `
Patient: ${patient.name || 'Unknown'}, Age: ${patient.age || 'Unknown'}
Disease: ${patient.disease || 'Unknown'}
Conditions: ${patient.medicalHistory?.conditions?.join(', ') || 'None listed'}
Genomic Markers: ${patient.biomarkers?.genomicVariant || 'Not assessed'}
MSI Status: ${patient.biomarkers?.genomics?.microsatelliteStatus || 'Unknown'}
HER2 Status: ${patient.biomarkers?.genomics?.herStatus || 'Unknown'}
Current Medications: ${patient.medications?.map(m => m.name).filter(Boolean).join(', ') || 'None listed'}
`;

  const trialsContext = topTrials.map(t => `
- ${t.nctId}: ${t.title}
  Phase: ${t.phase}, Status: ${t.status}
  Interventions: ${t.interventions.join(', ')}
  Match Score: ${t.matchScore}
  Match Reasons: ${t.matchReasons?.join('; ') || 'N/A'}
`).join('\n');

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `You are a clinical trials specialist AI. Given a patient profile and matched clinical trials, provide a brief personalized recommendation explaining:
1. Which trial(s) are the best fit and why
2. Key considerations for this specific patient
3. Any potential concerns or prerequisites

Be specific to the patient's actual conditions and markers. Keep response concise.

Output JSON format:
{
  "topRecommendation": {
    "nctId": "trial ID",
    "reasoning": "2-3 sentences explaining why this is the best match"
  },
  "patientSpecificConsiderations": ["list of considerations specific to this patient"],
  "nextSteps": ["actionable next steps for the patient"],
  "confidenceLevel": "high|medium|low"
}`
        },
        {
          role: 'user',
          content: `Patient Profile:\n${patientSummary}\n\nMatched Trials:\n${trialsContext}\n\nProvide your recommendation as JSON.`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('AI trial recommendation error:', error);
    throw error;
  }
}

/**
 * Check if a patient is eligible for a specific trial
 */
function checkTrialEligibility(patient, trial) {
  const eligibility = trial.eligibility;
  const exclusionReasons = [];
  const matchReasons = [];
  const missingCriteria = [];
  const notes = [];
  let score = 0;

  // Check age
  const age = patient.age || patient.profile?.age || 0;
  if (eligibility.minAge && age < eligibility.minAge) {
    exclusionReasons.push(`Age ${age} below minimum ${eligibility.minAge}`);
  } else if (eligibility.maxAge && age > eligibility.maxAge) {
    exclusionReasons.push(`Age ${age} above maximum ${eligibility.maxAge}`);
  } else if (age > 0) {
    matchReasons.push('Age criteria met');
    score += 10;
  }

  // Check disease match
  const patientDisease = (patient.disease || '').toLowerCase();
  const diseaseMatch = eligibility.diseases?.some(d => 
    patientDisease.includes(d.toLowerCase()) || d.toLowerCase().includes(patientDisease)
  );
  if (diseaseMatch) {
    matchReasons.push(`Disease match: ${patient.disease}`);
    score += 25;
  } else {
    missingCriteria.push('Disease type may not match trial focus');
  }

  // Check condition match
  const patientConditions = (patient.conditions || patient.medicalHistory?.conditions || [])
    .map(c => c.toLowerCase());
  
  if (eligibility.conditions) {
    const conditionMatch = eligibility.conditions.some(c =>
      patientConditions.some(pc => pc.includes(c.toLowerCase()) || c.toLowerCase().includes(pc))
    );
    if (conditionMatch) {
      matchReasons.push('Condition criteria match');
      score += 15;
    }
  }

  // Check required conditions
  if (eligibility.requiredConditions) {
    const hasRequired = eligibility.requiredConditions.every(rc =>
      patientConditions.some(pc => pc.includes(rc.toLowerCase()))
    );
    if (!hasRequired) {
      missingCriteria.push(`Required condition(s): ${eligibility.requiredConditions.join(', ')}`);
    } else {
      score += 10;
    }
  }

  // Check excluded conditions
  if (eligibility.excludedConditions) {
    const hasExcluded = eligibility.excludedConditions.some(ec =>
      patientConditions.some(pc => pc.includes(ec.toLowerCase()))
    );
    if (hasExcluded) {
      exclusionReasons.push('Has excluded condition');
    }
  }

  // Check ECOG performance status
  const ecog = patient.performanceStatus?.ecog;
  if (ecog !== undefined && eligibility.ecogMax !== undefined) {
    if (ecog > eligibility.ecogMax) {
      exclusionReasons.push(`ECOG ${ecog} exceeds maximum ${eligibility.ecogMax}`);
    } else {
      matchReasons.push(`ECOG ${ecog} within limit`);
      score += 10;
    }
  }

  // Check genomic markers
  if (eligibility.genomicMarkers) {
    const patientVariants = patient.biomarkers?.genomics?.variants || [];
    const variantGenes = patientVariants.map(v => v.gene?.toUpperCase());
    
    // Also check legacy genomicVariant field
    const legacyVariant = (patient.biomarkers?.genomicVariant || '').toUpperCase();
    
    const hasRequiredMarker = eligibility.genomicMarkers.some(marker =>
      variantGenes.includes(marker.toUpperCase()) || legacyVariant.includes(marker.toUpperCase())
    );
    
    if (hasRequiredMarker) {
      matchReasons.push(`Has required genomic marker: ${eligibility.genomicMarkers.join(', ')}`);
      score += 30;  // Genomic match is highly valuable
    } else {
      missingCriteria.push(`Requires genomic marker: ${eligibility.genomicMarkers.join(' or ')}`);
    }
  }

  // Check biomarkers
  if (eligibility.biomarkers) {
    const patientBiomarkers = patient.biomarkers?.genomics || {};
    
    if (eligibility.biomarkers.microsatelliteStatus) {
      if (patientBiomarkers.microsatelliteStatus === eligibility.biomarkers.microsatelliteStatus) {
        matchReasons.push(`MSI status match: ${eligibility.biomarkers.microsatelliteStatus}`);
        score += 25;
      } else {
        missingCriteria.push(`Requires ${eligibility.biomarkers.microsatelliteStatus} status`);
      }
    }
    
    if (eligibility.biomarkers.herStatus) {
      if (patientBiomarkers.herStatus === eligibility.biomarkers.herStatus) {
        matchReasons.push(`HER2 status match: ${eligibility.biomarkers.herStatus}`);
        score += 25;
      } else {
        missingCriteria.push(`Requires HER2 ${eligibility.biomarkers.herStatus}`);
      }
    }
  }

  // Check prior treatments
  if (eligibility.priorTreatments) {
    const priorTreatments = (patient.medicalHistory?.previousTreatments || [])
      .map(t => t.treatmentName?.toLowerCase());
    const currentMeds = (patient.medications || [])
      .map(m => m.name?.toLowerCase());
    const allTreatments = [...priorTreatments, ...currentMeds];

    // Check excluded treatments
    if (eligibility.priorTreatments.excluded?.length > 0) {
      const hasExcluded = eligibility.priorTreatments.excluded.some(ex =>
        allTreatments.some(t => t?.includes(ex.toLowerCase()))
      );
      if (hasExcluded) {
        exclusionReasons.push('Has excluded prior treatment');
      }
    }

    // Check required treatments
    if (eligibility.priorTreatments.required?.length > 0) {
      const hasRequired = eligibility.priorTreatments.required.every(req =>
        allTreatments.some(t => t?.includes(req.toLowerCase()))
      );
      if (!hasRequired) {
        missingCriteria.push(`Requires prior: ${eligibility.priorTreatments.required.join(', ')}`);
      } else {
        matchReasons.push('Prior treatment criteria met');
        score += 15;
      }
    }
  }

  // Check excluded medications
  if (eligibility.excludedMedications) {
    const currentMeds = (patient.medications || []).map(m => m.name?.toLowerCase());
    const hasExcludedMed = eligibility.excludedMedications.some(em =>
      currentMeds.some(m => m?.includes(em.toLowerCase()))
    );
    if (hasExcludedMed) {
      exclusionReasons.push('Currently on excluded medication');
    }
  }

  // Determine eligibility
  const eligible = exclusionReasons.length === 0 && matchReasons.length >= 2;
  const partialMatch = exclusionReasons.length === 0 && missingCriteria.length > 0 && matchReasons.length >= 1;

  return {
    eligible,
    partialMatch,
    score,
    matchReasons,
    exclusionReasons,
    missingCriteria,
    notes
  };
}

/**
 * Format trial for API response
 */
function formatTrialSummary(trial) {
  return {
    nctId: trial.nctId,
    title: trial.title,
    phase: trial.phase,
    status: trial.status,
    conditions: trial.conditions,
    interventions: trial.interventions,
    sponsor: trial.sponsor,
    locations: trial.locations,
    estimatedCompletion: trial.estimatedCompletion,
    summary: trial.summary,
    clinicalTrialsGovUrl: `https://clinicaltrials.gov/study/${trial.nctId}`
  };
}

/**
 * Search trials by criteria
 * @param {Object} criteria - Search criteria
 */
function searchTrials(criteria) {
  let results = [...CLINICAL_TRIALS];

  if (criteria.disease) {
    const diseaseSearch = criteria.disease.toLowerCase();
    results = results.filter(t =>
      t.conditions.some(c => c.toLowerCase().includes(diseaseSearch)) ||
      t.eligibility.diseases?.some(d => d.toLowerCase().includes(diseaseSearch))
    );
  }

  if (criteria.phase) {
    results = results.filter(t => t.phase.includes(criteria.phase));
  }

  if (criteria.status) {
    results = results.filter(t => t.status === criteria.status);
  }

  if (criteria.genomicMarker) {
    const marker = criteria.genomicMarker.toUpperCase();
    results = results.filter(t =>
      t.eligibility.genomicMarkers?.some(m => m.toUpperCase().includes(marker))
    );
  }

  if (criteria.intervention) {
    const intervention = criteria.intervention.toLowerCase();
    results = results.filter(t =>
      t.interventions.some(i => i.toLowerCase().includes(intervention))
    );
  }

  return {
    results: results.map(formatTrialSummary),
    totalFound: results.length,
    searchCriteria: criteria,
    searchTimestamp: new Date().toISOString()
  };
}

/**
 * Get trial details by NCT ID
 */
function getTrialById(nctId) {
  const trial = CLINICAL_TRIALS.find(t => t.nctId === nctId);
  if (!trial) return null;
  
  return {
    ...formatTrialSummary(trial),
    eligibilityCriteria: trial.eligibility,
    fullDetails: true
  };
}

module.exports = {
  matchPatientToTrials,
  searchTrials,
  getTrialById,
  CLINICAL_TRIALS
};
