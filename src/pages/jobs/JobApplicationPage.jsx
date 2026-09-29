import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { getJobById, applyForJob, uploadResume, getApplicationsByApplicantId } from '../../api/jobService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link as LinkIcon, Upload, AlertCircle, ArrowLeft, CheckCircle2, FileCheck } from 'lucide-react';

const STATUS_LABEL = {
  pending: 'Pending review',
  accepted: 'Accepted',
  rejected: 'Not selected',
};

const JobApplicationPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [resumeLink, setResumeLink] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Guards against reaching this page (direct URL, back button, stale tab)
  // for a job already applied to. null = still checking, then either false
  // or the existing application's status string.
  const [existingApplicationStatus, setExistingApplicationStatus] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Check if user is authenticated and is a job seeker
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'jobSeeker') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;

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

  // Block the form entirely if this job seeker already applied to this job.
  // Without this, someone reaching this URL directly (bookmark, back button,
  // stale tab) instead of via the Detail page's "Already Applied" panel
  // could still submit and hit the backend's duplicate-application 400.
  useEffect(() => {
    if (!user?.id || !jobId) {
      setCheckingExisting(false);
      return;
    }

    let cancelled = false;
    setCheckingExisting(true);

    getApplicationsByApplicantId(user.id)
      .then((applications) => {
        if (cancelled) return;
        const match = applications.find((app) => String(app.jobId) === String(jobId));
        setExistingApplicationStatus(match ? match.status || 'pending' : null);
      })
      .catch((err) => {
        console.error('JobApplicationPage: failed to check existing applications:', err);
      })
      .finally(() => {
        if (!cancelled) setCheckingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, jobId]);

  // Handle file upload — actually uploads the PDF to the backend now,
  // rather than faking a delay and making up an example.com URL.
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const { resumeLink: uploadedUrl } = await uploadResume(file);
      setResumeLink(uploadedUrl);
      setUploadedFileName(file.name);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload resume. Please try again.';
      setUploadError(message);
      console.error('Error uploading resume:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobId || !user) return;

    if (!resumeLink) {
      setError('Please provide a resume link or upload a resume file');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await applyForJob(jobId, user.id, resumeLink, coverLetter);
      setSuccess(true);

      setTimeout(() => {
        navigate('/jobseeker/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please try again later.');
      console.error('Error applying for job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 w-[64rem] h-[64rem] rounded-full bg-violet opacity-15 blur-[120px]" />
        <div className="absolute -right-32 top-10 w-[48rem] h-[48rem] rounded-full bg-emerald opacity-[0.06] blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-grow py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              to={`/jobs/${jobId}`}
              className="inline-flex items-center text-sm text-violet-soft hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to job details
            </Link>
          </div>

          {isLoading || checkingExisting ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-soft" />
            </div>
          ) : success ? (
            <div className="glass-panel p-8 text-center border-emerald/30">
              <div className="w-14 h-14 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald" />
              </div>
              <h2 className="text-xl font-display font-semibold text-ink mb-2">Application Submitted!</h2>
              <p className="text-muted mb-4">
                Your application has been successfully submitted. We'll notify you when there's an update.
              </p>
              <p className="text-muted text-sm">Redirecting to your dashboard...</p>
            </div>
          ) : existingApplicationStatus ? (
            <div className="glass-panel p-8 text-center border-emerald-400/30">
              <div className="w-14 h-14 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-300" />
              </div>
              <h2 className="text-xl font-display font-semibold text-ink mb-2">You've already applied to this job</h2>
              <p className="text-muted mb-1">
                Status: <span className="font-medium text-ink">{STATUS_LABEL[existingApplicationStatus] || 'Pending review'}</span>
              </p>
              <p className="text-muted mb-6 text-sm">You can only submit one application per job.</p>
              <Link to="/jobseeker/dashboard" className="btn-glow px-6 py-3 text-sm inline-flex">
                View in My Applications
              </Link>
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
              <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-violet/10 to-magenta/10">
                <h1 className="text-xl font-display font-bold text-ink">Apply for {job.title}</h1>
                <p className="text-muted text-sm mt-0.5">
                  {job.companyName} — {job.location}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-display font-semibold text-ink mb-2">Resume / CV</h2>
                    <p className="text-muted text-sm mb-4">
                      Please provide your resume either by uploading a file or providing a link.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="resumeLink" className="block text-sm font-medium text-muted mb-1.5">
                          Resume link (Google Drive, Dropbox, etc.)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <LinkIcon className="h-4.5 w-4.5 text-muted" />
                          </div>
                          <input
                            type="url"
                            id="resumeLink"
                            className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-ink
                                       placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow"
                            placeholder="https://drive.google.com/your-resume"
                            value={resumeLink}
                            onChange={(e) => {
                              setResumeLink(e.target.value);
                              setUploadedFileName(null);
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink px-3 text-muted text-sm">or</span>
                        <div className="flex-grow border-t border-white/10"></div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">
                          Upload resume (PDF only)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-6 pb-6 rounded-lg border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-violet/40 transition-colors">
                          <div className="space-y-1 text-center">
                            {uploadedFileName && !isUploading ? (
                              <FileCheck className="mx-auto h-10 w-10 text-emerald" />
                            ) : (
                              <Upload className="mx-auto h-10 w-10 text-muted" />
                            )}
                            <div className="flex text-sm text-muted justify-center">
                              <label
                                htmlFor="resume-upload"
                                className="relative cursor-pointer font-medium text-violet-soft hover:text-ink transition-colors focus-within:outline-none"
                              >
                                <span>{uploadedFileName ? 'Replace file' : 'Upload a file'}</span>
                                <input
                                  id="resume-upload"
                                  name="resume-upload"
                                  type="file"
                                  className="sr-only"
                                  accept=".pdf"
                                  onChange={handleFileChange}
                                  disabled={isUploading}
                                />
                              </label>
                              {!uploadedFileName && <p className="pl-1">or drag and drop</p>}
                            </div>
                            {uploadedFileName ? (
                              <p className="text-xs text-emerald">{uploadedFileName} uploaded</p>
                            ) : (
                              <p className="text-xs text-muted/70">PDF up to 10MB</p>
                            )}
                            {isUploading && (
                              <div className="mt-2">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-violet-soft" />
                                </div>
                                <p className="text-xs text-muted mt-1">Uploading...</p>
                              </div>
                            )}
                            {uploadError && (
                              <p className="text-xs text-[#FF6BB0] mt-1 flex items-center justify-center gap-1">
                                <AlertCircle size={12} /> {uploadError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-display font-semibold text-ink mb-2">Additional Information</h2>
                    <div>
                      <label htmlFor="coverLetter" className="block text-sm font-medium text-muted mb-1.5">
                        Cover Letter (optional)
                      </label>
                      <textarea
                        id="coverLetter"
                        rows={4}
                        className="block w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-ink
                                   placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow"
                        placeholder="Tell us why you're a good fit for this position..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !resumeLink || isUploading}
                      className="btn-glow w-full justify-center py-3 text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </div>
              </form>
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

export default JobApplicationPage;