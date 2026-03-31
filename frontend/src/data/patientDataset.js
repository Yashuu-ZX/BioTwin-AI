/**
 * 100-Patient Dataset for BioTwin Digital Twin Creation
 * 
 * This dataset contains diverse patient profiles across multiple disease categories
 * to demonstrate varied agent deliberation behaviors during consensus simulation.
 * 
 * Disease Categories: Cardiac, Respiratory, Metabolic, Neurological, Oncology
 * Each patient has unique combinations of conditions, medications, biomarkers,
 * and risk factors that will trigger different specialist agent responses.
 */

const firstNames = {
  Male: ['James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Raymond', 'Gregory', 'Frank', 'Alexander', 'Patrick', 'Raymond', 'Jack', 'Dennis', 'Jerry'],
  Female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen', 'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather']
};

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Condition pools by disease category
const conditionsByCategory = {
  Cardiac: ['Hypertension', 'CAD', 'Arrhythmia', 'Heart Failure', 'Atrial Fibrillation', 'Cardiomyopathy'],
  Respiratory: ['Asthma', 'COPD', 'Pulmonary Fibrosis', 'Sleep Apnea', 'Bronchitis', 'Emphysema'],
  Metabolic: ['Type 2 Diabetes', 'Obesity', 'Hyperlipidemia', 'Metabolic Syndrome', 'Thyroid Disorder', 'NAFLD'],
  Neurological: ['Migraine', 'Epilepsy', 'Parkinson\'s Disease', 'Multiple Sclerosis', 'Neuropathy', 'Alzheimer\'s'],
  Oncology: ['Breast Cancer', 'Lung Cancer', 'Colorectal Cancer', 'Prostate Cancer', 'Melanoma', 'Lymphoma']
};

// Symptoms by category
const symptomsByCategory = {
  Cardiac: ['Chest Pain', 'Shortness of Breath', 'Palpitations', 'Fatigue', 'Dizziness', 'Edema'],
  Respiratory: ['Cough', 'Shortness of Breath', 'Wheezing', 'Chest Tightness', 'Fatigue', 'Fever'],
  Metabolic: ['Fatigue', 'Increased Thirst', 'Frequent Urination', 'Blurred Vision', 'Nausea', 'Weight Changes'],
  Neurological: ['Headache', 'Dizziness', 'Numbness', 'Tremor', 'Memory Issues', 'Fatigue'],
  Oncology: ['Fatigue', 'Weight Loss', 'Pain', 'Nausea', 'Fever', 'Night Sweats']
};

// Medications by category
const medicationsByCategory = {
  Cardiac: [
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
    { name: 'Metoprolol', dosage: '50mg', frequency: 'Twice daily' },
    { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
    { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily' },
    { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' },
    { name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily' },
    { name: 'Warfarin', dosage: '5mg', frequency: 'Once daily' },
    { name: 'Furosemide', dosage: '40mg', frequency: 'Once daily' }
  ],
  Respiratory: [
    { name: 'Albuterol', dosage: '90mcg', frequency: 'As needed' },
    { name: 'Fluticasone', dosage: '250mcg', frequency: 'Twice daily' },
    { name: 'Montelukast', dosage: '10mg', frequency: 'Once daily' },
    { name: 'Tiotropium', dosage: '18mcg', frequency: 'Once daily' },
    { name: 'Prednisone', dosage: '20mg', frequency: 'Once daily' },
    { name: 'Budesonide', dosage: '180mcg', frequency: 'Twice daily' }
  ],
  Metabolic: [
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
    { name: 'Glipizide', dosage: '5mg', frequency: 'Once daily' },
    { name: 'Insulin Glargine', dosage: '20 units', frequency: 'Once daily' },
    { name: 'Sitagliptin', dosage: '100mg', frequency: 'Once daily' },
    { name: 'Empagliflozin', dosage: '10mg', frequency: 'Once daily' },
    { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily' },
    { name: 'Rosuvastatin', dosage: '10mg', frequency: 'Once daily' }
  ],
  Neurological: [
    { name: 'Levodopa/Carbidopa', dosage: '25/100mg', frequency: 'Three times daily' },
    { name: 'Gabapentin', dosage: '300mg', frequency: 'Three times daily' },
    { name: 'Topiramate', dosage: '50mg', frequency: 'Twice daily' },
    { name: 'Sumatriptan', dosage: '50mg', frequency: 'As needed' },
    { name: 'Memantine', dosage: '10mg', frequency: 'Once daily' },
    { name: 'Donepezil', dosage: '10mg', frequency: 'Once daily' }
  ],
  Oncology: [
    { name: 'Tamoxifen', dosage: '20mg', frequency: 'Once daily' },
    { name: 'Letrozole', dosage: '2.5mg', frequency: 'Once daily' },
    { name: 'Pembrolizumab', dosage: '200mg', frequency: 'Every 3 weeks' },
    { name: 'Trastuzumab', dosage: '6mg/kg', frequency: 'Every 3 weeks' },
    { name: 'Ondansetron', dosage: '8mg', frequency: 'As needed' },
    { name: 'Dexamethasone', dosage: '4mg', frequency: 'Twice daily' }
  ]
};

// Allergens with reactions
const allergyPool = [
  { allergen: 'Penicillin', reaction: 'Rash', severity: 'Moderate' },
  { allergen: 'Sulfa drugs', reaction: 'Hives', severity: 'Moderate' },
  { allergen: 'NSAIDs', reaction: 'GI upset', severity: 'Mild' },
  { allergen: 'Aspirin', reaction: 'Bronchospasm', severity: 'Severe' },
  { allergen: 'Codeine', reaction: 'Nausea', severity: 'Mild' },
  { allergen: 'Morphine', reaction: 'Itching', severity: 'Mild' },
  { allergen: 'Contrast dye', reaction: 'Anaphylaxis', severity: 'Life-threatening' },
  { allergen: 'Latex', reaction: 'Skin irritation', severity: 'Moderate' },
  { allergen: 'ACE inhibitors', reaction: 'Angioedema', severity: 'Severe' },
  { allergen: 'Fluoroquinolones', reaction: 'Tendon pain', severity: 'Moderate' }
];

// Genomic variants by category (for triggering different agent behaviors)
const genomicProfiles = {
  Cardiac: [
    { variant: 'CYP2C19 *2/*2', target: 'Cardio-metabolic risk modulation', expression: 'Elevated inflammatory burden', resistance: 'Clopidogrel resistance', immune: 'Chronic low-grade inflammation', cyp2c19: 'Poor Metabolizer' },
    { variant: 'SLCO1B1 *5/*5', target: 'Statin metabolism pathway', expression: 'Normal', resistance: 'Statin-induced myopathy risk', immune: 'Baseline', cyp2c19: 'Normal' },
    { variant: 'VKORC1 A/A', target: 'Anticoagulation therapy', expression: 'High sensitivity', resistance: 'Warfarin sensitive', immune: 'Baseline', vkorc1: 'Very Low Dose' },
    { variant: 'APOE e4/e4', target: 'Lipid metabolism', expression: 'Elevated LDL response', resistance: 'None reported', immune: 'Pro-inflammatory', cyp2c19: 'Normal' }
  ],
  Respiratory: [
    { variant: 'ADRB2 Arg16Gly', target: 'Beta-agonist response', expression: 'Reduced receptor sensitivity', resistance: 'Beta-agonist tachyphylaxis', immune: 'Eosinophilic', cyp2d6: 'Normal' },
    { variant: 'IL4R Q576R', target: 'Inflammatory pathway', expression: 'Elevated IgE', resistance: 'Corticosteroid partial response', immune: 'Th2 dominant', cyp2d6: 'Normal' },
    { variant: 'TPMT *3A/*3A', target: 'Immunomodulation', expression: 'Low enzyme activity', resistance: 'Thiopurine toxicity risk', immune: 'Baseline', tpmt: 'Poor Metabolizer' }
  ],
  Metabolic: [
    { variant: 'TCF7L2 rs7903146', target: 'Insulin secretion pathway', expression: 'Reduced beta-cell function', resistance: 'Sulfonylurea partial response', immune: 'Baseline', cyp2c9: 'Normal' },
    { variant: 'SLC22A1 R61C', target: 'Metformin transport', expression: 'Reduced transporter activity', resistance: 'Metformin reduced efficacy', immune: 'Baseline', cyp2c9: 'Intermediate' },
    { variant: 'PPARG Pro12Ala', target: 'Insulin sensitivity', expression: 'Improved sensitivity', resistance: 'None reported', immune: 'Anti-inflammatory', cyp2c9: 'Normal' }
  ],
  Neurological: [
    { variant: 'CYP2D6 *4/*4', target: 'Analgesic metabolism', expression: 'No enzyme activity', resistance: 'Codeine ineffective', immune: 'Baseline', cyp2d6: 'Poor Metabolizer' },
    { variant: 'COMT Val158Met', target: 'Dopamine metabolism', expression: 'Altered dopamine levels', resistance: 'Variable opioid response', immune: 'Baseline', cyp2d6: 'Intermediate' },
    { variant: 'OPRM1 A118G', target: 'Opioid receptor binding', expression: 'Reduced receptor affinity', resistance: 'Higher opioid dose needed', immune: 'Baseline', cyp2d6: 'Normal' }
  ],
  Oncology: [
    { variant: 'EGFR exon 19 del', target: 'EGFR-TKI therapy', expression: 'High', resistance: 'T790M emergence risk', immune: 'Immune-cold', msi: 'MSS', her2: 'Negative', pdl1: '5%' },
    { variant: 'BRCA1 pathogenic', target: 'PARP inhibitor therapy', expression: 'High genomic instability', resistance: 'Platinum sensitive', immune: 'Inflamed', msi: 'MSS', her2: 'Negative', pdl1: '20%' },
    { variant: 'KRAS G12C', target: 'KRAS inhibitor therapy', expression: 'Constitutive activation', resistance: 'Anti-EGFR resistance', immune: 'Immune-cold', msi: 'MSS', her2: 'Negative', pdl1: '1%' },
    { variant: 'HER2 amplification', target: 'HER2-directed therapy', expression: 'Overexpression', resistance: 'Trastuzumab responsive', immune: 'Moderate', msi: 'MSS', her2: 'Positive', pdl1: '10%' },
    { variant: 'MSI-High', target: 'Immunotherapy', expression: 'High TMB', resistance: 'Checkpoint responsive', immune: 'Inflamed', msi: 'MSI-H', her2: 'Negative', pdl1: '60%' },
    { variant: 'ALK fusion', target: 'ALK inhibitor therapy', expression: 'Fusion positive', resistance: 'Crizotinib responsive', immune: 'Baseline', msi: 'MSS', her2: 'Negative', pdl1: '15%' }
  ]
};

// Family history templates
const familyHistoryTemplates = {
  Cardiac: ['Father had MI at age 55', 'Mother has hypertension', 'Brother had bypass surgery', 'Sister has atrial fibrillation', 'Grandfather died of heart attack', 'Family history of sudden cardiac death'],
  Respiratory: ['Mother has asthma', 'Father had lung cancer (smoker)', 'Sibling has COPD', 'Grandmother had pulmonary fibrosis', 'Family history of allergies'],
  Metabolic: ['Both parents have Type 2 Diabetes', 'Mother has thyroid disease', 'Father had diabetic complications', 'Strong family history of obesity', 'Grandmother had gestational diabetes'],
  Neurological: ['Father has Parkinson\'s disease', 'Mother has migraines', 'Grandmother had Alzheimer\'s', 'Uncle has epilepsy', 'Family history of stroke'],
  Oncology: ['Mother had breast cancer at 45', 'Father had colon cancer', 'Sister is BRCA positive', 'Grandmother had ovarian cancer', 'Multiple family members with cancer']
};

// Surgery templates
const surgeryTemplates = [
  'Appendectomy (2010)', 'Cholecystectomy (2015)', 'Knee replacement (2018)', 'Hip replacement (2019)',
  'CABG (2016)', 'Angioplasty with stent (2020)', 'Thyroidectomy (2017)', 'Mastectomy (2019)',
  'Colectomy (2018)', 'Prostatectomy (2017)', 'Hysterectomy (2016)', 'Spinal fusion (2015)',
  'Cataract surgery (2021)', 'Pacemaker implantation (2020)', 'None', 'None', 'None'
];

// Treatment goals
const treatmentGoals = ['Low Risk / Conservative', 'Fast Recovery', 'Cost-effective', 'Experimental / High Risk'];

// Helper functions
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomSubset = (arr, min, max) => {
  const count = randomInt(min, max);
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate a single patient
const generatePatient = (index, category) => {
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  const firstName = randomFrom(firstNames[gender]);
  const lastName = randomFrom(lastNames);
  
  // Age distribution varies by category
  let ageRange;
  switch (category) {
    case 'Oncology': ageRange = [45, 78]; break;
    case 'Cardiac': ageRange = [50, 80]; break;
    case 'Neurological': ageRange = [35, 85]; break;
    case 'Metabolic': ageRange = [35, 70]; break;
    case 'Respiratory': ageRange = [25, 75]; break;
    default: ageRange = [30, 75];
  }
  const age = randomInt(ageRange[0], ageRange[1]);
  
  // Physical characteristics
  const height = gender === 'Male' ? randomInt(165, 190) : randomInt(155, 175);
  const bmi = randomFloat(22, 35);
  const weight = Math.round(bmi * Math.pow(height / 100, 2));
  
  // Conditions - primary from category, may have comorbidities
  const primaryConditions = randomSubset(conditionsByCategory[category], 1, 3);
  const hasComorbidity = Math.random() > 0.4;
  let conditions = [...primaryConditions];
  if (hasComorbidity) {
    const otherCategories = Object.keys(conditionsByCategory).filter(c => c !== category);
    const comorbidCategory = randomFrom(otherCategories);
    conditions.push(randomFrom(conditionsByCategory[comorbidCategory]));
  }
  
  // Symptoms
  const symptoms = randomSubset(symptomsByCategory[category], 2, 4);
  const symptomSeverity = randomInt(4, 9);
  const symptomDuration = randomInt(2, 30);
  
  // Medications
  const categoryMeds = randomSubset(medicationsByCategory[category], 1, 3);
  const medications = categoryMeds.length > 0 ? categoryMeds : [{ name: '', dosage: '', frequency: '' }];
  
  // Allergies (30% have allergies)
  const allergies = Math.random() > 0.7 ? randomSubset(allergyPool, 1, 2) : [];
  
  // Genomic profile
  const genomicProfile = randomFrom(genomicProfiles[category]);
  
  // Vitals - vary by condition severity
  const isHighRisk = symptomSeverity >= 7;
  const vitals = {
    heartRate: category === 'Cardiac' ? randomInt(isHighRisk ? 85 : 65, isHighRisk ? 110 : 90) : randomInt(65, 95),
    bpSystolic: category === 'Cardiac' || conditions.includes('Hypertension') ? randomInt(135, 165) : randomInt(110, 135),
    bpDiastolic: category === 'Cardiac' || conditions.includes('Hypertension') ? randomInt(85, 100) : randomInt(70, 88),
    sugar: conditions.includes('Type 2 Diabetes') ? randomInt(130, 200) : randomInt(85, 115),
    spO2: category === 'Respiratory' ? randomInt(isHighRisk ? 88 : 92, 97) : randomInt(95, 99),
    temperature: randomFloat(97.8, 99.2)
  };
  
  // Lifestyle factors
  const lifestyle = {
    smoking: category === 'Respiratory' || category === 'Cardiac' ? randomFrom(['Past', 'Yes', 'No']) : randomFrom(['No', 'No', 'Past']),
    alcohol: randomFrom(['No', 'Rarely', 'Occasionally', 'Frequently']),
    exercise: randomFrom(['None', 'Rarely', 'Moderate', 'Active']),
    diet: randomFrom(['Poor', 'Average', 'Healthy'])
  };
  
  // Build biomarkers object
  const biomarkers = {
    genomicVariant: genomicProfile.variant,
    therapyTarget: genomicProfile.target,
    expressionLevel: genomicProfile.expression,
    resistanceMarker: genomicProfile.resistance,
    immuneProfile: genomicProfile.immune,
    genomics: {
      variants: [{ gene: genomicProfile.variant.split(' ')[0], mutation: genomicProfile.variant.split(' ').slice(1).join(' '), significance: genomicProfile.target }],
      tumorMutationBurden: category === 'Oncology' ? String(randomInt(2, 20)) : '',
      microsatelliteStatus: genomicProfile.msi || 'Unknown',
      pdL1Expression: genomicProfile.pdl1 || '',
      herStatus: genomicProfile.her2 || 'Unknown',
      hormoneReceptors: { er: category === 'Oncology' ? randomFrom(['Positive', 'Negative', 'Unknown']) : 'Unknown', pr: category === 'Oncology' ? randomFrom(['Positive', 'Negative', 'Unknown']) : 'Unknown' }
    },
    pharmacogenomics: {
      cyp2d6: genomicProfile.cyp2d6 || 'Normal',
      cyp2c19: genomicProfile.cyp2c19 || 'Normal',
      cyp2c9: genomicProfile.cyp2c9 || 'Normal',
      vkorc1: genomicProfile.vkorc1 || 'Normal',
      tpmt: genomicProfile.tpmt || 'Normal'
    }
  };
  
  return {
    id: index + 1,
    name: `${firstName} ${lastName}`,
    age,
    gender,
    height,
    weight,
    bloodGroup: randomFrom(bloodGroups),
    symptoms,
    symptomSeverity,
    symptomDuration,
    medicalHistory: {
      conditions,
      surgeries: randomFrom(surgeryTemplates),
      familyHistory: randomFrom(familyHistoryTemplates[category])
    },
    medications,
    biomarkers,
    allergies,
    lifestyle,
    vitals,
    disease: category,
    treatmentGoal: randomFrom(treatmentGoals)
  };
};

// Generate 100 patients with distribution across categories
const generateDataset = () => {
  const categories = ['Cardiac', 'Respiratory', 'Metabolic', 'Neurological', 'Oncology'];
  const patients = [];
  
  // 20 patients per category for balanced distribution
  categories.forEach((category, catIndex) => {
    for (let i = 0; i < 20; i++) {
      const patientIndex = catIndex * 20 + i;
      patients.push(generatePatient(patientIndex, category));
    }
  });
  
  return patients;
};

// Pre-generated dataset for consistency
export const patientDataset = generateDataset();

// Export helper to get a random patient
export const getRandomPatient = () => {
  const randomIndex = Math.floor(Math.random() * patientDataset.length);
  return patientDataset[randomIndex];
};

// Export helper to get patient by ID
export const getPatientById = (id) => {
  return patientDataset.find(p => p.id === id);
};

// Export helper to get patients by category
export const getPatientsByCategory = (category) => {
  return patientDataset.filter(p => p.disease === category);
};

export default patientDataset;
