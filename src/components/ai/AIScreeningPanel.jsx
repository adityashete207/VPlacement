import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { getAiScreening } from '../../api/aiService.js';
import MatchScoreBadge from './MatchScoreBadge.jsx';

const AIScreeningPanel = ({ jobId }) => {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScreen = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAiScreening(jobId);
      setResults(data);
    } catch (err) {
      setError('AI screening failed. Please try again.');
      console.error('AI screening error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel mt-6 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-soft" size={18} />
          <h3 className="text-sm font-display font-semibold text-ink">AI Candidate Screening</h3>
        </div>
        <button onClick={handleScreen} disabled={isLoading} className="btn-glow text-xs px-3 py-1.5">
          {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
          {isLoading ? 'Ranking...' : 'Rank Candidates with AI'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[#FF6BB0] text-sm mb-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {results &&
        (results.length === 0 ? (
          <p className="text-sm text-muted">No applicants to screen yet.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {results
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((r) => (
                <li
                  key={r.applicationId}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex gap-3"
                >
                  <MatchScoreBadge score={r.score} size={40} />
                  <div className="min-w-0 flex-1">
                    <span className="font-display font-medium text-ink text-sm">{r.applicantName}</span>
                    <p className="text-xs text-emerald mt-1">
                      <strong className="font-tag">Strengths:</strong> {r.strengths}
                    </p>
                    <p className="text-xs text-amber">
                      <strong className="font-tag">Watch for:</strong> {r.concerns}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        ))}
    </div>
  );
};

export default AIScreeningPanel;