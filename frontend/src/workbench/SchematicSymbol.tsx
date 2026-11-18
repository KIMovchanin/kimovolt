import React from 'react';
import {
  BAND_SPECS,
  ohmsToColorBands,
  type CircuitComponent,
  type ComponentSimResult,
  type LogicSimulationResult,
} from '@kimovolt/simulation';
import { GRID_PX } from './geometry';

interface SymbolProps {
  comp: CircuitComponent;
  simResult?: ComponentSimResult;
  logicSim?: LogicSimulationResult | null;
  showPower?: boolean;
  onToggleInteractive?: (compId: string) => void;
}

const LED_HEX: Record<string, string> = {
  red: '#FF4B47',
  amber: '#FFAF38',
  green: '#82F26B',
  blue: '#4FA8FF',
  white: '#F4F7FF',
};

export const SchematicSymbol: React.FC<SymbolProps> = ({
  comp,
  simResult,
  logicSim,
  showPower,
  onToggleInteractive,
}) => {
  const G = GRID_PX;
  const cx = comp.position.x * G;
  const cy = comp.position.y * G;
  const powerHeat =
    showPower && simResult?.powerWatts
      ? Math.min(1, simResult.powerWatts / (comp.params.powerRating ?? 0.25))
      : 0;

  const isFaulty = simResult?.state === 'overcurrent' || simResult?.state === 'overpower' || simResult?.state === 'blown' || simResult?.state === 'short_circuit';

  const handleInteractiveClick = (e: React.MouseEvent) => {
    if (comp.type === 'switch_spst' || comp.type === 'pushbutton' || comp.type === 'logic_input') {
      e.stopPropagation();
      onToggleInteractive?.(comp.id);
    }
  };

  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${comp.rotation})`}>
      {/* Thermal overlay when Show Power active */}
      {powerHeat > 0.04 && (
        <circle
          cx={0}
          cy={0}
          r={24 + powerHeat * 14}
          fill={powerHeat > 0.9 ? 'rgba(255, 116, 108, 0.32)' : 'rgba(245, 160, 90, 0.22)'}
          pointerEvents="none"
        />
      )}

      {comp.type === 'voltage_source' && (
        <g>
          <line x1={0} y1={-2 * G} x2={0} y2={-22} stroke="var(--text)" strokeWidth="2.2" />
          <line x1={0} y1={22} x2={0} y2={2 * G} stroke="var(--text)" strokeWidth="2.2" />
          <circle
            cx={0}
            cy={0}
            r={22}
            fill="var(--surface)"
            stroke={isFaulty ? 'var(--coral)' : 'var(--copper)'}
            strokeWidth="2.2"
          />
          <text x={0} y={-7} textAnchor="middle" fill="var(--copper)" fontSize="13" fontWeight="700" className="kv-mono">
            +
          </text>
          <text x={0} y={15} textAnchor="middle" fill="var(--muted)" fontSize="13" fontWeight="700" className="kv-mono">
            −
          </text>
        </g>
      )}

      {comp.type === 'battery' && (
        <g>
          <line x1={0} y1={-2 * G} x2={0} y2={-9} stroke="var(--text)" strokeWidth="2.2" />
          <line x1={0} y1={9} x2={0} y2={2 * G} stroke="var(--text)" strokeWidth="2.2" />
          {/* Long thin positive plate */}
          <line x1={-16} y1={-9} x2={16} y2={-9} stroke="var(--copper)" strokeWidth="2.6" />
          {/* Short thick negative plate */}
          <line x1={-9} y1={-1} x2={9} y2={-1} stroke="var(--text)" strokeWidth="4" />
          <line x1={-14} y1={5} x2={14} y2={5} stroke="var(--copper)" strokeWidth="2.2" />
          <line x1={-8} y1={11} x2={8} y2={11} stroke="var(--text)" strokeWidth="3.6" />
          <text x={18} y={-12} fill="var(--copper)" fontSize="11" fontWeight="700" className="kv-mono">
            +
          </text>
        </g>
      )}

      {comp.type === 'ground' && (
        <g>
          <line x1={0} y1={-G} x2={0} y2={0} stroke="var(--cyan)" strokeWidth="2.2" />
          <line x1={-16} y1={0} x2={16} y2={0} stroke="var(--cyan)" strokeWidth="2.4" />
          <line x1={-10} y1={6} x2={10} y2={6} stroke="var(--cyan)" strokeWidth="2.2" />
          <line x1={-4} y1={12} x2={4} y2={12} stroke="var(--cyan)" strokeWidth="2.2" />
        </g>
      )}

      {comp.type === 'resistor' && (() => {
        const bands = ohmsToColorBands(comp.params.resistance ?? 330, 4, 5);
        return (
          <g>
            <line x1={-2 * G} y1={0} x2={-26} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <line x1={26} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <rect
              x={-26}
              y={-10}
              width={52}
              height={20}
              rx={2}
              fill="var(--elevated)"
              stroke={isFaulty ? 'var(--coral)' : 'var(--text)'}
              strokeWidth="2"
            />
            {bands.map((b, i) => (
              <rect
                key={i}
                x={-17 + i * 9.5}
                y={-9}
                width={4.5}
                height={18}
                fill={BAND_SPECS[b].hex}
              />
            ))}
          </g>
        );
      })()}

      {comp.type === 'potentiometer' && (
        <g>
          <line x1={-2 * G} y1={0} x2={-26} y2={0} stroke="var(--text)" strokeWidth="2.2" />
          <line x1={26} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
          <rect
            x={-26}
            y={-10}
            width={52}
            height={20}
            rx={2}
            fill="var(--elevated)"
            stroke="var(--text)"
            strokeWidth="2"
          />
          <line x1={0} y1={-2 * G} x2={0} y2={-16} stroke="var(--copper)" strokeWidth="2.2" />
          <polygon points="0,-10 -5,-18 5,-18" fill="var(--copper)" />
        </g>
      )}

      {comp.type === 'led' && (() => {
        const ledHex = LED_HEX[comp.params.color ?? 'red'] ?? '#FF4B47';
        const bright = simResult?.brightness ?? 0;
        const lit = Boolean(simResult?.conducting && bright > 0.02);
        return (
          <g>
            {lit && (
              <circle
                cx={0}
                cy={0}
                r={18 + bright * 16}
                fill={ledHex}
                opacity={Math.min(0.48, 0.14 + bright * 0.28)}
                pointerEvents="none"
              />
            )}
            <line x1={-2 * G} y1={0} x2={-13} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <line x1={13} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <circle
              cx={0}
              cy={0}
              r={21}
              fill={lit ? `color-mix(in srgb, ${ledHex} 24%, var(--surface))` : 'var(--surface)'}
              stroke={isFaulty ? 'var(--coral)' : lit ? ledHex : 'var(--border-strong)'}
              strokeWidth="1.8"
            />
            <polygon
              points="-11,-11 11,0 -11,11"
              fill={lit ? ledHex : 'none'}
              stroke={lit ? ledHex : 'var(--text)'}
              strokeWidth="2"
            />
            <line x1={11} y1={-11} x2={11} y2={11} stroke={lit ? ledHex : 'var(--text)'} strokeWidth="2.4" />
            {/* Light emission arrows */}
            <path d="M4,-15 L12,-24 M12,-24 L7,-23 M12,-24 L11,-19" stroke={lit ? ledHex : 'var(--muted)'} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12,-11 L20,-20 M20,-20 L15,-19 M20,-20 L19,-15" stroke={lit ? ledHex : 'var(--muted)'} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        );
      })()}

      {comp.type === 'diode' && (
        <g>
          <line x1={-2 * G} y1={0} x2={-11} y2={0} stroke="var(--text)" strokeWidth="2.2" />
          <line x1={11} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
          <polygon points="-11,-10 11,0 -11,10" fill="var(--elevated)" stroke="var(--text)" strokeWidth="2" />
          <line x1={11} y1={-10} x2={11} y2={10} stroke="var(--cyan)" strokeWidth="2.8" />
        </g>
      )}

      {comp.type === 'switch_spst' && (() => {
        const closed = Boolean(comp.params.closed) && !comp.faulty;
        return (
          <g data-toggle-id={comp.id} onClick={handleInteractiveClick} style={{ cursor: 'pointer' }}>
            <rect x={-32} y={-22} width={64} height={44} fill="transparent" />
            <line x1={-2 * G} y1={0} x2={-15} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <line x1={15} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <circle cx={-15} cy={0} r={3.5} fill="var(--bg)" stroke="var(--copper)" strokeWidth="2" />
            <circle cx={15} cy={0} r={3.5} fill="var(--bg)" stroke="var(--copper)" strokeWidth="2" />
            <line
              x1={-15}
              y1={0}
              x2={15}
              y2={closed ? 0 : -15}
              stroke={closed ? 'var(--green)' : 'var(--copper)'}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </g>
        );
      })()}

      {comp.type === 'pushbutton' && (() => {
        const pressed = Boolean(comp.params.pressed) && !comp.faulty;
        return (
          <g data-toggle-id={comp.id} onClick={handleInteractiveClick} style={{ cursor: 'pointer' }}>
            <rect x={-32} y={-24} width={64} height={44} fill="transparent" />
            <line x1={-2 * G} y1={0} x2={-15} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <line x1={15} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <circle cx={-15} cy={0} r={3.5} fill="var(--bg)" stroke="var(--cyan)" strokeWidth="2" />
            <circle cx={15} cy={0} r={3.5} fill="var(--bg)" stroke="var(--cyan)" strokeWidth="2" />
            <line
              x1={-15}
              y1={pressed ? 0 : -10}
              x2={15}
              y2={pressed ? 0 : -10}
              stroke={pressed ? 'var(--green)' : 'var(--text)'}
              strokeWidth="2.8"
            />
            <line x1={0} y1={pressed ? 0 : -10} x2={0} y2={pressed ? -11 : -20} stroke="var(--muted)" strokeWidth="2" />
            <rect x={-10} y={pressed ? -15 : -24} width={20} height={5} rx={1.5} fill="var(--copper)" />
          </g>
        );
      })()}

      {comp.type === 'fuse' && (() => {
        const blown = Boolean(simResult?.blown || comp.params.blown);
        return (
          <g>
            <line x1={-2 * G} y1={0} x2={-24} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <line x1={24} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <rect
              x={-24}
              y={-10}
              width={48}
              height={20}
              rx={4}
              fill="var(--surface)"
              stroke={blown ? 'var(--coral)' : 'var(--amber)'}
              strokeWidth="2"
            />
            {blown ? (
              <path d="M-20,0 L-6,-4 M6,4 L20,0" stroke="var(--coral)" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              <path d="M-22,0 C-10,-8 10,8 22,0" fill="none" stroke="var(--amber)" strokeWidth="2.2" />
            )}
          </g>
        );
      })()}

      {(comp.type === 'voltmeter' || comp.type === 'ammeter') && (
        <g>
          <line x1={-2 * G} y1={0} x2={-20} y2={0} stroke="var(--text)" strokeWidth="2.2" />
          <line x1={20} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
          <circle
            cx={0}
            cy={0}
            r={20}
            fill="var(--elevated)"
            stroke={isFaulty ? 'var(--coral)' : 'var(--cyan)'}
            strokeWidth="2.2"
          />
          <text x={0} y={5} textAnchor="middle" fill="var(--cyan)" fontSize="15" fontWeight="700" className="kv-mono">
            {comp.type === 'voltmeter' ? 'V' : 'A'}
          </text>
        </g>
      )}

      {comp.type === 'logic_input' && (() => {
        const hi = Boolean(comp.params.logicLevel);
        return (
          <g data-toggle-id={comp.id} onClick={handleInteractiveClick} style={{ cursor: 'pointer' }}>
            <line x1={18} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <rect
              x={-26}
              y={-16}
              width={44}
              height={32}
              rx={4}
              fill={hi ? 'color-mix(in srgb, var(--green) 22%, var(--surface))' : 'var(--surface)'}
              stroke={hi ? 'var(--green)' : 'var(--border-strong)'}
              strokeWidth="2"
            />
            <text x={-4} y={5} textAnchor="middle" fill={hi ? 'var(--green)' : 'var(--muted)'} fontSize="14" fontWeight="700" className="kv-mono">
              {hi ? '1' : '0'}
            </text>
          </g>
        );
      })()}

      {comp.type === 'logic_output' && (() => {
        const hi = logicSim?.componentOutputs[comp.id] === true;
        return (
          <g>
            <line x1={-2 * G} y1={0} x2={-18} y2={0} stroke="var(--text)" strokeWidth="2.2" />
            <circle
              cx={0}
              cy={0}
              r={18}
              fill={hi ? 'color-mix(in srgb, var(--cyan) 28%, var(--surface))' : 'var(--surface)'}
              stroke={hi ? 'var(--cyan)' : 'var(--border-strong)'}
              strokeWidth="2.2"
            />
            <text x={0} y={5} textAnchor="middle" fill={hi ? 'var(--cyan)' : 'var(--muted)'} fontSize="13" fontWeight="700" className="kv-mono">
              {hi ? 'HIGH' : 'LOW'}
            </text>
          </g>
        );
      })()}

      {comp.type === 'logic_gate' && (() => {
        const kind = comp.params.gateKind ?? 'AND';
        const isNot = kind === 'NOT';
        return (
          <g>
            {isNot ? (
              <line x1={-2 * G} y1={0} x2={-22} y2={0} stroke="var(--text)" strokeWidth="2" />
            ) : (
              <>
                <line x1={-2 * G} y1={-G} x2={-22} y2={-G} stroke="var(--text)" strokeWidth="2" />
                <line x1={-2 * G} y1={G} x2={-22} y2={G} stroke="var(--text)" strokeWidth="2" />
              </>
            )}
            <line x1={22} y1={0} x2={2 * G} y2={0} stroke="var(--text)" strokeWidth="2" />
            <rect
              x={-22}
              y={-28}
              width={44}
              height={56}
              rx={4}
              fill="var(--elevated)"
              stroke="var(--cyan)"
              strokeWidth="2"
            />
            <text x={0} y={4} textAnchor="middle" fill="var(--text)" fontSize="11.5" fontWeight="700" className="kv-mono">
              {kind}
            </text>
          </g>
        );
      })()}
    </g>
  );
};
