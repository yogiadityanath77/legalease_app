const mongoose = require('mongoose');
const Document = require('../models/Document');
const { buildDocumentPayload, UploadError } = require('../utils/documentText');

// POST /api/documents/upload
// Accepts EITHER a multipart PDF (field: file) OR pasted text (field: text).
const uploadDocument = async (req, res, next) => {
  try {
    const { name, rawText } = await buildDocumentPayload({
      file: req.file,
      text: req.body.text,
      name: req.body.name,
    });

    const doc = await Document.create({
      userId: req.user.id,
      name,
      rawText,
    });

    return res.status(201).json({ documentId: doc._id });
  } catch (err) {
    if (err instanceof UploadError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

// GET /api/documents — all documents for the logged-in user (no rawText)
const getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({
      userId: req.user.id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .select('-rawText');

    return res.json(docs);
  } catch (err) {
    next(err);
  }
};

// GET /api/documents/:id — single document with full text
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = await Document.findById(id);
    if (!doc || doc.isDeleted) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (doc.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadDocument, getDocuments, getDocumentById };
