// jobportal-backend/routes/statsRoutes.js
//
// Public, read-only platform totals for the homepage stats cards.
// Returns aggregate counts only — no user or application details.

const express = require('express');
const router = express.Router();
const pool = require('../db');

// @route   GET /api/stats
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [
      [[jobsRow]],
      [[companiesRow]],
      [[seekersRow]],
      [[hiresRow]],
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS n FROM jobs'),
      // distinct, case/spacing-insensitive, so "Stark Industries" posted twice counts once
      pool.query('SELECT COUNT(DISTINCT LOWER(TRIM(company_name))) AS n FROM jobs'),
      pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'jobSeeker'"),
      // a "hire" = an application an employer has marked accepted
      pool.query("SELECT COUNT(*) AS n FROM applications WHERE status = 'accepted'"),
    ]);

    res.json({
      activeJobs: Number(jobsRow.n),
      companies: Number(companiesRow.n),
      jobSeekers: Number(seekersRow.n),
      hires: Number(hiresRow.n),
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    res.status(500).json({ message: 'Server error fetching platform stats.' });
  }
});

module.exports = router;
