// src/api/jobService.js
import axios from 'axios';

// Uses VITE_BACKEND_URL when set (needed once deployed), otherwise local dev —
// same convention as authService.js / adminService.js / NotificationContext.jsx.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api/jobs`;

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return {
      Authorization: `Bearer ${user.token}`,
    };
  }
  return {};
};

// Get all jobs (public)
export const getAllJobs = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Get single job by ID (public)
export const getJobById = async (jobId) => {
  const response = await axios.get(`${API_URL}/${jobId}`);
  return response.data;
};

// Post a new job (private, employer)
export const createJob = async (jobData) => {
  const response = await axios.post(API_URL, jobData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Upload a resume PDF and get back a URL to submit as resumeLink.
// (private, jobSeeker)
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await axios.post(`${API_URL}/upload-resume`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // { resumeLink }
};

// Apply for a job (private, jobSeeker)
export const applyForJob = async (jobId, applicantId, resumeLink, coverLetter) => {
  const response = await axios.post(`${API_URL}/${jobId}/apply`, {
    resumeLink,
    coverLetter
  }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get applications by applicant ID (private, jobSeeker/admin)
export const getApplicationsByApplicantId = async (applicantId) => {
  try {
    const response = await axios.get(`${API_URL}/applications/applicant/${applicantId}`, {
      headers: getAuthHeaders(),
    });
    // Backend already sends the 'job' object nested and camelCase — return as-is.
    return response.data;
  } catch (error) {
    console.error(`Error fetching applications for applicant ${applicantId} from backend:`, error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch applications';
  }
};

// Get jobs by employer ID (private, employer/admin)
export const getJobsByEmployerId = async (employerId) => {
  const response = await axios.get(`${API_URL}/employer/${employerId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get applications for a specific job (private, employer/admin)
export const getApplicationsByJobId = async (jobId) => {
  const response = await axios.get(`${API_URL}/applications/job/${jobId}`, {
    headers: getAuthHeaders(),
  });
  // The backend already returns each application with a nested
  // `applicant: { name, email }` object — return it as-is. (Previously this
  // function tried to rebuild that object from `app.applicant_name` /
  // `app.applicant_email`, which don't exist on the response — the backend
  // sends them already nested under `applicant` — so it was silently
  // overwriting real data with `undefined`. That's why the UI fell back to
  // a hardcoded "John Doe" placeholder.)
  return response.data;
};

// Update an application's status: 'pending' | 'accepted' | 'rejected'
// (private, employer who owns the job, or admin)
export const updateApplicationStatus = async (applicationId, status) => {
  const response = await axios.patch(
    `${API_URL}/applications/${applicationId}/status`,
    { status },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// updateJob and deleteJob for employer dashboard features
export const updateJob = async (jobId, jobData) => {
  const response = await axios.put(`${API_URL}/${jobId}`, jobData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteJob = async (jobId) => {
  const response = await axios.delete(`${API_URL}/${jobId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

   export const getResumeAccessUrl = async (applicationId) => {
     const response = await axios.get(
       `${API_URL}/applications/${applicationId}/resume-access`,
       { headers: getAuthHeaders() }
     );
     return response.data.url;
   };