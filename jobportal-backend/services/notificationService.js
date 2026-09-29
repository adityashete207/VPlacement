// jobportal-backend/services/notificationService.js
//
// Central place for creating notifications: every call here does two things
// together — persists a row to the `notifications` table (so it's still
// there next time the user logs in, even if they weren't connected when it
// happened) and emits the same event over Socket.IO (for anyone currently
// online, so it still feels instant). Route handlers should call these
// instead of using req.io.to(...).emit(...) directly.

const pool = require('../db');

/**
 * Notify a single user by ID (e.g. "your application was accepted").
 */
async function notifyUser(io, { userId, type, message, jobId = null, applicationId = null }) {
  let notificationId = null;

  try {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, type, message, job_id, application_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, message, jobId, applicationId]
    );
    notificationId = result.insertId;
  } catch (err) {
    console.error('notificationService: failed to persist notification (still emitting live):', err.message);
  }

  const payload = {
    id: notificationId,
    type,
    message,
    jobId,
    applicationId,
    read: false,
    timestamp: new Date().toISOString(),
  };

  try {
    if (io) io.to(`user-${userId}`).emit(type, payload);
  } catch (err) {
    console.error('notificationService: failed to emit live notification:', err.message);
  }

  return payload;
}

/**
 * Notify every user with a given role (e.g. every jobSeeker when a new job
 * is posted). Persists one row per matching user so each of them still sees
 * it next time they log in, then emits once to the shared role room for
 * anyone currently connected.
 */
async function notifyRole(io, { role, type, message, jobId = null, applicationId = null }) {
  try {
    await pool.execute(
      `INSERT INTO notifications (user_id, type, message, job_id, application_id)
       SELECT id, ?, ?, ?, ? FROM users WHERE role = ?`,
      [type, message, jobId, applicationId, role]
    );
  } catch (err) {
    console.error('notificationService: failed to persist role notification (still emitting live):', err.message);
  }

  const payload = {
    id: null, // this is a broadcast — each recipient's own row gets a real id on their next fetch
    type,
    message,
    jobId,
    applicationId,
    read: false,
    timestamp: new Date().toISOString(),
  };

  try {
    if (io) io.to(`role-${role}`).emit(type, payload);
  } catch (err) {
    console.error('notificationService: failed to emit live role notification:', err.message);
  }

  return payload;
}

module.exports = { notifyUser, notifyRole };