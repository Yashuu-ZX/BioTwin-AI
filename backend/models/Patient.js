const { mongoose } = require('../config/mongo');

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  conditions: [{ type: String }],
  profile: {
    age: Number,
    gender: String,
    height: Number,
    weight: Number,
    bmi: Number,
    bloodGroup: String
  },
  symptoms: [{ type: String }],
  medicalHistory: {
    conditions: [{ type: String }],
    surgeries: String,
    familyHistory: String
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  lifestyle: {
    smoking: String,
    alcohol: String,
    exercise: String,
    diet: String
  },
  vitals: {
    heartRate: Number,
    bpSystolic: Number,
    bpDiastolic: Number,
    sugar: Number,
    spO2: Number,
    temperature: Number
  },
  labReports: { type: mongoose.Schema.Types.Mixed }, // to support varied structures or just file URLs
  disease: { type: String },
  treatmentGoal: { type: String },
  metrics: {
    baselineHealthIndex: Number,
    riskScore: Number,
    diseaseProbability: {
      cardiac: Number,
      respiratory: Number,
      metabolic: Number
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
