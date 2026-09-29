// jobportal-backend/routes/notificationRoutes.js
//
// Lets the frontend fetch a user's notifications on login/page load, instead
// of relying purely on live Socket.IO events (which are missed entirely if
// the user wasn't connected at the moment they fired).

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/notifications
// @desc    Get the logged-in user's most recent notifications
// @access  Private (any authenticated role)
router.get('/', protect, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, type, message, job_id AS jobId, application_id AS applicationId,
              is_read AS is_read, created_at AS timestamp
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    // is_read comes back from MySQL as 0/1 — normalize to a real boolean
    res.json(rows.map((r) => ({ ...r, read: !!r.is_read, is_read: undefined })));
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications.' });
  }
});

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark every one of the logged-in user's notifications as read
// @access  Private
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error in PATCH /api/notifications/mark-all-read:', error);
    res.status(500).json({ message: 'Server error updating notifications.' });
  }
});

module.exports = router;