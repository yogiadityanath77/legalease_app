const mongoose = require('mongoose');
const Document = require('../models/Document');
const { extractTextFromPdf } = require('../utils/pdfParser');

// POST /api/documents/upload
// Accepts EITHER a multipart PDF (field: file) OR pasted text (field: text).
const uploadDocument = async (req, res, next) => {
  try {
    let resolvedName = (req.body.name || '').trim();
    let rawText = '';

    if (req.file) {
      const isPdf =
        req.file.mimetype === 'application/pdf' ||
        req.file.originalname.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return res
          .status(400)
          .json({ message: 'Only PDF files are supported' });
      }

      try {
        rawText = await extractTextFromPdf(req.file.buffer);
      } catch (err) {
        return res
          .status(400)
          .json({ message: 'Could not read the PDF file' });
      }

      if (!resolvedName) {
        resolvedName = req.file.originalname.replace(/\.pdf$/i, '');
      }
    } else if (req.body.text && req.body.text.trim()) {
      rawText = req.body.text.trim();
    } else {
      return res.status(400).json({ message: 'No document provided' });
    }

    if (!rawText) {
      return res
        .status(400)
        .json({ message: 'No readable text found in the document' });
    }
    if (!resolvedName) resolvedName = 'Untitled document';

    const doc = await Document.create({
      userId: req.user.id,
      name: resolvedName,
      rawText,
    });

    return res.status(201).json({ documentId: doc._id });
  } catch (err) {
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
