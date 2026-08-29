# LegalEase — Design Decisions

## Purpose
This file documents why key technical choices were made. Do not change these decisions without reading this file first.

---

## 1. No RAG / No Vector Database
**Decision:** GPT-4o is called with the full document text in a single API call. No chunking, no embeddings, no vector search.

**Why:**
- Legal documents (rent agreements, terms of service) are typically 500–5,000 words — well within GPT-4o's 128,000 token context window
- RAG adds significant complexity (ChromaDB setup, chunking strategy, embedding costs) with no benefit at this document size
- A single GPT call is faster, simpler, and more reliable for this use case

**If this needs to change:** Only add RAG if users start uploading very large legal documents (e.g. full corporate contracts 50+ pages). Even then, consider just splitting into two sequential GPT calls first.

---

## 2. pdf-parse over pdfjs-dist
**Decision:** Using `pdf-parse` npm package for PDF text extraction.

**Why:**
- `pdf-parse` is lightweight and works server-side with Node.js buffers directly — no browser APIs needed
- `pdfjs-dist` is primarily designed for browser rendering and is much heavier
- `pdf-parse` integrates cleanly with multer's in-memory file buffer

**Limitation:** `pdf-parse` cannot handle scanned/image PDFs (no OCR). This is acceptable for V1 — legal documents are almost always text-based PDFs.

---

## 3. JWT in localStorage (not httpOnly cookies)
**Decision:** Storing JWT in localStorage, sent via Authorization header.

**Why:**
- Simpler to implement for a student project
- Axios interceptor handles attaching the token automatically

**Known tradeoff:** httpOnly cookies are more secure against XSS. This is a known limitation acceptable for V1.

---

## 4. Q&A Answers Not Stored in MongoDB
**Decision:** Q&A responses from GPT are returned to the frontend but not saved to the database.

**Why:**
- Keeps the Document schema simple
- Q&A is conversational and ephemeral — users are unlikely to need to revisit a specific answer
- Reduces MongoDB storage and GPT cost over time

**If this needs to change:** Add a `qaHistory: [{ question, answer, createdAt }]` array to the Document model.

---

## 5. GPT Temperature Set to 0.2
**Decision:** Using temperature 0.2 for all GPT calls.

**Why:**
- Legal analysis needs to be consistent and factual, not creative
- Low temperature reduces hallucination risk when quoting clauses
- Higher temperature would cause different outputs for the same document on repeated calls

---

## 6. Multer Memory Storage (not disk storage)
**Decision:** Using multer with `memoryStorage()` — files are held in memory as buffers, not written to disk.

**Why:**
- Render (deployment) has an ephemeral filesystem — files written to disk are lost on restart
- Memory storage keeps the buffer available for `pdf-parse` immediately
- No file cleanup needed

**Limitation:** Not suitable for very large files (>10MB). Add a file size limit in multer config.

---

## 7. Tailwind CSS over custom CSS
**Decision:** All styling via Tailwind utility classes.

**Why:**
- Faster to build consistent UI without context-switching to CSS files
- Works well with React component architecture
- Easy to maintain a consistent color theme via Tailwind config

---

## 8. Vite over Create React App
**Decision:** Using Vite to initialise the React frontend.

**Why:**
- Significantly faster dev server and hot module replacement
- Create React App is no longer actively maintained
- Vite is now the industry standard for React projects
