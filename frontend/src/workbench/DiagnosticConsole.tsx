import React from 'react';
import type { SimulationResult } from '@kimovolt/simulation';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../state/AppStore';

interface DiagnosticConsoleProps {
  sim: SimulationResult;
  hasLed?: boolean;
}

export const DiagnosticConsole: React.FC<DiagnosticConsoleProps> = ({ sim, hasLed }) => {
  const { lang, t } = useApp();

  return (
    <section className="kv-panel" style={{ padding: '0.85rem' }} aria-label="Diagnostic Console">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
        <span className="kv-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cyan)' }}>
          {t.workbench.diagnostics.toUpperCase()}
        </span>
        <StatusBadge
          tone={sim.solvable ? (sim.diagnostics.some((d) => d.severity === 'warning') ? 'warn' : 'ok') : 'err'}
          shape={sim.solvable ? 'circle' : 'triangle'}
          label={
            sim.solvable
              ? sim.hasActiveCurrent
                ? lang === 'ru'
                  ? 'ТОК ИДЁТ'
                  : 'ACTIVE'
                : lang === 'ru'
                  ? 'ОЖИДАНИЕ'
                  : 'IDLE'
              : lang === 'ru'
                ? 'ОШИБКА ЦЕПИ'
                : 'FAULT'
          }
        />
      </div>

      {sim.diagnostics.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--green)' }}>
          {lang === 'ru'
            ? 'Параметры цепи в норме. Конфликтов и перегрузок не обнаружено.'
            : 'Circuit parameters nominal. No wiring faults or overloads detected.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {sim.diagnostics.map((d, idx) => (
            <li
              key={`${d.code}-${idx}`}
              style={{
                padding: '0.45rem 0.6rem',
                borderRadius: 4,
                fontSize: '0.81rem',
                background: 'var(--bg)',
                borderLeft: `3px solid ${
                  d.severity === 'error'
                    ? 'var(--coral)'
                    : d.severity === 'warning'
                      ? 'var(--amber)'
                      : 'var(--cyan)'
                }`,
              }}
            >
              <div className="kv-mono" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                [{d.code}]
              </div>
              <div>{lang === 'ru' ? d.messageRu : d.messageEn}</div>
            </li>
          ))}
        </ul>
      )}

      {hasLed && (
        <p style={{ marginTop: '0.55rem', marginBottom: 0, fontSize: '0.74rem', color: 'var(--muted)' }}>
          ℹ {t.workbench.ledModelNote}
        </p>
      )}
    </section>
  );
};
