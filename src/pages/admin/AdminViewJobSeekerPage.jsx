// src/pages/admin/AdminViewJobSeekerPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { getUserById } from '../../api/adminService.js';
import { getApplicationsByApplicantId } from '../../api/jobService.js';
import { ArrowLeft, User as UserIcon, Mail, MapPin, Briefcase, AlertCircle, Loader2 } from 'lucide-react';
import ResumeLink from '../../components/ResumeLink.jsx';
const STATUS_CHIP = {
  pending: 'chip-warn',
  accepted: 'chip-ok',
  rejected: 'chip-bad',
};

const AdminViewJobSeekerPage = () => {
  const { userId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [jobSeeker, setJobSeeker] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [jobSeekerData, jobSeekerApplications] = await Promise.all([
          getUserById(userId),
          getApplicationsByApplicantId(userId),
        ]);
        setJobSeeker(jobSeekerData);
        setApplications(jobSeekerApplications);
      } catch (err) {
        setError('Failed to load this job seeker\'s data. Please try again later.');
        console.error('Error fetching job seeker view data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(String(dateString).replace(' ', 'T'));
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 w-[64rem] h-[64rem] rounded-full bg-violet opacity-15 blur-[120px]" />
        <div className="absolute -right-32 top-10 w-[48rem] h-[48rem] rounded-full bg-amber opacity-[0.06] blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-grow py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center text-sm text-violet-soft hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to dashboard
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="animate-spin h-12 w-12 text-violet-soft" />
            </div>
          ) : error ? (
            <div className="mb-6 rounded-lg border border-magenta/40 bg-magenta/10 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-[#FF6BB0] mr-2 flex-shrink-0" />
                <span className="text-[#FFD9EA] text-sm">{error}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="glass-panel p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-display font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FFBE0B, #FF8A00)' }}
                  >
                    {jobSeeker?.name ? jobSeeker.name.trim()[0].toUpperCase() : <UserIcon className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-display font-bold text-ink truncate">{jobSeeker?.name}</h1>
                    <div className="flex items-center text-sm text-muted mt-1">
                      <Mail className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{jobSeeker?.email}</span>
                    </div>
                  </div>
                  <span className="chip-warn ml-auto whitespace-nowrap">jobSeeker</span>
                </div>
              </div>

              <div className="glass-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-base font-display font-semibold text-ink">Applications</h2>
                  <span className="text-sm text-muted">
                    {applications.length} {applications.length === 1 ? 'application' : 'applications'}
                  </span>
                </div>

                {applications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Briefcase className="mx-auto h-10 w-10 text-muted" />
                    <p className="mt-3 text-muted">This job seeker hasn't applied to any jobs yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Job</th>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Applied On</th>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Resume</th>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {applications.map((application) => (
                          <tr key={application.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-ink">{application.job?.title || 'N/A'}</div>
                              <div className="flex items-center text-xs text-muted mt-0.5">
                                <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                {application.job?.location || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{formatDate(application.createdAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ResumeLink application={application} label="View" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={STATUS_CHIP[application.status] || 'chip-warn'}>
                                {application.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminViewJobSeekerPage;
