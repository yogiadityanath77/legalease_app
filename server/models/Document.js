const mongoose = require('mongoose');

// GPT fields (summary, risks) are added in Phase 3.
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
