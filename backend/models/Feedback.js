const { mongoose } = require('../config/mongo');

const FeedbackSchema = new mongoose.Schema({
  patientId:        { type: String, required: true, index: true },
  treatmentUsed:    { type: String, required: true },
  actualOutcome:    { type: String, required: true },
  predictedOutcome: { type: String, required: true },
  predictionAccuracy: { type: Number },
  delta:            { type: Number },
  evaluation:       { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, collection: 'feedback' });

module.exports = mongoose.model('Feedback', FeedbackSchema);
