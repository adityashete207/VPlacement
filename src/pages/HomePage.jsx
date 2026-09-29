import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { getAllJobs } from '../api/jobService.js';
import { getPublicStats } from '../api/statsService.js';
import { Search, Building, FileCheck, MapPin, Sparkles } from 'lucide-react';

const HomePage = () => {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const allJobs = await getAllJobs();
        // Most recently posted, real jobs — no more hardcoded placeholders.
        setFeaturedJobs(allJobs.slice(0, 2));
      } catch (err) {
        console.error('Error fetching featured jobs:', err);
      }
    };

    const fetchStats = async () => {
      try {
        setStats(await getPublicStats());
      } catch (err) {
        console.error('Error fetching platform stats:', err);
      }
    };

    fetchJobs();
    fetchStats();
  }, []);

  // Real totals, or an em dash while loading / if the request failed.
  const statValue = (key) => (stats && stats[key] != null ? Number(stats[key]).toLocaleString('en-IN') : '—');

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink relative overflow-hidden">
      {/* ambient background glow — purely decorative */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 w-[64rem] h-[64rem] rounded-full bg-violet opacity-20 blur-[120px]" />
        <div className="absolute -right-32 top-10 w-[48rem] h-[48rem] rounded-full bg-magenta opacity-10 blur-[120px]" />
        <div className="absolute left-1/3 bottom-0 w-[40rem] h-[40rem] rounded-full bg-emerald opacity-[0.06] blur-[140px]" />
      </div>

      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="chip-violet mb-5">
                  <Sparkles size={12} className="mr-1.5" /> AI-powered matching, live
                </span>
                <h1
                  className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-[#CDBBFF] bg-clip-text text-transparent"
                >
                  Find Your Dream Job Today
                </h1>
                <p className="text-lg md:text-xl text-muted mb-8 max-w-xl">
                  Connect with top employers and discover opportunities that match your skills and
                  career goals — scored by our AI Matching Agent.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/jobs" className="btn-glow justify-center px-6 py-3 text-base">
                    Find Jobs
                  </Link>
                  <Link to="/employer/post-job" className="btn-ghost justify-center px-6 py-3 text-base">
                    Post a Job
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="glass-panel p-2 shadow-glow">
                  <img
                    src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                    alt="Job seekers"
                    className="rounded-xl w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section — all four numbers are live totals from GET /api/stats */}
        <section className="py-12 border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
              <div className="glass-panel p-6">
                <div className="text-3xl font-display font-bold text-violet-soft mb-1">{statValue('activeJobs')}</div>
                <div className="text-muted text-sm">Active Jobs</div>
              </div>
              <div className="glass-panel p-6">
                <div className="text-3xl font-display font-bold text-emerald mb-1">{statValue('companies')}</div>
                <div className="text-muted text-sm">Companies</div>
              </div>
              <div className="glass-panel p-6">
                <div className="text-3xl font-display font-bold text-[#FF6BB0] mb-1">{statValue('jobSeekers')}</div>
                <div className="text-muted text-sm">Job Seekers</div>
              </div>
              <div className="glass-panel p-6">
                <div className="text-3xl font-display font-bold text-amber mb-1">{statValue('hires')}</div>
                <div className="text-muted text-sm">Successful Hires</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-ink">How It Works</h2>
              <p className="mt-3 text-lg text-muted">Simplifying the job search and hiring process</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto bg-violet/10 border border-violet/30">
                  <Search className="h-6 w-6 text-violet-soft" />
                </div>
                <h3 className="text-lg font-display font-semibold text-center mb-2 text-ink">Search Jobs</h3>
                <p className="text-muted text-center text-sm">
                  Browse thousands of jobs across industries and locations to find the perfect match
                  for your skills.
                </p>
              </div>

              <div className="glass-panel p-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto bg-emerald/10 border border-emerald/30">
                  <FileCheck className="h-6 w-6 text-emerald" />
                </div>
                <h3 className="text-lg font-display font-semibold text-center mb-2 text-ink">Apply Easily</h3>
                <p className="text-muted text-center text-sm">
                  Submit your application with just a few clicks and track your application status
                  in real-time.
                </p>
              </div>

              <div className="glass-panel p-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto bg-magenta/10 border border-magenta/30">
                  <Building className="h-6 w-6 text-[#FF6BB0]" />
                </div>
                <h3 className="text-lg font-display font-semibold text-center mb-2 text-ink">Get Hired</h3>
                <p className="text-muted text-center text-sm">
                  Connect with employers, showcase your talents, and land your dream job opportunity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs Section — now pulled live from the jobs API instead
            of two hardcoded fake listings. */}
        <section className="py-16 md:py-20 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-ink">Featured Jobs</h2>
              <p className="mt-3 text-lg text-muted">Explore some of our top opportunities</p>
            </div>

            {featuredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {featuredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="glass-panel p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-glow"
                  >
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <h3 className="text-xl font-display font-semibold text-ink">{job.title}</h3>
                      <span className="chip-violet whitespace-nowrap">{job.jobType}</span>
                    </div>
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center text-muted text-sm">
                        <Building className="h-4 w-4 mr-2 text-violet-soft flex-shrink-0" />
                        <span>{job.companyName}</span>
                      </div>
                      <div className="flex items-center text-muted text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-violet-soft flex-shrink-0" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-violet-soft hover:text-ink font-medium text-sm transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted">No jobs posted yet — check back soon.</p>
            )}

            <div className="text-center mt-10">
              <Link to="/jobs" className="btn-glow px-6 py-3 text-base">
                View All Jobs
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 border-t border-white/10 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <h2 className="text-3xl font-display font-bold text-ink mb-4">
              Ready to Find Your Next Opportunity?
            </h2>
            <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers and employers who are already connecting on our platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="btn-glow justify-center px-6 py-3 text-base">
                Sign Up Now
              </Link>
              <Link to="/jobs" className="btn-ghost justify-center px-6 py-3 text-base">
                Browse Jobs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
