import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { getAdminInsights } from '../../api/aiService.js';

const AIInsightsPanel = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getAdminInsights();
      setData(result);
    } catch (err) {
      setError('Could not generate AI insights right now.');
      console.error('AI insights error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, []);

  return (
    <div className="glass-panel p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-soft" size={18} />
          <h3 className="text-base font-display font-semibold text-ink">AI Platform Insights</h3>
        </div>
        <button onClick={handleFetch} disabled={isLoading} className="btn-ghost text-xs px-3 py-1.5">
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isLoading && !data && (
        <div className="flex items-center gap-2 text-muted text-sm">
          <Loader2 className="animate-spin" size={14} /> Generating insights...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-[#FF6BB0] text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {data && (
        <ul className="space-y-2 text-sm text-ink">
          {(data.summary || []).map((point, i) => {
            const isRec = point.trim().toLowerCase().startsWith('recommendation:');
            return (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0"
                  style={{
                    background: isRec ? '#FFBE0B' : '#00F5D4',
                    boxShadow: `0 0 8px ${isRec ? '#FFBE0B' : '#00F5D4'}`,
                  }}
                />
                <span className={isRec ? 'text-amber' : 'text-muted'}>{point}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AIInsightsPanel;