import React from 'react';
import { BAND_SPECS, colorBandsToOhms, type ResistorBandColor } from '@kimovolt/simulation';
import { useApp } from '../state/AppStore';

interface Props {
  mode: 'decode_bands_to_ohms' | 'pick_bands_for_ohms';
  bands: ResistorBandColor[];
  onChangeBands?: (next: ResistorBandColor[]) => void;
}

const DIGIT_COLORS: ResistorBandColor[] = [
  'black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white',
];
const MULT_COLORS: ResistorBandColor[] = [
  'black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'gold', 'silver',
];
const TOL_COLORS: ResistorBandColor[] = ['brown', 'red', 'gold', 'silver'];

export const ResistorColorBandInteractive: React.FC<Props> = ({ mode, bands, onChangeBands }) => {
  const { lang } = useApp();
  const decoded = colorBandsToOhms(bands);

  const setBand = (idx: number, col: ResistorBandColor) => {
    if (!onChangeBands) return;
    const copy = [...bands];
    copy[idx] = col;
    onChangeBands(copy);
  };

  return (
    <div className="kv-panel" style={{ padding: '1rem' }}>
      <svg viewBox="0 0 360 90" style={{ display: 'block', width: '100%', maxInlineSize: 380, marginInline: 'auto', marginBottom: '0.75rem' }} role="img" aria-label="Resistor color band visual">
        <line x1="10" y1="45" x2="350" y2="45" stroke="var(--muted)" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M75,25 Q88,18 115,24 L245,24 Q272,18 285,25 L285,65 Q272,72 245,66 L115,66 Q88,72 75,65 Z"
          fill="#D4BD9A"
          stroke="#6A583E"
          strokeWidth="2"
        />
        {[105, 145, 185, 240].map((x, idx) => {
          const bandColor = bands[idx] ?? 'black';
          return (
            <rect
              key={idx}
              x={x}
              y={23}
              width={16}
              height={44}
              fill={BAND_SPECS[bandColor].hex}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="0.7"
            />
          );
        })}
      </svg>

      {mode === 'pick_bands_for_ohms' && onChangeBands && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.6rem' }}>
            {[
              { idx: 0, label: lang === 'ru' ? '1-я цифра' : 'Band 1', opts: DIGIT_COLORS },
              { idx: 1, label: lang === 'ru' ? '2-я цифра' : 'Band 2', opts: DIGIT_COLORS },
              { idx: 2, label: lang === 'ru' ? 'Множитель' : 'Multiplier', opts: MULT_COLORS },
              { idx: 3, label: lang === 'ru' ? 'Допуск' : 'Tolerance', opts: TOL_COLORS },
            ].map((slot) => (
              <label key={slot.idx} className="kv-field">
                <span style={{ fontSize: '0.78rem' }}>{slot.label}</span>
                <select
                  className="kv-input"
                  value={bands[slot.idx] ?? slot.opts[0]}
                  onChange={(e) => setBand(slot.idx, e.target.value as ResistorBandColor)}
                >
                  {slot.opts.map((c) => (
                    <option key={c} value={c}>
                      {lang === 'ru' ? BAND_SPECS[c].labelRu : BAND_SPECS[c].labelEn}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {decoded && (
            <div className="kv-mono" style={{ fontSize: '0.86rem', color: 'var(--cyan)' }}>
              {lang === 'ru' ? 'Текущая маркировка:' : 'Decoded value:'} {decoded.ohms} Ω ±{decoded.tolerancePercent}%
            </div>
          )}
        </>
      )}
    </div>
  );
};
