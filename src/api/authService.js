// src/api/authService.js
import axios from 'axios';

// Uses VITE_BACKEND_URL when set (needed once deployed), otherwise local dev —
// same convention as NotificationContext.jsx's socket connection.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api/auth`;

// Register user
export const register = async (name, email, password, role) => {
  const response = await axios.post(`${API_URL}/register`, {
    name,
    email,
    password,
    role,
  });
  // Store user data in localStorage (including token)
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Login user
export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password,
  });
  // Store user data in localStorage (including token)
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Logout user
export const logout = () => {
  localStorage.removeItem('user');
};

// Get current user from localStorage
export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};
