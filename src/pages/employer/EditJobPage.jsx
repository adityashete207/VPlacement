import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { getJobById, updateJob } from '../../api/jobService.js';
import AIJobDescriptionHelper from '../../components/ai/AIJobDescriptionHelper.jsx';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3.5 text-sm text-ink ' +
  'placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow';
const labelClass = 'block text-sm font-medium text-muted';

const JOB_TYPES = ['Full-time', 'Part-time', 'Remote'];

const EditJobPage = () => {
  const { jobId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [salary, setSalary] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Load the existing job and pre-fill the form. (All hooks stay above the
  // auth redirect below so hook order never changes between renders.)
  useEffect(() => {
    if (!user?.id || !jobId) return;

    let cancelled = false;

    const fetchJob = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const job = await getJobById(jobId);
        if (cancelled) return;

        // The backend enforces this too; checking here just gives a clear
        // message instead of a form that fails on save.
        if (Number(job.employerId) !== Number(user.id)) {
          setLoadError('You can only edit your own job postings.');
          return;
        }

        setTitle(job.title || '');
        setDescription(job.description || '');
        setLocation(job.location || '');
        setJobType(job.jobType || 'Full-time');
        setSalary(job.salary || '');
        setCompanyName(job.companyName || '');
      } catch (err) {
        if (cancelled) return;
        setLoadError('Failed to load this job. It may have been deleted.');
        console.error('Error fetching job for edit:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchJob();

    return () => {
      cancelled = true;
    };
  }, [jobId, user]);

  // Check if user is authenticated and is an employer
  if (!isAuthenticated || user?.role !== 'employer') {
    return <Navigate to="/login" />;
  }

  // If this job has an older job type that isn't one of the standard options,
  // keep it selectable so saving doesn't silently change it.
  const jobTypeOptions = JOB_TYPES.includes(jobType) || !jobType ? JOB_TYPES : [jobType, ...JOB_TYPES];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !location || !jobType || !salary || !companyName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await updateJob(jobId, {
        title,
        description,
        location,
        jobType,
        salary,
        companyName,
      });

      navigate('/employer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job. Please try again later.');
      console.error('Error updating job:', err);
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
              to="/employer/dashboard"
              className="inline-flex items-center text-sm text-violet-soft hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to dashboard
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-soft" />
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-magenta/40 bg-magenta/10 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-[#FF6BB0] mr-2 flex-shrink-0" />
                <span className="text-[#FFD9EA] text-sm">{loadError}</span>
              </div>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="px-5 py-5 border-b border-white/10">
                <h1 className="text-xl font-display font-bold text-ink">Edit Job</h1>
                <p className="mt-1 text-sm text-muted">Update the details below and save your changes</p>
              </div>

              {error && (
                <div className="m-5 rounded-lg border border-magenta/40 bg-magenta/10 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-[#FF6BB0] mr-2 flex-shrink-0" />
                    <span className="text-[#FFD9EA] text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="px-5 pt-5">
                <AIJobDescriptionHelper
                  onGenerated={(result) => {
                    if (result.title) setTitle(result.title);
                    if (result.description) setDescription(result.description);
                    if (result.suggestedSalaryRange) setSalary(result.suggestedSalaryRange);
                  }}
                />
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-5">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label htmlFor="title" className={labelClass}>
                      Job Title*
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClass}
                      placeholder="e.g., Frontend Developer"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="companyName" className={labelClass}>
                      Company Name*
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={inputClass}
                      placeholder="e.g., Tech Company Inc."
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className={labelClass}>
                      Location*
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={inputClass}
                      placeholder="e.g., San Francisco, CA or Remote"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="jobType" className={labelClass}>
                      Job Type*
                    </label>
                    <select
                      id="jobType"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className={inputClass}
                      required
                    >
                      {jobTypeOptions.map((option) => (
                        <option key={option} className="bg-obsidian" value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="salary" className={labelClass}>
                      CTC (LPA)*
                    </label>
                    <input
                      type="text"
                      id="salary"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className={inputClass}
                      placeholder="e.g., 6 LPA CTC"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className={labelClass}>
                      Job Description*
                    </label>
                    <textarea
                      id="description"
                      rows={8}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={inputClass}
                      placeholder="Describe the job responsibilities, requirements, benefits, etc."
                      required
                    ></textarea>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Link
                      to="/employer/dashboard"
                      className="btn-ghost flex-1 justify-center py-2.5 text-sm"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-glow flex-[2] justify-center py-2.5 text-sm"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditJobPage;
