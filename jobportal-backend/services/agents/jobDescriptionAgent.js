// jobportal-backend/services/agents/jobDescriptionAgent.js
//
// Agent #3: Job Posting Agent
// Turns an employer's rough notes into a polished job title + description,
// used by the "Generate with AI" button on the Post Job page.

const { callAI, extractJson } = require('../aiClient');

const SYSTEM_PROMPT = `You are the Job Posting Agent for VPlacement, a college job & internship platform.
Given rough notes from an employer, write a clear, appealing job posting aimed at college students.

Respond with ONLY a JSON object (no prose, no markdown fences):
{"title": "<concise job title>", "description": "<3-5 short paragraphs: overview, responsibilities, requirements, and what the student will gain>", "suggestedSalaryRange": "<a plausible range as a string, or empty string if not enough info>"}

Rules:
- Keep the tone professional but warm, written for a student/entry-level audience.
- Do not invent a company name, exact address, or compensation figure the employer did not imply.
- If the notes already include a title, salary, or company name, respect them rather than inventing new ones.`;

async function generateJobDescription({ title, companyName, location, jobType, keyPoints }) {
  const userContent = JSON.stringify({
    existingTitle: title || null,
    companyName: companyName || null,
    location: location || null,
    jobType: jobType || null,
    employerNotes: keyPoints,
  });

  const text = await callAI({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    maxTokens: 900,
    temperature: 0.5,
  });

  return extractJson(text);
}

module.exports = { generateJobDescription };
