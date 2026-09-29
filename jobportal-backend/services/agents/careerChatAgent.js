// jobportal-backend/services/agents/careerChatAgent.js
//
// Agent #4: Career Assistant Agent
// Powers the floating chat widget. Works for guests and logged-in users;
// it's given a snapshot of currently open jobs so it can reference real
// listings instead of making them up.

const { callAI } = require('../aiClient');

function buildSystemPrompt(openJobs) {
  const jobsSummary = (openJobs || [])
    .slice(0, 15)
    .map((j) => `- [#${j.id}] ${j.title} at ${j.companyName} (${j.location}, ${j.jobType})`)
    .join('\n');

  return `You are the VPlacement Career Assistant — a friendly, practical helper embedded in a college
job & internship portal. You help students with resume tips, interview prep, career questions, and
questions about currently open roles.

Currently open roles you may reference (do not invent others, and do not invent details about them
beyond what's listed here):
${jobsSummary || '(no open roles right now)'}

Guidelines:
- Keep answers concise and actionable (under 150 words) unless the student explicitly asks for more detail.
- If asked about a specific open role, reference it by title and company from the list above.
- If you don't know something (e.g. application status, employer contact info), say so plainly and
  suggest checking the dashboard or contacting the employer directly.
- Never fabricate salary, deadlines, or company details you were not given.`;
}

async function chatReply({ message, history = [], openJobs = [] }) {
  const messages = [
    ...history.filter((m) => m.role === 'user' || m.role === 'assistant'),
    { role: 'user', content: message },
  ];

  return callAI({
    system: buildSystemPrompt(openJobs),
    messages,
    maxTokens: 500,
    temperature: 0.6,
  });
}

module.exports = { chatReply };
