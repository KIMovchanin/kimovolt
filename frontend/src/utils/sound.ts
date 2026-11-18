/**
 * Procedural Web Audio synthesizer for subtle, muted engineering micro-sounds.
 * Strictly disabled by default; plays only when the user enables sound and interacts.
 */
class LabSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(freq: number, durationSec: number, type: OscillatorType, gainPeak = 0.045, delaySec = 0): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  playSwitchClick(): void {
    this.tone(420, 0.045, 'triangle', 0.04);
  }

  playWireSnap(): void {
    this.tone(680, 0.055, 'sine', 0.035);
  }

  playSuccessChime(): void {
    this.tone(523.25, 0.14, 'sine', 0.04, 0);
    this.tone(659.25, 0.18, 'sine', 0.04, 0.09);
  }

  playContinuityBeep(): void {
    this.tone(1950, 0.12, 'sine', 0.025);
  }

  playWarningTick(): void {
    this.tone(240, 0.09, 'triangle', 0.035);
  }
}

export const labSound = new LabSoundEngine();
