const OpenAI = require('openai');

// Model + temperature are fixed by PROMPTS.md — do not change without testing output.
const MODEL = 'gpt-4o';
const TEMPERATURE = 0.2;

// Guard rails before we spend tokens. gpt-4o has a 128k-token context; ~200k
// characters (~50k tokens) leaves ample room for the prompt + response and
// keeps the bill sane. Anything larger is rejected up front (see CLAUDE.md:
// "Always validate inputs on the backend before sending to GPT").
const MAX_DOCUMENT_CHARS = 200_000;
const MAX_QUESTION_CHARS = 2_000;

// Thrown when GPT is unreachable or returns something we cannot use.
// `status` lets the controller distinguish a retryable outage (502) from a
// caller mistake such as an over-long document (400).
class GPTError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'GPTError';
    this.status = status;
  }
}

// Lazily created so importing this module never throws when the key is unset
// (e.g. in tests) — a missing key surfaces as a GPTError at request time.
// Explicit timeout/maxRetries so a slow call fails fast instead of holding the
// HTTP request open for the SDK's 10-minute default.
let client;
const getClient = () => {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new GPTError('The AI service is not configured. Please try again later.');
    }
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60_000,
      maxRetries: 1,
    });
  }
  return client;
};

// --- Prompts (kept verbatim from PROMPTS.md) ---

const ANALYSIS_SYSTEM_PROMPT = `You are a legal document analyst. Your job is to read legal documents and help non-lawyers understand them clearly and safely.

You must respond ONLY with a valid JSON object. Do not include any explanation, preamble, markdown, or code fences. Return raw JSON only.`;

const buildAnalysisUserPrompt = (documentText) => `Analyse the following legal document and return a JSON object with this exact structure:

{
  "summary": "A plain-English summary of the entire document in 150-250 words. Explain what the document is, what it means for the person signing it, and the key obligations or rights involved.",
  "risks": [
    {
      "clause": "The exact clause or section that is risky (quote it directly from the document, max 60 words)",
      "reason": "A plain-English explanation of why this clause is risky or unusual (1-2 sentences)",
      "severity": "High | Medium | Low"
    }
  ]
}

Severity guidelines:
- High: clauses that could result in significant financial loss, legal liability, waiver of major rights, or automatic renewal traps
- Medium: clauses that are one-sided, unusual, or could cause moderate inconvenience or cost
- Low: clauses that are mildly unfavourable but common and generally acceptable

Identify between 3 and 8 risk clauses. If the document has fewer than 3 risks, still identify the most noteworthy clauses even if low severity.

Document:
"""
${documentText}
"""`;

const QA_SYSTEM_PROMPT = `You are a legal document assistant. A user has uploaded a legal document and you have already analysed it. Answer their follow-up questions clearly and in plain English. Base your answers strictly on the document provided. If the answer is not in the document, say so clearly. Do not give legal advice — instead explain what the document says.`;

const buildQAUserPrompt = (documentText, question) => `Here is the legal document the user uploaded:

"""
${documentText}
"""

The user asks: ${question}

Answer in 2-4 sentences. Be clear, direct, and reference the specific part of the document your answer comes from.`;

// --- Input validation ---

const assertLength = (label, value, max) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new GPTError(`No ${label} text was provided.`, 400);
  }
  if (value.length > max) {
    throw new GPTError(
      `The ${label} is too long to analyse (limit ${max.toLocaleString()} characters, got ${value.length.toLocaleString()}). Please shorten it and try again.`,
      400
    );
  }
};

// --- Response parsing ---

// GPT can occasionally return malformed JSON or wrap it in code fences despite
// instructions. Never throw here — return null and let the caller handle it.
const parseGPTResponse = (content) => {
  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('GPT response parse error:', err);
    return null;
  }
};

// Map whatever GPT puts in `severity` onto our three canonical values,
// case-insensitively and with common synonyms. An unrecognised value is
// treated as Medium — never silently downgraded to Low (which renders as a
// "safe" badge and would hide a genuinely high-risk clause).
const SEVERITY_BY_KEY = {
  high: 'High',
  severe: 'High',
  critical: 'High',
  medium: 'Medium',
  moderate: 'Medium',
  low: 'Low',
  minor: 'Low',
};

const normaliseSeverity = (value) => {
  if (typeof value !== 'string') return 'Medium';
  return SEVERITY_BY_KEY[value.trim().toLowerCase()] || 'Medium';
};

// Coerce the parsed GPT payload into the shape the Document model expects.
const normaliseRisks = (risks) =>
  (Array.isArray(risks) ? risks : [])
    .filter(
      (r) =>
        r &&
        typeof r.clause === 'string' &&
        r.clause.trim() &&
        typeof r.reason === 'string' &&
        r.reason.trim()
    )
    .map((r) => ({
      clause: r.clause.trim(),
      reason: r.reason.trim(),
      severity: normaliseSeverity(r.severity),
    }));

// Turn an OpenAI SDK error into a GPTError with an accurate, actionable message.
// Retryable outages stay 502 with a "try again" message; caller-side problems
// (over-long / malformed request) become 400 so the user isn't told to retry
// something that will always fail; auth/model misconfig is logged loudly.
const toGPTError = (err) => {
  const status = err && err.status; // OpenAI APIError carries the HTTP status
  const code = (err && (err.code || (err.error && err.error.code))) || '';

  if (status === 401 || status === 403) {
    console.error('GPT auth/config error:', err);
    return new GPTError(
      'The AI service is not configured correctly. Please contact support.',
      502
    );
  }
  if (status === 404) {
    console.error('GPT model/endpoint unavailable:', err);
    return new GPTError(
      'The AI service is misconfigured (model unavailable). Please contact support.',
      502
    );
  }
  if (code === 'context_length_exceeded' || status === 400 || status === 422) {
    console.error('GPT rejected the request:', err);
    return new GPTError(
      'This document is too long or complex for the AI to analyse. Please try a shorter document.',
      400
    );
  }
  // 408 / 429 / 5xx / network / timeout — genuinely transient.
  console.error('GPT request failed (transient):', err);
  return new GPTError(
    'The AI service is currently unavailable. Please try again in a moment.',
    502
  );
};

const chat = async (messages) => {
  try {
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      messages,
    });
    return completion.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err instanceof GPTError) throw err;
    throw toGPTError(err);
  }
};

// analyseDocument(text) → { summary, risks[] }
const analyseDocument = async (text) => {
  assertLength('document', text, MAX_DOCUMENT_CHARS);

  const content = await chat([
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    { role: 'user', content: buildAnalysisUserPrompt(text) },
  ]);

  const parsed = parseGPTResponse(content);
  if (!parsed || typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new GPTError('The document could not be analysed. Please try again.');
  }

  return {
    summary: parsed.summary.trim(),
    risks: normaliseRisks(parsed.risks),
  };
};

// askQuestion(text, question) → answer string (not stored, see DECISIONS.md #4)
const askQuestion = async (text, question) => {
  assertLength('document', text, MAX_DOCUMENT_CHARS);
  assertLength('question', question, MAX_QUESTION_CHARS);

  const answer = await chat([
    { role: 'system', content: QA_SYSTEM_PROMPT },
    { role: 'user', content: buildQAUserPrompt(text, question) },
  ]);

  if (!answer.trim()) {
    throw new GPTError('The AI could not answer that question. Please try again.');
  }
  return answer.trim();
};

module.exports = {
  analyseDocument,
  askQuestion,
  GPTError,
  MAX_DOCUMENT_CHARS,
  MAX_QUESTION_CHARS,
  // Exported for unit testing of the response-coercion logic.
  normaliseSeverity,
  normaliseRisks,
};
