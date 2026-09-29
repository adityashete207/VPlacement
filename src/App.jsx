import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
// Pages
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import JobListingPage from './pages/jobs/JobListingPage.jsx';
import JobDetailPage from './pages/jobs/JobDetailPage.jsx';
import JobApplicationPage from './pages/jobs/JobApplicationPage.jsx';
import EmployerDashboard from './pages/employer/EmployerDashboard.jsx';
import PostJobPage from './pages/employer/PostJobPage.jsx';
import EditJobPage from './pages/employer/EditJobPage.jsx'; // NEW
import JobSeekerDashboard from './pages/jobseeker/JobSeekerDashboard.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminProfilePage from './pages/admin/AdminProfilePage.jsx'; // NEW
import AdminViewEmployerPage from './pages/admin/AdminViewEmployerPage.jsx'; // NEW — replaces placeholder
import AdminViewJobSeekerPage from './pages/admin/AdminViewJobSeekerPage.jsx'; // NEW — replaces placeholder

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CareerChatWidget from './components/ai/CareerChatWidget.jsx';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Router>
        <Routes>
          {/* Public Routes */}

          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} /> {/* Admin login */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jobs" element={<JobListingPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />

          {/* Job Seeker Routes */}
          <Route
            path="/jobs/:jobId/apply"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <JobApplicationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobseeker/dashboard"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <JobSeekerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Employer Routes */}
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/post-job"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <PostJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/edit-job/:jobId"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EditJobPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/view-jobseeker/:userId"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminViewJobSeekerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/view-employer/:userId"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminViewEmployerPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CareerChatWidget />
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
