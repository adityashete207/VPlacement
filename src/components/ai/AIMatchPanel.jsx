import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAiMatches } from '../../api/aiService.js';
import JobCard from '../JobCard.jsx';

const AIMatchPanel = () => {
  const { isAuthenticated, user } = useAuth();
  const [skills, setSkills] = useState('');
  const [matches, setMatches] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Only job seekers get AI matching — employers/admins browse jobs differently.
  if (!isAuthenticated || user?.role !== 'jobSeeker') return null;

  const handleFindMatches = async () => {
    if (!skills.trim()) {
      setError('Tell the AI a bit about your skills or interests first.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAiMatches({ skills, name: user.name });
      setMatches(data);
    } catch (err) {
      setError('Could not fetch AI matches right now. Please try again.');
      console.error('AI match error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel mb-8 p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 font-display font-semibold text-ink">
          <Sparkles size={18} className="text-violet-soft" />
          Get AI-Matched Job Recommendations
        </span>
        <ChevronDown
          size={18}
          className={`text-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="mt-4">
          <textarea
            rows={2}
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Final-year CS student, React & Node.js, interested in backend internships"
            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-ink
                       placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-emerald/50"
          />
          {error && (
            <p className="text-xs text-[#FF6BB0] mt-2 flex items-center gap-1">
              <AlertCircle size={12} /> {error}
            </p>
          )}
          <button
            onClick={handleFindMatches}
            disabled={isLoading}
            className="btn-glow mt-3 text-xs px-3 py-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
            {isLoading ? 'Matching...' : 'Find My Matches'}
          </button>

          {matches && (
            <div className="mt-5 space-y-4">
              {matches.length === 0 ? (
                <p className="text-sm text-muted">
                  No strong matches found right now — check back as new jobs are posted.
                </p>
              ) : (
                matches
                  .slice(0, 5)
                  .map((m) => (
                    <JobCard key={m.jobId} job={m.job} matchScore={m.score} matchReason={m.reason} />
                  ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIMatchPanel;