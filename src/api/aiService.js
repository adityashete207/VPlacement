// src/api/aiService.js
import axios from 'axios';

// Uses VITE_BACKEND_URL when set (needed once deployed), otherwise local dev —
// same convention as authService.js / adminService.js / NotificationContext.jsx.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api/ai`;

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

// Matching Agent — AI-recommended jobs for the logged-in student
export const getAiMatches = async (profile) => {
  const response = await axios.post(
    `${API_URL}/match`,
    { profile },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Screening Agent — AI-ranked applicants for a job
export const getAiScreening = async (jobId) => {
  const response = await axios.post(
    `${API_URL}/screen/${jobId}`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Job Posting Agent — draft a title + description from rough notes
export const generateJobDescriptionAI = async (payload) => {
  const response = await axios.post(
    `${API_URL}/generate-job-description`,
    payload,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Career Assistant Agent — one chat turn (works for guests too)
export const sendChatMessage = async (message, history) => {
  const response = await axios.post(`${API_URL}/chat`, { message, history });
  return response.data;
};

// Insights Agent — admin dashboard summary
export const getAdminInsights = async () => {
  const response = await axios.get(`${API_URL}/insights`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};