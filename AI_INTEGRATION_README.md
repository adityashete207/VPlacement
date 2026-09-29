# VPlacement — AI Layer

This adds five specialized AI agents (all powered by Google Gemini via the free
Gemini API) on top of your existing React + Express + MySQL job portal.
Nothing about your existing auth, DB schema, or routes was removed — this is
purely additive.

## The five agents

| Agent | Where it lives | What it does | Who sees it |
|---|---|---|---|
| **Matching Agent** | `jobportal-backend/services/agents/matchingAgent.js` | Scores open jobs against a student's self-described skills/interests | Job seekers — "Get AI-Matched Job Recommendations" panel on `/jobs` |
| **Screening Agent** | `.../screeningAgent.js` | Ranks applicants for a job from their cover letters | Employers/admins — "Rank Candidates with AI" on Employer Dashboard |
| **Job Posting Agent** | `.../jobDescriptionAgent.js` | Turns rough notes into a polished title + description | Employers — "AI Job Post Assistant" on Post a Job page |
| **Career Assistant Agent** | `.../careerChatAgent.js` | Conversational help with resumes/interviews/open roles | Everyone — floating chat widget, bottom-right, every page |
| **Insights Agent** | `.../insightsAgent.js` | Summarizes platform stats into plain-English bullets + one recommendation | Admins — top of Admin Dashboard |

All five call through one shared client, `jobportal-backend/services/aiClient.js`,
which owns the API key, model name, and JSON parsing. New routes live in
`jobportal-backend/routes/aiRoutes.js`, mounted at `/api/ai`.

## Setup

1. **Get a free API key** at https://aistudio.google.com/apikey
2. In `jobportal-backend/`, copy `.env.example` to `.env` (or add to your existing `.env`):
   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite  # optional, this is the default
   ```
3. No new npm packages are required — the AI client uses Node's built-in
   `fetch`, which your project already needs (Express 5 requires Node 18+).
4. Start the backend and frontend as usual:
   ```
   cd jobportal-backend && npm install && node server.js
   cd .. && npm install && npm run dev
   ```

That's it — the chat widget, match panel, job-description helper, screening
panel, and insights panel are already wired into the existing pages.

## A note on the free tier

Gemini's free tier (via AI Studio keys) is genuinely free, but it comes with
real rate limits — a capped number of requests per minute and per day — and
Google may use free-tier prompts to improve their models unless you opt out.
That's fine for development and demos. Check current limits at
https://ai.google.dev/pricing before leaning on this for anything with real
traffic. If you ever hit rate limits, the fix is either to add a billing
account (moves you off the free tier) or throttle/cache AI calls on the
backend.

## Notes & things to sanity-check before you rely on this

- **Cost/rate limits**: every agent call hits the Anthropic API live — there's
  no caching yet. If you demo this a lot, keep an eye on your API usage.
- **The screening agent only reads cover letters**, not actual resume files
  (PDFs) — it explicitly avoids inventing resume content it can't see. Wiring
  in real resume parsing (e.g. extracting text from the uploaded resume link)
  would be the natural next step if you want deeper screening.
- **The matching agent's "student profile"** is just whatever the student types
  into the panel each time — it isn't saved anywhere. If you want persistent
  profiles (skills, resume, preferences), you'd add a `profile` table and
  pre-fill the panel from it.
- **Error handling**: if `GEMINI_API_KEY` is missing or the API call fails,
  every endpoint returns a clear error message rather than crashing the server.
- **This was written and reviewed for syntax correctness but not run against
  a live server** (this environment has no network access to install
  dependencies or call the Gemini API). Please test each feature locally
  before treating it as production-ready — start with the chat widget since
  it's the simplest end-to-end path to verify your API key and wiring work.

## Ideas for going further

- Cache matching/insights results for a few minutes to cut API calls.
- Add a "why this candidate" expandable view sourced from actual resume text.
- Let the Insights Agent run on a schedule and email a weekly digest to admins.
- Add streaming responses to the chat widget for a snappier feel.
