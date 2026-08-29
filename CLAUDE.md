# LegalEase — Claude Code Guide

## What This Project Is
LegalEase is a full-stack MERN web application that allows users to upload legal documents (PDF or plain text) and receive an AI-powered analysis: a plain-English summary, risk-flagged clauses (High/Medium/Low severity), and a GPT-4o-powered Q&A panel for follow-up questions. Users have JWT-authenticated accounts with a full document history.

---

## Tech Stack
- **Frontend:** React, Tailwind CSS (dark navy + gold theme)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **AI:** OpenAI GPT-4o via official `openai` npm package
- **PDF Parsing:** `pdf-parse` npm package
- **Auth:** JWT (access tokens), bcrypt for password hashing
- **Deployment:** Frontend → Vercel, Backend → Render

---

## Folder Structure
```
legalease/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── DocumentView.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── UploadModal.jsx
│   │   │   ├── SummaryTab.jsx
│   │   │   ├── RiskTab.jsx
│   │   │   └── QATab.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── axios.js        # Axios instance with interceptor
│   │   └── App.jsx
│   └── package.json
│
├── server/                  # Express backend
│   ├── controllers/
│   │   ├── authController.js
│   │   └── documentController.js
│   ├── models/
│   │   ├── User.js
│   │   └── Document.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── documentRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── utils/
│   │   ├── pdfParser.js
│   │   └── gptService.js
│   └── index.js
│
├── CLAUDE.md
├── ARCHITECTURE.md
├── PLAN.md
├── PROMPTS.md
├── DECISIONS.md
└── review/
    └── REVIEW.md
```

---

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Commands

### Install dependencies
```bash
cd server && npm install
cd client && npm install
```

### Run development
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

---

## Coding Conventions
- Use `async/await` everywhere, no `.then()` chains
- All backend errors go through a centralised error handler
- Controllers are thin — logic lives in utils/services
- React components use functional components + hooks only
- Tailwind for all styling — no separate CSS files
- Axios instance in `utils/axios.js` handles all API calls with auth headers and error interception
- MongoDB documents are never deleted — use an `isDeleted` flag if needed

---

## Important Rules for Claude Code
- Do NOT change the folder structure without updating ARCHITECTURE.md
- Do NOT switch libraries (e.g. from pdf-parse to pdfjs) — see DECISIONS.md for reasoning
- Do NOT add RAG, vector DBs, or embeddings — GPT-4o handles full document in context
- Always validate inputs on the backend before sending to GPT
- Keep GPT prompts exactly as defined in PROMPTS.md unless explicitly told to change them
