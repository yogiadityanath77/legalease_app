const mongoose = require('mongoose');

// GPT analysis output — one risky clause with its plain-English explanation.
const riskSchema = new mongoose.Schema(
  {
    clause: { type: String, required: true },
    reason: { type: String, required: true },
    severity: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      required: true,
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rawText: {
      type: String,
      required: true, // extracted PDF text or pasted text
    },
    summary: {
      type: String,
      default: '', // GPT-4o plain-English summary (set on upload)
    },
    risks: {
      type: [riskSchema],
      default: [], // GPT-4o risk-flagged clauses (set on upload)
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
