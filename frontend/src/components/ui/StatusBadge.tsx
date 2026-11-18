import React from 'react';

export type BadgeTone = 'ok' | 'info' | 'warn' | 'err' | 'copper' | 'neutral';

interface StatusBadgeProps {
  tone: BadgeTone;
  label: string;
  shape?: 'circle' | 'square' | 'diamond' | 'triangle' | 'ring';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ tone, label, shape = 'circle' }) => {
  const toneClass =
    tone === 'ok'
      ? 'kv-badge-ok'
      : tone === 'info'
        ? 'kv-badge-info'
        : tone === 'warn'
          ? 'kv-badge-warn'
          : tone === 'err'
            ? 'kv-badge-err'
            : tone === 'copper'
              ? 'kv-badge-copper'
              : '';

  return (
    <span className={`kv-badge ${toneClass}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        {shape === 'circle' && <circle cx="5" cy="5" r="4" fill="currentColor" />}
        {shape === 'ring' && <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />}
        {shape === 'square' && <rect x="1.5" y="1.5" width="7" height="7" fill="currentColor" />}
        {shape === 'diamond' && <polygon points="5,0.5 9.5,5 5,9.5 0.5,5" fill="currentColor" />}
        {shape === 'triangle' && <polygon points="5,1 9.5,9 0.5,9" fill="currentColor" />}
      </svg>
      <span>{label}</span>
    </span>
  );
};
