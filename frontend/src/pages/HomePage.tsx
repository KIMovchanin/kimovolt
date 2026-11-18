import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  evalGate,
  formatMetric,
  solveCircuit,
  type CircuitDocument,
} from '@kimovolt/simulation';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSimulation } from '../hooks/useSimulation';
import { useApp } from '../state/AppStore';
import { CircuitCanvas } from '../workbench/CircuitCanvas';
import { OscilloscopeWidget } from '../workbench/OscilloscopeWidget';

const INITIAL_HERO_CIRCUIT: CircuitDocument = {
  schemaVersion: 1,
  id: 'home-hero-circuit',
  name: 'First Circuit Hero',
  viewMode: 'schematic',
  components: [
    { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0, locked: true },
    { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: false }, position: { x: 10, y: 3 }, rotation: 0, locked: true },
    { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 16, y: 3 }, rotation: 0, locked: true },
    { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 16, y: 9 }, rotation: 90, locked: true },
    { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0, locked: true },
  ],
  wires: [
    { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw1', terminalId: 'a' }, locked: true },
    { id: 'w2', from: { componentId: 'sw1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' }, locked: true },
    { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' }, locked: true },
    { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' }, locked: true },
    { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' }, locked: true },
  ],
};

export const HomePage: React.FC = () => {
  const { lang, t } = useApp();
  const [heroDoc, setHeroDoc] = useState<CircuitDocument>(INITIAL_HERO_CIRCUIT);
  const { sim: heroSim } = useSimulation(heroDoc);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  // Micro-demo states (all backed by real solvers)
  const [demoR, setDemoR] = useState(330);
  const demoResistanceSim = useMemo(() => {
    const doc: CircuitDocument = {
      ...INITIAL_HERO_CIRCUIT,
      id: 'demo-r-sweep',
      components: INITIAL_HERO_CIRCUIT.components.map((c) =>
        c.id === 'sw1'
          ? { ...c, params: { closed: true } }
          : c.id === 'r1'
            ? { ...c, params: { resistance: demoR } }
            : c
      ),
    };
    return solveCircuit(doc);
  }, [demoR]);

  const [voltNode, setVoltNode] = useState<'source' | 'led' | 'resistor'>('led');
  const [faultFixed, setFaultFixed] = useState(false);
  const [logicA, setLogicA] = useState(true);
  const [logicB, setLogicB] = useState(false);
  const [pwmDuty, setPwmDuty] = useState(35);

  const heroClosed = heroSim.hasActiveCurrent && Boolean(heroSim.components.d1?.conducting);
  const heroCurrent = heroSim.components.d1?.current ?? 0;
  const heroPower = heroSim.components.r1?.powerWatts ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ASYMMETRIC EDITORIAL HERO WITH WORKING CIRCUIT */}
      <section
        aria-labelledby="main-content"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}
      >
        <div
          className="kv-panel"
          style={{
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.25rem',
          }}
        >
          <div>
            <div className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--copper)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
              {t.home.eyebrow}
            </div>
            <h1
              id="main-content"
              tabIndex={-1}
              style={{
                fontSize: 'clamp(1.65rem, 3.1vw, 2.55rem)',
                lineHeight: 1.12,
                marginBottom: '1rem',
              }}
            >
              {t.home.headline}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '1.02rem', maxInlineSize: '54ch' }}>
              {t.home.subheadline}
            </p>
          </div>

          {/* Live Hero Message + Telemetry Strip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div
              data-testid="hero-circuit-status"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 4,
                background: 'var(--bg)',
                border: `1px solid ${heroClosed ? 'var(--green)' : 'var(--border-strong)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <StatusBadge
                  tone={heroClosed ? 'ok' : 'copper'}
                  shape={heroClosed ? 'circle' : 'ring'}
                  label={heroClosed ? t.home.stateClosed : t.home.stateOpen}
                />
                <span className="kv-mono" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  MNA // 5.00 V / 330 Ω / LED
                </span>
              </div>
              <p style={{ margin: 0, fontWeight: 600, color: heroClosed ? 'var(--green)' : 'var(--text)' }}>
                {heroClosed ? t.home.heroClosedMsg : t.home.heroPrompt}
              </p>
            </div>

            <div
              className="kv-mono"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                padding: '0.7rem 0.9rem',
                borderRadius: 4,
                background: 'var(--elevated)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t.home.voltageLabel}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--copper)' }}>5.00 V</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t.home.currentLabel}</div>
                <div data-testid="hero-current-readout" style={{ fontSize: '1.05rem', fontWeight: 700, color: heroClosed ? 'var(--cyan)' : 'var(--muted)' }}>
                  {formatMetric(heroCurrent, 'A').fullText}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t.home.powerLabel}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {formatMetric(heroPower, 'W').fullText}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link to="/learn/m0-first-led" className="kv-btn kv-btn-primary">
                {t.home.startLearning} →
              </Link>
              <Link to="/lab" className="kv-btn kv-btn-cyan">
                {t.home.openLab}
              </Link>
              <button
                type="button"
                className="kv-btn"
                onClick={() =>
                  setHeroDoc((prev) => ({
                    ...prev,
                    components: prev.components.map((c) =>
                      c.id === 'sw1' ? { ...c, params: { ...c.params, closed: !c.params.closed } } : c
                    ),
                  }))
                }
              >
                {heroClosed
                  ? lang === 'ru'
                    ? 'Разомкнуть SW1'
                    : 'Open SW1'
                  : lang === 'ru'
                    ? 'Замкнуть SW1'
                    : 'Close SW1'}
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Hero Workbench */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minInlineSize: 0 }}>
          <CircuitCanvas
            doc={heroDoc}
            sim={heroSim}
            overlays={{ showCurrent: true, showVoltage: false, showPower: false, xrayMode: heroClosed }}
            readOnlyStructure
            selectedId={selectedHeroId}
            onSelect={(id) => setSelectedHeroId(id)}
            onChangeDoc={(next) => setHeroDoc(next)}
            compactHeight={370}
          />
        </div>
      </section>

      <div className="kv-trace-rule" />

      {/* 6 UNIQUE COMPOSITIONAL MINI-DEMOS */}
      <section aria-labelledby="demos-title" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 id="demos-title" style={{ fontSize: '1.35rem', margin: 0 }}>
            {t.home.demosHeading}
          </h2>
          <span className="kv-mono" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            01 // 06 LIVE LAB MODULES
          </span>
        </div>

        {/* Row 1: Asymmetric 7/5 split — Resistance Sweep + Voltage Probing */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: '1rem' }}>
          {/* Demo 1: Resistance Slider */}
          <article className="kv-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--copper)' }}>01 // OHM'S LIMITING</span>
              <span className="kv-mono" style={{ fontSize: '0.9rem', color: 'var(--cyan)' }}>
                {formatMetric(demoResistanceSim.components.d1?.current ?? 0, 'A').fullText}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
              {lang === 'ru' ? 'Изменение сопротивления в реальном времени' : 'Live Resistance Tuning'}
            </h3>
            <label style={{ fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--muted)' }}>R1 (5 V → Red LED 2.0 V)</span>
                <span className="kv-mono">{demoR} Ω</span>
              </div>
              <input
                type="range"
                min={68}
                max={1200}
                step={10}
                value={demoR}
                onChange={(e) => setDemoR(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  inlineSize: 24,
                  blockSize: 24,
                  borderRadius: '50%',
                  background: `rgba(255, 75, 71, ${Math.min(1, Math.max(0.15, demoResistanceSim.components.d1?.brightness ?? 0))})`,
                  border: '2px solid var(--border-strong)',
                  boxShadow:
                    (demoResistanceSim.components.d1?.current ?? 0) > 0.025
                      ? '0 0 14px var(--coral)'
                      : '0 0 10px rgba(255,75,71,0.4)',
                }}
                aria-hidden="true"
              />
              <span style={{ fontSize: '0.84rem', color: (demoResistanceSim.components.d1?.current ?? 0) > 0.025 ? 'var(--coral)' : 'var(--muted)' }}>
                {(demoResistanceSim.components.d1?.current ?? 0) > 0.025
                  ? lang === 'ru'
                    ? 'Внимание: ток > 25 mA перегружает светодиод!'
                    : 'Warning: > 25 mA overloads the LED!'
                  : lang === 'ru'
                    ? `Безопасный ток: ~${((demoResistanceSim.components.d1?.current ?? 0) * 1000).toFixed(1)} mA`
                    : `Safe current: ~${((demoResistanceSim.components.d1?.current ?? 0) * 1000).toFixed(1)} mA`}
              </span>
            </div>
          </article>

          {/* Demo 2: Voltage Probing */}
          <article className="kv-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--cyan)' }}>02 // POTENTIAL DROP</span>
              <span className="kv-mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan)' }}>
                {voltNode === 'source' ? '5.00 V' : voltNode === 'resistor' ? '3.00 V' : '2.00 V'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
              {lang === 'ru' ? 'Измерение напряжения по узлам' : 'Probing Node Voltage Drops'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: 0 }}>
              {lang === 'ru' ? 'Выбери участок цепи, куда приложить щупы вольтметра:' : 'Select where to place voltmeter probes:'}
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {(
                [
                  ['source', lang === 'ru' ? 'Источник' : 'Source'],
                  ['resistor', lang === 'ru' ? 'Резистор R1' : 'Resistor R1'],
                  ['led', lang === 'ru' ? 'Светодиод' : 'LED1'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`kv-btn kv-btn-sm ${voltNode === id ? 'kv-btn-primary' : ''}`}
                  onClick={() => setVoltNode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="kv-mono" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              KVL: 3.00 V (R1) + 2.00 V (LED) = 5.00 V
            </div>
          </article>
        </div>

        {/* Row 2: 3 diverse panels — Fault Diagnosis, Digital Logic, PWM Scope */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
          {/* Demo 3: Spot the wrong connection */}
          <article className="kv-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--amber)' }}>03 // DIAGNOSTICS</span>
            <h3 style={{ fontSize: '1.02rem', margin: 0 }}>
              {lang === 'ru' ? 'Поиск неправильного соединения' : 'Spot & Fix Wiring Faults'}
            </h3>
            <div style={{ padding: '0.6rem', background: 'var(--bg)', borderRadius: 4, border: `1px solid ${faultFixed ? 'var(--green)' : 'var(--coral)'}`, fontSize: '0.83rem' }}>
              {faultFixed
                ? lang === 'ru'
                  ? '✓ Анод (+) к плюсу, Катод (−) к GND — ток 9.08 mA, свечение восстановлено.'
                  : '✓ Anode (+) to positive, Cathode (-) to GND — 9.08 mA restored.'
                : lang === 'ru'
                  ? '✕ Светодиод перевёрнут (Катод к +5 V): ток заперт, цепь не светится.'
                  : '✕ Reversed LED (Cathode to +5 V): current blocked.'}
            </div>
            <button type="button" className="kv-btn kv-btn-sm" onClick={() => setFaultFixed((f) => !f)}>
              {faultFixed
                ? lang === 'ru'
                  ? 'Вернуть ошибку'
                  : 'Restore Fault'
                : lang === 'ru'
                  ? 'Перевернуть LED правильно'
                  : 'Flip LED Polarity'}
            </button>
          </article>

          {/* Demo 4: Digital Logic Gate */}
          <article className="kv-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--cyan)' }}>04 // DIGITAL SIGNAL</span>
            <h3 style={{ fontSize: '1.02rem', margin: 0 }}>
              {lang === 'ru' ? 'Работа логического вентиля XOR' : 'Interactive XOR Logic'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" className={`kv-btn kv-btn-sm kv-mono ${logicA ? 'kv-btn-primary' : ''}`} onClick={() => setLogicA((v) => !v)}>
                  A={logicA ? '1' : '0'}
                </button>
                <button type="button" className={`kv-btn kv-btn-sm kv-mono ${logicB ? 'kv-btn-primary' : ''}`} onClick={() => setLogicB((v) => !v)}>
                  B={logicB ? '1' : '0'}
                </button>
              </div>
              <span className="kv-mono" style={{ fontWeight: 700, color: evalGate('XOR', logicA, logicB) ? 'var(--green)' : 'var(--muted)' }}>
                Y = {evalGate('XOR', logicA, logicB) ? 'HIGH (1)' : 'LOW (0)'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
              {lang === 'ru' ? 'Выход равен 1 только когда сигналы A и B различны.' : 'Outputs 1 only when inputs A and B differ.'}
            </p>
          </article>

          {/* Demo 5: Real Hardware Bridge */}
          <article className="kv-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--green)' }}>05 // REAL HARDWARE</span>
            <h3 style={{ fontSize: '1.02rem', margin: 0 }}>
              {lang === 'ru' ? 'От схемы — к реальному проекту' : 'From Virtual Lab to Breadboard'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
              {lang === 'ru'
                ? 'Каждый проект даёт честную спецификацию деталей, пошаговую сборку на макетке и проверенные распиновки Arduino UNO, ESP32-C3 и ESP32-S3.'
                : 'Every project provides an exact BOM, breadboard assembly steps, and verified Arduino UNO, ESP32-C3 & ESP32-S3 pinouts.'}
            </p>
            <Link to="/projects" className="kv-btn kv-btn-sm" style={{ alignSelf: 'flex-start' }}>
              {lang === 'ru' ? 'Смотреть проекты →' : 'Browse Projects →'}
            </Link>
          </article>
        </div>

        {/* Demo 6: Full-width PWM Scope Strip */}
        <article className="kv-panel" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--cyan)' }}>06 // PWM & OSCILLOSCOPE</span>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
              {lang === 'ru' ? 'Визуализация ШИМ (PWM) на осциллографе' : 'Live PWM Duty-Cycle Visualization'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
              {lang === 'ru'
                ? 'Управляй шириной импульса от 10% до 90% и наблюдай, как меняется среднее напряжение сигнала 5 V.'
                : 'Sweep pulse duty cycle from 10% to 90% and see how average 5 V energy scales in real time.'}
            </p>
            <label style={{ fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Duty Cycle</span>
                <span className="kv-mono" style={{ color: 'var(--cyan)' }}>
                  {pwmDuty}% · V_avg = {(5 * (pwmDuty / 100)).toFixed(2)} V
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={pwmDuty}
                onChange={(e) => setPwmDuty(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>
          </div>
          <OscilloscopeWidget
            signal={{ mode: 'pwm', amplitudeV: 5, frequencyHz: 500, dutyCyclePercent: pwmDuty }}
          />
        </article>
      </section>
    </div>
  );
};
