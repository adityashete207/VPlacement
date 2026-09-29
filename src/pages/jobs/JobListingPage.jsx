// src/pages/jobs/JobListingPage.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import JobCard from '../../components/JobCard.jsx';
import SearchAndFilter from '../../components/SearchAndFilter.jsx';
import AIMatchPanel from '../../components/ai/AIMatchPanel.jsx';
import { getAllJobs, getApplicationsByApplicantId } from '../../api/jobService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Briefcase, AlertCircle } from 'lucide-react';

const JobListingPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  // Set of job IDs (as strings) this job seeker has already applied to, so
  // JobCard can show "Applied" instead of "Apply" without a per-card
  // network call.
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const allJobs = await getAllJobs();
        setJobs(allJobs);
        setFilteredJobs(allJobs);
      } catch (err) {
        setError('Failed to load jobs. Please try again later.');
        console.error('Error fetching jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Fetch which jobs this job seeker has already applied to, once, so every
  // card can show the correct Apply/Applied state immediately.
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'jobSeeker' || !user?.id) {
      setAppliedJobIds(new Set());
      return;
    }

    let cancelled = false;

    getApplicationsByApplicantId(user.id)
      .then((applications) => {
        if (cancelled) return;
        setAppliedJobIds(new Set(applications.map((app) => String(app.jobId))));
      })
      .catch((err) => {
        console.error('JobListingPage: failed to fetch applied jobs:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    let currentJobs = [...jobs];

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      currentJobs = currentJobs.filter(job =>
        job.title.toLowerCase().includes(lowerCaseQuery) ||
        job.description.toLowerCase().includes(lowerCaseQuery) ||
        job.companyName.toLowerCase().includes(lowerCaseQuery) ||
        job.location.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setFilteredJobs(currentJobs);
  }, [searchQuery, filters, jobs]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink relative overflow-hidden">
      {/* ambient background glow — purely decorative */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 w-[64rem] h-[64rem] rounded-full bg-violet opacity-20 blur-[120px]" />
        <div className="absolute -right-32 top-10 w-[48rem] h-[48rem] rounded-full bg-magenta opacity-10 blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-grow py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight bg-gradient-to-b from-white to-[#CDBBFF] bg-clip-text text-transparent">
              Find Your Dream Job
            </h1>
            <p className="mt-3 text-lg text-muted">
              Browse open roles, scored against your skills by the Matching Agent.
            </p>
          </div>

          <AIMatchPanel />

          <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} />

          {error && (
            <div className="mb-6 rounded-xl border border-magenta/40 bg-magenta/10 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-[#FF6BB0] mr-2 flex-shrink-0" />
                <span className="text-[#FFD9EA]">{error}</span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center my-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet" />
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  hasApplied={appliedJobIds.has(String(job.id))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/[0.03]">
              <Briefcase className="mx-auto h-12 w-12 text-muted" />
              <h3 className="mt-3 text-lg font-medium text-white">No jobs found</h3>
              <p className="mt-1 text-muted">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobListingPage;