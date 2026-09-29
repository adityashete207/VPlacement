import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { createJob } from '../../api/jobService.js';
import AIJobDescriptionHelper from '../../components/ai/AIJobDescriptionHelper.jsx';
import { AlertCircle } from 'lucide-react';

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3.5 text-sm text-ink ' +
  'placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow';
const labelClass = 'block text-sm font-medium text-muted';

const PostJobPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [salary, setSalary] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is authenticated and is an employer
  if (!isAuthenticated || user?.role !== 'employer') {
    return <Navigate to="/login" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !location || !jobType || !salary || !companyName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (!user) return;

      await createJob({
        title,
        description,
        location,
        jobType,
        salary,
        companyName,
        employerId: user.id,
      });

      navigate('/employer/dashboard');
    } catch (err) {
      setError('Failed to post job. Please try again later.');
      console.error('Error posting job:', err);
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
          <div className="glass-panel overflow-hidden">
            <div className="px-5 py-5 border-b border-white/10">
              <h1 className="text-xl font-display font-bold text-ink">Post a New Job</h1>
              <p className="mt-1 text-sm text-muted">Fill in the details below to create a new job listing</p>
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
                    <option className="bg-obsidian" value="Full-time">Full-time</option>
                    <option className="bg-obsidian" value="Part-time">Part-time</option>
                    <option className="bg-obsidian" value="Remote">Remote</option>
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-glow w-full justify-center py-2.5 text-sm"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Job'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostJobPage;
