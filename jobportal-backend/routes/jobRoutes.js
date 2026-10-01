// jobportal-backend/routes/jobRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');
const { notifyUser, notifyRole } = require('../services/notificationService'); // NEW
const { deleteJobWithDependents } = require('../services/jobDeletionService'); // NEW

const formatJobForFrontend = (job) => {
  if (!job) return null;
  return {
    id: job.id,
    employerId: job.employer_id,
    title: job.title,
    description: job.description,
    location: job.location,
    jobType: job.job_type,
    salary: job.salary,
    companyName: job.company_name,
    datePosted: job.date_posted,
  };
};

// --- Resume upload setup ---
// Files land in jobportal-backend/uploads/resumes/ (on Railway this folder is
// a persistent volume mounted at /app/uploads). They are NOT served publicly:
// the GET /applications/:applicationId/resume-access route checks who is asking
// and returns a 5-minute signed link to GET /resume-file/:token. Filenames are
// randomized so two applicants uploading "resume.pdf" never collide or
// overwrite each other.
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'resumes'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, matches the UI copy
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  },
});

// Middleware to attach io object from app to req
router.use((req, res, next) => {
  req.io = req.app.get('socketio');
  next();
});

// @route   POST /api/jobs/upload-resume
// @desc    Upload a resume PDF, get back a URL to store as resumeLink
// @access  Private/JobSeeker
router.post('/upload-resume', protect, authorize('jobSeeker'), (req, res) => {
  uploadResume.single('resume')(req, res, (err) => {
    if (err) {
      // multer errors (file too large, wrong type, etc.) land here
      return res.status(400).json({ message: err.message || 'Resume upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file was uploaded.' });
    }

    // Build an absolute URL using whatever host this request actually came in
    // on, so it works the same in local dev and once this is deployed.
    const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/resumes/${req.file.filename}`;
    res.status(201).json({ resumeLink: resumeUrl });
  });
});

// @route   POST /api/jobs
// @desc    Post a new job
// @access  Private/Employer
router.post('/', protect, authorize('employer'), async (req, res) => {
  const { title, description, location, jobType, salary, companyName } = req.body;
  const employerId = req.user.id;

  if (!title || !description || !location || !jobType || !companyName) {
    return res.status(400).json({ message: 'Please include all required job fields.' });
  }

  let formattedJob;

  try {
    const [result] = await pool.execute(
      'INSERT INTO jobs (employer_id, title, description, location, job_type, salary, company_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employerId, title, description, location, jobType, salary || null, companyName]
    );

    const [newlyCreatedJobs] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [result.insertId]);
    const newJobFromDb = newlyCreatedJobs[0];
    formattedJob = formatJobForFrontend(newJobFromDb);

    // Persist + emit to every job seeker (was: raw req.io.to('role-jobSeeker').emit(...) with no persistence)
    notifyRole(req.io, {
      role: 'jobSeeker',
      type: 'newJobPosted',
      message: `A new job "${formattedJob.title}" by ${formattedJob.companyName} has been posted!`,
      jobId: formattedJob.id,
    }).catch((err) => console.error('Backend: notifyRole failed for newJobPosted (non-critical):', err.message));

    res.status(201).json(formattedJob);
  } catch (error) {
    console.error('Backend: CRITICAL Error in POST /api/jobs route handler:', error);
    res.status(500).json({ message: 'Server error posting job.' });
  }
});

// @route   GET /api/jobs
// @desc    Get all jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [jobs] = await pool.execute('SELECT * FROM jobs ORDER BY date_posted DESC');
    res.json(jobs.map(formatJobForFrontend));
  } catch (error) {
    console.error('Error in GET /api/jobs (all jobs):', error);
    res.status(500).json({ message: 'Server error fetching all jobs.' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const [jobs] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    const job = jobs[0];

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.json(formatJobForFrontend(job));
  } catch (error) {
    console.error('Error in GET /api/jobs/:id:', error);
    res.status(500).json({ message: 'Server error fetching job details.' });
  }
});

// @route   GET /api/jobs/employer/:employerId
// @desc    Get jobs by employer ID
// @access  Private (employer or admin)
router.get('/employer/:employerId', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.employerId)) {
      return res.status(403).json({ message: 'Not authorized to view these jobs.' });
    }
    const [jobs] = await pool.execute('SELECT * FROM jobs WHERE employer_id = ? ORDER BY date_posted DESC', [req.params.employerId]);
    res.json(jobs.map(formatJobForFrontend));
  } catch (error) {
    console.error('Error in GET /api/jobs/employer/:employerId:', error);
    res.status(500).json({ message: 'Server error fetching employer jobs.' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job's details
// @access  Private/Employer (must own the job) or Admin
router.put('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  const { title, description, location, jobType, salary, companyName } = req.body;

  if (!title || !description || !location || !jobType || !companyName) {
    return res.status(400).json({ message: 'Please include all required job fields.' });
  }

  try {
    const [jobs] = await pool.execute('SELECT id, employer_id FROM jobs WHERE id = ?', [req.params.id]);
    const job = jobs[0];

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (req.user.role !== 'admin' && req.user.id !== job.employer_id) {
      return res.status(403).json({ message: 'Not authorized to edit this job.' });
    }

    await pool.execute(
      `UPDATE jobs
       SET title = ?, description = ?, location = ?, job_type = ?, salary = ?, company_name = ?
       WHERE id = ?`,
      [title, description, location, jobType, salary || null, companyName, req.params.id]
    );

    const [updatedJobs] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    res.json(formatJobForFrontend(updatedJobs[0]));
  } catch (error) {
    console.error('Error in PUT /api/jobs/:id:', error);
    res.status(500).json({ message: 'Server error updating job.' });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job along with its applications
// @access  Private/Employer (must own the job) or Admin
router.delete('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const [jobs] = await pool.execute('SELECT id, employer_id FROM jobs WHERE id = ?', [req.params.id]);
    const job = jobs[0];

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (req.user.role !== 'admin' && req.user.id !== job.employer_id) {
      return res.status(403).json({ message: 'Not authorized to delete this job.' });
    }

    await deleteJobWithDependents(req.params.id);
    res.json({ message: 'Job deleted successfully.' });
  } catch (error) {
    console.error('Error in DELETE /api/jobs/:id:', error);
    res.status(500).json({ message: 'Server error deleting job.' });
  }
});

// @route   POST /api/jobs/:jobId/apply
// @desc    Apply for a job
// @access  Private/JobSeeker
router.post('/:jobId/apply', protect, authorize('jobSeeker'), async (req, res) => {
  const { jobId } = req.params;
  const applicantId = req.user.id;
  const { resumeLink, coverLetter } = req.body;

  if (!resumeLink) {
    return res.status(400).json({ message: 'Resume link is required.' });
  }

  let job;
  let applicantName;

  try {
    const [jobs] = await pool.execute('SELECT id, employer_id, title FROM jobs WHERE id = ?', [jobId]);
    job = jobs[0];

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const [existingApplication] = await pool.execute(
      'SELECT id FROM applications WHERE job_id = ? AND applicant_id = ?',
      [jobId, applicantId]
    );
    if (existingApplication.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    const [insertResult] = await pool.execute(
      'INSERT INTO applications (job_id, applicant_id, resume_link, cover_letter) VALUES (?, ?, ?, ?)',
      [jobId, applicantId, resumeLink, coverLetter || null]
    );

    const [applicantUser] = await pool.execute('SELECT name FROM users WHERE id = ?', [applicantId]);
    applicantName = applicantUser[0]?.name || 'A job seeker';

    // Persist + emit to the employer (was: raw req.io.to(`user-${job.employer_id}`).emit(...))
    notifyUser(req.io, {
      userId: job.employer_id,
      type: 'newApplication',
      message: `${applicantName} applied to your job "${job.title}"!`,
      jobId: job.id,
      applicationId: insertResult.insertId,
    }).catch((err) => console.error('Backend: notifyUser failed for newApplication (non-critical):', err.message));

    // Persist + emit confirmation to the applicant themselves
    notifyUser(req.io, {
      userId: applicantId,
      type: 'applicationConfirmation',
      message: `Your application for "${job.title}" has been submitted successfully!`,
      jobId: job.id,
      applicationId: insertResult.insertId,
    }).catch((err) => console.error('Backend: notifyUser failed for applicationConfirmation (non-critical):', err.message));

    res.status(201).json({ message: 'Application submitted successfully.', id: insertResult.insertId });
  } catch (error) {
    console.error('Backend: CRITICAL Error in POST /api/jobs/:jobId/apply route handler:', error);
    res.status(500).json({ message: 'Server error submitting application.' });
  }
});

// @route   GET /api/jobs/applications/applicant/:applicantId
// @desc    Get applications by applicant ID
// @access  Private/JobSeeker (or Admin)
router.get('/applications/applicant/:applicantId', protect, authorize('jobSeeker', 'admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.applicantId)) {
      return res.status(403).json({ message: 'Not authorized to view these applications.' });
    }

    const [applications] = await pool.execute(
      `SELECT a.id, a.job_id, a.applicant_id, a.resume_link, a.cover_letter, a.status, a.created_at,
              j.id AS job_id_from_job, j.title, j.description, j.location,
              j.job_type, j.salary, j.company_name, j.date_posted, j.employer_id AS job_employer_id
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.applicant_id = ? ORDER BY a.created_at DESC`,
      [req.params.applicantId]
    );

    const formattedApplications = applications.map(app => ({
      id: app.id,
      jobId: app.job_id,
      applicantId: app.applicant_id,
      resumeLink: app.resume_link,
      coverLetter: app.cover_letter,
      status: app.status,
      createdAt: app.created_at,
      job: formatJobForFrontend({
        id: app.job_id_from_job,
        title: app.title,
        description: app.description,
        location: app.location,
        job_type: app.job_type,
        salary: app.salary,
        company_name: app.company_name,
        date_posted: app.date_posted,
        employer_id: app.job_employer_id,
      })
    }));

    res.json(formattedApplications);
  } catch (error) {
    console.error('Error in GET /api/jobs/applications/applicant/:applicantId:', error);
    res.status(500).json({ message: 'Server error fetching applicant applications.' });
  }
});

// @route   GET /api/jobs/applications/job/:jobId
// @desc    Get applications for a specific job
// @access  Private/Employer (or Admin)
router.get('/applications/job/:jobId', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const [jobs] = await pool.execute('SELECT employer_id FROM jobs WHERE id = ?', [jobId]);
    const job = jobs[0];

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (req.user.role !== 'admin' && req.user.id !== job.employer_id) {
      return res.status(403).json({ message: 'Not authorized to view applications for this job.' });
    }

    const [applications] = await pool.execute(
      `SELECT a.*, u.name as applicant_name, u.email as applicant_email
       FROM applications a
       JOIN users u ON a.applicant_id = u.id
       WHERE a.job_id = ? ORDER BY a.created_at DESC`,
      [jobId]
    );
    res.json(applications.map(app => ({
      id: app.id,
      jobId: app.job_id,
      applicantId: app.applicant_id,
      resumeLink: app.resume_link,
      coverLetter: app.cover_letter,
      status: app.status,
      createdAt: app.created_at,
      applicant: {
        name: app.applicant_name,
        email: app.applicant_email
      }
    })));
  } catch (error) {
    console.error('Error in GET /api/jobs/applications/job/:jobId:', error);
    res.status(500).json({ message: 'Server error fetching job applications.' });
  }
});

// @route   PATCH /api/jobs/applications/:applicationId/status
// @desc    Update an application's status (pending / accepted / rejected)
// @access  Private/Employer (must own the job) or Admin
const VALID_STATUSES = ['pending', 'accepted', 'rejected'];

router.patch('/applications/:applicationId/status', protect, authorize('employer', 'admin'), async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}.` });
  }

  try {
    const [applications] = await pool.execute(
      `SELECT a.id, a.applicant_id, a.status, j.id AS job_id, j.title, j.employer_id
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ?`,
      [applicationId]
    );
    const application = applications[0];

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    if (req.user.role !== 'admin' && req.user.id !== application.employer_id) {
      return res.status(403).json({ message: 'Not authorized to update this application.' });
    }

    await pool.execute('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId]);

    // Persist + emit to the applicant (was: raw req.io.to(...).emit(...))
    notifyUser(req.io, {
      userId: application.applicant_id,
      type: 'applicationStatusUpdated',
      message: `Your application for "${application.title}" is now marked as ${status}.`,
      jobId: application.job_id,
      applicationId: application.id,
    }).catch((err) => console.error('Backend: notifyUser failed for applicationStatusUpdated (non-critical):', err.message));

    res.json({ id: Number(applicationId), status });
  } catch (error) {
    console.error('Error in PATCH /api/jobs/applications/:applicationId/status:', error);
    res.status(500).json({ message: 'Server error updating application status.' });
  }
});

const RESUME_DIR = path.join(__dirname, '..', 'uploads', 'resumes');

// Logged-in user asks for a temporary (5 min) link to a resume
router.get('/applications/:applicationId/resume-access', protect, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.resume_link, a.applicant_id, j.employer_id
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ?`,
      [req.params.applicationId]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Application not found.' });

    const allowed =
      req.user.role === 'admin' ||
      req.user.id === row.employer_id ||
      req.user.id === row.applicant_id;
    if (!allowed) return res.status(403).json({ message: 'Not authorized to view this resume.' });

    // NEW: external links (Google Drive, Dropbox...) are returned as they are
    const link = String(row.resume_link);
    if (!link.includes('/uploads/resumes/')) {
    return res.json({ url: link });
}

    const file = path.basename(link.split('?')[0]);
    const token = jwt.sign({ file, purpose: 'resume' }, process.env.JWT_SECRET, { expiresIn: '5m' });

    res.json({ url: `${req.protocol}://${req.get('host')}/api/jobs/resume-file/${token}` });
  } catch (err) {
    console.error('Error in resume-access:', err);
    res.status(500).json({ message: 'Could not create resume link.' });
  }
});

// The temporary link serves the PDF (no login header needed, the token is the proof)
router.get('/resume-file/:token', (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'resume') throw new Error('Wrong token type');

    const filePath = path.join(RESUME_DIR, path.basename(decoded.file));
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found.');

    res.type('application/pdf').sendFile(filePath);
  } catch (err) {
    res.status(401).send('Link expired or invalid.');
  }
});
module.exports = router;
