import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  computeSignalMetrics,
  sampleWaveform,
  type SignalGeneratorConfig,
  type WaveformMode,
} from '@kimovolt/simulation';
import { useApp } from '../state/AppStore';

interface OscilloscopeWidgetProps {
  signal: SignalGeneratorConfig;
  allowModeSelect?: boolean;
  onChangeSignal?: (next: SignalGeneratorConfig) => void;
}

const TIME_DIV_OPTIONS_MS = [0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 50.0];
const VOLT_DIV_OPTIONS = [0.5, 1.0, 2.0, 5.0];

export const OscilloscopeWidget: React.FC<OscilloscopeWidgetProps> = ({
  signal,
  allowModeSelect = false,
  onChangeSignal,
}) => {
  const { lang, unlockEasterEgg } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [timeDivMs, setTimeDivMs] = useState(0.5);
  const [voltDiv, setVoltDiv] = useState(2.0);
  const [yOffsetDiv, setYOffsetDiv] = useState(-1.5);
  const [triggerV, setTriggerV] = useState(2.5);
  const [running, setRunning] = useState(true);
  const [cursorA, setCursorA] = useState(2); // in divisions (0..10)
  const [cursorB, setCursorB] = useState(6);

  const totalWindowSec = (timeDivMs * 10) / 1000;
  const points = useMemo(() => sampleWaveform(signal, totalWindowSec, 500), [signal, totalWindowSec]);
  const metrics = useMemo(() => computeSignalMetrics(signal), [signal]);

  useEffect(() => {
    if (signal.mode === 'xy_kimovolt') {
      unlockEasterEgg('XY_SCOPE');
    }
  }, [signal.mode, unlockEasterEgg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background phosphor dark screen
    ctx.fillStyle = '#080C0F';
    ctx.fillRect(0, 0, w, h);

    const cols = 10;
    const rows = 8;
    const cellW = w / cols;
    const cellH = h / rows;

    // Graticule grid
    ctx.strokeStyle = 'rgba(145, 160, 168, 0.16)';
    ctx.lineWidth = 1;
    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, h);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(w, r * cellH);
      ctx.stroke();
    }

    // Ground 0V baseline
    const zeroY = h / 2 - yOffsetDiv * cellH;
    ctx.strokeStyle = 'rgba(245, 160, 90, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // Trigger line
    if (signal.mode !== 'xy_kimovolt') {
      const trigY = zeroY - (triggerV / voltDiv) * cellH;
      ctx.strokeStyle = 'rgba(241, 187, 88, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, trigY);
      ctx.lineTo(w, trigY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Cursors
    if (signal.mode !== 'xy_kimovolt') {
      ctx.strokeStyle = 'rgba(167, 230, 111, 0.45)';
      ctx.setLineDash([3, 3]);
      [cursorA, cursorB].forEach((cDiv) => {
        const cx = cDiv * cellW;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Signal trace
    ctx.strokeStyle = '#56D6D0';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    points.forEach((pt, idx) => {
      let px = 0;
      let py = 0;
      if (signal.mode === 'xy_kimovolt' && pt.x !== undefined) {
        px = (pt.x * 0.45 + 0.5) * w;
        py = (0.5 - pt.v * 0.42) * h;
      } else {
        px = (pt.t / totalWindowSec) * w;
        py = zeroY - (pt.v / voltDiv) * cellH;
      }
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }, [cursorA, cursorB, points, signal.mode, totalWindowSec, triggerV, voltDiv, yOffsetDiv]);

  const dtMs = Math.abs(cursorB - cursorA) * timeDivMs;
  const cursorFreqHz = dtMs > 0 ? 1000 / dtMs : 0;

  return (
    <section className="kv-panel" style={{ padding: '0.9rem' }} aria-label="Virtual Oscilloscope">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <span className="kv-mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.08em' }}>
          DSO // KIMOVOLT-S2
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`kv-btn kv-btn-sm ${running ? 'kv-btn-primary' : ''}`}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? 'RUN' : 'STOP'}
          </button>
          {allowModeSelect && onChangeSignal && (
            <select
              aria-label={lang === 'ru' ? 'Тип сигнала' : 'Signal mode'}
              value={signal.mode}
              onChange={(e) => onChangeSignal({ ...signal, mode: e.target.value as WaveformMode })}
              className="kv-input"
              style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.82rem' }}
            >
              <option value="pwm">PWM (500 Hz)</option>
              <option value="square">Square</option>
              <option value="sine">Sine</option>
              <option value="rc_charge">RC Charge</option>
              <option value="rc_discharge">RC Discharge</option>
              <option value="xy_kimovolt">XY Demo (Easter Egg)</option>
            </select>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={290}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          borderRadius: 4,
          border: '1px solid var(--border-strong)',
          marginBottom: '0.7rem',
        }}
      />

      {/* Scale & Trigger Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '0.5rem', marginBottom: '0.7rem' }}>
        <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span className="kv-mono" style={{ color: 'var(--muted)' }}>Time / div</span>
          <select
            className="kv-input"
            value={timeDivMs}
            onChange={(e) => setTimeDivMs(Number(e.target.value))}
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.82rem' }}
          >
            {TIME_DIV_OPTIONS_MS.map((ms) => (
              <option key={ms} value={ms}>
                {ms} ms/div
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span className="kv-mono" style={{ color: 'var(--muted)' }}>Volt / div</span>
          <select
            className="kv-input"
            value={voltDiv}
            onChange={(e) => setVoltDiv(Number(e.target.value))}
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.82rem' }}
          >
            {VOLT_DIV_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v.toFixed(1)} V/div
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span className="kv-mono" style={{ color: 'var(--muted)' }}>GND Pos ({yOffsetDiv.toFixed(1)} div)</span>
          <input
            type="range"
            min={-3.5}
            max={3.5}
            step={0.5}
            value={yOffsetDiv}
            onChange={(e) => setYOffsetDiv(Number(e.target.value))}
          />
        </label>

        <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span className="kv-mono" style={{ color: 'var(--muted)' }}>Trigger ({triggerV.toFixed(1)} V)</span>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={triggerV}
            onChange={(e) => setTriggerV(Number(e.target.value))}
          />
        </label>
      </div>

      {/* Cursors & Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '0.55rem' }}>
        <label style={{ fontSize: '0.76rem' }}>
          <span className="kv-mono" style={{ color: 'var(--green)' }}>Cursor A ({cursorA.toFixed(1)} div)</span>
          <input type="range" min={0} max={10} step={0.2} value={cursorA} onChange={(e) => setCursorA(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={{ fontSize: '0.76rem' }}>
          <span className="kv-mono" style={{ color: 'var(--green)' }}>Cursor B ({cursorB.toFixed(1)} div)</span>
          <input type="range" min={0} max={10} step={0.2} value={cursorB} onChange={(e) => setCursorB(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
      </div>

      <div
        className="kv-mono"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.9rem',
          fontSize: '0.8rem',
          padding: '0.45rem 0.65rem',
          borderRadius: 4,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
        }}
      >
        <span>Δt = {dtMs.toFixed(2)} ms</span>
        <span>1/Δt = {cursorFreqHz.toFixed(1)} Hz</span>
        <span>Vpp = {metrics.vpp.toFixed(2)} V</span>
        {metrics.timeConstantSec !== null && (
          <span style={{ color: 'var(--copper)' }}>τ = RC = {(metrics.timeConstantSec * 1000).toFixed(1)} ms</span>
        )}
      </div>
    </section>
  );
};
