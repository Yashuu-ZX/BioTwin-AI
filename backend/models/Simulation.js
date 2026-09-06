const { mongoose } = require('../config/mongo');

const SimulationSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  treatmentPlan: { type: mongoose.Schema.Types.Mixed },
  predictions: { type: mongoose.Schema.Types.Mixed },
  riskScore: { type: Number },
  riskLevel: { type: String },
  diseaseState: { type: mongoose.Schema.Types.Mixed },
  agentAnalysis: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'simulations' });

module.exports = mongoose.model('Simulation', SimulationSchema);
