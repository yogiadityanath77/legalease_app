const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  askDocument,
} = require('../controllers/documentController');

const router = express.Router();

// In-memory storage — Render's filesystem is ephemeral (see DECISIONS.md #6).
// The "Paste Text" tab is sent as a multipart field, so fieldSize must be
// raised to match the file limit; fields/parts cap field-count abuse.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB PDF
    fieldSize: 10 * 1024 * 1024, // 10 MB pasted text
    fields: 10,
    parts: 20,
  },
});

// Multer errors (file too large, field too long) are user-facing 400s;
// anything else is a genuine failure and goes to the centralised handler.
const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return next(err);
    }
    next();
  });
};

router.use(authMiddleware); // all document routes are protected

router.post('/upload', uploadSingle, uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.post('/:id/ask', askDocument);

module.exports = router;
