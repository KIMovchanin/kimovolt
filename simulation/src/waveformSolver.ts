export type WaveformMode = 'pwm' | 'square' | 'sine' | 'rc_charge' | 'rc_discharge' | 'xy_kimovolt';

export interface SignalGeneratorConfig {
  mode: WaveformMode;
  amplitudeV: number; // e.g. 5.0 V
  offsetV?: number; // DC offset
  frequencyHz: number; // e.g. 500 Hz
  dutyCyclePercent?: number; // 1..99 for PWM
  resistanceOhms?: number; // for RC modes
  capacitanceFarads?: number; // for RC modes
}

export interface WaveformPoint {
  t: number; // seconds
  v: number; // volts (or Y in xy mode)
  x?: number; // optional X in xy mode
}

export interface SignalMetrics {
  mode: WaveformMode;
  periodSec: number | null;
  frequencyHz: number | null;
  vMin: number;
  vMax: number;
  vpp: number;
  vAvg: number;
  dutyCyclePercent: number | null;
  timeConstantSec: number | null;
}

export function sampleWaveform(
  config: SignalGeneratorConfig,
  windowDurationSec: number,
  sampleCount = 400
): WaveformPoint[] {
  const count = Math.max(32, Math.min(2000, sampleCount));
  const points: WaveformPoint[] = [];
  const offset = config.offsetV ?? 0;

  if (config.mode === 'xy_kimovolt') {
    // Original geometric oscilloscope trace spelling "K" + wave motif (Easter egg)
    const strokes: Array<[number, number, number, number]> = [
      // Letter K vertical spine + upper/lower diagonal + PCB trace tail
      [-0.75, -0.7, -0.75, 0.7],
      [-0.75, 0.0, -0.25, 0.7],
      [-0.6, 0.15, -0.2, -0.7],
      // Signal trace V-pulse right next to K
      [-0.05, 0.0, 0.2, 0.0],
      [0.2, 0.0, 0.4, 0.7],
      [0.4, 0.7, 0.6, -0.55],
      [0.6, -0.55, 0.78, 0.0],
      [0.78, 0.0, 0.95, 0.0],
    ];
    const perStroke = Math.max(4, Math.floor(count / strokes.length));
    for (let s = 0; s < strokes.length; s++) {
      const [x1, y1, x2, y2] = strokes[s]!;
      for (let i = 0; i <= perStroke; i++) {
        const u = i / perStroke;
        points.push({
          t: (s * perStroke + i) / (strokes.length * perStroke),
          x: x1 + (x2 - x1) * u,
          v: y1 + (y2 - y1) * u,
        });
      }
    }
    return points;
  }

  const freq = Math.max(0.1, config.frequencyHz);
  const period = 1 / freq;
  const duty = Math.max(0.01, Math.min(0.99, (config.dutyCyclePercent ?? 50) / 100));
  const r = Math.max(1, config.resistanceOhms ?? 1000);
  const c = Math.max(1e-9, config.capacitanceFarads ?? 100e-6);
  const tau = r * c;

  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * windowDurationSec;
    let v = 0;
    switch (config.mode) {
      case 'square': {
        const phase = (t % period) / period;
        v = phase < 0.5 ? config.amplitudeV + offset : offset;
        break;
      }
      case 'pwm': {
        const phase = (t % period) / period;
        v = phase < duty ? config.amplitudeV + offset : offset;
        break;
      }
      case 'sine': {
        v = offset + (config.amplitudeV / 2) * Math.sin(2 * Math.PI * freq * t);
        break;
      }
      case 'rc_charge': {
        v = offset + config.amplitudeV * (1 - Math.exp(-t / tau));
        break;
      }
      case 'rc_discharge': {
        v = offset + config.amplitudeV * Math.exp(-t / tau);
        break;
      }
    }
    points.push({ t, v });
  }
  return points;
}

export function computeSignalMetrics(config: SignalGeneratorConfig): SignalMetrics {
  const offset = config.offsetV ?? 0;
  if (config.mode === 'rc_charge' || config.mode === 'rc_discharge') {
    const r = Math.max(1, config.resistanceOhms ?? 1000);
    const c = Math.max(1e-9, config.capacitanceFarads ?? 100e-6);
    const tau = r * c;
    return {
      mode: config.mode,
      periodSec: null,
      frequencyHz: null,
      vMin: offset,
      vMax: offset + config.amplitudeV,
      vpp: config.amplitudeV,
      vAvg: offset + config.amplitudeV * (config.mode === 'rc_charge' ? 0.632 : 0.368),
      dutyCyclePercent: null,
      timeConstantSec: tau,
    };
  }

  if (config.mode === 'xy_kimovolt') {
    return {
      mode: config.mode,
      periodSec: null,
      frequencyHz: null,
      vMin: -1,
      vMax: 1,
      vpp: 2,
      vAvg: 0,
      dutyCyclePercent: null,
      timeConstantSec: null,
    };
  }

  const freq = Math.max(0.1, config.frequencyHz);
  const period = 1 / freq;
  const duty = config.mode === 'square' ? 50 : config.mode === 'pwm' ? Math.max(1, Math.min(99, config.dutyCyclePercent ?? 50)) : null;

  if (config.mode === 'sine') {
    const half = config.amplitudeV / 2;
    return {
      mode: config.mode,
      periodSec: period,
      frequencyHz: freq,
      vMin: offset - half,
      vMax: offset + half,
      vpp: config.amplitudeV,
      vAvg: offset,
      dutyCyclePercent: null,
      timeConstantSec: null,
    };
  }

  return {
    mode: config.mode,
    periodSec: period,
    frequencyHz: freq,
    vMin: offset,
    vMax: offset + config.amplitudeV,
    vpp: config.amplitudeV,
    vAvg: offset + config.amplitudeV * ((duty ?? 50) / 100),
    dutyCyclePercent: duty,
    timeConstantSec: null,
  };
}
