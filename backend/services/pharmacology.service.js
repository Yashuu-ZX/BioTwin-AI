/**
 * Pharmacology Service
 * 
 * Provides drug interaction checking, pharmacokinetic modeling, 
 * and pharmacogenomic-based dosing recommendations.
 * 
 * This service enhances patient safety by:
 * 1. Checking drug-drug interactions
 * 2. Checking drug-allergy contraindications
 * 3. Adjusting doses based on renal/hepatic function
 * 4. Providing pharmacogenomic dosing guidance
 * 
 * Supports AI-enhanced analysis when OpenAI/OpenRouter is configured
 */

require('dotenv').config();

// Check for AI integration
let AI_ENABLED = false;
let openaiInstance = null;

try {
  if (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    
    openaiInstance = new OpenAI({
      apiKey: apiKey,
      baseURL: useOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1',
      defaultHeaders: useOpenRouter ? {
        'HTTP-Referer': 'https://biotwin.ai',
        'X-Title': 'BioTwin Pharmacology'
      } : {}
    });
    
    AI_ENABLED = true;
    console.log('✅ AI-enhanced pharmacology analysis available');
  }
} catch (error) {
  console.log('⚠️ AI not available for pharmacology - using rule-based analysis');
}

// Comprehensive drug interaction database (expanded)
const DRUG_INTERACTIONS = {
  'Warfarin': {
    interactions: [
      { drug: 'Aspirin', severity: 'Major', effect: 'Increased bleeding risk', action: 'Avoid combination or monitor closely' },
      { drug: 'Ibuprofen', severity: 'Major', effect: 'Increased bleeding risk and GI hemorrhage', action: 'Avoid NSAIDs if possible' },
      { drug: 'Metronidazole', severity: 'Major', effect: 'Increased anticoagulant effect', action: 'Reduce warfarin dose by 25-50%' },
      { drug: 'Amiodarone', severity: 'Major', effect: 'Significantly increased INR', action: 'Reduce warfarin dose by 30-50%' },
      { drug: 'Fluconazole', severity: 'Major', effect: 'Increased anticoagulant effect', action: 'Monitor INR closely' },
      { drug: 'Simvastatin', severity: 'Moderate', effect: 'Increased bleeding risk', action: 'Monitor INR' },
      { drug: 'Omeprazole', severity: 'Moderate', effect: 'May alter warfarin metabolism', action: 'Monitor INR' }
    ],
    foodInteractions: ['Vitamin K rich foods (leafy greens)', 'Cranberry juice', 'Grapefruit'],
    monitoringRequired: ['INR', 'Signs of bleeding']
  },
  'Metformin': {
    interactions: [
      { drug: 'Contrast dye', severity: 'Major', effect: 'Risk of lactic acidosis', action: 'Hold metformin 48h before/after contrast' },
      { drug: 'Alcohol', severity: 'Major', effect: 'Increased lactic acidosis risk', action: 'Limit alcohol consumption' },
      { drug: 'Furosemide', severity: 'Moderate', effect: 'May increase metformin levels', action: 'Monitor renal function' },
      { drug: 'Cimetidine', severity: 'Moderate', effect: 'Increased metformin levels', action: 'Consider dose adjustment' }
    ],
    renalConsiderations: { 
      gfrThreshold: 30, 
      action: 'Contraindicated if GFR < 30 mL/min',
      doseAdjustment: 'Reduce dose if GFR 30-45 mL/min'
    },
    monitoringRequired: ['Renal function', 'B12 levels (long-term)', 'Lactic acid if symptomatic']
  },
  'Lisinopril': {
    interactions: [
      { drug: 'Potassium supplements', severity: 'Major', effect: 'Hyperkalemia risk', action: 'Monitor potassium closely' },
      { drug: 'Spironolactone', severity: 'Major', effect: 'Severe hyperkalemia risk', action: 'Monitor potassium, consider alternatives' },
      { drug: 'NSAIDs', severity: 'Moderate', effect: 'Reduced antihypertensive effect, renal impairment', action: 'Avoid if possible' },
      { drug: 'Lithium', severity: 'Moderate', effect: 'Increased lithium levels', action: 'Monitor lithium levels' },
      { drug: 'Aliskiren', severity: 'Major', effect: 'Hypotension, hyperkalemia, renal failure', action: 'Avoid in diabetics' }
    ],
    contraindications: ['Pregnancy', 'History of angioedema with ACE inhibitors', 'Bilateral renal artery stenosis'],
    monitoringRequired: ['Potassium', 'Creatinine', 'Blood pressure']
  },
  'Atorvastatin': {
    interactions: [
      { drug: 'Gemfibrozil', severity: 'Major', effect: 'Increased myopathy/rhabdomyolysis risk', action: 'Avoid combination' },
      { drug: 'Clarithromycin', severity: 'Major', effect: 'Increased statin levels', action: 'Limit atorvastatin to 20mg' },
      { drug: 'Cyclosporine', severity: 'Major', effect: 'Markedly increased statin exposure', action: 'Avoid or use lowest dose' },
      { drug: 'Grapefruit juice', severity: 'Moderate', effect: 'Increased statin levels', action: 'Avoid large quantities' },
      { drug: 'Amiodarone', severity: 'Moderate', effect: 'Increased myopathy risk', action: 'Limit atorvastatin to 40mg' }
    ],
    hepaticConsiderations: {
      altThreshold: 3,  // x ULN
      action: 'Contraindicated in active liver disease'
    },
    monitoringRequired: ['LFTs at baseline', 'CK if muscle symptoms']
  },
  'Clopidogrel': {
    interactions: [
      { drug: 'Omeprazole', severity: 'Major', effect: 'Reduced antiplatelet effect (CYP2C19 inhibition)', action: 'Use pantoprazole instead' },
      { drug: 'Esomeprazole', severity: 'Major', effect: 'Reduced antiplatelet effect', action: 'Use pantoprazole instead' },
      { drug: 'Aspirin', severity: 'Moderate', effect: 'Increased bleeding risk (but often intentional DAPT)', action: 'Monitor for bleeding' },
      { drug: 'Warfarin', severity: 'Major', effect: 'Significantly increased bleeding risk', action: 'Triple therapy requires careful monitoring' }
    ],
    pharmacogenomics: {
      gene: 'CYP2C19',
      poorMetabolizer: 'Reduced efficacy - consider prasugrel or ticagrelor',
      recommendation: 'Genetic testing recommended for ACS/PCI patients'
    },
    monitoringRequired: ['Signs of bleeding', 'Platelet function (if available)']
  },
  'Amiodarone': {
    interactions: [
      { drug: 'Warfarin', severity: 'Major', effect: 'Increased INR by 30-50%', action: 'Reduce warfarin dose proactively' },
      { drug: 'Digoxin', severity: 'Major', effect: 'Increased digoxin levels by 70-100%', action: 'Reduce digoxin dose by 50%' },
      { drug: 'Simvastatin', severity: 'Major', effect: 'Increased myopathy risk', action: 'Limit simvastatin to 20mg' },
      { drug: 'QT-prolonging drugs', severity: 'Major', effect: 'Torsades de pointes risk', action: 'Avoid combination' },
      { drug: 'Beta-blockers', severity: 'Moderate', effect: 'Bradycardia, heart block', action: 'Monitor heart rate' }
    ],
    organToxicity: ['Thyroid (hypo/hyperthyroidism)', 'Pulmonary fibrosis', 'Hepatotoxicity', 'Corneal deposits'],
    monitoringRequired: ['TFTs every 6 months', 'LFTs', 'CXR annually', 'PFTs at baseline', 'Eye exam']
  },
  'Digoxin': {
    interactions: [
      { drug: 'Amiodarone', severity: 'Major', effect: 'Doubled digoxin levels', action: 'Reduce digoxin dose by 50%' },
      { drug: 'Verapamil', severity: 'Major', effect: 'Increased digoxin levels', action: 'Reduce digoxin dose by 25-50%' },
      { drug: 'Quinidine', severity: 'Major', effect: 'Doubled digoxin levels', action: 'Reduce digoxin dose by 50%' },
      { drug: 'Diuretics', severity: 'Moderate', effect: 'Hypokalemia increases toxicity risk', action: 'Monitor potassium' }
    ],
    renalConsiderations: {
      gfrThreshold: 50,
      action: 'Reduce dose based on CrCl; avoid loading dose in renal impairment'
    },
    toxicitySigns: ['Nausea', 'Visual changes (yellow halos)', 'Arrhythmias', 'Confusion'],
    monitoringRequired: ['Digoxin level', 'Potassium', 'Creatinine', 'Heart rate']
  },
  'Fluoxetine': {
    interactions: [
      { drug: 'MAOIs', severity: 'Contraindicated', effect: 'Serotonin syndrome', action: 'Do not combine; 5-week washout needed' },
      { drug: 'Tramadol', severity: 'Major', effect: 'Serotonin syndrome, seizure risk', action: 'Avoid or monitor closely' },
      { drug: 'Warfarin', severity: 'Moderate', effect: 'Increased bleeding risk', action: 'Monitor INR' },
      { drug: 'Tamoxifen', severity: 'Major', effect: 'Reduced tamoxifen efficacy (CYP2D6 inhibition)', action: 'Use alternative antidepressant' },
      { drug: 'Triptans', severity: 'Moderate', effect: 'Serotonin syndrome risk', action: 'Monitor for symptoms' }
    ],
    blackBoxWarning: 'Increased suicidality risk in young adults (<25 years)',
    monitoringRequired: ['Mood/suicidality', 'Sodium levels (SIADH risk in elderly)']
  },
  'Methotrexate': {
    interactions: [
      { drug: 'NSAIDs', severity: 'Major', effect: 'Increased methotrexate toxicity', action: 'Avoid; use acetaminophen instead' },
      { drug: 'Trimethoprim', severity: 'Major', effect: 'Bone marrow suppression', action: 'Avoid combination' },
      { drug: 'Proton pump inhibitors', severity: 'Moderate', effect: 'Increased methotrexate levels', action: 'Monitor for toxicity' },
      { drug: 'Penicillins', severity: 'Moderate', effect: 'Reduced methotrexate clearance', action: 'Monitor levels' }
    ],
    renalConsiderations: {
      gfrThreshold: 30,
      action: 'Contraindicated in severe renal impairment'
    },
    hepaticConsiderations: {
      action: 'Contraindicated in significant liver disease'
    },
    monitoringRequired: ['CBC weekly initially', 'LFTs', 'Creatinine', 'Pulmonary symptoms']
  }
};

// Drug-allergy cross-reactivity patterns
const ALLERGY_CROSS_REACTIVITY = {
  'Penicillin': {
    crossReactive: ['Amoxicillin', 'Ampicillin', 'Piperacillin', 'Nafcillin'],
    possibleCrossReactive: ['Cephalosporins (1st gen > 3rd gen)', 'Carbapenems (low risk ~1%)'],
    safeAlternatives: ['Azithromycin', 'Fluoroquinolones', 'Vancomycin']
  },
  'Sulfa': {
    crossReactive: ['Sulfamethoxazole', 'Sulfasalazine', 'Sulfadiazine'],
    possibleCrossReactive: ['Thiazide diuretics (rare)', 'Celecoxib (rare)', 'Furosemide (rare)'],
    safeAlternatives: ['Most other antibiotics are safe']
  },
  'Aspirin': {
    crossReactive: ['All NSAIDs (if respiratory reaction)'],
    possibleCrossReactive: ['Acetaminophen (rarely in high doses)'],
    safeAlternatives: ['Acetaminophen (usually safe)', 'COX-2 inhibitors (with caution)']
  },
  'Contrast dye': {
    crossReactive: ['Iodinated contrast (different brands have varying risk)'],
    possibleCrossReactive: [],
    safeAlternatives: ['Gadolinium-based (for MRI)', 'Low-osmolar contrast with premedication']
  },
  'Codeine': {
    crossReactive: ['Morphine', 'Hydrocodone', 'Oxycodone (lower risk)'],
    possibleCrossReactive: ['Tramadol'],
    safeAlternatives: ['Fentanyl (structurally different)', 'Non-opioid alternatives']
  }
};

// Pharmacogenomic dosing guidelines
const PHARMACOGENOMIC_GUIDELINES = {
  'CYP2C19': {
    'Poor Metabolizer': {
      'Clopidogrel': { recommendation: 'Consider alternative (prasugrel, ticagrelor)', riskLevel: 'High' },
      'Omeprazole': { recommendation: 'May have increased exposure; consider dose reduction', riskLevel: 'Low' },
      'Voriconazole': { recommendation: 'Reduce dose by 50%', riskLevel: 'Moderate' },
      'Citalopram': { recommendation: 'Maximum 20mg daily', riskLevel: 'Moderate' }
    },
    'Ultrarapid Metabolizer': {
      'Clopidogrel': { recommendation: 'Standard dosing effective', riskLevel: 'Low' },
      'Omeprazole': { recommendation: 'May need higher doses for adequate acid suppression', riskLevel: 'Low' }
    }
  },
  'CYP2D6': {
    'Poor Metabolizer': {
      'Codeine': { recommendation: 'Avoid - no analgesic effect', riskLevel: 'High' },
      'Tramadol': { recommendation: 'Avoid - reduced efficacy', riskLevel: 'Moderate' },
      'Tamoxifen': { recommendation: 'Consider alternative (aromatase inhibitor if postmenopausal)', riskLevel: 'High' },
      'Metoprolol': { recommendation: 'Consider 50% dose reduction', riskLevel: 'Moderate' },
      'Fluoxetine': { recommendation: 'May need lower starting dose', riskLevel: 'Low' }
    },
    'Ultrarapid Metabolizer': {
      'Codeine': { recommendation: 'Avoid - risk of toxicity from rapid morphine conversion', riskLevel: 'High' },
      'Tramadol': { recommendation: 'Use with caution - increased seizure/respiratory depression risk', riskLevel: 'High' }
    }
  },
  'CYP2C9': {
    'Poor Metabolizer': {
      'Warfarin': { recommendation: 'Reduce initial dose by 50-80%', riskLevel: 'High' },
      'Phenytoin': { recommendation: 'Reduce dose; monitor levels closely', riskLevel: 'High' },
      'Celecoxib': { recommendation: 'Start with 50% of lowest dose', riskLevel: 'Moderate' }
    }
  },
  'VKORC1': {
    'A/A (Low dose)': {
      'Warfarin': { recommendation: 'Significantly reduced dose required (often <3mg/day)', riskLevel: 'High' }
    }
  },
  'TPMT': {
    'Poor Metabolizer': {
      'Azathioprine': { recommendation: 'Reduce dose by 90% or avoid', riskLevel: 'High' },
      '6-Mercaptopurine': { recommendation: 'Reduce dose by 90% or avoid', riskLevel: 'High' }
    }
  },
  'DPYD': {
    'Poor Metabolizer': {
      '5-Fluorouracil': { recommendation: 'Contraindicated - life-threatening toxicity risk', riskLevel: 'Critical' },
      'Capecitabine': { recommendation: 'Contraindicated', riskLevel: 'Critical' }
    }
  },
  'UGT1A1': {
    '*28/*28 (Poor)': {
      'Irinotecan': { recommendation: 'Reduce initial dose by 30%', riskLevel: 'High' }
    }
  }
};

// Renal dosing adjustments
const RENAL_DOSE_ADJUSTMENTS = {
  'Metformin': [
    { gfrMin: 45, gfrMax: Infinity, adjustment: 'No adjustment needed' },
    { gfrMin: 30, gfrMax: 44, adjustment: 'Reduce dose to 50%; max 1000mg/day' },
    { gfrMin: 0, gfrMax: 29, adjustment: 'Contraindicated' }
  ],
  'Gabapentin': [
    { gfrMin: 60, gfrMax: Infinity, adjustment: 'No adjustment needed' },
    { gfrMin: 30, gfrMax: 59, adjustment: 'Max 600mg TID' },
    { gfrMin: 15, gfrMax: 29, adjustment: 'Max 300mg TID' },
    { gfrMin: 0, gfrMax: 14, adjustment: 'Max 300mg daily' }
  ],
  'Enoxaparin': [
    { gfrMin: 30, gfrMax: Infinity, adjustment: 'No adjustment needed' },
    { gfrMin: 0, gfrMax: 29, adjustment: 'Reduce dose by 50% (1mg/kg once daily for treatment)' }
  ],
  'Digoxin': [
    { gfrMin: 50, gfrMax: Infinity, adjustment: 'Standard dosing; avoid loading dose' },
    { gfrMin: 10, gfrMax: 49, adjustment: 'Reduce maintenance dose by 25-75%; monitor levels' },
    { gfrMin: 0, gfrMax: 9, adjustment: 'Avoid or use very low doses with close monitoring' }
  ],
  'Ciprofloxacin': [
    { gfrMin: 30, gfrMax: Infinity, adjustment: 'No adjustment needed' },
    { gfrMin: 0, gfrMax: 29, adjustment: 'Reduce dose by 50%' }
  ],
  'Vancomycin': [
    { gfrMin: 50, gfrMax: Infinity, adjustment: 'Standard dosing; target trough 10-20 mcg/mL' },
    { gfrMin: 20, gfrMax: 49, adjustment: 'Reduce frequency; monitor levels closely' },
    { gfrMin: 0, gfrMax: 19, adjustment: 'Significantly extend interval; dose based on levels' }
  ],
  'Allopurinol': [
    { gfrMin: 60, gfrMax: Infinity, adjustment: 'No adjustment needed' },
    { gfrMin: 20, gfrMax: 59, adjustment: 'Max 200mg daily' },
    { gfrMin: 0, gfrMax: 19, adjustment: 'Max 100mg daily or every other day' }
  ]
};

/**
 * Check for drug-drug interactions
 * @param {Array} medications - List of patient medications
 * @returns {Object} Interaction analysis
 */
function checkDrugInteractions(medications) {
  const interactions = [];
  const warnings = [];
  const monitoringNeeded = new Set();
  
  if (!medications || medications.length === 0) {
    return { interactions: [], warnings: [], monitoringNeeded: [], riskLevel: 'None' };
  }

  const drugNames = medications.map(m => normalizedrugName(m.name || m));

  // Check each pair of drugs
  for (let i = 0; i < drugNames.length; i++) {
    const drug1 = drugNames[i];
    const drugInfo = findDrugInfo(drug1);
    
    if (drugInfo) {
      // Add monitoring requirements
      if (drugInfo.monitoringRequired) {
        drugInfo.monitoringRequired.forEach(m => monitoringNeeded.add(m));
      }
      
      // Check interactions with other medications
      for (let j = i + 1; j < drugNames.length; j++) {
        const drug2 = drugNames[j];
        
        if (drugInfo.interactions) {
          const interaction = drugInfo.interactions.find(
            int => normalizedrugName(int.drug) === drug2
          );
          
          if (interaction) {
            interactions.push({
              drug1,
              drug2,
              severity: interaction.severity,
              effect: interaction.effect,
              action: interaction.action
            });
          }
        }
      }
      
      // Add organ-specific warnings
      if (drugInfo.contraindications) {
        warnings.push({
          drug: drug1,
          type: 'Contraindications',
          details: drugInfo.contraindications
        });
      }
      
      if (drugInfo.blackBoxWarning) {
        warnings.push({
          drug: drug1,
          type: 'Black Box Warning',
          details: drugInfo.blackBoxWarning
        });
      }
    }
  }

  // Determine overall risk level
  let riskLevel = 'Low';
  if (interactions.some(i => i.severity === 'Contraindicated')) {
    riskLevel = 'Critical';
  } else if (interactions.some(i => i.severity === 'Major')) {
    riskLevel = 'High';
  } else if (interactions.some(i => i.severity === 'Moderate')) {
    riskLevel = 'Moderate';
  }

  return {
    interactions,
    warnings,
    monitoringNeeded: Array.from(monitoringNeeded),
    riskLevel,
    summary: generateInteractionSummary(interactions, riskLevel)
  };
}

/**
 * Check for drug-allergy contraindications
 * @param {Array} medications - List of patient medications
 * @param {Array} allergies - List of patient allergies
 * @returns {Object} Allergy analysis
 */
function checkAllergyContraindications(medications, allergies) {
  const contraindications = [];
  const warnings = [];
  const safeAlternatives = [];

  if (!medications || !allergies || allergies.length === 0) {
    return { contraindications: [], warnings: [], safeAlternatives: [], riskLevel: 'None' };
  }

  const drugNames = medications.map(m => normalizedrugName(m.name || m));
  
  for (const allergy of allergies) {
    const allergen = normalizedrugName(allergy.allergen || allergy);
    const crossReactivity = ALLERGY_CROSS_REACTIVITY[allergen];
    
    for (const drug of drugNames) {
      // Direct allergen match
      if (drug === allergen) {
        contraindications.push({
          drug,
          allergen,
          reaction: allergy.reaction || 'Allergic reaction',
          severity: allergy.severity || 'Unknown',
          type: 'Direct allergy'
        });
      }
      
      // Cross-reactivity check
      if (crossReactivity) {
        if (crossReactivity.crossReactive?.some(cr => normalizedrugName(cr) === drug)) {
          contraindications.push({
            drug,
            allergen,
            reaction: `Cross-reactive with ${allergen}`,
            severity: allergy.severity || 'Unknown',
            type: 'Cross-reactivity (high risk)'
          });
        }
        
        if (crossReactivity.possibleCrossReactive?.some(pcr => 
          pcr.toLowerCase().includes(drug.toLowerCase())
        )) {
          warnings.push({
            drug,
            allergen,
            message: `Possible cross-reactivity with ${allergen} allergy`,
            type: 'Cross-reactivity (lower risk)'
          });
        }
        
        // Add safe alternatives
        if (crossReactivity.safeAlternatives) {
          safeAlternatives.push({
            forAllergen: allergen,
            alternatives: crossReactivity.safeAlternatives
          });
        }
      }
    }
  }

  let riskLevel = 'None';
  if (contraindications.some(c => c.severity === 'Life-threatening' || c.severity === 'Severe')) {
    riskLevel = 'Critical';
  } else if (contraindications.length > 0) {
    riskLevel = 'High';
  } else if (warnings.length > 0) {
    riskLevel = 'Moderate';
  }

  return {
    contraindications,
    warnings,
    safeAlternatives,
    riskLevel,
    summary: contraindications.length > 0
      ? `⚠️ ALERT: ${contraindications.length} drug-allergy contraindication(s) detected!`
      : 'No direct drug-allergy contraindications found.'
  };
}

/**
 * Get renal dose adjustments
 * @param {Array} medications - List of patient medications
 * @param {Number} gfr - Patient's GFR (mL/min/1.73m²)
 * @returns {Object} Dosing recommendations
 */
function getrenalDoseAdjustments(medications, gfr) {
  const adjustments = [];
  
  if (!medications || gfr === undefined || gfr === null) {
    return { adjustments: [], needsAdjustment: false };
  }

  const drugNames = medications.map(m => normalizedrugName(m.name || m));
  
  for (const drug of drugNames) {
    const renalGuidelines = RENAL_DOSE_ADJUSTMENTS[drug];
    
    if (renalGuidelines) {
      const applicable = renalGuidelines.find(
        g => gfr >= g.gfrMin && gfr <= g.gfrMax
      );
      
      if (applicable && !applicable.adjustment.includes('No adjustment')) {
        adjustments.push({
          drug,
          currentGFR: gfr,
          recommendation: applicable.adjustment,
          urgency: applicable.adjustment.includes('Contraindicated') ? 'Critical' : 'Moderate'
        });
      }
    }
  }

  return {
    adjustments,
    needsAdjustment: adjustments.length > 0,
    summary: adjustments.length > 0
      ? `${adjustments.length} medication(s) require dose adjustment based on GFR ${gfr} mL/min`
      : 'No renal dose adjustments needed for current medications.'
  };
}

/**
 * Get pharmacogenomic dosing recommendations
 * @param {Array} medications - List of patient medications
 * @param {Object} pharmacogenomics - Patient's pharmacogenomic profile
 * @returns {Object} PGx-based recommendations
 */
function getPharmacogenomicGuidance(medications, pharmacogenomics) {
  const recommendations = [];
  
  if (!medications || !pharmacogenomics) {
    return { recommendations: [], hasActionableFindings: false };
  }

  const drugNames = medications.map(m => normalizedrugName(m.name || m));
  
  // Check each PGx marker
  for (const [gene, phenotype] of Object.entries(pharmacogenomics)) {
    if (!phenotype || phenotype === 'Unknown' || phenotype === 'Not Tested') continue;
    
    const geneGuidelines = PHARMACOGENOMIC_GUIDELINES[gene.toUpperCase()];
    if (!geneGuidelines) continue;
    
    const phenotypeGuidelines = geneGuidelines[phenotype];
    if (!phenotypeGuidelines) continue;
    
    // Check if patient is on any affected drugs
    for (const drug of drugNames) {
      const drugGuideline = phenotypeGuidelines[drug];
      if (drugGuideline) {
        recommendations.push({
          drug,
          gene,
          phenotype,
          recommendation: drugGuideline.recommendation,
          riskLevel: drugGuideline.riskLevel,
          source: 'CPIC Guidelines'
        });
      }
    }
  }

  // Sort by risk level
  const riskOrder = { 'Critical': 0, 'High': 1, 'Moderate': 2, 'Low': 3 };
  recommendations.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

  return {
    recommendations,
    hasActionableFindings: recommendations.some(r => r.riskLevel !== 'Low'),
    criticalFindings: recommendations.filter(r => r.riskLevel === 'Critical' || r.riskLevel === 'High'),
    summary: recommendations.length > 0
      ? `${recommendations.length} pharmacogenomic finding(s) affecting current medications`
      : 'No actionable pharmacogenomic interactions with current medications.'
  };
}

/**
 * Comprehensive pharmacology analysis for a patient
 * Uses AI enhancement when available for medications not in the database
 * @param {Object} patient - Full patient object
 * @returns {Object} Complete pharmacology analysis
 */
async function analyzePatientPharmacology(patient) {
  const medications = patient.medications || [];
  const allergies = patient.allergies || [];
  const gfr = patient.biomarkers?.labBiomarkers?.gfr?.value;
  const pharmacogenomics = patient.biomarkers?.pharmacogenomics || {};
  
  // Run all rule-based analyses
  const drugInteractions = checkDrugInteractions(medications);
  const allergyCheck = checkAllergyContraindications(medications, allergies);
  const renalAdjustments = getrenalDoseAdjustments(medications, gfr);
  const pgxGuidance = getPharmacogenomicGuidance(medications, pharmacogenomics);
  
  // AI enhancement for unknown drugs or complex interactions
  let aiEnhancement = null;
  if (AI_ENABLED && openaiInstance && medications.length > 0) {
    try {
      // Check if there are medications not in our database
      const knownDrugs = Object.keys(DRUG_INTERACTIONS).map(d => d.toLowerCase());
      const unknownMeds = medications.filter(m => 
        m.name && !knownDrugs.some(kd => m.name.toLowerCase().includes(kd))
      );
      
      if (unknownMeds.length > 0 || medications.length > 4) {
        aiEnhancement = await getAIPharmacologyAnalysis(patient, {
          drugInteractions,
          allergyCheck,
          renalAdjustments,
          pgxGuidance
        });
      }
    } catch (error) {
      console.warn('AI pharmacology enhancement failed:', error.message);
    }
  }
  
  // Aggregate critical alerts
  const criticalAlerts = [];
  
  if (drugInteractions.riskLevel === 'Critical' || drugInteractions.riskLevel === 'High') {
    criticalAlerts.push({
      type: 'Drug Interaction',
      details: drugInteractions.interactions.filter(i => i.severity === 'Major' || i.severity === 'Contraindicated')
    });
  }
  
  if (allergyCheck.riskLevel === 'Critical' || allergyCheck.riskLevel === 'High') {
    criticalAlerts.push({
      type: 'Allergy Contraindication',
      details: allergyCheck.contraindications
    });
  }
  
  if (renalAdjustments.adjustments.some(a => a.urgency === 'Critical')) {
    criticalAlerts.push({
      type: 'Renal Dosing',
      details: renalAdjustments.adjustments.filter(a => a.urgency === 'Critical')
    });
  }
  
  if (pgxGuidance.criticalFindings?.length > 0) {
    criticalAlerts.push({
      type: 'Pharmacogenomics',
      details: pgxGuidance.criticalFindings
    });
  }

  // Calculate overall safety score (0-100, higher is safer)
  let safetyScore = 100;
  safetyScore -= drugInteractions.interactions.length * 10;
  safetyScore -= allergyCheck.contraindications.length * 25;
  safetyScore -= renalAdjustments.adjustments.length * 8;
  safetyScore -= (pgxGuidance.criticalFindings?.length || 0) * 15;
  safetyScore = Math.max(0, Math.min(100, safetyScore));

  return {
    summary: {
      medicationCount: medications.length,
      allergyCount: allergies.length,
      safetyScore,
      overallRisk: criticalAlerts.length > 0 ? 'High' : 
                   (drugInteractions.riskLevel === 'Moderate' || 
                    allergyCheck.riskLevel === 'Moderate') ? 'Moderate' : 'Low'
    },
    criticalAlerts,
    drugInteractions,
    allergyCheck,
    renalAdjustments,
    pharmacogenomicGuidance: pgxGuidance,
    monitoringPlan: generateMonitoringPlan(drugInteractions, medications),
    aiEnhancement: aiEnhancement,
    aiEnabled: AI_ENABLED,
    timestamp: new Date().toISOString()
  };
}

/**
 * AI-enhanced pharmacology analysis for complex cases
 */
async function getAIPharmacologyAnalysis(patient, ruleBasedResults) {
  const MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini';
  
  const medicationList = patient.medications?.map(m => 
    `${m.name} ${m.dosage || ''} ${m.frequency || ''}`
  ).filter(Boolean).join(', ');
  
  const allergyList = patient.allergies?.map(a => 
    `${a.allergen} (${a.reaction || 'unknown reaction'})`
  ).filter(Boolean).join(', ');
  
  const pgxInfo = patient.biomarkers?.pharmacogenomics || {};
  const pgxSummary = Object.entries(pgxInfo)
    .filter(([k, v]) => v && v !== 'Unknown')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ') || 'Not tested';

  try {
    const completion = await openaiInstance.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `You are a clinical pharmacist AI providing drug safety analysis. Given a patient's medication list, allergies, and pharmacogenomics, identify:
1. Any additional drug interactions not captured by standard databases
2. Unusual cross-reactivity concerns
3. Dose optimization opportunities based on the full clinical picture
4. Monitoring recommendations

Focus on clinically significant findings. Be specific and evidence-based.

Output JSON format:
{
  "additionalInteractions": [{"drugs": ["drug1", "drug2"], "concern": "description", "severity": "major|moderate|minor", "recommendation": "action"}],
  "allergyInsights": ["specific concerns based on this patient's allergies"],
  "doseOptimizations": [{"drug": "name", "suggestion": "recommendation", "rationale": "why"}],
  "monitoringAdditions": ["additional monitoring specific to this patient"],
  "overallAssessment": "1-2 sentence summary of key pharmacological concerns",
  "confidenceLevel": "high|medium|low"
}`
        },
        {
          role: 'user',
          content: `Patient: ${patient.name || 'Unknown'}, Age: ${patient.age || 'Unknown'}
Conditions: ${patient.medicalHistory?.conditions?.join(', ') || 'None listed'}

Current Medications: ${medicationList || 'None'}

Allergies: ${allergyList || 'None documented'}

Pharmacogenomics: ${pgxSummary}

GFR: ${patient.biomarkers?.labBiomarkers?.gfr?.value || 'Unknown'} mL/min

Rule-based analysis found:
- ${ruleBasedResults.drugInteractions.interactions.length} drug interactions
- ${ruleBasedResults.allergyCheck.contraindications.length} allergy contraindications
- ${ruleBasedResults.renalAdjustments.adjustments.length} renal adjustments needed
- ${ruleBasedResults.pgxGuidance.recommendations.length} pharmacogenomic recommendations

Provide additional insights as JSON.`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('AI pharmacology analysis error:', error);
    throw error;
  }
}

// Helper functions
function normalizedrugName(name) {
  if (!name) return '';
  // Remove dosage info and normalize
  return name.split(/\s+/)[0]
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase()
    .replace(/^(.)/, c => c.toUpperCase());
}

function findDrugInfo(drugName) {
  const normalized = normalizedrugName(drugName);
  return DRUG_INTERACTIONS[normalized] || 
         Object.entries(DRUG_INTERACTIONS).find(([key]) => 
           key.toLowerCase() === normalized.toLowerCase()
         )?.[1];
}

function generateInteractionSummary(interactions, riskLevel) {
  if (interactions.length === 0) {
    return 'No significant drug-drug interactions identified.';
  }
  
  const majorCount = interactions.filter(i => i.severity === 'Major' || i.severity === 'Contraindicated').length;
  const moderateCount = interactions.filter(i => i.severity === 'Moderate').length;
  
  return `Found ${interactions.length} interaction(s): ${majorCount} major, ${moderateCount} moderate. Risk level: ${riskLevel}.`;
}

function generateMonitoringPlan(drugInteractions, medications) {
  const plan = {
    labTests: new Set(),
    vitalSigns: new Set(),
    symptoms: new Set(),
    frequency: 'Standard'
  };
  
  // Add monitoring from interactions
  drugInteractions.monitoringNeeded?.forEach(m => {
    if (m.includes('INR') || m.includes('LFT') || m.includes('renal') || m.includes('Creatinine')) {
      plan.labTests.add(m);
    } else if (m.includes('pressure') || m.includes('heart rate')) {
      plan.vitalSigns.add(m);
    } else {
      plan.symptoms.add(m);
    }
  });
  
  // Increase frequency if high-risk
  if (drugInteractions.riskLevel === 'High' || drugInteractions.riskLevel === 'Critical') {
    plan.frequency = 'Intensive';
  }
  
  return {
    labTests: Array.from(plan.labTests),
    vitalSigns: Array.from(plan.vitalSigns),
    symptomsToWatch: Array.from(plan.symptoms),
    monitoringFrequency: plan.frequency
  };
}

module.exports = {
  checkDrugInteractions,
  checkAllergyContraindications,
  getrenalDoseAdjustments,
  getPharmacogenomicGuidance,
  analyzePatientPharmacology,
  DRUG_INTERACTIONS,
  ALLERGY_CROSS_REACTIVITY,
  PHARMACOGENOMIC_GUIDELINES,
  RENAL_DOSE_ADJUSTMENTS
};
