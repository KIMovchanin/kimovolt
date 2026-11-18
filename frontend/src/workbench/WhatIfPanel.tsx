import React, { useState } from 'react';
import { formatMetric, type CircuitDocument, type SimulationResult } from '@kimovolt/simulation';
import { useApp } from '../state/AppStore';

interface WhatIfPanelProps {
  doc: CircuitDocument;
  sim: SimulationResult;
  onChangeDoc: (next: CircuitDocument, recordHistory?: boolean) => void;
}

interface BaselineSnapshot {
  label: string;
  totalPowerW: number;
  maxCurrentA: number;
}

export const WhatIfPanel: React.FC<WhatIfPanelProps> = ({ doc, sim, onChangeDoc }) => {
  const { lang } = useApp();
  const [baseline, setBaseline] = useState<BaselineSnapshot | null>(null);

  const tunableResistor = doc.components.find((c) => c.type === 'resistor');
  const tunableSource = doc.components.find((c) => c.type === 'voltage_source' || c.type === 'battery');

  const maxCurrentA = Math.max(
    0,
    ...Object.values(sim.components).map((c) => Math.abs(c.current ?? 0))
  );

  const captureBefore = () => {
    setBaseline({
      label: tunableResistor
        ? `${tunableResistor.label}: ${formatMetric(tunableResistor.params.resistance ?? 330, 'Ω').fullText}`
        : 'Baseline',
      totalPowerW: sim.totalSuppliedPowerWatts,
      maxCurrentA,
    });
  };

  return (
    <section className="kv-panel" style={{ padding: '0.85rem' }} aria-label="What If Comparison">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
        <span className="kv-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--copper)' }}>
          {lang === 'ru' ? 'РЕЖИМ «ЧТО ЕСЛИ?»' : 'WHAT-IF EXPLORER'}
        </span>
        <button type="button" className="kv-btn kv-btn-sm" onClick={captureBefore}>
          {lang === 'ru' ? 'Зафиксировать «До»' : 'Pin Baseline'}
        </button>
      </div>

      {tunableResistor && (
        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.84rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span>{tunableResistor.label}</span>
            <span className="kv-mono">{formatMetric(tunableResistor.params.resistance ?? 330, 'Ω').fullText}</span>
          </div>
          <input
            type="range"
            min={47}
            max={4700}
            step={10}
            value={tunableResistor.params.resistance ?? 330}
            onChange={(e) => {
              const r = Number(e.target.value);
              onChangeDoc(
                {
                  ...doc,
                  components: doc.components.map((c) =>
                    c.id === tunableResistor.id ? { ...c, params: { ...c.params, resistance: r } } : c
                  ),
                },
                false
              );
            }}
            style={{ width: '100%' }}
          />
        </label>
      )}

      {tunableSource && (
        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.84rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span>{tunableSource.label}</span>
            <span className="kv-mono">{(tunableSource.params.voltage ?? 5).toFixed(1)} V</span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={0.5}
            value={tunableSource.params.voltage ?? 5}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChangeDoc(
                {
                  ...doc,
                  components: doc.components.map((c) =>
                    c.id === tunableSource.id ? { ...c, params: { ...c.params, voltage: v } } : c
                  ),
                },
                false
              );
            }}
            style={{ width: '100%' }}
          />
        </label>
      )}

      {baseline ? (
        <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }} className="kv-mono">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th scope="col" style={{ textAlign: 'left', padding: '0.25rem 0' }}>{lang === 'ru' ? 'Параметр' : 'Metric'}</th>
              <th scope="col" style={{ textAlign: 'right' }}>{lang === 'ru' ? 'До' : 'Before'}</th>
              <th scope="col" style={{ textAlign: 'right', color: 'var(--cyan)' }}>{lang === 'ru' ? 'После' : 'After'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.25rem 0' }}>{lang === 'ru' ? 'Макс. ток' : 'Peak I'}</td>
              <td style={{ textAlign: 'right' }}>{formatMetric(baseline.maxCurrentA, 'A').fullText}</td>
              <td style={{ textAlign: 'right', color: 'var(--cyan)' }}>{formatMetric(maxCurrentA, 'A').fullText}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.25rem 0' }}>{lang === 'ru' ? 'Мощность' : 'Power'}</td>
              <td style={{ textAlign: 'right' }}>{formatMetric(baseline.totalPowerW, 'W').fullText}</td>
              <td style={{ textAlign: 'right', color: 'var(--cyan)' }}>{formatMetric(sim.totalSuppliedPowerWatts, 'W').fullText}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
          {lang === 'ru'
            ? 'Нажми «Зафиксировать До» и сдвинь ползунок, чтобы сравнить изменения.'
            : 'Click "Pin Baseline" then adjust a slider to compare live before/after values.'}
        </p>
      )}
    </section>
  );
};
