// src/api/statsService.js
import axios from 'axios';

// Uses VITE_BACKEND_URL when set (needed once deployed), otherwise local dev —
// same convention as NotificationContext.jsx's socket connection.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Public platform totals: { activeJobs, companies, jobSeekers, hires }
export const getPublicStats = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/stats`);
  return response.data;
};
