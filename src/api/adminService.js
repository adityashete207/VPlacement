// src/api/adminService.js
import axios from 'axios';

// Uses VITE_BACKEND_URL when set (needed once deployed), otherwise local dev —
// same convention as NotificationContext.jsx's socket connection.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api/admin`;

// Helper function to get authorization headers from localStorage
// This assumes your AuthContext stores the user object with a 'token' property in localStorage.
const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user')); // Get user data from localStorage
  if (user && user.token) {
    return {
      Authorization: `Bearer ${user.token}`, // Attach the JWT token
    };
  }
  return {}; // Return empty object if no token
};

/**
 * Fetches all users from the backend (requires admin role).
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: getAuthHeaders(), // Include authentication header
    });
    return response.data; // Assuming your backend returns the list of users directly
  } catch (error) {
    console.error('Error fetching all users from backend:', error.response?.data || error.message);
    // Re-throw the error so the calling component can handle it (e.g., display a message)
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

/**
 * Fetches a single user's profile info by ID (requires admin role).
 * Used by the admin "View Employer" / "View Job Seeker" pages.
 * @param {string|number} userId
 * @returns {Promise<Object>} { id, name, email, role, created_at }
 */
export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId} from backend:`, error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch user';
  }
};

/**
 * Fetches all jobs from the backend (requires admin role).
 * @returns {Promise<Array>} A promise that resolves to an array of job objects.
 */
export const getAllJobs = async () => {
  try {
    const response = await axios.get(`${API_URL}/jobs`, {
      headers: getAuthHeaders(), // Include authentication header
    });
    return response.data; // Assuming your backend returns the list of jobs directly
  } catch (error) {
    console.error('Error fetching all jobs from backend:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch jobs';
  }
};

/**
 * Deletes a user on the backend (requires admin role).
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<Object>} A promise that resolves to a success message.
 */
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/users/${userId}`, {
      headers: getAuthHeaders(), // Include authentication header
    });
    return response.data; // e.g., { message: 'User deleted successfully' }
  } catch (error) {
    console.error(`Error deleting user ${userId} from backend:`, error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to delete user';
  }
};

/**
 * Deletes a job on the backend (requires admin role).
 * @param {string} jobId - The ID of the job to delete.
 * @returns {Promise<Object>} A promise that resolves to a success message.
 */
export const deleteJob = async (jobId) => {
  try {
    const response = await axios.delete(`${API_URL}/jobs/${jobId}`, {
      headers: getAuthHeaders(), // Include authentication header
    });
    return response.data; // e.g., { message: 'Job deleted successfully' }
  } catch (error) {
    console.error(`Error deleting job ${jobId} from backend:`, error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to delete job';
  }
};

/**
 * Fetches one employer's posted jobs, each annotated with its applicant
 * count, for the admin "View Employer" read-only dashboard.
 * @param {string|number} employerId
 * @returns {Promise<Array>}
 */
export const getEmployerJobsAsAdmin = async (employerId) => {
  try {
    const response = await axios.get(`${API_URL}/employers/${employerId}/jobs`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching jobs for employer ${employerId} as admin:`, error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch employer jobs';
  }
};
