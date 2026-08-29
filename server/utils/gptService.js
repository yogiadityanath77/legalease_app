const OpenAI = require('openai');

// Model + temperature are fixed by PROMPTS.md — do not change without testing output.
const MODEL = 'gpt-4o';
const TEMPERATURE = 0.2;

// Lazily created so importing this module never throws when the key is unset
// (e.g. in tests) — a missing key surfaces as a GPTError at request time.
let client;
const getClient = () => {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new GPTError('The AI service is not configured. Please try again later.');
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
};

// Thrown when GPT is unreachable or returns something we cannot use.
// The controller turns this into a user-facing response instead of a 500 crash.
class GPTError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GPTError';
    this.status = 502;
  }
}

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

const VALID_SEVERITIES = ['High', 'Medium', 'Low'];

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
      severity: VALID_SEVERITIES.includes(r.severity) ? r.severity : 'Low',
    }));

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
    console.error('GPT request failed:', err);
    throw new GPTError('The AI service is currently unavailable. Please try again.');
  }
};

// analyseDocument(text) → { summary, risks[] }
const analyseDocument = async (text) => {
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
  const answer = await chat([
    { role: 'system', content: QA_SYSTEM_PROMPT },
    { role: 'user', content: buildQAUserPrompt(text, question) },
  ]);

  if (!answer.trim()) {
    throw new GPTError('The AI could not answer that question. Please try again.');
  }
  return answer.trim();
};

module.exports = { analyseDocument, askQuestion, GPTError };
