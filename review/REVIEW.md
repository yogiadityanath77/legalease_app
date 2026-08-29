# LegalEase — Review & Testing Guide

## Purpose
Use this file in a separate Claude session to review and test the completed build. Work through each section in order.

---

## Phase 1 — Auth Review

### Backend Tests (Postman)
| Test | Expected Result |
|---|---|
| POST `/api/auth/register` with name, email, password | Returns `{ token, user: { id, name, email } }` with status 201 |
| POST `/api/auth/register` with duplicate email | Returns error 400 "Email already exists" |
| POST `/api/auth/register` with missing fields | Returns error 400 with validation message |
| POST `/api/auth/login` with correct credentials | Returns `{ token, user }` with status 200 |
| POST `/api/auth/login` with wrong password | Returns error 401 "Invalid credentials" |
| POST `/api/auth/login` with unregistered email | Returns error 401 |
| GET `/api/documents` with no token | Returns error 401 "No token provided" |
| GET `/api/documents` with invalid token | Returns error 401 "Invalid token" |

### Frontend Tests
- [ ] Register page renders without errors
- [ ] Successful register redirects to `/dashboard`
- [ ] Login page renders without errors
- [ ] Successful login redirects to `/dashboard`
- [ ] Invalid credentials shows error message on screen
- [ ] Logged-in user cannot access `/login` (redirects to dashboard)
- [ ] Logged-out user cannot access `/dashboard` (redirects to login)
- [ ] Logout button clears token and redirects to `/login`

---

## Phase 2 — Document Upload Review

### Backend Tests (Postman)
| Test | Expected Result |
|---|---|
| POST `/api/documents/upload` with valid PDF + auth token | Returns `{ documentId }` status 201 |
| POST `/api/documents/upload` with plain text + auth token | Returns `{ documentId }` status 201 |
| POST `/api/documents/upload` with no file and no text | Returns error 400 "No document provided" |
| POST `/api/documents/upload` with non-PDF file | Returns error 400 "Only PDF files are supported" |
| GET `/api/documents` with valid token | Returns array of user's documents |
| GET `/api/documents/:id` with valid token + valid ID | Returns full document object |
| GET `/api/documents/:id` of another user's document | Returns error 403 "Not authorised" |

### Frontend Tests
- [ ] Upload modal opens on button click
- [ ] Can switch between PDF upload and paste text tabs
- [ ] PDF drag-and-drop works
- [ ] File name displays after selection
- [ ] Submit button disabled if no file/text provided
- [ ] Loading state shown during upload
- [ ] Redirects to `/document/:id` on success
- [ ] Error message shown if upload fails

---

## Phase 3 — GPT Integration Review

### Backend Tests (Postman)
| Test | Expected Result |
|---|---|
| Upload a real PDF rental agreement | MongoDB document has non-empty `summary` and `risks[]` |
| Check `risks[]` structure | Each risk has `clause`, `reason`, `severity` fields |
| Check `severity` values | All values are exactly "High", "Medium", or "Low" |
| Upload very short text (< 50 words) | GPT still returns valid response or graceful error |
| POST `/api/documents/:id/ask` with valid question | Returns `{ answer: "..." }` string |
| POST `/api/documents/:id/ask` with empty question | Returns error 400 |

### GPT Quality Check
Upload this sample text and verify the output makes sense:
```
This agreement is made between the Landlord and Tenant. The tenant shall pay rent of ₹20,000 per month. 
The landlord may terminate this lease with 7 days notice for any reason. The tenant waives all rights 
to dispute resolution in a court of law. Any damage to the property shall be borne entirely by the 
tenant regardless of cause. The agreement auto-renews every year unless cancelled 6 months in advance.
```

Expected: At least 3 risks flagged, at least one High severity (7-day termination + waiver of court rights).

---

## Phase 4 — UI Review

### Visual Checklist
- [ ] Dark navy background across all pages
- [ ] Gold accent on buttons, active tab, headings
- [ ] Navbar present on all authenticated pages
- [ ] Sidebar shows list of past documents with name + date
- [ ] Active document highlighted in sidebar
- [ ] Three tabs visible on DocumentView: Summary | Risk Flags | Ask a Question
- [ ] Tab switching works without page reload

### Summary Tab
- [ ] Summary text is readable, well-spaced
- [ ] No raw JSON visible on screen

### Risk Flags Tab
- [ ] Each risk shown as a card
- [ ] Severity badge colour correct (red/amber/green)
- [ ] Clause text displayed (quoted style)
- [ ] Reason text displayed below clause

### Q&A Tab
- [ ] Input field at bottom of screen
- [ ] Send button works
- [ ] Loading indicator while GPT responds
- [ ] Answer displays clearly
- [ ] Can ask multiple questions in sequence

---

## Phase 5 — Deployment Review

- [ ] Backend live on Render — test all Postman routes against live URL
- [ ] Frontend live on Vercel — test full flow in browser
- [ ] CORS not blocking requests from Vercel to Render
- [ ] Environment variables set correctly on both platforms
- [ ] No API keys or secrets visible in frontend code or network tab
- [ ] PDF upload works on live deployment (not just localhost)

---

## Known Limitations (Acceptable for V1)
- Scanned/image PDFs will not extract text correctly (no OCR)
- JWT stored in localStorage (not httpOnly cookie)
- Q&A history not persisted after page refresh
- No document delete feature
- No file size validation beyond multer default
