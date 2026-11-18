import React, { useState } from 'react';
import { breadboardHoleToBusId } from '@kimovolt/simulation';
import { GRID_PX } from './geometry';

export const BreadboardLayer: React.FC = () => {
  const [hoveredBus, setHoveredBus] = useState<string | null>(null);
  const cols = 24;
  const startX = 2 * GRID_PX;
  const pitch = GRID_PX;
  const boardW = cols * pitch + 2 * pitch;
  const boardH = 12 * pitch;

  const railRows = [
    { prefix: 'tp', y: 1.5 * pitch, stroke: 'var(--coral)', label: '+' },
    { prefix: 'tn', y: 2.5 * pitch, stroke: 'var(--cyan)', label: '−' },
    { prefix: 'bn', y: 10.5 * pitch, stroke: 'var(--cyan)', label: '−' },
    { prefix: 'bp', y: 11.5 * pitch, stroke: 'var(--coral)', label: '+' },
  ];

  const upperRows = ['e', 'd', 'c', 'b', 'a'];
  const lowerRows = ['f', 'g', 'h', 'i', 'j'];

  return (
    <g aria-label="Solderless breadboard contact matrix">
      {/* Main board chassis */}
      <rect
        x={startX - pitch}
        y={pitch * 0.6}
        width={boardW}
        height={boardH}
        rx={8}
        fill="var(--surface)"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
      />
      {/* Center DIP isolation trench */}
      <rect
        x={startX - pitch * 0.4}
        y={6.2 * pitch}
        width={boardW - pitch * 1.2}
        height={0.6 * pitch}
        rx={3}
        fill="var(--bg)"
        stroke="var(--border)"
      />

      {/* Power rails */}
      {railRows.map((rail) => {
        const bus = `bb_rail_${rail.prefix}`;
        const active = hoveredBus === bus;
        return (
          <g key={rail.prefix}>
            <line
              x1={startX}
              y1={rail.y}
              x2={startX + (cols - 1) * pitch}
              y2={rail.y}
              stroke={rail.stroke}
              strokeWidth={active ? 3 : 1}
              opacity={active ? 0.9 : 0.35}
            />
            <text x={startX - 18} y={rail.y + 4} fill={rail.stroke} fontSize="12" fontWeight="700" className="kv-mono">
              {rail.label}
            </text>
            {Array.from({ length: cols }, (_, c) => (
              <rect
                key={c}
                x={startX + c * pitch - 3.5}
                y={rail.y - 3.5}
                width={7}
                height={7}
                rx={1.5}
                fill={active ? rail.stroke : 'var(--bg)'}
                stroke={active ? rail.stroke : 'var(--border-strong)'}
                onMouseEnter={() => setHoveredBus(bus)}
                onMouseLeave={() => setHoveredBus(null)}
              />
            ))}
          </g>
        );
      })}

      {/* Vertical 5-hole terminal columns */}
      {Array.from({ length: cols }, (_, cIdx) => {
        const colNum = cIdx + 1;
        const x = startX + cIdx * pitch;
        const upBus = breadboardHoleToBusId(`${colNum}a`);
        const lowBus = breadboardHoleToBusId(`${colNum}f`);
        const upActive = hoveredBus === upBus;
        const lowActive = hoveredBus === lowBus;

        return (
          <g key={colNum}>
            <text x={x} y={3.4 * pitch} textAnchor="middle" fill="var(--muted)" fontSize="9" className="kv-mono">
              {colNum}
            </text>
            {upActive && (
              <rect
                x={x - 6}
                y={3.65 * pitch}
                width={12}
                height={2.35 * pitch}
                rx={3}
                fill="rgba(86, 214, 208, 0.16)"
                stroke="var(--cyan)"
                strokeWidth="1"
              />
            )}
            {lowerRows && lowActive && (
              <rect
                x={x - 6}
                y={7.05 * pitch}
                width={12}
                height={2.35 * pitch}
                rx={3}
                fill="rgba(86, 214, 208, 0.16)"
                stroke="var(--cyan)"
                strokeWidth="1"
              />
            )}

            {upperRows.map((rowChar, rIdx) => {
              const y = (3.8 + rIdx * 0.5) * pitch;
              return (
                <rect
                  key={rowChar}
                  x={x - 3.5}
                  y={y - 3.5}
                  width={7}
                  height={7}
                  rx={1.5}
                  fill={upActive ? 'var(--cyan)' : 'var(--bg)'}
                  stroke={upActive ? 'var(--cyan)' : 'var(--border-strong)'}
                  onMouseEnter={() => setHoveredBus(upBus)}
                  onMouseLeave={() => setHoveredBus(null)}
                />
              );
            })}

            {lowerRows.map((rowChar, rIdx) => {
              const y = (7.2 + rIdx * 0.5) * pitch;
              return (
                <rect
                  key={rowChar}
                  x={x - 3.5}
                  y={y - 3.5}
                  width={7}
                  height={7}
                  rx={1.5}
                  fill={lowActive ? 'var(--cyan)' : 'var(--bg)'}
                  stroke={lowActive ? 'var(--cyan)' : 'var(--border-strong)'}
                  onMouseEnter={() => setHoveredBus(lowBus)}
                  onMouseLeave={() => setHoveredBus(null)}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
