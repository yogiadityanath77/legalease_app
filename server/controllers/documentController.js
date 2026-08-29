const mongoose = require('mongoose');
const Document = require('../models/Document');
const { buildDocumentPayload, UploadError } = require('../utils/documentText');
const { analyseDocument, askQuestion, GPTError } = require('../utils/gptService');

// Run GPT analysis for a saved document and persist the result onto it.
// On GPT failure the document is left intact and marked 'failed' so the caller
// can retry (POST /:id/analyze) without re-uploading; the GPTError is rethrown
// for the caller to surface.
const runAnalysis = async (doc) => {
  try {
    const { summary, risks } = await analyseDocument(doc.rawText);
    doc.summary = summary;
    doc.risks = risks;
    doc.analysisStatus = 'complete';
    await doc.save();
  } catch (err) {
    if (err instanceof GPTError) {
      doc.analysisStatus = 'failed';
      await doc.save().catch(() => {});
    }
    throw err;
  }
};

// POST /api/documents/upload
// Accepts EITHER a multipart PDF (field: file) OR pasted text (field: text).
const uploadDocument = async (req, res, next) => {
  let doc;
  try {
    const { name, rawText } = await buildDocumentPayload({
      file: req.file,
      text: req.body.text,
      name: req.body.name,
    });

    // Persist the extracted text first so a downstream GPT outage never costs
    // the user their upload — analysis is a separate, retriable step.
    doc = await Document.create({
      userId: req.user.id,
      name,
      rawText,
      analysisStatus: 'pending',
    });
  } catch (err) {
    if (err instanceof UploadError) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }

  try {
    await runAnalysis(doc);
    return res.status(201).json({ documentId: doc._id, analysisStatus: 'complete' });
  } catch (err) {
    if (err instanceof GPTError) {
      // Document is saved; report the analysis failure without discarding it.
      return res.status(201).json({
        documentId: doc._id,
        analysisStatus: 'failed',
        message: err.message,
      });
    }
    return next(err);
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

// Shared lookup: fetch a non-deleted document owned by the current user.
// Returns { doc } on success, or { error: { status, message } } to send back.
const loadOwnedDocument = async (id, userId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: { status: 404, message: 'Document not found' } };
  }

  const doc = await Document.findById(id);
  if (!doc || doc.isDeleted) {
    return { error: { status: 404, message: 'Document not found' } };
  }
  if (doc.userId.toString() !== userId) {
    return { error: { status: 403, message: 'Not authorised' } };
  }

  return { doc };
};

// GET /api/documents/:id — single document with full text
const getDocumentById = async (req, res, next) => {
  try {
    const { doc, error } = await loadOwnedDocument(req.params.id, req.user.id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/:id/ask — follow-up question about a document.
// The answer is returned but not stored (see DECISIONS.md #4).
const askDocument = async (req, res, next) => {
  try {
    const question = (req.body?.question || '').trim();
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const { doc, error } = await loadOwnedDocument(req.params.id, req.user.id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const answer = await askQuestion(doc.rawText, question);
    return res.json({ answer });
  } catch (err) {
    if (err instanceof GPTError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

// POST /api/documents/:id/analyze — (re)run GPT analysis for a document whose
// earlier attempt failed. Returns the updated document.
const analyzeDocument = async (req, res, next) => {
  try {
    const { doc, error } = await loadOwnedDocument(req.params.id, req.user.id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    await runAnalysis(doc);
    return res.json(doc);
  } catch (err) {
    if (err instanceof GPTError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  askDocument,
  analyzeDocument,
};
