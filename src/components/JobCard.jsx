import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, IndianRupee, Building, CheckCircle2 } from 'lucide-react';
import MatchScoreBadge from './ai/MatchScoreBadge.jsx';

const JobCard = ({ job, showApplyButton = true, matchScore, matchReason, hasApplied = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="glass-panel p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-glow">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-display font-semibold text-ink">{job.title}</h3>
            <MatchScoreBadge score={matchScore} reason={matchReason} />
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center text-muted">
              <Building size={16} className="mr-2 text-violet-soft flex-shrink-0" />
              <span>{job.companyName}</span>
            </div>
            <div className="flex items-center text-muted">
              <MapPin size={16} className="mr-2 text-violet-soft flex-shrink-0" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center text-muted">
              <Clock size={16} className="mr-2 text-violet-soft flex-shrink-0" />
              <span>{job.jobType}</span>
            </div>
            <div className="flex items-center text-muted">
              <IndianRupee size={16} className="mr-2 text-violet-soft flex-shrink-0" />
              <span>{job.salary}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col sm:items-end justify-between gap-3">
          <span className="text-xs text-muted font-tag whitespace-nowrap">
            Posted {formatDate(job.datePosted)}
          </span>

          <div className="flex gap-2">
            <Link
              to={`/jobs/${job.id}`}
              className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition"
              style={{
                borderColor: 'rgba(157,78,221,.4)',
                background: 'rgba(157,78,221,.08)',
                color: '#D7BBFF',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(157,78,221,.7)';
                e.currentTarget.style.boxShadow = '0 0 14px rgba(157,78,221,.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(157,78,221,.4)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Details
            </Link>
            {showApplyButton && (
              hasApplied ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                  style={{
                    borderColor: 'rgba(0,245,212,.4)',
                    background: 'rgba(0,245,212,.1)',
                    color: '#00F5D4',
                    boxShadow: '0 0 12px rgba(0,245,212,.2)',
                  }}
                >
                  <CheckCircle2 size={13} />
                  Applied
                </span>
              ) : (
                <Link to={`/jobs/${job.id}/apply`} className="btn-glow text-xs px-3 py-1.5">
                  Apply
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted line-clamp-2">{job.description}</p>
    </div>
  );
};

export default JobCard;