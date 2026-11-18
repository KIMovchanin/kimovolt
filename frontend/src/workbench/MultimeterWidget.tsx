import React, { useEffect } from 'react';
import {
  measureMultimeter,
  type CircuitDocument,
  type MultimeterMode,
  type PinRef,
  type SimulationResult,
} from '@kimovolt/simulation';
import { useApp } from '../state/AppStore';
import { labSound } from '../utils/sound';

interface MultimeterWidgetProps {
  doc: CircuitDocument;
  sim: SimulationResult;
  mode: MultimeterMode;
  onChangeMode: (m: MultimeterMode) => void;
  posPin: PinRef | null;
  negPin: PinRef | null;
  activePicker: 'pos' | 'neg' | null;
  onSetActivePicker: (role: 'pos' | 'neg' | null) => void;
  onClearProbes: () => void;
}

export const MultimeterWidget: React.FC<MultimeterWidgetProps> = ({
  doc,
  sim,
  mode,
  onChangeMode,
  posPin,
  negPin,
  activePicker,
  onSetActivePicker,
  onClearProbes,
}) => {
  const { lang } = useApp();
  const reading = measureMultimeter(doc, sim, { mode, posPin, negPin });

  useEffect(() => {
    if (reading.continuityBeep) {
      labSound.playContinuityBeep();
    }
  }, [reading.continuityBeep, posPin?.componentId, posPin?.terminalId, negPin?.componentId, negPin?.terminalId]);

  const modes: Array<{ id: MultimeterMode; label: string }> = [
    { id: 'dc_v', label: 'V⎓' },
    { id: 'dc_ma', label: 'mA⎓' },
    { id: 'ohm', label: 'Ω' },
    { id: 'continuity', label: '♪' },
  ];

  const formatPin = (p: PinRef | null) => {
    if (!p) return lang === 'ru' ? 'Не подключён' : 'Unattached';
    const c = doc.components.find((comp) => comp.id === p.componentId);
    return `${c?.label || p.componentId}:${p.terminalId}`;
  };

  return (
    <section className="kv-panel" style={{ padding: '0.85rem' }} aria-label="Digital Multimeter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cyan)' }} className="kv-mono">
          DMM // KIMOVOLT-M1
        </span>
        {(posPin || negPin) && (
          <button type="button" className="kv-btn kv-btn-sm" onClick={onClearProbes}>
            {lang === 'ru' ? 'Снять щупы' : 'Clear'}
          </button>
        )}
      </div>

      {/* Instrument LCD */}
      <div
        style={{
          padding: '0.7rem 0.85rem',
          borderRadius: 4,
          background: 'var(--bg)',
          border: `1px solid ${reading.warningCode ? 'var(--coral)' : 'var(--border-strong)'}`,
          marginBottom: '0.65rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span className="kv-mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
          {mode.toUpperCase()}
        </span>
        <span
          className="kv-mono"
          data-testid="multimeter-display"
          style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            color: reading.warningCode ? 'var(--coral)' : 'var(--cyan)',
          }}
        >
          {reading.displayText}
        </span>
      </div>

      {/* Mode Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', marginBottom: '0.65rem' }}>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`kv-btn kv-btn-sm kv-mono ${mode === m.id ? 'kv-btn-primary' : ''}`}
            aria-pressed={mode === m.id}
            onClick={() => onChangeMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Probe Pickers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
        <button
          type="button"
          className="kv-btn kv-btn-sm"
          style={{
            borderColor: activePicker === 'pos' ? 'var(--coral)' : 'var(--border-strong)',
            justifyContent: 'flex-start',
          }}
          onClick={() => onSetActivePicker(activePicker === 'pos' ? null : 'pos')}
        >
          <span style={{ color: 'var(--coral)', fontWeight: 700 }}>● +</span>
          <span className="kv-mono" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatPin(posPin)}
          </span>
        </button>

        <button
          type="button"
          className="kv-btn kv-btn-sm"
          style={{
            borderColor: activePicker === 'neg' ? 'var(--cyan)' : 'var(--border-strong)',
            justifyContent: 'flex-start',
          }}
          onClick={() => onSetActivePicker(activePicker === 'neg' ? null : 'neg')}
        >
          <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>● −</span>
          <span className="kv-mono" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatPin(negPin)}
          </span>
        </button>
      </div>

      {(reading.warningRu || reading.warningEn) && (
        <p style={{ marginTop: '0.55rem', marginBottom: 0, fontSize: '0.8rem', color: reading.warningCode ? 'var(--coral)' : 'var(--amber)' }}>
          {lang === 'ru' ? reading.warningRu : reading.warningEn}
        </p>
      )}
    </section>
  );
};
