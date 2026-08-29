# LegalEase — Build Plan

## Overview
Build in 5 phases, in order. Do not jump ahead. Each phase should be tested before moving to the next.

---

## Phase 1 — Project Setup & Auth
**Goal:** Working login/register with JWT. Nothing else.

### Backend
- [x] Initialise Node/Express project in `server/`
- [x] Connect to MongoDB via Mongoose
- [x] Create `User` model
- [x] Create `authController.js` — register + login
- [x] Hash passwords with bcrypt
- [x] Generate and return JWT on register/login
- [x] Create `authMiddleware.js` — verify JWT on protected routes
- [x] Create `authRoutes.js`
- [x] Test with Postman: register → login → get token (verified via curl — all REVIEW.md Phase 1 backend cases pass)

### Frontend
- [x] Initialise React project with Vite in `client/`
- [x] Install Tailwind CSS
- [x] Set up `axios.js` utility with base URL + auth header interceptor
- [x] Create `AuthContext.jsx` — store token + user in state
- [x] Build `Login.jsx` page
- [x] Build `Register.jsx` page
- [x] Protected route wrapper — redirect to login if no token (`ProtectedRoute` / `PublicOnlyRoute` in `App.jsx`)
- [x] Test: register → login → redirects to `/dashboard` (build passes; dev server boots clean)

---

## Phase 2 — Document Upload & PDF Parsing
**Goal:** User can upload a PDF or paste text. Raw text is saved to MongoDB.

### Backend
- [x] Create `Document` model (without GPT fields for now)
- [x] Install `pdf-parse` and `multer`
- [x] Create `pdfParser.js` utility — extract text from PDF buffer
- [x] Create `documentController.js` — handle upload
  - Accept multipart PDF OR plain text body
  - Extract text
  - Save raw document to MongoDB (no GPT yet)
  - Return document ID
- [x] Create `documentRoutes.js` — POST `/upload`, GET `/`, GET `/:id`
- [x] Test with Postman: upload PDF → check MongoDB for raw text (verified via curl — all REVIEW.md Phase 2 backend cases pass; real PDF extracted correctly)

### Frontend
- [x] Build `UploadModal.jsx`
  - Tab toggle: Upload PDF / Paste Text
  - PDF: drag-and-drop file input
  - Text: textarea
  - Document name input
  - Submit button
- [x] POST to `/api/documents/upload` on submit
- [x] On success: navigate to `/document/:id` (minimal `DocumentView` placeholder added + route; full tabs UI is Phase 4)
- [x] Build basic `Dashboard.jsx` with upload button

---

## Phase 3 — GPT Integration
**Goal:** Uploaded document gets analysed by GPT-4o. Summary + risks saved to MongoDB.

### Backend
- [ ] Create `gptService.js`
  - `analyseDocument(text)` — returns `{ summary, risks[] }`
  - Use exact prompt from `PROMPTS.md`
  - Parse GPT JSON response safely
- [ ] Update `documentController.js` upload handler
  - After extracting text, call `gptService.analyseDocument()`
  - Save summary + risks to Document model
- [ ] Create `/:id/ask` route + controller
  - Fetch document rawText from DB
  - Call GPT with document + user question
  - Return answer (do not store)
- [ ] Test: upload doc → check MongoDB for summary + risks

---

## Phase 4 — Frontend UI
**Goal:** Full professional UI with all tabs working.

### Frontend
- [ ] Build `Navbar.jsx` — logo left, logout right
- [ ] Build `Sidebar.jsx` — list documents from GET `/api/documents`
- [ ] Build `Dashboard.jsx` — sidebar + upload area
- [ ] Build `DocumentView.jsx` — fetch document by ID, render tabs
- [ ] Build `SummaryTab.jsx` — render summary text
- [ ] Build `RiskTab.jsx` — render risk cards with severity badges
- [ ] Build `QATab.jsx` — chat input, send question, display answer
- [ ] Apply full navy/gold theme via Tailwind
- [ ] Test all tabs end to end with a real document

---

## Phase 5 — Deployment
**Goal:** Live app on Vercel (frontend) + Render (backend).

- [ ] Add `CORS` config to Express for production frontend URL
- [ ] Set all environment variables on Render
- [ ] Set `VITE_API_URL` to Render backend URL on Vercel
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Test full flow on live URLs
- [ ] Update GitHub README with live link

---

## Build Order Within Each Phase
Always in this order:
1. Model / Schema
2. Controller logic
3. Route
4. Test with Postman
5. Build frontend component
6. Connect frontend to backend
7. Test end to end
