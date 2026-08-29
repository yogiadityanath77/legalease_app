const { extractTextFromPdf } = require('./pdfParser');

// Expected, user-facing validation problem — the controller turns this into a 400.
class UploadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UploadError';
    this.status = 400;
  }
}

// Turn a raw upload (multipart PDF OR pasted text) into { name, rawText }.
// Throws UploadError for bad input; lets unexpected errors bubble up.
const buildDocumentPayload = async ({ file, text, name }) => {
  let resolvedName = (name || '').trim();
  let rawText = '';

  if (file) {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new UploadError('Only PDF files are supported');
    }

    try {
      rawText = await extractTextFromPdf(file.buffer);
    } catch (err) {
      console.error('PDF parse failed:', err);
      throw new UploadError('Could not read the PDF file');
    }

    if (!resolvedName) {
      resolvedName = file.originalname.replace(/\.pdf$/i, '');
    }
  } else if (text && text.trim()) {
    rawText = text.trim();
  } else {
    throw new UploadError('No document provided');
  }

  if (!rawText) {
    throw new UploadError('No readable text found in the document');
  }
  if (!resolvedName) resolvedName = 'Untitled document';

  return { name: resolvedName, rawText };
};

module.exports = { buildDocumentPayload, UploadError };
