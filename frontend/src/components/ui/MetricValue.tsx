import React from 'react';
import { formatMetric } from '@kimovolt/simulation';

interface MetricValueProps {
  value: number | null | undefined;
  unit: 'V' | 'A' | 'Ω' | 'W' | 'Hz' | 's';
  label?: string;
  className?: string;
}

export const MetricValue: React.FC<MetricValueProps> = ({ value, unit, label, className = '' }) => {
  const fmt = formatMetric(value, unit);
  return (
    <span className={`kv-metric ${className}`}>
      {label && <span style={{ color: 'var(--muted)', fontSize: '0.8em', marginInlineEnd: '0.2rem' }}>{label}</span>}
      <span className="kv-metric-val">{fmt.valueText}</span>
      <span className="kv-metric-unit">{fmt.unitText}</span>
    </span>
  );
};
