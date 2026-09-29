// jobportal-backend/services/agents/screeningAgent.js
//
// Agent #2: Screening Agent
// Ranks applicants for a given job so employers can triage applications
// faster. Deliberately conservative: it only reasons over the cover
// letter text it's given, never invents resume content it can't see.

const { callAI, extractJson } = require('../aiClient');

const SYSTEM_PROMPT = `You are the Screening Agent for VPlacement, a college job & internship platform.
Given a job posting and a list of applicants (name + cover letter text), rank them by fit for the role.

Respond with ONLY a JSON array (no prose, no markdown fences). Each item must be:
{"applicationId": <number>, "score": <integer 0-100>, "strengths": "<max 20 words>", "concerns": "<max 20 words>"}

Rules:
- Base your judgment only on the cover letter text and job description provided. Do not assume resume
  content, GPA, or anything not written in the text.
- If a cover letter is empty or missing, say so in "concerns" and score conservatively.
- Sort the array by score, descending.
- Never discriminate based on name, gender, or any protected characteristic implied by a name — judge
  only the written content.`;

async function screenApplicants({ job, applicants }) {
  if (!applicants || applicants.length === 0) return [];

  const userContent = JSON.stringify({
    job: {
      title: job.title,
      description: job.description,
      jobType: job.jobType,
      companyName: job.companyName,
    },
    applicants: applicants.map((a) => ({
      applicationId: a.applicationId,
      coverLetter: a.coverLetter || '(no cover letter submitted)',
    })),
  });

  const text = await callAI({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    maxTokens: 1500,
  });

  const result = extractJson(text);
  return Array.isArray(result) ? result : [];
}

module.exports = { screenApplicants };
