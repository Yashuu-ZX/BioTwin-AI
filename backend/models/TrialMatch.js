const { mongoose } = require('../config/mongo');

// ── Trial Match Result ───────────────────────────────────────────────────────
const TrialMatchSchema = new mongoose.Schema({
  patientId:      { type: String, required: true, index: true },
  matchType:      { type: String, enum: ['full', 'quick'], default: 'full' },
  totalFound:     { type: Number },
  eligibleTrials: { type: Number },
  results:        [{ type: mongoose.Schema.Types.Mixed }],
  criteria:       { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, collection: 'trial_matches' });

module.exports = mongoose.model('TrialMatch', TrialMatchSchema);
