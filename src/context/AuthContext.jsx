import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as authLogin, register as authRegister, logout as authLogout, getCurrentUser } from '../api/authService.js';

// Create auth context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in.
  // authService only ever writes ONE localStorage key ('user'), with the
  // token nested inside that same object — there is no separate 'token'
  // key. Read it that way here too, or this check always fails on refresh
  // and silently logs everyone out.
  useEffect(() => {
    const storedUser = getCurrentUser(); // already does JSON.parse('user')

    if (storedUser && storedUser.token) {
      setUser(storedUser);
      setToken(storedUser.token);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authLogin(email, password);
      setUser(userData);
      setToken(userData.token); // was never being set before — anything
                                 // reading `token` from context mid-session
                                 // was always getting null
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password, role) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authRegister(name, email, password, role);
      setUser(userData);
      setToken(userData.token); // same fix as login()
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

    // Clear localStorage — authService only ever wrote 'user', so only
    // remove that (removing a 'token' key that never existed is harmless
    // but misleading to keep around).
    authLogout(); // localStorage.removeItem('user')
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};