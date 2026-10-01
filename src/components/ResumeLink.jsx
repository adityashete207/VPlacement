import React, { useState } from 'react';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import { getResumeAccessUrl } from '../api/jobService.js';

const ResumeLink = ({ application, label = 'View' }) => {
  const [loading, setLoading] = useState(false);
  const className =
    'inline-flex items-center text-sm text-violet-soft hover:text-ink transition-colors disabled:opacity-50';

  // External links (Google Drive etc.) stay as normal links
  if (!application.resumeLink?.includes('/uploads/resumes/')) {
    return (
      <a href={application.resumeLink} target="_blank" rel="noopener noreferrer" className={className}>
        <FileText className="h-4 w-4 mr-1" />
        {label}
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    );
  }

  const handleClick = async () => {
    // Open the tab right away so the browser's popup blocker allows it
    const win = window.open('', '_blank');
    try {
      setLoading(true);
      const url = await getResumeAccessUrl(application.id);
      if (win) win.location.href = url;
    } catch (err) {
      if (win) win.close();
      alert(err.response?.data?.message || 'Could not open the resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
      {label}
      <ExternalLink className="h-3 w-3 ml-1" />
    </button>
  );
};

export default ResumeLink;