// jobportal-backend/services/agents/matchingAgent.js
//
// Agent #1: Matching Agent
// Scores a student's fit against the current open jobs so the frontend
// can show an "AI Match" panel on the job listing page.

const { callAI, extractJson } = require('../aiClient');

const SYSTEM_PROMPT = `You are the Matching Agent for VPlacement, a college job & internship platform.
Given a student's self-described profile and a list of open jobs, score how well each job fits the student.

Respond with ONLY a JSON array (no prose, no markdown fences). Each item must be:
{"jobId": <number>, "score": <integer 0-100>, "reason": "<max 25 words explaining the fit>"}

Rules:
- Only include jobs from the provided list, referenced by their exact "id".
- Sort the array by score, descending.
- Be honest — do not inflate scores. A poor fit should score low.
- If the profile is too vague to judge, still give your best estimate based on general employability.`;

async function matchJobsForSeeker({ profile, jobs }) {
  if (!jobs || jobs.length === 0) return [];

  const userContent = JSON.stringify({
    studentProfile: profile,
    openJobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      location: j.location,
      jobType: j.jobType,
      companyName: j.companyName,
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

module.exports = { matchJobsForSeeker };
