import React from 'react';

// Renders a compact circular "telemetry gauge" for an AI score (0-100).
// Color tier follows the Ultraviolet Solar Matrix system: emerald (strong),
// violet-magenta (medium), amber (weak).
const MatchScoreBadge = ({ score, reason, size = 44 }) => {
  if (score === undefined || score === null) return null;

  const clamped = Math.max(0, Math.min(100, score));
  const tier = clamped >= 85 ? 'hi' : clamped >= 65 ? 'mid' : 'low';
  const stroke =
    tier === 'hi' ? '#00F5D4' : tier === 'mid' ? '#B57BFF' : '#FFBE0B';
  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="group relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
      title={reason || `${clamped}% match`}
    >
      <svg
        viewBox="0 0 44 44"
        width={size}
        height={size}
        className="-rotate-90"
        style={{ filter: `drop-shadow(0 0 6px ${stroke}66)` }}
      >
        <circle cx="22" cy="22" r={radius} className="gauge-track" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="gauge-value"
          strokeWidth="4"
          stroke={stroke}
          strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-display font-bold text-ink"
        style={{ fontSize: size * 0.32 }}
      >
        {clamped}
      </span>

      {reason && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2
                     rounded-lg border border-violet/30 bg-obsidian/95 px-3 py-2 text-xs text-muted
                     opacity-0 shadow-glow transition-opacity duration-150 group-hover:opacity-100"
        >
          {reason}
        </div>
      )}
    </div>
  );
};

export default MatchScoreBadge;