import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ENCYCLOPEDIA_ENTRIES, type EncyclopediaEntry } from '@kimovolt/content';
import { formatMetric, solveCircuit, solveLogicCircuit, type CircuitDocument } from '@kimovolt/simulation';
import { useApp } from '../state/AppStore';
import { OscilloscopeWidget } from '../workbench/OscilloscopeWidget';
import { SchematicSymbol } from '../workbench/SchematicSymbol';

export const ReferencePage: React.FC = () => {
  const { lang, markComponentInspected } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string>(ENCYCLOPEDIA_ENTRIES[0]!.id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENCYCLOPEDIA_ENTRIES.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (!q) return true;
      return (
        entry.name.ru.toLowerCase().includes(q) ||
        entry.name.en.toLowerCase().includes(q) ||
        entry.designator.toLowerCase().includes(q) ||
        entry.summary[lang].toLowerCase().includes(q)
      );
    });
  }, [category, lang, query]);

  const activeEntry: EncyclopediaEntry =
    filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? ENCYCLOPEDIA_ENTRIES[0]!;

  // Interactive demo state for selected encyclopedia entry
  const [sliderVal, setSliderVal] = useState<number>(330);
  const [logicA, setLogicA] = useState(true);
  const [logicB, setLogicB] = useState(false);

  const handleSelectEntry = (entry: EncyclopediaEntry) => {
    setSelectedId(entry.id);
    markComponentInspected(entry.id);
    if (entry.interactiveDemo?.kind === 'circuit') {
      const d = entry.interactiveDemo;
      setSliderVal(d.sliderParam === 'resistance' ? 330 : d.sliderParam === 'voltage' ? 5 : 0.5);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header>
        <span className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--cyan)', letterSpacing: '0.1em' }}>
          COMPONENT ENCYCLOPEDIA // LIVE SPECS
        </span>
        <h1 id="main-content" tabIndex={-1} style={{ margin: '0.2rem 0 0.45rem', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)' }}>
          {lang === 'ru' ? 'Интерактивный справочник компонентов' : 'Interactive Component Encyclopedia'}
        </h1>
      </header>

      {/* Search & Filter */}
      <div className="kv-panel" style={{ padding: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
        <input
          type="search"
          aria-label={lang === 'ru' ? 'Поиск компонентов' : 'Search components'}
          className="kv-input"
          style={{ flex: '1 1 240px' }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === 'ru' ? 'Поиск по названию (RU/EN), обозначению R/D/LED…' : 'Search by name, symbol R/D/LED…'}
        />
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {(['all', 'sources', 'passive', 'semiconductors', 'controls', 'instruments', 'logic'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`kv-btn kv-btn-sm ${category === cat ? 'kv-btn-primary' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))', gap: '1rem', alignItems: 'start' }}>
        {/* Component List */}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {filtered.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="kv-panel"
                onClick={() => handleSelectEntry(entry)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.7rem 0.9rem',
                  borderColor: activeEntry.id === entry.id ? 'var(--copper)' : 'var(--border)',
                  background: activeEntry.id === entry.id ? 'var(--elevated)' : 'var(--surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{entry.name[lang]}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{entry.summary[lang].slice(0, 62)}…</div>
                </div>
                <span className="kv-mono" style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '0.84rem' }}>
                  {entry.designator}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Detailed Entry + Embedded Live Simulator */}
        <article className="kv-panel-elevated" style={{ gridColumn: 'span 2', padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--copper)' }}>
                {activeEntry.designator} · {activeEntry.category.toUpperCase()}
              </div>
              <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.35rem' }}>{activeEntry.name[lang]}</h2>
              <div className="kv-mono" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                {activeEntry.name.ru} / {activeEntry.name.en}
              </div>
            </div>

            {activeEntry.type !== 'capacitor' && (
              <svg viewBox="0 0 180 120" width="150" height="100" role="img" aria-label={activeEntry.name[lang]} style={{ background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
                <SchematicSymbol
                  comp={{
                    id: 'sym-prev',
                    type: activeEntry.type,
                    label: activeEntry.designator,
                    params: { color: 'red', closed: true, logicLevel: true },
                    position: { x: 3.2, y: 2.1 },
                    rotation: 0,
                  }}
                />
              </svg>
            )}
          </div>

          <p style={{ margin: 0 }}>{activeEntry.howItWorks[lang]}</p>

          <div className="kv-panel" style={{ padding: '0.75rem', background: 'var(--bg)', fontSize: '0.86rem' }}>
            <strong className="kv-mono" style={{ color: 'var(--cyan)', fontSize: '0.76rem' }}>
              {lang === 'ru' ? 'ТИПОВЫЕ ПАРАМЕТРЫ:' : 'TYPICAL SPECS:'}
            </strong>
            <div style={{ marginTop: '0.25rem' }}>{activeEntry.typicalParams[lang]}</div>
            {activeEntry.polarityNote && (
              <div style={{ marginTop: '0.45rem', color: 'var(--amber)' }}>
                <strong>{lang === 'ru' ? 'Полярность:' : 'Polarity:'}</strong> {activeEntry.polarityNote[lang]}
              </div>
            )}
          </div>

          {/* Embedded Interactive Demo */}
          {activeEntry.interactiveDemo?.kind === 'circuit' && (() => {
            const demo = activeEntry.interactiveDemo;
            const modDoc: CircuitDocument = {
              ...demo.circuit,
              components: demo.circuit.components.map((c) =>
                c.id === demo.sliderComponentId && demo.sliderParam
                  ? { ...c, params: { ...c.params, [demo.sliderParam]: sliderVal } }
                  : c
              ),
            };
            const sim = solveCircuit(modDoc);
            const led = Object.values(sim.components).find((c) => c.type === 'led');
            const vm = Object.values(sim.components).find((c) => c.type === 'voltmeter');

            return (
              <div className="kv-panel" style={{ padding: '0.95rem', borderColor: 'var(--cyan)' }}>
                <div className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--cyan)', marginBottom: '0.5rem' }}>
                  LIVE INTERACTIVE DEMO (MNA)
                </div>
                {demo.sliderParam && (
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span>{demo.sliderParam}</span>
                      <span className="kv-mono" style={{ color: 'var(--copper)', fontWeight: 700 }}>
                        {demo.sliderParam === 'resistance'
                          ? `${sliderVal} Ω`
                          : demo.sliderParam === 'voltage'
                            ? `${sliderVal} V`
                            : `${Math.round(sliderVal * 100)}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={demo.min ?? 0}
                      max={demo.max ?? 100}
                      step={demo.step ?? 1}
                      value={sliderVal}
                      onChange={(e) => setSliderVal(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </label>
                )}
                <div className="kv-mono" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                  {led && (
                    <>
                      <span>I_led = {formatMetric(led.current, 'A').fullText}</span>
                      <span>V_led = {formatMetric(led.voltageDrop, 'V').fullText}</span>
                      <span style={{ color: led.conducting ? 'var(--green)' : 'var(--muted)' }}>
                        {led.conducting ? 'LED ON' : 'LED OFF'}
                      </span>
                    </>
                  )}
                  {vm && <span>V_wiper = {formatMetric(vm.voltageDrop, 'V').fullText}</span>}
                </div>
              </div>
            );
          })()}

          {activeEntry.interactiveDemo?.kind === 'rc_waveform' && (
            <OscilloscopeWidget signal={activeEntry.interactiveDemo.signal} allowModeSelect />
          )}

          {activeEntry.interactiveDemo?.kind === 'logic_and' && (() => {
            const doc = {
              ...activeEntry.interactiveDemo.circuit,
              components: activeEntry.interactiveDemo.circuit.components.map((c) =>
                c.id === 'inA'
                  ? { ...c, params: { logicLevel: logicA } }
                  : c.id === 'inB'
                    ? { ...c, params: { logicLevel: logicB } }
                    : c
              ),
            };
            const lSim = solveLogicCircuit(doc);
            const y = lSim.componentOutputs.out1;
            return (
              <div className="kv-panel" style={{ padding: '0.95rem', borderColor: 'var(--cyan)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className={`kv-btn kv-btn-sm kv-mono ${logicA ? 'kv-btn-primary' : ''}`} onClick={() => setLogicA((v) => !v)}>
                    A = {logicA ? '1' : '0'}
                  </button>
                  <button type="button" className={`kv-btn kv-btn-sm kv-mono ${logicB ? 'kv-btn-primary' : ''}`} onClick={() => setLogicB((v) => !v)}>
                    B = {logicB ? '1' : '0'}
                  </button>
                </div>
                <span className="kv-mono" style={{ fontWeight: 700, color: y ? 'var(--green)' : 'var(--muted)' }}>
                  AND OUT = {y ? 'HIGH (1)' : 'LOW (0)'}
                </span>
              </div>
            );
          })()}

          <div>
            <strong style={{ fontSize: '0.88rem' }}>{lang === 'ru' ? 'Типичные ошибки:' : 'Common Mistakes:'}</strong>
            <ul style={{ margin: '0.35rem 0 0', paddingInlineStart: '1.2rem', color: 'var(--muted)', fontSize: '0.86rem' }}>
              {activeEntry.commonMistakes.map((m, idx) => (
                <li key={idx}>{m[lang]}</li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {activeEntry.linkedLessonIds.map((lid) => (
              <Link key={lid} to={`/learn/${lid}`} className="kv-btn kv-btn-sm">
                {lang === 'ru' ? `Урок: ${lid}` : `Lesson: ${lid}`} →
              </Link>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};
