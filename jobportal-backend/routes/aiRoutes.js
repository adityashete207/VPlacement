// jobportal-backend/routes/aiRoutes.js
//
// Exposes VPlacement's AI layer. Five agents, five jobs:
//   POST /api/ai/match                     -> Matching Agent      (jobSeeker)
//   POST /api/ai/screen/:jobId              -> Screening Agent     (employer/admin)
//   POST /api/ai/generate-job-description   -> Job Posting Agent   (employer)
//   POST /api/ai/chat                       -> Career Assistant    (public)
//   GET  /api/ai/insights                   -> Insights Agent      (admin)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

const { matchJobsForSeeker } = require('../services/agents/matchingAgent');
const { screenApplicants } = require('../services/agents/screeningAgent');
const { generateJobDescription } = require('../services/agents/jobDescriptionAgent');
const { chatReply } = require('../services/agents/careerChatAgent');
const { generatePlatformInsights } = require('../services/agents/insightsAgent');

const formatJobForFrontend = (job) => ({
  id: job.id,
  employerId: job.employer_id,
  title: job.title,
  description: job.description,
  location: job.location,
  jobType: job.job_type,
  salary: job.salary,
  companyName: job.company_name,
  datePosted: job.date_posted,
});

// Small helper so one flaky AI call doesn't crash the process.
const handleAiError = (res, label, error) => {
  console.error(`[AI] ${label} error:`, error.message);
  res.status(502).json({ message: error.message || `${label} failed.` });
};

// @route   POST /api/ai/match
// @desc    AI-matched jobs for the logged-in student
// @access  Private/JobSeeker
router.post('/match', protect, authorize('jobSeeker'), async (req, res) => {
  try {
    const { profile } = req.body;
    const [jobs] = await pool.execute('SELECT * FROM jobs ORDER BY date_posted DESC LIMIT 40');
    const formattedJobs = jobs.map(formatJobForFrontend);

    const matches = await matchJobsForSeeker({ profile: profile || {}, jobs: formattedJobs });

    const jobsById = Object.fromEntries(formattedJobs.map((j) => [j.id, j]));
    const enriched = matches
      .filter((m) => jobsById[m.jobId])
      .map((m) => ({ ...m, job: jobsById[m.jobId] }));

    res.json(enriched);
  } catch (error) {
    handleAiError(res, 'AI matching', error);
  }
});

// @route   POST /api/ai/screen/:jobId
// @desc    AI-ranked applicants for a job
// @access  Private/Employer (own job) or Admin
router.post('/screen/:jobId', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const [jobs] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [jobId]);
    const job = jobs[0];

    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (req.user.role !== 'admin' && req.user.id !== job.employer_id) {
      return res.status(403).json({ message: 'Not authorized to screen applicants for this job.' });
    }

    const [applications] = await pool.execute(
      `SELECT a.id, a.resume_link, a.cover_letter, u.name AS applicant_name
       FROM applications a
       JOIN users u ON a.applicant_id = u.id
       WHERE a.job_id = ?`,
      [jobId]
    );

    if (applications.length === 0) return res.json([]);

    const results = await screenApplicants({
      job: formatJobForFrontend(job),
      applicants: applications.map((a) => ({
        applicationId: a.id,
        coverLetter: a.cover_letter,
      })),
    });

    const appsById = Object.fromEntries(applications.map((a) => [a.id, a]));
    const enriched = results
      .filter((r) => appsById[r.applicationId])
      .map((r) => ({
        ...r,
        applicantName: appsById[r.applicationId].applicant_name,
        resumeLink: appsById[r.applicationId].resume_link,
      }));

    res.json(enriched);
  } catch (error) {
    handleAiError(res, 'AI screening', error);
  }
});

// @route   POST /api/ai/generate-job-description
// @desc    Draft a job title + description from rough employer notes
// @access  Private/Employer
router.post('/generate-job-description', protect, authorize('employer'), async (req, res) => {
  try {
    const { title, companyName, location, jobType, keyPoints } = req.body;

    if (!keyPoints || !keyPoints.trim()) {
      return res.status(400).json({ message: 'Add a few notes about the role first.' });
    }

    const result = await generateJobDescription({ title, companyName, location, jobType, keyPoints });
    res.json(result);
  } catch (error) {
    handleAiError(res, 'AI job description generation', error);
  }
});

// @route   POST /api/ai/chat
// @desc    Career assistant chat turn
// @access  Public (works for guests and logged-in users alike)
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const [jobs] = await pool.execute('SELECT * FROM jobs ORDER BY date_posted DESC LIMIT 15');
    const reply = await chatReply({
      message,
      history: Array.isArray(history) ? history : [],
      openJobs: jobs.map(formatJobForFrontend),
    });

    res.json({ reply });
  } catch (error) {
    handleAiError(res, 'AI chat', error);
  }
});

// @route   GET /api/ai/insights
// @desc    AI-written summary of platform stats
// @access  Private/Admin
router.get('/insights', protect, authorize('admin'), async (req, res) => {
  try {
    const [[{ userCount }]] = await pool.query('SELECT COUNT(*) AS userCount FROM users');
    const [[{ jobCount }]] = await pool.query('SELECT COUNT(*) AS jobCount FROM jobs');
    const [[{ applicationCount }]] = await pool.query('SELECT COUNT(*) AS applicationCount FROM applications');
    const [roleBreakdown] = await pool.query('SELECT role, COUNT(*) AS count FROM users GROUP BY role');
    const [topJobs] = await pool.query(
      `SELECT j.title, j.company_name AS companyName, COUNT(a.id) AS applicants
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.id
       GROUP BY j.id
       ORDER BY applicants DESC
       LIMIT 5`
    );

    const stats = { userCount, jobCount, applicationCount, roleBreakdown, topJobs };
    const insights = await generatePlatformInsights({ stats });

    res.json({ stats, ...insights });
  } catch (error) {
    handleAiError(res, 'AI insights', error);
  }
});

module.exports = router;
