const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');
const { deleteJobWithDependents } = require('../services/jobDeletionService');

// @route   GET /api/admin/users
// @desc    Get all users (for admin dashboard)
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, name, email, role, created_at FROM users');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching all users' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get a single user's profile info by ID (for the admin "View" pages)
// @access  Private/Admin
router.get('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    const targetUser = users[0];
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(targetUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user by ID
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  const userId = req.params.id;
  try {
    // Optional: Prevent deleting yourself or other admins
    if (parseInt(userId) === req.user.id || (await pool.execute('SELECT role FROM users WHERE id = ?', [userId]))[0][0]?.role === 'admin') {
        return res.status(403).json({ message: 'Cannot delete an admin account or your own account' });
    }

    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// @route   GET /api/admin/employers/:id/jobs
// @desc    Get one employer's posted jobs, each with its applicant count
//          (used by the admin "View Employer" read-only dashboard)
// @access  Private/Admin
router.get('/employers/:id/jobs', protect, authorize('admin'), async (req, res) => {
  try {
    const [jobs] = await pool.execute(
      `SELECT j.id, j.title, j.description, j.location, j.job_type AS jobType,
              j.salary, j.company_name AS companyName, j.date_posted AS datePosted,
              COUNT(a.id) AS applicantCount
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.employer_id = ?
       GROUP BY j.id
       ORDER BY j.date_posted DESC`,
      [req.params.id]
    );
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching employer jobs' });
  }
});

// @route   GET /api/admin/jobs
// @desc    Get all jobs (for admin dashboard)
// @access  Private/Admin
router.get('/jobs', protect, authorize('admin'), async (req, res) => {
  try {
    const [jobs] = await pool.execute(
      `SELECT id, employer_id AS employerId, title, description, location,
              job_type AS jobType, salary, company_name AS companyName, date_posted AS datePosted
       FROM jobs ORDER BY date_posted DESC`
    );
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching all jobs' });
  }
});

// @route   DELETE /api/admin/jobs/:id
// @desc    Delete a job by ID
// @access  Private/Admin
router.delete('/jobs/:id', protect, authorize('admin'), async (req, res) => {
  const jobId = req.params.id;
  try {
    const deleted = await deleteJobWithDependents(jobId);
    if (!deleted) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
});

module.exports = router;
