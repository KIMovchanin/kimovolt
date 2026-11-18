import React, { useEffect } from 'react';
import {
  formatMetric,
  type CircuitComponent,
  type CircuitDocument,
  type ComponentSimResult,
  type LedColor,
} from '@kimovolt/simulation';
import { useApp } from '../state/AppStore';

interface ComponentInspectorProps {
  doc: CircuitDocument;
  selectedId: string | null;
  simResult?: ComponentSimResult;
  onChangeDoc: (next: CircuitDocument, recordHistory?: boolean) => void;
  readOnlyStructure?: boolean;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  doc,
  selectedId,
  simResult,
  onChangeDoc,
  readOnlyStructure = false,
}) => {
  const { lang, t, unlockEasterEgg } = useApp();
  const comp = doc.components.find((c) => c.id === selectedId);

  const is42Ohm = comp?.type === 'resistor' && Math.round(comp.params.resistance ?? 0) === 42;
  useEffect(() => {
    if (is42Ohm) {
      unlockEasterEgg('42_OHM');
    }
  }, [is42Ohm, unlockEasterEgg]);

  if (!comp) {
    return (
      <section className="kv-panel" style={{ padding: '0.85rem' }}>
        <div className="kv-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.35rem' }}>
          {lang === 'ru' ? 'ИНСПЕКТОР ЭЛЕМЕНТА' : 'COMPONENT INSPECTOR'}
        </div>
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
          {lang === 'ru'
            ? 'Выбери любой компонент на схеме, чтобы увидеть точные расчёты или изменить номинал.'
            : 'Select any component on the canvas to inspect live telemetry or adjust parameters.'}
        </p>
      </section>
    );
  }

  const updateParams = (patch: Partial<CircuitComponent['params']>) => {
    onChangeDoc(
      {
        ...doc,
        components: doc.components.map((c) =>
          c.id === comp.id ? { ...c, params: { ...c.params, ...patch } } : c
        ),
      },
      true
    );
  };

  return (
    <section className="kv-panel" style={{ padding: '0.85rem' }} aria-label="Component Inspector">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
        <span className="kv-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--copper)' }}>
          {comp.label || comp.id} ({comp.type})
        </span>
        {!comp.locked && !readOnlyStructure && (
          <button
            type="button"
            className="kv-btn kv-btn-sm"
            onClick={() => {
              const nextRot = ((comp.rotation + 90) % 360) as 0 | 90 | 180 | 270;
              onChangeDoc(
                {
                  ...doc,
                  components: doc.components.map((c) => (c.id === comp.id ? { ...c, rotation: nextRot } : c)),
                },
                true
              );
            }}
          >
            ↻ 90°
          </button>
        )}
      </div>

      {/* Live Physical Telemetry */}
      {simResult && (
        <div
          className="kv-mono"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.4rem',
            padding: '0.45rem',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            marginBottom: '0.65rem',
            fontSize: '0.78rem',
          }}
        >
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.68rem' }}>U</div>
            <div>{formatMetric(simResult.voltageDrop, 'V').fullText}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.68rem' }}>I</div>
            <div>{formatMetric(simResult.current, 'A').fullText}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.68rem' }}>P</div>
            <div>{formatMetric(simResult.powerWatts, 'W').fullText}</div>
          </div>
        </div>
      )}

      {/* Editable parameter fields */}
      {(comp.type === 'voltage_source' || comp.type === 'battery') && (
        <label className="kv-field" style={{ marginBottom: '0.5rem' }}>
          <span>{lang === 'ru' ? 'Напряжение (V)' : 'Voltage (V)'}</span>
          <input
            type="number"
            min={0.5}
            max={24}
            step={0.1}
            className="kv-input kv-mono"
            value={comp.params.voltage ?? 5}
            onChange={(e) => {
              const v = Math.max(0.5, Math.min(24, Number(e.target.value) || 0.5));
              updateParams({ voltage: v });
            }}
          />
        </label>
      )}

      {(comp.type === 'resistor' || comp.type === 'potentiometer') && (
        <label className="kv-field" style={{ marginBottom: '0.5rem' }}>
          <span>{lang === 'ru' ? 'Сопротивление (Ω)' : 'Resistance (Ω)'}</span>
          <input
            type="number"
            min={1}
            max={1_000_000}
            step={1}
            className="kv-input kv-mono"
            value={comp.params.resistance ?? 330}
            onChange={(e) => {
              const r = Math.max(1, Math.min(1_000_000, Number(e.target.value) || 1));
              updateParams({ resistance: r });
            }}
          />
        </label>
      )}

      {comp.type === 'potentiometer' && (
        <label className="kv-field" style={{ marginBottom: '0.5rem' }}>
          <span>
            {lang === 'ru' ? 'Положение движка' : 'Wiper'}: {Math.round((comp.params.wiperPosition ?? 0.5) * 100)}%
          </span>
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.05}
            value={comp.params.wiperPosition ?? 0.5}
            onChange={(e) => updateParams({ wiperPosition: Number(e.target.value) })}
          />
        </label>
      )}

      {comp.type === 'led' && (
        <label className="kv-field" style={{ marginBottom: '0.5rem' }}>
          <span>{lang === 'ru' ? 'Цвет свечения' : 'LED Color'}</span>
          <select
            className="kv-input"
            value={comp.params.color ?? 'red'}
            onChange={(e) => updateParams({ color: e.target.value as LedColor })}
          >
            <option value="red">Red (~2.0 V)</option>
            <option value="amber">Amber (~2.05 V)</option>
            <option value="green">Green (~2.1 V)</option>
            <option value="blue">Blue (~3.1 V)</option>
            <option value="white">White (~3.1 V)</option>
          </select>
        </label>
      )}

      {comp.type === 'fuse' && (comp.params.blown || simResult?.blown) && (
        <button
          type="button"
          className="kv-btn kv-btn-primary kv-btn-sm"
          onClick={() => updateParams({ blown: false })}
          style={{ width: '100%' }}
        >
          {lang === 'ru' ? 'Заменить предохранитель (сброс)' : 'Replace Blown Fuse'}
        </button>
      )}

      {is42Ohm && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.45rem 0.6rem',
            borderRadius: 4,
            border: '1px solid var(--amber)',
            color: 'var(--amber)',
            fontSize: '0.78rem',
          }}
        >
          ★ {t.workbench.answer42EasterEgg}
        </div>
      )}
    </section>
  );
};
