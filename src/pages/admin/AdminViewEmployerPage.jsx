// src/pages/admin/AdminViewEmployerPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { getUserById, getEmployerJobsAsAdmin } from '../../api/adminService.js';
import { ArrowLeft, Building, Mail, MapPin, Briefcase, Users, AlertCircle, Loader2 } from 'lucide-react';

const AdminViewEmployerPage = () => {
  const { userId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
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
        const [employerData, employerJobs] = await Promise.all([
          getUserById(userId),
          getEmployerJobsAsAdmin(userId),
        ]);
        setEmployer(employerData);
        setJobs(employerJobs);
      } catch (err) {
        setError('Failed to load this employer\'s data. Please try again later.');
        console.error('Error fetching employer view data:', err);
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
                    style={{ background: 'linear-gradient(135deg, #00C48C, #00F5D4)' }}
                  >
                    {employer?.name ? employer.name.trim()[0].toUpperCase() : <Building className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-display font-bold text-ink truncate">{employer?.name}</h1>
                    <div className="flex items-center text-sm text-muted mt-1">
                      <Mail className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{employer?.email}</span>
                    </div>
                  </div>
                  <span className="chip-ok ml-auto whitespace-nowrap">employer</span>
                </div>
              </div>

              <div className="glass-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-base font-display font-semibold text-ink">Posted Jobs</h2>
                  <span className="text-sm text-muted">{jobs.length} {jobs.length === 1 ? 'listing' : 'listings'}</span>
                </div>

                {jobs.length === 0 ? (
                  <div className="p-8 text-center">
                    <Briefcase className="mx-auto h-10 w-10 text-muted" />
                    <p className="mt-3 text-muted">This employer hasn't posted any jobs yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Job</th>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Posted</th>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Applicants</th>
                          <th className="px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">{job.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              <span className="inline-flex items-center">
                                <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                {job.location}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{formatDate(job.datePosted)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center text-violet-soft">
                                <Users className="h-3.5 w-3.5 mr-1.5" />
                                {job.applicantCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link to={`/jobs/${job.id}`} target="_blank" className="text-violet-soft hover:text-ink transition-colors">
                                View listing
                              </Link>
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

export default AdminViewEmployerPage;
