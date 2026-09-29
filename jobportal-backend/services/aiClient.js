// jobportal-backend/services/aiClient.js
//
// Thin wrapper around the Google Gemini API. Every AI "agent" in this
// project (matching, screening, job-description writing, chat, insights)
// calls through this single function so there's one place that owns the
// API key, model name, and error handling.
//
// Requires Node 18+ (for global fetch), which is already required by
// Express 5 in this project.

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function buildUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

// Gemini's "contents" array only knows 'user' and 'model' roles — map our
// Anthropic-style 'assistant' role onto 'model'.
function toGeminiRole(role) {
  return role === 'assistant' ? 'model' : 'user';
}

// Gemini 2.5 models control thinking via an integer "thinkingBudget"
// (0 = off). Gemini 3.x models replaced that with a string "thinkingLevel"
// enum (minimal/low/medium/high) — sending the old integer field to a 3.x
// model is rejected outright as an invalid argument, and vice versa. Since
// GEMINI_MODEL is configurable, detect the family from the model name
// rather than hardcoding one field.
function buildThinkingConfig(model) {
  const isGemini3 = /gemini-3/.test(model);
  return isGemini3
    ? { thinkingLevel: 'minimal' } // cheapest/fastest tier for direct-answer agents
    : { thinkingBudget: 0 };
}

/**
 * Call Gemini with a system prompt + message history.
 * @param {Object} opts
 * @param {string} opts.system - system prompt describing the agent's role
 * @param {Array<{role: 'user'|'assistant', content: string}>} opts.messages
 * @param {number} [opts.maxTokens=1024]
 * @param {number} [opts.temperature=0.4]
 * @returns {Promise<string>} the model's text reply
 */
async function callAI({ system, messages, maxTokens = 1024, temperature = 0.4 }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to jobportal-backend/.env to enable AI features.'
    );
  }

  const contents = messages.map((m) => ({
    role: toGeminiRole(m.role),
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      // See buildThinkingConfig: field name depends on model generation.
      thinkingConfig: buildThinkingConfig(DEFAULT_MODEL),
    },
  };

  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  const response = await fetch(buildUrl(DEFAULT_MODEL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Newer Google AI Studio "Auth" keys (AQ.Ab... prefix) are rejected
      // when passed as a ?key= query param — they must go in this header
      // instead. This header also works fine with legacy AIza keys, so it's
      // safe regardless of which key format is configured.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const candidate = data.candidates && data.candidates[0];

  if (!candidate) {
    // Most commonly a safety block — surface something useful instead of a blank string.
    const blockReason = data.promptFeedback && data.promptFeedback.blockReason;
    throw new Error(
      blockReason
        ? `Gemini blocked this request (${blockReason}).`
        : 'Gemini returned no candidates.'
    );
  }

  const parts = (candidate.content && candidate.content.parts) || [];
  // Defensive filter: don't let any internal-reasoning ("thought") parts
  // leak into the visible reply, regardless of thinking config above.
  return parts
    .filter((p) => !p.thought)
    .map((p) => p.text || '')
    .join('');
}

/**
 * Agents are instructed to reply with raw JSON. This helper strips any
 * accidental markdown fences and parses it, falling back to extracting the
 * first {...} or [...] block if the model added stray text.
 */
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Failed to parse JSON from AI response: ${err.message}`);
  }
}

module.exports = { callAI, extractJson };
