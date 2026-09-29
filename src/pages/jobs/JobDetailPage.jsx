// src/pages/jobs/JobDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { getJobById, getApplicationsByApplicantId } from '../../api/jobService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  MapPin,
  Clock,
  IndianRupee,
  Building,
  Calendar,
  Share2,
  Bookmark,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// Existing listings may still hold old-format salary text; new listings are
// saved as "₹X LPA (CTC)" by PostJobPage. Swap the symbol for consistency
// rather than guessing at a conversion for old free-text values.
const formatSalary = (salary) => {
  if (!salary) return 'Competitive';
  return String(salary).replace(/\$/g, '₹');
};

const STATUS_LABEL = {
  pending: 'Pending review',
  accepted: 'Accepted',
  rejected: 'Not selected',
};

const JobDetailPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tracks whether the logged-in job seeker has already applied to THIS job.
  // null = not applicable / not checked yet, otherwise the application's
  // status string ('pending' | 'accepted' | 'rejected').
  const [existingApplicationStatus, setExistingApplicationStatus] = useState(null);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setError('Job ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const jobData = await getJobById(jobId);
        setJob(jobData);
      } catch (err) {
        setError('Failed to load job details. Please try again later.');
        console.error('Error fetching job:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // Check whether this job seeker has already applied to this job, so we
  // can swap the Apply button for a status indicator instead of letting
  // them hit the same "already applied" 400 error on submit.
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'jobSeeker' || !user?.id || !jobId) {
      setExistingApplicationStatus(null);
      return;
    }

    let cancelled = false;

    getApplicationsByApplicantId(user.id)
      .then((applications) => {
        if (cancelled) return;
        const match = applications.find((app) => String(app.jobId) === String(jobId));
        setExistingApplicationStatus(match ? match.status || 'pending' : null);
      })
      .catch((err) => {
        console.error('JobDetailPage: failed to check existing applications:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, jobId]);

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role === 'employer') {
      setError('Employers cannot apply for jobs.');
      return;
    }

    navigate(`/jobs/${jobId}/apply`);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }

    // MySQL DATETIME strings ("YYYY-MM-DD HH:MM:SS") parse more reliably as
    // ISO 8601 with the space replaced by 'T'.
    const parsedDate = new Date(dateString.replace(' ', 'T'));

    if (isNaN(parsedDate.getTime())) {
      console.error('formatDate: Invalid date string received:', dateString);
      return 'Invalid Date';
    }

    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-soft" />
            </div>
          ) : error ? (
            <div className="mb-6 rounded-lg border border-magenta/40 bg-magenta/10 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-[#FF6BB0] mr-2 flex-shrink-0" />
                <span className="text-[#FFD9EA] text-sm">{error}</span>
              </div>
            </div>
          ) : job ? (
            <div className="glass-panel overflow-hidden">
              <div className="p-6 sm:p-8">
                {/* Job Title and Action Buttons */}
                <div className="md:flex md:justify-between md:items-center">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">{job.title}</h1>
                    <div className="mt-2 flex items-center text-muted">
                      <Building className="h-5 w-5 mr-2 text-violet-soft" />
                      <span className="font-medium">{job.companyName}</span>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex gap-2">
                    <button className="btn-ghost text-xs px-3 py-1.5">
                      <Bookmark className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button className="btn-ghost text-xs px-3 py-1.5">
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                  </div>
                </div>

                {/* Job Info Grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center text-muted text-sm">
                    <MapPin className="h-4.5 w-4.5 mr-2 text-violet-soft flex-shrink-0" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-muted text-sm">
                    <Clock className="h-4.5 w-4.5 mr-2 text-violet-soft flex-shrink-0" />
                    <span>{job.jobType}</span>
                  </div>
                  <div className="flex items-center text-muted text-sm">
                    <IndianRupee className="h-4.5 w-4.5 mr-2 text-violet-soft flex-shrink-0" />
                    <span>{job.salary || 'Not disclosed'}</span>
                  </div>
                  <div className="flex items-center text-muted text-sm">
                    <Calendar className="h-4.5 w-4.5 mr-2 text-violet-soft flex-shrink-0" />
                    <span>Posted {formatDate(job.datePosted)}</span>
                  </div>
                </div>

                {/* Job Description */}
                <div className="mt-8">
                  <h2 className="text-lg font-display font-semibold text-ink mb-3">Job Description</h2>
                  <p className="whitespace-pre-line text-sm text-muted leading-relaxed">{job.description}</p>
                </div>

                {/* Qualifications */}
                <div className="mt-8">
                  <h2 className="text-lg font-display font-semibold text-ink mb-3">Qualifications</h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted">
                    <li>Bachelor's degree in relevant field</li>
                    <li>2+ years of experience in similar role</li>
                    <li>Strong communication and teamwork skills</li>
                    <li>Problem-solving abilities and attention to detail</li>
                  </ul>
                </div>

                {/* Benefits */}
                <div className="mt-8">
                  <h2 className="text-lg font-display font-semibold text-ink mb-3">Benefits</h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted">
                    <li>Competitive salary and bonus structure</li>
                    <li>Health, dental, and vision insurance</li>
                    <li>401(k) with company match</li>
                    <li>Professional development opportunities</li>
                    <li>Flexible work arrangements</li>
                  </ul>
                </div>

                {/* Apply for Job CTA — replaced with a status indicator if already applied */}
                {user?.role === 'jobSeeker' && existingApplicationStatus ? (
                  <div className="mt-8 flex flex-col sm:flex-row justify-between items-center rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-6 gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <CheckCircle2 className="h-6 w-6 text-emerald-300 flex-shrink-0" />
                      <div>
                        <h3 className="text-base font-display font-semibold text-ink">
                          You've already applied to this job
                        </h3>
                        <p className="text-sm text-muted">
                          Status: <span className="font-medium text-ink">{STATUS_LABEL[existingApplicationStatus] || 'Pending review'}</span>
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/jobseeker/dashboard"
                      className="btn-ghost w-full sm:w-auto justify-center px-6 py-3 text-sm"
                    >
                      View in My Applications
                    </Link>
                  </div>
                ) : (
                  <div className="mt-8 flex flex-col sm:flex-row justify-between items-center rounded-xl border border-white/10 bg-white/[0.03] p-6 gap-4">
                    <div className="text-center sm:text-left">
                      <h3 className="text-base font-display font-semibold text-ink">Interested in this job?</h3>
                      <p className="text-sm text-muted">Apply now and we'll get back to you soon</p>
                    </div>
                    <button
                      onClick={handleApply}
                      className="btn-glow w-full sm:w-auto justify-center px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isAuthenticated || user?.role === 'employer'}
                    >
                      Apply for this job
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/[0.03]">
              <h3 className="text-lg font-display font-medium text-ink">Job not found</h3>
              <p className="mt-1 text-muted">The job listing you're looking for doesn't exist or has been removed.</p>
              <div className="mt-6">
                <Link to="/jobs" className="text-violet-soft hover:text-ink font-medium transition-colors">
                  Browse all jobs
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobDetailPage;
