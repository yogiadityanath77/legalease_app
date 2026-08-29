# LegalEase — Architecture

## Overview
LegalEase follows a standard MERN architecture with a clear separation between frontend (React) and backend (Express REST API). There is no RAG or vector database — GPT-4o handles the full document text in a single context window call.

---

## Frontend Pages

### `/login` — Login Page
- Email + password form
- On success: stores JWT in localStorage, redirects to `/dashboard`

### `/register` — Register Page
- Name + email + password form
- On success: auto-login, redirect to `/dashboard`

### `/dashboard` — Main Page
- Left sidebar: list of all user's past documents (name + date)
- Main area: upload button → opens UploadModal
- Click any past document → navigates to `/document/:id`

### `/document/:id` — Document Analysis Page
- Three tabs: **Summary** | **Risk Flags** | **Ask a Question**
- Summary Tab: plain English breakdown of the document
- Risk Tab: list of flagged clauses with High/Medium/Low badge
- Q&A Tab: chat-style interface, user types question, GPT answers based on document context

---

## Frontend Components

| Component | Purpose |
|---|---|
| `Navbar.jsx` | Top bar with logo + logout button |
| `Sidebar.jsx` | Document history list |
| `UploadModal.jsx` | PDF upload + text paste + submit |
| `SummaryTab.jsx` | Renders GPT summary |
| `RiskTab.jsx` | Renders risk flags with severity badges |
| `QATab.jsx` | Chat interface for document Q&A |
| `AuthContext.jsx` | Global auth state (user, token, login, logout) |

---

## Backend Routes

### Auth Routes (`/api/auth`)
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Create new user, return JWT |
| POST | `/login` | Validate credentials, return JWT |

### Document Routes (`/api/documents`) — all protected by authMiddleware
| Method | Route | Description |
|---|---|---|
| POST | `/upload` | Upload PDF or text, save raw text, then run GPT analysis. The document is saved even if analysis fails (`analysisStatus: 'failed'`). |
| GET | `/` | Get all documents for logged-in user |
| GET | `/:id` | Get single document with full analysis |
| POST | `/:id/ask` | Ask a follow-up question about a specific document |
| POST | `/:id/analyze` | Re-run GPT analysis for a document whose earlier attempt failed |

---

## MongoDB Schemas

### User Model
```js
{
  name: String,
  email: { type: String, unique: true },
  password: String, // bcrypt hashed
  createdAt: Date
}
```

### Document Model
```js
{
  userId: { type: ObjectId, ref: 'User' },
  name: String,           // original filename or user-given name
  rawText: String,        // extracted text from PDF or pasted text
  summary: String,        // GPT plain-English summary
  risks: [
    {
      clause: String,     // the risky clause text
      reason: String,     // why it's risky
      severity: String    // 'High' | 'Medium' | 'Low'
    }
  ],
  analysisStatus: String, // 'pending' | 'complete' | 'failed'
  createdAt: Date
}
```

---

## Data Flow

### Document Upload Flow
```
User uploads PDF / pastes text
        ↓
UploadModal → POST /api/documents/upload
        ↓
authMiddleware validates JWT
        ↓
documentController receives file/text
        ↓
documentText.js builds { name, rawText }
  (uses pdfParser.js to extract PDF text; validates input)
        ↓
Save Document to MongoDB (analysisStatus: 'pending')
        ↓
gptService.js validates length, then sends text to GPT-4o
        ↓
GPT returns { summary, risks[] }  ──(on failure)──▶ mark analysisStatus 'failed', keep document
        ↓
Update Document with summary + risks (analysisStatus: 'complete')
        ↓
Return document._id + analysisStatus to frontend
        ↓
Frontend navigates to /document/:id
  (if analysis failed, offers retry → POST /:id/analyze)
```

### Q&A Flow
```
User types question in QATab
        ↓
POST /api/documents/:id/ask
        ↓
Fetch document rawText from MongoDB
        ↓
gptService sends rawText + question to GPT
        ↓
GPT returns answer
        ↓
Return answer to frontend (not stored)
```

---

## UI Theme
- Background: `#0a0f1e` (dark navy)
- Surface/Cards: `#111827`
- Accent: `#c9a84c` (gold)
- Text: `#f9fafb` (white)
- Risk badges:
  - High: red (`#ef4444`)
  - Medium: amber (`#f59e0b`)
  - Low: green (`#22c55e`)
- Font: Inter (Google Fonts)
