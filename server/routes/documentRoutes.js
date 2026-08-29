const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
} = require('../controllers/documentController');

const router = express.Router();

// In-memory storage — Render's filesystem is ephemeral (see DECISIONS.md #6).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Turn multer errors (e.g. file too large) into clean 400s.
const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: 'Upload failed' });
    }
    next();
  });
};

router.use(authMiddleware); // all document routes are protected

router.post('/upload', uploadSingle, uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);

module.exports = router;
