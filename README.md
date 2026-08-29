# LegalEase

Upload a legal document, get it back in plain English.

LegalEase is a MERN web app that takes a rental agreement, terms of service, or
any other contract — as a PDF or pasted text — and uses GPT-4o to produce a
plain-English summary, a list of risk-flagged clauses graded High / Medium /
Low, and a Q&A panel for follow-up questions answered from the document itself.

---

## Features

- **Accounts** — register / login with JWT auth and bcrypt-hashed passwords.
- **Upload** — drag-and-drop a PDF or paste raw text. Text is extracted
  server-side and stored before analysis runs, so an AI outage never costs you
  the upload.
- **Summary** — a plain-English breakdown of what the document actually says.
- **Risk flags** — clauses worth worrying about, each with a severity badge and
  an explanation of why it was flagged.
- **Q&A** — ask follow-up questions; answers are grounded in the document, and
  the model says so when something isn't in there.
- **Dashboard** — stat row plus the highest-severity clauses across every
  document you've uploaded, so you can triage at a glance.
- **History** — every document you've uploaded, in a sidebar on every page.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT-4o (`openai` package) |
| PDF parsing | `pdf-parse` |
| Auth | JWT access tokens, bcrypt |

There is deliberately **no RAG, no vector database, and no embeddings** — legal
documents of this size fit comfortably in GPT-4o's context window, so the whole
document goes in a single call. See [DECISIONS.md](DECISIONS.md) for the
reasoning behind this and other choices.

---

## Getting started

### Prerequisites

- Node.js 22 or newer
- A MongoDB connection string (local `mongod` or MongoDB Atlas)
- An OpenAI API key with access to `gpt-4o`

### 1. Install

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure

Create `server/.env`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
OPENAI_API_KEY=sk-...
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

### 3. Run

Two terminals:

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

Backend serves on `http://localhost:5000`, frontend on
`http://localhost:5173`. Register an account and upload something.

> On Windows PowerShell, `&&` isn't supported — run the `cd` and `npm` lines
> separately.

---

## API

All `/api/documents` routes require an `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/auth/register` | Create an account, returns a JWT |
| `POST` | `/api/auth/login` | Log in, returns a JWT |
| `POST` | `/api/documents/upload` | Upload a document and analyse it |
| `GET` | `/api/documents` | List your documents (without raw text) |
| `GET` | `/api/documents/:id` | One document, including raw text |
| `POST` | `/api/documents/:id/ask` | Ask a question about a document |
| `POST` | `/api/documents/:id/analyze` | Re-run analysis after a failure |

`POST /api/documents/upload` takes `multipart/form-data` with either a `file`
field (PDF) or a `text` field (pasted text), plus an optional `name`. Limits are
10 MB for a PDF and 10 MB for pasted text.

Upload responds `201` with `{ documentId, analysisStatus }`. If the GPT call
fails, the document is still saved with `analysisStatus: "failed"` and the UI
offers a retry via the `/analyze` route rather than making you upload again.

---

## Project structure

```
legalease/
├── client/                   # React frontend
│   └── src/
│       ├── pages/            # Login, Register, Dashboard, DocumentView
│       ├── components/       # Navbar, Sidebar, UploadModal, tabs
│       ├── context/          # AuthContext
│       └── utils/axios.js    # Axios instance: auth header + error handling
│
└── server/                   # Express API
    ├── controllers/          # auth, document
    ├── models/               # User, Document
    ├── routes/               # authRoutes, documentRoutes
    ├── middleware/           # JWT verification
    └── utils/                # pdfParser, documentText, gptService
```

Companion docs: [ARCHITECTURE.md](ARCHITECTURE.md) for the full component and
route breakdown, [PROMPTS.md](PROMPTS.md) for the exact GPT prompts,
[PLAN.md](PLAN.md) for the build phases, and [DECISIONS.md](DECISIONS.md) for
the reasoning behind the technical choices.

---

## Known limitations

- **No OCR.** `pdf-parse` reads text-based PDFs only — a scanned or
  photographed document will extract nothing useful.
- **JWT lives in `localStorage`**, which is more exposed to XSS than an
  httpOnly cookie. A known V1 tradeoff.
- **Q&A is not persisted.** Answers are returned but never stored, so the
  conversation resets when you leave the page.
- **Analysis costs an OpenAI call per upload**, so uploading is not free.

---

## Deployment

Not yet deployed. The plan is Vercel for the frontend and Render for the
backend; the remaining steps are tracked as Phase 5 in [PLAN.md](PLAN.md).

---

## License

No license specified — all rights reserved.
