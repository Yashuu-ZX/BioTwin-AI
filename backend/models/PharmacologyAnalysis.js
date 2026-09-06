const { mongoose } = require('../config/mongo');

// ── Pharmacology Analysis ────────────────────────────────────────────────────
const PharmacologyAnalysisSchema = new mongoose.Schema({
  patientId:       { type: String, required: true, index: true },
  analysiType:     { type: String },   // 'full', 'interactions', 'dosing', 'pgx'
  medications:     [{ type: String }],
  interactions:    [{ type: mongoose.Schema.Types.Mixed }],
  dosingAdjustments: [{ type: mongoose.Schema.Types.Mixed }],
  pgxGuidance:     [{ type: mongoose.Schema.Types.Mixed }],
  allergyContraindications: [{ type: mongoose.Schema.Types.Mixed }],
  fullResult:      { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, collection: 'pharmacology_analyses' });

module.exports = mongoose.model('PharmacologyAnalysis', PharmacologyAnalysisSchema);
