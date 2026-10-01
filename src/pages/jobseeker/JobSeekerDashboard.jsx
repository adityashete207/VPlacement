// src/pages/jobseeker/JobSeekerDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import ResumeLink from '../../components/ResumeLink.jsx';
import { getApplicationsByApplicantId } from '../../api/jobService.js';
import {
  Briefcase,
  FileText,
  AlertCircle,
  ExternalLink,
  Calendar,
  MapPin,
} from 'lucide-react';

const STATUS_CHIP = {
  pending: 'chip-warn',
  accepted: 'chip-ok',
  rejected: 'chip-bad',
};

const JobSeekerDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated and is a job seeker
  if (!isAuthenticated || user?.role !== 'jobSeeker') {
    return <Navigate to="/login" />;
  }

  // Load job seeker's applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user || !user.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const userApplications = await getApplicationsByApplicantId(user.id);
        setApplications(userApplications);
      } catch (err) {
        setError('Failed to load your applications. Please try again later.');
        console.error('Error fetching applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
      console.error('formatDate: Invalid date string received:', dateString);
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 w-[64rem] h-[64rem] rounded-full bg-violet opacity-15 blur-[120px]" />
        <div className="absolute -right-32 top-10 w-[48rem] h-[48rem] rounded-full bg-magenta opacity-10 blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-display font-bold text-ink">My Applications</h1>
              <p className="mt-1 text-muted">Track and manage your job applications</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link to="/jobs" className="btn-glow px-4 py-2 text-sm">
                <Briefcase className="h-4 w-4" />
                Browse Jobs
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-magenta/40 bg-magenta/10 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-[#FF6BB0] mr-2 flex-shrink-0" />
                <span className="text-[#FFD9EA] text-sm">{error}</span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-soft" />
            </div>
          ) : applications.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted" />
              <h3 className="mt-3 text-lg font-display font-medium text-ink">No applications yet</h3>
              <p className="mt-1 text-muted">
                You haven't applied to any jobs yet. Start browsing jobs to find opportunities.
              </p>
              <div className="mt-6">
                <Link to="/jobs" className="btn-glow px-4 py-2 text-sm">
                  Browse Jobs
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-base font-display font-semibold text-ink">Your Job Applications</h3>
                <p className="mt-1 text-sm text-muted">
                  {applications.length} {applications.length === 1 ? 'application' : 'applications'} submitted
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                        Applied On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                        Resume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {applications.map((application) => (
                      <tr key={application.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-ink">{application.job?.title || 'N/A'}</div>
                          <div className="flex items-center text-xs text-muted mt-0.5">
                            <MapPin className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                            {application.job?.location || 'Location N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                          {application.job?.companyName || 'Company N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-muted">
                            <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                            {formatDate(application.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ResumeLink application={application} label="View" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={STATUS_CHIP[application.status] || 'chip-warn'}>
                            {application.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            to={`/jobs/${application.jobId}`}
                            className="text-violet-soft hover:text-ink transition-colors"
                          >
                            View Job
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobSeekerDashboard;
