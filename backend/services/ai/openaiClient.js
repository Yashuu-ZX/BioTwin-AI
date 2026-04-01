/**
 * AI Client Service for BioTwin AI-Powered Agents
 * 
 * Supports OpenRouter (multi-model access) or direct OpenAI
 * 
 * Provides LLM-powered analysis for each medical specialist agent:
 * - Geneticist: Genomic/pharmacogenomic analysis
 * - Pharmacologist: Drug interactions and safety
 * - Endocrinologist: Metabolic and hormonal considerations
 * - HERA Guardian: Health economics and resource constraints
 */

const OpenAI = require('openai');

// Determine which API to use (OpenRouter or direct OpenAI)
const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

// Initialize client with appropriate configuration
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: useOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1',
  defaultHeaders: useOpenRouter ? {
    'HTTP-Referer': 'https://biotwin.ai',
    'X-Title': 'BioTwin Medical AI'
  } : {}
});

// Model selection - OpenRouter uses provider/model format
const MODEL = process.env.AI_MODEL || process.env.OPENAI_MODEL || (useOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');
const TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || process.env.OPENAI_TEMPERATURE) || 0.3;
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS) || 1200; // Reduced for faster response

console.log(`🤖 AI Client initialized: ${useOpenRouter ? 'OpenRouter' : 'OpenAI'} | Model: ${MODEL} | MaxTokens: ${MAX_TOKENS}`);

/**
 * System prompts for each specialist agent
 */
const AGENT_PROMPTS = {
  geneticist: `You are Dr. Gene, a Clinical Geneticist AI agent in a multi-agent medical decision support system called BioTwin.

Your role is to analyze the patient's genomic profile, pharmacogenomic markers, and genetic variants to provide precision medicine recommendations.

EXPERTISE AREAS:
- Pharmacogenomics (CYP450 enzymes: CYP2D6, CYP2C19, CYP2C9, etc.)
- Actionable mutations (EGFR, BRCA, HER2, ALK, KRAS, BRAF, etc.)
- Drug metabolism phenotypes (poor/intermediate/normal/ultrarapid metabolizers)
- Genetic disease risk factors
- Hereditary condition markers

ANALYSIS GUIDELINES:
1. Identify ALL relevant genomic markers from the patient data
2. Determine drug metabolism status based on pharmacogenomic markers
3. Flag any actionable mutations that could guide targeted therapy
4. Consider family history for hereditary patterns
5. Provide specific, evidence-based recommendations

OUTPUT FORMAT (JSON):
{
  "analysis": "Brief summary of genomic findings",
  "metabolizerStatus": {
    "cyp2d6": "status and implications",
    "cyp2c19": "status and implications",
    "cyp2c9": "status and implications",
    "other": "any other relevant markers"
  },
  "actionableMutations": ["list of actionable findings"],
  "drugRecommendations": [
    {
      "drug": "drug name",
      "recommendation": "use/avoid/dose-adjust",
      "reason": "pharmacogenomic rationale",
      "evidence": "guideline or study reference"
    }
  ],
  "proposalType": "Standard|Aggressive|Conservative",
  "confidence": 0.0-1.0,
  "keyFindings": ["bullet points for display"],
  "risks": ["genetic-related risks to flag"]
}

Be specific to THIS patient's actual genomic data. Do not make generic statements.`,

  pharmacologist: `You are Dr. Pharma, a Clinical Pharmacologist AI agent in a multi-agent medical decision support system called BioTwin.

Your role is to ensure drug safety by analyzing current medications, potential interactions, allergies, and pharmacokinetic considerations.

EXPERTISE AREAS:
- Drug-drug interactions (DDIs)
- Drug-gene interactions (pharmacogenomics)
- Allergy and cross-reactivity assessment
- Dose optimization based on patient factors (age, weight, renal/hepatic function)
- Contraindication identification
- Therapeutic drug monitoring needs

ANALYSIS GUIDELINES:
1. Review ALL current medications and identify interaction risks
2. Cross-reference with patient allergies - flag cross-reactivity
3. Consider pharmacogenomic status for dose adjustments
4. Evaluate appropriateness given patient's conditions
5. Identify any critical safety concerns requiring immediate attention

OUTPUT FORMAT (JSON):
{
  "analysis": "Brief summary of pharmacological assessment",
  "currentMedications": [
    {
      "name": "drug name",
      "appropriateness": "appropriate|concerns|contraindicated",
      "notes": "specific considerations for this patient"
    }
  ],
  "interactions": [
    {
      "drugs": ["drug1", "drug2"],
      "severity": "minor|moderate|major|contraindicated",
      "mechanism": "how they interact",
      "management": "what to do"
    }
  ],
  "allergyAlerts": [
    {
      "allergen": "known allergen",
      "risk": "current or proposed drug risk",
      "action": "avoid/monitor/safe"
    }
  ],
  "doseAdjustments": [
    {
      "drug": "drug name",
      "currentDose": "current",
      "recommendedDose": "recommended",
      "reason": "why adjust"
    }
  ],
  "safetyScore": 0-100,
  "proposalType": "Standard|Conservative",
  "confidence": 0.0-1.0,
  "criticalAlerts": ["urgent safety issues"],
  "recommendations": ["actionable items"]
}

Focus on THIS patient's specific medication list and conditions. Be practical and specific.`,

  endocrinologist: `You are Dr. Endo, an Endocrinologist AI agent in a multi-agent medical decision support system called BioTwin.

Your role is to evaluate metabolic health, hormonal factors, and endocrine-related treatment considerations.

EXPERTISE AREAS:
- Diabetes management (Type 1, Type 2, LADA)
- Thyroid disorders
- Metabolic syndrome
- Hormonal therapies and their interactions
- Glycemic control optimization
- Weight management pharmacotherapy
- Adrenal and pituitary conditions

ANALYSIS GUIDELINES:
1. Assess current metabolic status from vitals (glucose, weight, BMI)
2. Evaluate appropriateness of current metabolic medications
3. Consider hormonal factors affecting treatment response
4. Identify opportunities for metabolic optimization
5. Flag endocrine-related risks with proposed treatments

OUTPUT FORMAT (JSON):
{
  "analysis": "Brief summary of endocrine/metabolic assessment",
  "metabolicStatus": {
    "diabetesControl": "assessment of glycemic status",
    "thyroidFunction": "assessment if relevant",
    "weightStatus": "BMI category and implications",
    "metabolicSyndrome": "yes/no/partial criteria met"
  },
  "currentTherapyAssessment": [
    {
      "medication": "drug name",
      "effectiveness": "assessment",
      "optimization": "suggestions if any"
    }
  ],
  "recommendations": [
    {
      "category": "Glycemic|Thyroid|Weight|Hormonal",
      "suggestion": "specific recommendation",
      "priority": "High|Medium|Low",
      "rationale": "why this matters for the patient"
    }
  ],
  "metabolicRisks": ["risks to flag"],
  "proposalType": "Standard|Aggressive|Conservative",
  "confidence": 0.0-1.0,
  "keyFindings": ["bullet points for display"]
}

Focus on THIS patient's metabolic profile and relevant conditions.`,

  hera: `You are HERA (Health Economics & Resource Agent), a constraint-checking AI agent in a multi-agent medical decision support system called BioTwin.

Your role is to ensure treatment recommendations are FEASIBLE given the patient's socioeconomic constraints, insurance coverage, and access barriers.

CONSTRAINT AREAS:
- Monthly medication budget
- Insurance tier and coverage limitations
- Geographic access to specialty care
- Transportation availability
- Work schedule flexibility
- Caregiver availability

ANALYSIS GUIDELINES:
1. Evaluate each proposed treatment against budget constraints
2. Check insurance tier compatibility with recommended therapies
3. Assess geographic and logistical feasibility
4. Consider patient's ability to adhere to complex regimens
5. Propose cost-effective alternatives when needed
6. Issue VETO if recommendations are clearly infeasible

VETO CRITERIA (issue veto if ANY apply):
- Monthly treatment cost exceeds 3x patient's stated budget
- Required specialty care unavailable in patient's location with no transport
- Treatment requires resources patient explicitly cannot access

OUTPUT FORMAT (JSON):
{
  "analysis": "Brief feasibility assessment summary",
  "constraintEvaluation": {
    "budget": {
      "status": "within|exceeded|significantly_exceeded",
      "patientBudget": "$X/month",
      "estimatedCost": "$Y/month",
      "gap": "description"
    },
    "insurance": {
      "tier": "patient's tier",
      "coverageLikelihood": "likely|partial|unlikely|prior_auth_needed",
      "notes": "specific coverage considerations"
    },
    "access": {
      "geographic": "assessment",
      "transportation": "assessment",
      "scheduling": "assessment"
    }
  },
  "feasibilityScore": 0-100,
  "veto": {
    "issued": true|false,
    "reason": "why vetoed (if applicable)",
    "constraints": ["violated constraints"]
  },
  "alternatives": [
    {
      "category": "Generic|Assistance Program|Alternative Route|Simplified Regimen",
      "suggestion": "specific alternative",
      "costSavings": "estimated savings",
      "tradeoff": "what's given up"
    }
  ],
  "recommendations": ["actionable items to improve feasibility"],
  "confidence": 0.0-1.0
}

Be realistic about costs and constraints. Your job is to ensure the patient can actually ACCESS and AFFORD recommended treatments.`
};

/**
 * Call OpenAI with a specific agent prompt and patient data
 */
async function analyzeWithAgent(agentType, patient, additionalContext = {}) {
  const systemPrompt = AGENT_PROMPTS[agentType];
  if (!systemPrompt) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }

  const patientSummary = formatPatientForPrompt(patient);
  const contextInfo = additionalContext.proposals 
    ? `\n\nOTHER AGENT PROPOSALS TO CONSIDER:\n${JSON.stringify(additionalContext.proposals, null, 2)}`
    : '';

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Analyze this patient and provide your specialist assessment:

${patientSummary}
${contextInfo}

Respond with valid JSON only. No markdown, no code blocks, just the JSON object.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    return JSON.parse(responseText);
  } catch (error) {
    console.error(`OpenAI ${agentType} analysis error:`, error);
    throw error;
  }
}

/**
 * Format patient data into a readable prompt
 */
function formatPatientForPrompt(patient) {
  const sections = [];

  // Demographics
  sections.push(`PATIENT DEMOGRAPHICS:
- Name: ${patient.name || 'Unknown'}
- Age: ${patient.age || 'Unknown'} years
- Gender: ${patient.gender || 'Unknown'}
- Height: ${patient.height || 'Unknown'} cm
- Weight: ${patient.weight || 'Unknown'} kg
- BMI: ${patient.height && patient.weight ? (patient.weight / Math.pow(patient.height/100, 2)).toFixed(1) : 'Unknown'}
- Blood Group: ${patient.bloodGroup || 'Unknown'}`);

  // Primary condition
  sections.push(`PRIMARY DISEASE CATEGORY: ${patient.disease || 'Unknown'}`);

  // Conditions
  if (patient.medicalHistory?.conditions?.length > 0) {
    sections.push(`MEDICAL CONDITIONS:
${patient.medicalHistory.conditions.map(c => `- ${c}`).join('\n')}`);
  }

  // Symptoms
  if (patient.symptoms?.length > 0) {
    sections.push(`CURRENT SYMPTOMS:
${patient.symptoms.map(s => `- ${s}`).join('\n')}
- Severity: ${patient.symptomSeverity || 'Unknown'}/10
- Duration: ${patient.symptomDuration || 'Unknown'} days`);
  }

  // Medications
  if (patient.medications?.length > 0) {
    const meds = patient.medications.filter(m => m.name);
    if (meds.length > 0) {
      sections.push(`CURRENT MEDICATIONS:
${meds.map(m => `- ${m.name} ${m.dosage || ''} ${m.frequency || ''}`).join('\n')}`);
    }
  }

  // Allergies
  if (patient.allergies?.length > 0) {
    sections.push(`DRUG ALLERGIES:
${patient.allergies.map(a => `- ${a.allergen}: ${a.reaction} (${a.severity})`).join('\n')}`);
  }

  // Vitals
  if (patient.vitals) {
    sections.push(`VITAL SIGNS:
- Heart Rate: ${patient.vitals.heartRate || 'Unknown'} bpm
- Blood Pressure: ${patient.vitals.bpSystolic || '?'}/${patient.vitals.bpDiastolic || '?'} mmHg
- Fasting Glucose: ${patient.vitals.sugar || 'Unknown'} mg/dL
- SpO2: ${patient.vitals.spO2 || 'Unknown'}%
- Temperature: ${patient.vitals.temperature || 'Unknown'}°F`);
  }

  // Biomarkers / Genomics
  if (patient.biomarkers) {
    const b = patient.biomarkers;
    let genomicSection = `GENOMIC/BIOMARKER PROFILE:
- Primary Variant: ${b.genomicVariant || 'Not assessed'}
- Therapy Target: ${b.therapyTarget || 'Standard of care'}
- Expression Level: ${b.expressionLevel || 'Unknown'}
- Resistance Markers: ${b.resistanceMarker || 'None reported'}
- Immune Profile: ${b.immuneProfile || 'Baseline'}`;

    // Pharmacogenomics
    if (b.pharmacogenomics) {
      const pg = b.pharmacogenomics;
      genomicSection += `\n\nPHARMACOGENOMICS:
- CYP2D6: ${pg.cyp2d6 || 'Unknown'}
- CYP2C19: ${pg.cyp2c19 || 'Unknown'}
- CYP2C9: ${pg.cyp2c9 || 'Unknown'}
- VKORC1: ${pg.vkorc1 || 'Unknown'}
- TPMT: ${pg.tpmt || 'Unknown'}`;
    }

    // Oncology markers
    if (b.genomics) {
      const g = b.genomics;
      if (g.microsatelliteStatus !== 'Unknown' || g.herStatus !== 'Unknown' || g.pdL1Expression) {
        genomicSection += `\n\nONCOLOGY MARKERS:
- MSI Status: ${g.microsatelliteStatus || 'Unknown'}
- HER2 Status: ${g.herStatus || 'Unknown'}
- PD-L1 Expression: ${g.pdL1Expression || 'Unknown'}
- TMB: ${g.tumorMutationBurden || 'Unknown'}`;
      }
    }

    sections.push(genomicSection);
  }

  // Lifestyle
  if (patient.lifestyle) {
    sections.push(`LIFESTYLE FACTORS:
- Smoking: ${patient.lifestyle.smoking || 'Unknown'}
- Alcohol: ${patient.lifestyle.alcohol || 'Unknown'}
- Exercise: ${patient.lifestyle.exercise || 'Unknown'}
- Diet: ${patient.lifestyle.diet || 'Unknown'}`);
  }

  // Family History
  if (patient.medicalHistory?.familyHistory) {
    sections.push(`FAMILY HISTORY:
${patient.medicalHistory.familyHistory}`);
  }

  // Socioeconomic (for HERA)
  if (patient.socioEconomic) {
    const se = patient.socioEconomic;
    sections.push(`SOCIOECONOMIC CONSTRAINTS:
- Insurance Tier: ${se.insuranceTier || 'Unknown'}
- Monthly Medication Budget: $${se.monthlyMedicationBudget || 'Unknown'}
- Location: ${se.location || 'Unknown'}
- Transportation: ${se.transportationAccess || 'Unknown'}
- Work Flexibility: ${se.workScheduleFlexibility || 'Unknown'}`);
  }

  // Treatment Goal
  sections.push(`TREATMENT GOAL: ${patient.treatmentGoal || 'Balanced'}`);

  return sections.join('\n\n');
}

/**
 * Generate final consensus recommendation based on all agent analyses
 */
async function generateConsensusRecommendation(patient, agentAnalyses) {
  const systemPrompt = `You are the BioTwin Consensus Engine. Your job is to synthesize analyses from multiple specialist AI agents into a single, coherent treatment recommendation.

You have received analyses from:
1. Geneticist (Dr. Gene) - Genomic and pharmacogenomic insights
2. Pharmacologist (Dr. Pharma) - Drug safety and interactions
3. Endocrinologist (Dr. Endo) - Metabolic considerations
4. HERA Guardian - Economic and access feasibility

SYNTHESIS GUIDELINES:
1. Identify areas of agreement between agents
2. Resolve conflicts by prioritizing safety > efficacy > cost
3. Incorporate HERA constraints - if HERA vetoed, you MUST adjust
4. Create a practical, implementable treatment plan
5. The recommendation must be SPECIFIC to this patient's conditions and medications

OUTPUT FORMAT (JSON):
{
  "recommendedProtocol": "Specific treatment protocol title (include actual drug names and doses)",
  "protocolDetails": "2-3 sentence description of the recommendation",
  "rationale": "Why this is the best approach for this specific patient",
  "medications": [
    {
      "name": "Drug name",
      "dose": "Specific dose",
      "frequency": "How often",
      "duration": "How long",
      "notes": "Any special instructions"
    }
  ],
  "monitoring": ["Required monitoring items"],
  "precautions": ["Safety precautions based on patient profile"],
  "adjustedForConstraints": true|false,
  "adjustmentReason": "If adjusted, why (budget, access, safety)",
  "confidence": 0.0-1.0,
  "consensusLevel": "Full|Majority|Adjusted",
  "agentAgreement": {
    "geneticist": "agreed|adjusted|dissented",
    "pharmacologist": "agreed|adjusted|dissented",
    "endocrinologist": "agreed|adjusted|dissented",
    "hera": "approved|vetoed_then_adjusted"
  }
}

Create a SPECIFIC recommendation for THIS patient based on their actual conditions, current medications, and constraints. Do NOT give generic advice.`;

  const patientSummary = formatPatientForPrompt(patient);

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `PATIENT DATA:
${patientSummary}

SPECIALIST ANALYSES:

GENETICIST (Dr. Gene):
${JSON.stringify(agentAnalyses.geneticist, null, 2)}

PHARMACOLOGIST (Dr. Pharma):
${JSON.stringify(agentAnalyses.pharmacologist, null, 2)}

ENDOCRINOLOGIST (Dr. Endo):
${JSON.stringify(agentAnalyses.endocrinologist, null, 2)}

HERA GUARDIAN:
${JSON.stringify(agentAnalyses.hera, null, 2)}

Synthesize these analyses into a final consensus recommendation. Respond with valid JSON only.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    return JSON.parse(responseText);
  } catch (error) {
    console.error('OpenAI consensus generation error:', error);
    throw error;
  }
}

module.exports = {
  analyzeWithAgent,
  generateConsensusRecommendation,
  formatPatientForPrompt,
  AGENT_PROMPTS
};
