import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BOARD_PROFILES, HARDWARE_PROJECTS } from '@kimovolt/content';
import { solveCircuit } from '@kimovolt/simulation';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../state/AppStore';
import { CircuitCanvas } from '../workbench/CircuitCanvas';

export const ProjectsPage: React.FC = () => {
  const { lang } = useApp();
  const navigate = useNavigate();
  const [selectedBoardId, setSelectedBoardId] = useState<'arduino_uno' | 'esp32_c3' | 'esp32_s3'>('arduino_uno');

  const activeBoard = BOARD_PROFILES.find((b) => b.id === selectedBoardId) ?? BOARD_PROFILES[0]!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <header>
        <span className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--copper)', letterSpacing: '0.1em' }}>
          REAL HARDWARE BRIDGE // LOW-VOLTAGE PROJECTS
        </span>
        <h1 id="main-content" tabIndex={-1} style={{ margin: '0.2rem 0 0.45rem', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)' }}>
          {lang === 'ru' ? 'Инженерные проекты и макетные платы' : 'Hardware Projects & Board Pinouts'}
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', maxInlineSize: '68ch' }}>
          {lang === 'ru'
            ? 'Повтори изученные схемы в реальности на безопасном низковольтном питании (3.3–9 V). Каждый проект включает честный список деталей, пошаговую сборку, ожидаемые измерения и проверяемую схему.'
            : 'Bring virtual circuits to real breadboards safely at low voltage (3.3–9 V). Each project includes verified BOMs, assembly steps, expected meter readings, and live schematic verification.'}
        </p>
      </header>

      {/* Hardware Projects Gallery */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '1.1rem' }}>
        {HARDWARE_PROJECTS.map((proj) => {
          const sim = solveCircuit(proj.circuit);
          return (
            <article key={proj.id} className="kv-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <StatusBadge
                  tone={proj.difficulty === 1 ? 'ok' : proj.difficulty === 2 ? 'copper' : 'info'}
                  shape="diamond"
                  label={`LVL ${proj.difficulty} · ~${proj.estimatedMinutes} min`}
                />
                {proj.boardHint && (
                  <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--cyan)' }}>
                    {proj.boardHint.toUpperCase()}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.12rem', margin: 0 }}>{proj.title[lang]}</h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>{proj.summary[lang]}</p>

              {/* Honest interactive SVG circuit preview */}
              <CircuitCanvas
                doc={proj.circuit}
                sim={sim}
                overlays={{ showCurrent: true, showVoltage: false, showPower: false, xrayMode: false }}
                readOnlyStructure
                selectedId={null}
                onSelect={() => {}}
                onChangeDoc={() => {}}
                compactHeight={230}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                <div>
                  <strong className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--copper)' }}>
                    {lang === 'ru' ? 'ДЕТАЛИ (BOM):' : 'PARTS (BOM):'}
                  </strong>
                  <ul style={{ margin: '0.3rem 0 0', paddingInlineStart: '1.1rem', color: 'var(--muted)' }}>
                    {proj.componentsList.map((item, idx) => (
                      <li key={idx}>{item[lang]}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--cyan)' }}>
                    {lang === 'ru' ? 'ШАГИ СБОРКИ:' : 'ASSEMBLY:'}
                  </strong>
                  <ol style={{ margin: '0.3rem 0 0', paddingInlineStart: '1.1rem', color: 'var(--muted)' }}>
                    {proj.assemblySteps.map((st, idx) => (
                      <li key={idx}>{st[lang]}</li>
                    ))}
                  </ol>
                </div>
              </div>

              <div style={{ padding: '0.5rem 0.7rem', borderRadius: 4, background: 'var(--bg)', borderLeft: '3px solid var(--amber)', fontSize: '0.81rem' }}>
                <strong>{lang === 'ru' ? 'Безопасность:' : 'Safety:'}</strong> {proj.safetyNotes[lang]}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="kv-mono" style={{ fontSize: '0.78rem', color: 'var(--green)' }}>
                  {proj.expectedMeasurements[0]?.[lang]}
                </span>
                <button
                  type="button"
                  className="kv-btn kv-btn-primary kv-btn-sm"
                  onClick={() => {
                    sessionStorage.setItem('kimovolt-open-circuit', JSON.stringify(proj.circuit));
                    navigate('/lab');
                  }}
                >
                  {lang === 'ru' ? 'Открыть в лаборатории →' : 'Open in Lab →'}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <div className="kv-trace-rule" />

      {/* Verified Microcontroller Profiles: Arduino UNO, ESP32-C3, ESP32-S3 */}
      <section className="kv-panel" style={{ padding: '1.35rem' }} aria-labelledby="boards-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--cyan)' }}>
              VERIFIED HARDWARE PROFILES
            </span>
            <h2 id="boards-title" style={{ margin: '0.2rem 0 0', fontSize: '1.25rem' }}>
              {lang === 'ru' ? 'Распиновки Arduino UNO, ESP32-C3 и ESP32-S3' : 'Arduino UNO, ESP32-C3 & ESP32-S3 Pinouts'}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {BOARD_PROFILES.map((bp) => (
              <button
                key={bp.id}
                type="button"
                className={`kv-btn kv-btn-sm ${selectedBoardId === bp.id ? 'kv-btn-primary' : ''}`}
                onClick={() => setSelectedBoardId(bp.id)}
              >
                {bp.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1rem' }}>
          <div>
            <div className="kv-mono" style={{ fontSize: '0.82rem', display: 'grid', gap: '0.35rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
              <div><strong>MCU:</strong> {activeBoard.mcu}</div>
              <div><strong>{lang === 'ru' ? 'Питание:' : 'Power:'}</strong> {activeBoard.operatingVoltage}</div>
              <div><strong>{lang === 'ru' ? 'Логика:' : 'Logic:'}</strong> <span style={{ color: 'var(--copper)' }}>{activeBoard.logicLevel}</span></div>
              <div><strong>{lang === 'ru' ? 'Ток GPIO:' : 'Pin Max:'}</strong> {activeBoard.maxPinCurrent}</div>
            </div>

            <div style={{ padding: '0.6rem 0.75rem', borderRadius: 4, borderLeft: '3px solid var(--coral)', background: 'var(--bg)', fontSize: '0.84rem', marginBottom: '0.75rem' }}>
              {activeBoard.safetyRules[lang]}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-strong)', textAlign: 'left' }}>
                  <th scope="col" style={{ padding: '0.4rem' }}>Pin</th>
                  <th scope="col" style={{ padding: '0.4rem' }}>Role</th>
                  <th scope="col" style={{ padding: '0.4rem' }}>{lang === 'ru' ? 'Примечание' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody>
                {activeBoard.pins.map((row) => (
                  <tr key={row.pin} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="kv-mono" style={{ padding: '0.4rem', color: 'var(--cyan)', fontWeight: 600 }}>{row.pin}</td>
                    <td className="kv-mono" style={{ padding: '0.4rem' }}>{row.role}</td>
                    <td style={{ padding: '0.4rem', color: 'var(--muted)' }}>{row.notes[lang]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
              {lang === 'ru' ? 'ПРОВЕРЕННЫЙ ШАБЛОН КОДА' : 'VERIFIED CODE TEMPLATE'}
            </div>
            <pre
              className="kv-mono"
              style={{
                margin: 0,
                padding: '0.9rem',
                borderRadius: 4,
                background: 'var(--bg)',
                border: '1px solid var(--border-strong)',
                overflowX: 'auto',
                fontSize: '0.8rem',
                lineHeight: 1.5,
              }}
            >
              <code>{activeBoard.blinkCodeSnippet}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
