// jobportal-backend/services/jobDeletionService.js
//
// Deleting a job has to remove the rows that point at it first, otherwise
// MySQL rejects the delete with a foreign-key error (applications.job_id ->
// jobs.id). Everything runs in one transaction so a failure part-way through
// can't leave a job half-deleted (e.g. applications gone but the job still
// there).
//
// Used by both the employer's "delete my job" route and the admin's
// "delete any job" route, so the behavior is identical in both places.

const pool = require('../db');

/**
 * @param {number|string} jobId
 * @returns {Promise<boolean>} true if a job row was actually deleted
 */
async function deleteJobWithDependents(jobId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute('DELETE FROM applications WHERE job_id = ?', [jobId]);

    // Notifications only hold a loose job_id reference (no foreign key), so
    // this is cleanup, not a requirement. Don't let a problem here (e.g. the
    // table not existing yet in a fresh database) block the job delete.
    try {
      await connection.execute('DELETE FROM notifications WHERE job_id = ?', [jobId]);
    } catch (err) {
      console.warn('jobDeletionService: could not clean up notifications (continuing):', err.message);
    }

    const [result] = await connection.execute('DELETE FROM jobs WHERE id = ?', [jobId]);

    await connection.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { deleteJobWithDependents };
