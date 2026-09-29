import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateJobDescriptionAI } from '../../api/aiService.js';

const AIJobDescriptionHelper = ({ onGenerated }) => {
  const [keyPoints, setKeyPoints] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!keyPoints.trim()) {
      setError('Add a few key points first (e.g. role, must-have skills, team).');
      return;
    }
    try {
      setIsGenerating(true);
      setError(null);
      const result = await generateJobDescriptionAI({ keyPoints });
      onGenerated(result);
    } catch (err) {
      setError('AI generation failed. Please try again.');
      console.error('AI job description error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="text-violet-soft" size={18} />
        <h3 className="text-sm font-display font-semibold text-ink">AI Job Post Assistant</h3>
      </div>
      <p className="text-xs text-muted mb-3">
        Jot down rough notes (role, must-haves, team, perks) and let AI draft a job title and description
        for you. You can still edit everything below before posting.
      </p>
      <textarea
        rows={3}
        value={keyPoints}
        onChange={(e) => setKeyPoints(e.target.value)}
        placeholder="e.g. Frontend intern, React + Tailwind, remote-friendly, 3 month internship, mentorship included"
        className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-ink
                   placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-emerald/50"
      />
      {error && <p className="text-xs text-[#FF6BB0] mt-2">{error}</p>}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="btn-glow mt-3 text-xs px-3 py-2"
      >
        {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
        {isGenerating ? 'Generating...' : 'Generate with AI'}
      </button>
    </div>
  );
};

export default AIJobDescriptionHelper;