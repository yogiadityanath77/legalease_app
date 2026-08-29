const pdfParse = require('pdf-parse');

// Extract plain text from an in-memory PDF buffer (from multer memoryStorage).
// Throws if the buffer is not a parseable PDF — caller converts that to a 400.
const extractTextFromPdf = async (buffer) => {
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
};

module.exports = { extractTextFromPdf };
