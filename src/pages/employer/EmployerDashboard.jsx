import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import {
  getJobsByEmployerId,
  getApplicationsByJobId,
  updateApplicationStatus,
  deleteJob,
} from '../../api/jobService.js';
import AIScreeningPanel from '../../components/ai/AIScreeningPanel.jsx';
import {
  Briefcase,
  Users,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Clock,
  FileText,
  ExternalLink,
  User as UserIcon,
  Check,
  X as XIcon,
  RotateCcw,
} from 'lucide-react';

const STATUS_CHIP = {
  pending: 'chip-warn',
  accepted: 'chip-ok',
  rejected: 'chip-bad',
};

const EmployerDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deletingJobId, setDeletingJobId] = useState(null);

  // Check if user is authenticated and is an employer
  if (!isAuthenticated || user?.role !== 'employer') {
    return <Navigate to="/login" />;
  }

  // Load employer's jobs
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);
        const employerJobs = await getJobsByEmployerId(user.id);
        setJobs(employerJobs);

        if (employerJobs.length > 0) {
          setSelectedJob(employerJobs[0].id);
        }
      } catch (err) {
        setError('Failed to load your job listings. Please try again later.');
        console.error('Error fetching jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  // Load applications for the selected job
  useEffect(() => {
    const fetchApplications = async () => {
      if (!selectedJob) return;
      if (applications[selectedJob]) return;

      try {
        const jobApplications = await getApplicationsByJobId(selectedJob);
        setApplications((prev) => ({
          ...prev,
          [selectedJob]: jobApplications,
        }));
      } catch (err) {
        console.error('Error fetching applications:', err);
      }
    };

    fetchApplications();
  }, [selectedJob, applications]);

  // Delete a job for real: hits the backend (which also removes the job's
  // applications), then updates the screen only once that succeeds.
  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        'Delete this job? All applications submitted to it will be deleted too. This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setDeletingJobId(jobId);
      setError(null);
      await deleteJob(jobId);

      const remainingJobs = jobs.filter((job) => job.id !== jobId);
      setJobs(remainingJobs);
      setApplications((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });

      if (selectedJob === jobId) {
        setSelectedJob(remainingJobs.length > 0 ? remainingJobs[0].id : null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete the job. Please try again.');
      console.error('Error deleting job:', err);
    } finally {
      setDeletingJobId(null);
    }
  };

  // Update an application's status and reflect it in local state immediately
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setStatusUpdatingId(applicationId);
      await updateApplicationStatus(applicationId, newStatus);
      setApplications((prev) => ({
        ...prev,
        [selectedJob]: prev[selectedJob].map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        ),
      }));
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update application status. Please try again.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
              <h1 className="text-2xl font-display font-bold text-ink">Employer Dashboard</h1>
              <p className="mt-1 text-muted">Manage your job postings and view applications</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link to="/employer/post-job" className="btn-glow px-4 py-2 text-sm">
                <Briefcase className="h-4 w-4" />
                Post a New Job
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
          ) : jobs.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted" />
              <h3 className="mt-3 text-lg font-display font-medium text-ink">No jobs posted yet</h3>
              <p className="mt-1 text-muted">Get started by posting your first job listing</p>
              <div className="mt-6">
                <Link to="/employer/post-job" className="btn-glow px-4 py-2 text-sm">
                  Post a Job
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Job Listings */}
              <div className="lg:col-span-1">
                <div className="glass-panel overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10">
                    <h3 className="text-base font-display font-semibold text-ink">Your Job Postings</h3>
                    <p className="mt-1 text-sm text-muted">
                      {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} posted
                    </p>
                  </div>
                  <ul className="divide-y divide-white/5">
                    {jobs.map((job) => (
                      <li key={job.id}>
                        <button
                          onClick={() => setSelectedJob(job.id)}
                          className={`block w-full transition-colors ${
                            selectedJob === job.id ? 'bg-violet/10' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="px-5 py-4 text-left">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`text-sm font-medium truncate ${
                                  selectedJob === job.id ? 'text-violet-soft' : 'text-ink'
                                }`}
                              >
                                {job.title}
                              </p>
                              <span className="chip-ok whitespace-nowrap flex-shrink-0">{job.jobType}</span>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between gap-2">
                              <p className="flex items-center text-xs text-muted">
                                <Clock className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                                Posted {formatDate(job.datePosted)}
                              </p>
                              <div className="mt-1.5 sm:mt-0 flex items-center text-xs text-muted">
                                <Users className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                                {applications[job.id]?.length || 0} applicants
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Job Details and Applications */}
              <div className="lg:col-span-2">
                {selectedJob ? (
                  <div className="glass-panel overflow-hidden">
                    {jobs.map(
                      (job) =>
                        job.id === selectedJob && (
                          <div key={job.id}>
                            <div className="px-5 py-4 border-b border-white/10">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <h3 className="text-base font-display font-semibold text-ink">{job.title}</h3>
                                  <p className="mt-1 text-sm text-muted">
                                    {job.companyName} — {job.location}
                                  </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <Link
                                    to={`/employer/edit-job/${job.id}`}
                                    title="Edit job"
                                    className="inline-flex items-center p-2 rounded-lg border border-white/10 bg-white/5 text-muted hover:text-ink hover:border-white/20 transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteJob(job.id)}
                                    disabled={deletingJobId === job.id}
                                    title="Delete job"
                                    className="inline-flex items-center p-2 rounded-lg border border-magenta/30 bg-magenta/5 text-[#FF6BB0] hover:bg-magenta/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  <Link
                                    to={`/jobs/${job.id}`}
                                    title="View public listing"
                                    className="inline-flex items-center p-2 rounded-lg border border-white/10 bg-white/5 text-muted hover:text-ink hover:border-white/20 transition-colors"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </div>
                              </div>
                            </div>

                            <div className="px-5 py-5">
                              <h3 className="text-base font-display font-semibold text-ink mb-3">Job Details</h3>
                              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                <div>
                                  <dt className="text-xs font-tag text-muted uppercase tracking-wide">Job Type</dt>
                                  <dd className="mt-1 text-sm text-ink">{job.jobType}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-tag text-muted uppercase tracking-wide">Salary</dt>
                                  <dd className="mt-1 text-sm text-ink">{job.salary}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-tag text-muted uppercase tracking-wide">Location</dt>
                                  <dd className="mt-1 text-sm text-ink">{job.location}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-tag text-muted uppercase tracking-wide">Date Posted</dt>
                                  <dd className="mt-1 text-sm text-ink">{formatDate(job.datePosted)}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                  <dt className="text-xs font-tag text-muted uppercase tracking-wide">Description</dt>
                                  <dd className="mt-1 text-sm text-muted whitespace-pre-line">{job.description}</dd>
                                </div>
                              </dl>
                            </div>

                            <div className="px-5 py-5 border-t border-white/10">
                              <h3 className="text-base font-display font-semibold text-ink mb-3">Applications</h3>

                              {applications[job.id]?.length ? (
                                <div className="overflow-x-auto rounded-lg border border-white/10">
                                  <table className="min-w-full divide-y divide-white/10">
                                    <thead>
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                                          Applicant
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                                          Date Applied
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                                          Resume
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {applications[job.id]?.map((application) => (
                                        <tr key={application.id} className="hover:bg-white/[0.03] transition-colors">
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                <UserIcon className="h-5 w-5 text-muted" />
                                              </div>
                                              <div className="ml-3">
                                                <div className="text-sm font-medium text-ink">
                                                  {application.applicant?.name || 'Unknown applicant'}
                                                </div>
                                                <div className="text-xs text-muted">
                                                  {application.applicant?.email || '—'}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-muted">
                                            {formatDate(application.createdAt)}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <a
                                              href={application.resumeLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center text-sm text-violet-soft hover:text-ink transition-colors"
                                            >
                                              <FileText className="h-4 w-4 mr-1" />
                                              View Resume
                                              <ExternalLink className="h-3 w-3 ml-1" />
                                            </a>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                              <span className={STATUS_CHIP[application.status] || 'chip-warn'}>
                                                {application.status || 'pending'}
                                              </span>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  title="Accept"
                                                  disabled={statusUpdatingId === application.id || application.status === 'accepted'}
                                                  onClick={() => handleStatusChange(application.id, 'accepted')}
                                                  className="p-1.5 rounded-md border border-emerald/30 text-emerald hover:bg-emerald/10 disabled:opacity-30 transition-colors"
                                                >
                                                  <Check className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                  title="Reject"
                                                  disabled={statusUpdatingId === application.id || application.status === 'rejected'}
                                                  onClick={() => handleStatusChange(application.id, 'rejected')}
                                                  className="p-1.5 rounded-md border border-magenta/30 text-[#FF6BB0] hover:bg-magenta/10 disabled:opacity-30 transition-colors"
                                                >
                                                  <XIcon className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                  title="Reset to pending"
                                                  disabled={statusUpdatingId === application.id || application.status === 'pending'}
                                                  onClick={() => handleStatusChange(application.id, 'pending')}
                                                  className="p-1.5 rounded-md border border-white/10 text-muted hover:text-ink hover:bg-white/5 disabled:opacity-30 transition-colors"
                                                >
                                                  <RotateCcw className="h-3.5 w-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-8 rounded-lg border border-white/10 bg-white/[0.02]">
                                  <Users className="mx-auto h-10 w-10 text-muted" />
                                  <h3 className="mt-2 text-sm font-medium text-ink">No applications yet</h3>
                                  <p className="mt-1 text-sm text-muted">
                                    You'll see applications here once job seekers apply
                                  </p>
                                </div>
                              )}

                              {applications[job.id]?.length > 0 && <AIScreeningPanel jobId={job.id} />}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                ) : (
                  <div className="glass-panel p-8 text-center">
                    <h3 className="text-lg font-display font-medium text-ink">No job selected</h3>
                    <p className="mt-1 text-muted">Select a job from the list to view details and applications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmployerDashboard;
