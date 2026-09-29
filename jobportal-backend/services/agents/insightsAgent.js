// jobportal-backend/services/agents/insightsAgent.js
//
// Agent #5: Insights Agent
// Reads plain platform statistics (counts, top jobs by applicants, role
// breakdown) and writes a short human-readable summary for the admin
// dashboard, including one actionable recommendation.

const { callAI, extractJson } = require('../aiClient');

const SYSTEM_PROMPT = `You are the Insights Agent for the VPlacement admin dashboard.
Given raw platform statistics, write a short, plain-English summary highlighting notable trends,
imbalances, or concerns, plus exactly one actionable recommendation for the admin team.

Respond with ONLY a JSON object (no prose, no markdown fences):
{"summary": ["<bullet 1>", "<bullet 2>", "<bullet 3>", "...", "<final bullet is the recommendation, prefixed with 'Recommendation:'>"]}

Rules:
- 4-6 bullets total, each under 25 words.
- Base every bullet strictly on the numbers provided — do not invent figures.
- If a number is zero or data is sparse, say so plainly rather than guessing why.`;

async function generatePlatformInsights({ stats }) {
  const text = await callAI({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(stats) }],
    maxTokens: 600,
    temperature: 0.3,
  });

  return extractJson(text);
}

module.exports = { generatePlatformInsights };
