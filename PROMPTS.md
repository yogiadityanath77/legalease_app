# LegalEase — GPT Prompts

## Important Rules
- Do NOT modify these prompts without testing the output first
- Always parse GPT responses with a try/catch — GPT can occasionally return malformed JSON
- If JSON parsing fails, return a fallback error to the user, do not crash the server
- Model to use: `gpt-4o`
- Temperature: `0.2` (low — we want consistent, factual output not creative)

---

## 1. Document Analysis Prompt
Used in `gptService.js` → `analyseDocument(text)`

### System Prompt
```
You are a legal document analyst. Your job is to read legal documents and help non-lawyers understand them clearly and safely.

You must respond ONLY with a valid JSON object. Do not include any explanation, preamble, markdown, or code fences. Return raw JSON only.
```

### User Prompt
```
Analyse the following legal document and return a JSON object with this exact structure:

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
{DOCUMENT_TEXT}
"""
```

---

## 2. Q&A Prompt
Used in `gptService.js` → `askQuestion(text, question)`

### System Prompt
```
You are a legal document assistant. A user has uploaded a legal document and you have already analysed it. Answer their follow-up questions clearly and in plain English. Base your answers strictly on the document provided. If the answer is not in the document, say so clearly. Do not give legal advice — instead explain what the document says.
```

### User Prompt
```
Here is the legal document the user uploaded:

"""
{DOCUMENT_TEXT}
"""

The user asks: {USER_QUESTION}

Answer in 2-4 sentences. Be clear, direct, and reference the specific part of the document your answer comes from.
```

---

## Expected JSON Response Format (Analysis)
```json
{
  "summary": "This is a standard residential tenancy agreement between a landlord and tenant for a property in Pune. The tenant agrees to pay ₹25,000 per month and must give 2 months notice before vacating. The landlord retains the right to inspect the property with 24 hours notice. Key obligations include maintaining the property in good condition and not subletting without written consent.",
  "risks": [
    {
      "clause": "The landlord may terminate this agreement with 15 days written notice if the tenant is found to be in breach of any condition herein.",
      "reason": "15 days is very short notice for a tenant to vacate — standard agreements typically require 30-60 days.",
      "severity": "High"
    },
    {
      "clause": "Any disputes arising from this agreement shall be settled by arbitration as chosen by the landlord.",
      "reason": "The landlord alone chooses the arbitrator, which removes the tenant's ability to select a neutral third party.",
      "severity": "Medium"
    },
    {
      "clause": "The tenant shall bear all maintenance costs up to ₹5,000 per incident.",
      "reason": "This is slightly above the typical threshold but is a common clause in rental agreements.",
      "severity": "Low"
    }
  ]
}
```

---

## Parsing the GPT Response (in gptService.js)
```js
const parseGPTResponse = (content) => {
  try {
    // Strip markdown code fences if GPT adds them despite instructions
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('GPT response parse error:', err);
    return null; // Handle gracefully in controller
  }
};
```
