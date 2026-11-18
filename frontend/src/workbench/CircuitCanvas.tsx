import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  formatMetric,
  type CircuitComponent,
  type CircuitDocument,
  type CircuitWire,
  type LogicSimulationResult,
  type PinRef,
  type SimulationResult,
} from '@kimovolt/simulation';
import { useApp } from '../state/AppStore';
import { labSound } from '../utils/sound';
import { BreadboardLayer } from './BreadboardLayer';
import { getAbsoluteTerminalPos, getAllAbsoluteTerminals, GRID_PX, orthogonalWirePath } from './geometry';
import { SchematicSymbol } from './SchematicSymbol';

export interface OverlayOptions {
  showCurrent: boolean;
  showVoltage: boolean;
  showPower: boolean;
  xrayMode: boolean;
}

export interface MultimeterProbeState {
  activePicker: 'pos' | 'neg' | null;
  posPin: PinRef | null;
  negPin: PinRef | null;
}

interface CircuitCanvasProps {
  doc: CircuitDocument;
  sim: SimulationResult;
  logicSim?: LogicSimulationResult | null;
  overlays: OverlayOptions;
  readOnlyStructure?: boolean;
  selectedId: string | null;
  onSelect: (id: string | null, kind: 'component' | 'wire' | null) => void;
  onChangeDoc: (next: CircuitDocument, recordHistory?: boolean) => void;
  probeState?: MultimeterProbeState;
  onPickProbePin?: (role: 'pos' | 'neg', pin: PinRef) => void;
  compactHeight?: number;
}

const WIRE_COLORS = {
  copper: 'var(--copper)',
  red: 'var(--coral)',
  black: 'var(--muted)',
  cyan: 'var(--cyan)',
  green: 'var(--green)',
  amber: 'var(--amber)',
} as const;

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  doc,
  sim,
  logicSim,
  overlays,
  readOnlyStructure = false,
  selectedId,
  onSelect,
  onChangeDoc,
  probeState,
  onPickProbePin,
  compactHeight,
}) => {
  const { lang, t, announce } = useApp();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [wireStart, setWireStart] = useState<PinRef | null>(null);
  const [mouseSvg, setMouseSvg] = useState<{ x: number; y: number } | null>(null);
  const [draggingComp, setDraggingComp] = useState<{
    id: string;
    startMouse: { x: number; y: number };
    origPos: { x: number; y: number };
  } | null>(null);
  const [panning, setPanning] = useState<{
    startMouse: { x: number; y: number };
    origPan: { x: number; y: number };
  } | null>(null);
  const [snapPulsePos, setSnapPulsePos] = useState<{ x: number; y: number; key: number } | null>(null);

  const viewWidth = 680;
  const viewHeight = compactHeight ?? 420;

  const clientToSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const sx = ((clientX - rect.left) / rect.width) * (viewWidth / zoom) - pan.x;
      const sy = ((clientY - rect.top) / rect.height) * (viewHeight / zoom) - pan.y;
      return { x: sx, y: sy };
    },
    [pan.x, pan.y, viewHeight, viewWidth, zoom]
  );

  const compMap = useMemo(() => {
    const m = new Map<string, CircuitComponent>();
    for (const c of doc.components) m.set(c.id, c);
    return m;
  }, [doc.components]);

  const toggleInteractive = useCallback(
    (compId: string) => {
      const next: CircuitDocument = {
        ...doc,
        components: doc.components.map((c) => {
          if (c.id !== compId) return c;
          if (c.type === 'switch_spst') {
            return { ...c, params: { ...c.params, closed: !c.params.closed } };
          }
          if (c.type === 'pushbutton') {
            return { ...c, params: { ...c.params, pressed: !c.params.pressed } };
          }
          if (c.type === 'logic_input') {
            return { ...c, params: { ...c.params, logicLevel: !c.params.logicLevel } };
          }
          return c;
        }),
      };
      labSound.playSwitchClick();
      onChangeDoc(next, true);
    },
    [doc, onChangeDoc]
  );

  const handleTerminalActivate = useCallback(
    (pin: PinRef, absPos: { x: number; y: number }) => {
      if (probeState?.activePicker && onPickProbePin) {
        onPickProbePin(probeState.activePicker, pin);
        labSound.playWireSnap();
        setSnapPulsePos({ x: absPos.x, y: absPos.y, key: Date.now() });
        announce(
          lang === 'ru'
            ? `Щуп подключён к ${pin.componentId}:${pin.terminalId}`
            : `Probe attached to ${pin.componentId}:${pin.terminalId}`
        );
        return;
      }

      if (readOnlyStructure) return;

      if (!wireStart) {
        setWireStart(pin);
        setMouseSvg(absPos);
        announce(
          lang === 'ru'
            ? `Начато соединение от ${pin.componentId}:${pin.terminalId}. Выберите второй контакт.`
            : `Started wire at ${pin.componentId}:${pin.terminalId}. Select target terminal.`
        );
        return;
      }

      if (wireStart.componentId === pin.componentId && wireStart.terminalId === pin.terminalId) {
        setWireStart(null);
        return;
      }

      // Avoid duplicate wire between identical pin pair
      const duplicate = doc.wires.some(
        (w) =>
          (w.from.componentId === wireStart.componentId &&
            w.from.terminalId === wireStart.terminalId &&
            w.to.componentId === pin.componentId &&
            w.to.terminalId === pin.terminalId) ||
          (w.to.componentId === wireStart.componentId &&
            w.to.terminalId === wireStart.terminalId &&
            w.from.componentId === pin.componentId &&
            w.from.terminalId === pin.terminalId)
      );

      if (!duplicate) {
        const newWire: CircuitWire = {
          id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          from: wireStart,
          to: pin,
          color: 'copper',
        };
        onChangeDoc({ ...doc, wires: [...doc.wires, newWire] }, true);
        labSound.playWireSnap();
        setSnapPulsePos({ x: absPos.x, y: absPos.y, key: Date.now() });
        announce(lang === 'ru' ? 'Провод соединён' : 'Wire connected');
      }
      setWireStart(null);
    },
    [announce, doc, lang, onChangeDoc, onPickProbePin, probeState?.activePicker, readOnlyStructure, wireStart]
  );

  // Clear pulse effect after 450ms
  useEffect(() => {
    if (!snapPulsePos) return;
    const id = window.setTimeout(() => setSnapPulsePos(null), 450);
    return () => window.clearTimeout(id);
  }, [snapPulsePos]);

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(e.clientX, e.clientY);
    if (wireStart) setMouseSvg(pt);
    if (draggingComp && !readOnlyStructure) {
      const dxGrid = Math.round((pt.x - draggingComp.startMouse.x) / GRID_PX);
      const dyGrid = Math.round((pt.y - draggingComp.startMouse.y) / GRID_PX);
      const nx = Math.max(1, Math.min(24, draggingComp.origPos.x + dxGrid));
      const ny = Math.max(1, Math.min(14, draggingComp.origPos.y + dyGrid));
      const next: CircuitDocument = {
        ...doc,
        components: doc.components.map((c) =>
          c.id === draggingComp.id ? { ...c, position: { x: nx, y: ny } } : c
        ),
      };
      onChangeDoc(next, false);
    } else if (panning) {
      const dx = pt.x - panning.startMouse.x;
      const dy = pt.y - panning.startMouse.y;
      setPan({ x: panning.origPan.x + dx, y: panning.origPan.y + dy });
    }
  };

  const handleSvgPointerUp = () => {
    if (draggingComp) {
      onChangeDoc(doc, true);
      setDraggingComp(null);
    }
    if (panning) setPanning(null);
  };

  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setWireStart(null);
      onSelect(null, null);
      return;
    }
    if (readOnlyStructure) return;

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      const comp = compMap.get(selectedId);
      if (comp && !comp.locked) {
        onChangeDoc(
          {
            ...doc,
            components: doc.components.filter((c) => c.id !== selectedId),
            wires: doc.wires.filter((w) => w.from.componentId !== selectedId && w.to.componentId !== selectedId),
          },
          true
        );
        onSelect(null, null);
      } else {
        const wire = doc.wires.find((w) => w.id === selectedId);
        if (wire && !wire.locked) {
          onChangeDoc({ ...doc, wires: doc.wires.filter((w) => w.id !== selectedId) }, true);
          onSelect(null, null);
        }
      }
      return;
    }

    if ((e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') && selectedId) {
      const comp = compMap.get(selectedId);
      if (comp && !comp.locked) {
        e.preventDefault();
        const nextRot = ((comp.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        onChangeDoc(
          {
            ...doc,
            components: doc.components.map((c) => (c.id === selectedId ? { ...c, rotation: nextRot } : c)),
          },
          true
        );
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D') && selectedId) {
      const comp = compMap.get(selectedId);
      if (comp) {
        e.preventDefault();
        const clone: CircuitComponent = {
          ...comp,
          id: `${comp.type.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
          label: `${comp.label || comp.type}_2`,
          locked: false,
          position: { x: comp.position.x + 2, y: comp.position.y + 1 },
        };
        onChangeDoc({ ...doc, components: [...doc.components, clone] }, true);
        onSelect(clone.id, 'component');
      }
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedId) {
      const comp = compMap.get(selectedId);
      if (comp && !comp.locked) {
        e.preventDefault();
        const dx = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        const dy = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        onChangeDoc(
          {
            ...doc,
            components: doc.components.map((c) =>
              c.id === selectedId ? { ...c, position: { x: c.position.x + dx, y: c.position.y + dy } } : c
            ),
          },
          true
        );
      }
    }
  };

  // Helper to get voltage color for node overlay
  const getVoltageStroke = (netId?: string) => {
    if (!overlays.showVoltage || !netId) return null;
    const v = sim.netVoltages[netId];
    if (v === null || v === undefined) return 'var(--muted)';
    if (Math.abs(v) < 0.05) return 'var(--cyan)';
    if (v > 3.5) return 'var(--copper)';
    return 'var(--amber)';
  };

  const viewBoxStr = `${-pan.x} ${-pan.y} ${viewWidth / zoom} ${viewHeight / zoom}`;

  return (
    <div
      className="kv-panel"
      tabIndex={0}
      onKeyDown={handleCanvasKeyDown}
      aria-label={lang === 'ru' ? 'Рабочее поле электрической схемы' : 'Interactive circuit canvas'}
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}
    >
      {/* Top-right compact zoom controls */}
      <div
        style={{
          position: 'absolute',
          insetBlockStart: 8,
          insetInlineEnd: 8,
          zIndex: 5,
          display: 'flex',
          gap: '0.25rem',
          background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
          padding: '0.25rem',
          borderRadius: 4,
          border: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          className="kv-btn kv-btn-sm"
          aria-label={lang === 'ru' ? 'Уменьшить масштаб' : 'Zoom out'}
          onClick={() => setZoom((z) => Math.max(0.65, Math.round((z - 0.15) * 100) / 100))}
        >
          −
        </button>
        <button
          type="button"
          className="kv-btn kv-btn-sm kv-mono"
          aria-label={lang === 'ru' ? 'Сбросить вид' : 'Reset view'}
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          className="kv-btn kv-btn-sm"
          aria-label={lang === 'ru' ? 'Увеличить масштаб' : 'Zoom in'}
          onClick={() => setZoom((z) => Math.min(1.8, Math.round((z + 0.15) * 100) / 100))}
        >
          +
        </button>
      </div>

      {/* Probe active banner */}
      {probeState?.activePicker && (
        <div
          style={{
            position: 'absolute',
            insetBlockStart: 8,
            insetInlineStart: 8,
            zIndex: 5,
            padding: '0.35rem 0.65rem',
            borderRadius: 4,
            border: `1px solid ${probeState.activePicker === 'pos' ? 'var(--coral)' : 'var(--cyan)'}`,
            background: 'var(--elevated)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {probeState.activePicker === 'pos'
            ? lang === 'ru'
              ? 'Нажми на любой контакт для КРАСНОГО щупа (+)'
              : 'Click any terminal to place RED probe (+)'
            : lang === 'ru'
              ? 'Нажми на любой контакт для ЧЁРНОГО щупа (−)'
              : 'Click any terminal to place BLACK probe (-)'}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={viewBoxStr}
        style={{
          display: 'block',
          width: '100%',
          height: compactHeight ? `${compactHeight}px` : 'clamp(340px, 56dvh, 560px)',
          touchAction: 'none',
          cursor: wireStart || probeState?.activePicker ? 'crosshair' : panning ? 'grabbing' : 'default',
        }}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerDown={(e) => {
          if (e.target === svgRef.current || (e.target as Element).getAttribute('data-bg-grid') === 'true') {
            if (wireStart) {
              setWireStart(null);
            } else {
              onSelect(null, null);
              const pt = clientToSvg(e.clientX, e.clientY);
              setPanning({ startMouse: pt, origPan: pan });
            }
          }
        }}
      >
        <defs>
          <pattern id="kv-grid-minor" width={GRID_PX} height={GRID_PX} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_PX} 0 L 0 0 0 ${GRID_PX}`} fill="none" stroke="var(--grid-line)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect
          data-bg-grid="true"
          x={-1000}
          y={-1000}
          width={3000}
          height={2000}
          fill="url(#kv-grid-minor)"
        />

        {doc.viewMode === 'breadboard' && <BreadboardLayer />}

        {/* Wires layer */}
        {doc.wires.map((wire, wIdx) => {
          const fromComp = compMap.get(wire.from.componentId);
          const toComp = compMap.get(wire.to.componentId);
          if (!fromComp || !toComp) return null;
          const p1 = getAbsoluteTerminalPos(fromComp, wire.from.terminalId);
          const p2 = getAbsoluteTerminalPos(toComp, wire.to.terminalId);
          if (!p1 || !p2) return null;

          const wireSim = sim.wires[wire.id];
          const isSelected = selectedId === wire.id;
          const netId = wireSim?.netId;
          const voltColor = getVoltageStroke(netId);
          const baseColor = isSelected
            ? 'var(--amber)'
            : voltColor ?? WIRE_COLORS[wire.color ?? 'copper'];

          // Determine flow direction (from higher potential to lower potential if voltage differs)
          const pathD = orthogonalWirePath(p1.x, p1.y, p2.x, p2.y, (wIdx % 3) - 1);
          const showFlow = overlays.showCurrent && sim.hasActiveCurrent && wireSim?.energized;

          return (
            <g
              key={wire.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(wire.id, 'wire');
              }}
              style={{ cursor: wire.locked ? 'default' : 'pointer' }}
            >
              {/* Wide hit target */}
              <path d={pathD} fill="none" stroke="transparent" strokeWidth="14" />
              <path
                d={pathD}
                fill="none"
                stroke={baseColor}
                strokeWidth={isSelected ? 3.8 : 2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
              {showFlow && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--text)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="kv-wire-flow"
                  opacity={0.85}
                />
              )}
            </g>
          );
        })}

        {/* Active ghost wire while connecting */}
        {wireStart && mouseSvg && (() => {
          const c = compMap.get(wireStart.componentId);
          const p1 = c ? getAbsoluteTerminalPos(c, wireStart.terminalId) : null;
          if (!p1) return null;
          return (
            <path
              d={orthogonalWirePath(p1.x, p1.y, mouseSvg.x, mouseSvg.y)}
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="2.4"
              strokeDasharray="6 4"
              pointerEvents="none"
            />
          );
        })()}

        {/* Components layer */}
        {doc.components.map((comp) => {
          const isSelected = selectedId === comp.id;
          const compSim = sim.components[comp.id];
          const terms = getAllAbsoluteTerminals(comp);
          const cx = comp.position.x * GRID_PX;
          const cy = comp.position.y * GRID_PX;
          const isDragging = draggingComp?.id === comp.id;

          return (
            <g
              key={comp.id}
              data-comp-id={comp.id}
              transform={isDragging ? 'translate(0, -3)' : undefined}
              style={{
                filter: isDragging ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.45))' : undefined,
                cursor: comp.locked || readOnlyStructure ? 'pointer' : 'grab',
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelect(comp.id, 'component');
                if (!comp.locked && !readOnlyStructure) {
                  const pt = clientToSvg(e.clientX, e.clientY);
                  setDraggingComp({ id: comp.id, startMouse: pt, origPos: { ...comp.position } });
                }
              }}
            >
              {/* Selection boundary + hit padding area */}
              <rect
                x={cx - 34}
                y={cy - 32}
                width={68}
                height={64}
                rx={6}
                fill="transparent"
                stroke={isSelected ? 'var(--cyan)' : 'transparent'}
                strokeWidth="1.5"
                strokeDasharray={isSelected ? '4 3' : undefined}
              />

              <SchematicSymbol
                comp={comp}
                simResult={compSim}
                logicSim={logicSim}
                showPower={overlays.showPower}
                onToggleInteractive={toggleInteractive}
              />

              {/* Component reference label positioned away from terminal leads */}
              {comp.label && (() => {
                const isVertTwoPin =
                  comp.type === 'voltage_source' ||
                  comp.type === 'battery' ||
                  comp.rotation === 90 ||
                  comp.rotation === 270;
                const cleanLabel =
                  comp.type === 'resistor'
                    ? comp.label.replace(/\s*\([^)]*\)/g, '')
                    : comp.label;
                const fullText =
                  comp.type === 'resistor' && comp.params.resistance
                    ? `${cleanLabel} · ${formatMetric(comp.params.resistance, 'Ω').fullText}`
                    : cleanLabel;
                const lx = isVertTwoPin ? cx - 30 : cx;
                const ly = comp.type === 'ground' ? cy + 26 : isVertTwoPin ? cy + 4 : cy + 27;
                return (
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={isVertTwoPin ? 'end' : 'middle'}
                    fill={isSelected ? 'var(--cyan)' : 'var(--muted)'}
                    fontSize="10.2"
                    fontWeight="600"
                    className="kv-mono"
                    pointerEvents="none"
                  >
                    {fullText}
                  </text>
                );
              })()}

              {/* X-Ray Telemetry Overlay */}
              {overlays.xrayMode && compSim && comp.type !== 'ground' && (
                <g transform={`translate(${cx}, ${cy - 34})`} pointerEvents="none">
                  <rect
                    x={-48}
                    y={-15}
                    width={96}
                    height={17}
                    rx={3}
                    fill="var(--elevated)"
                    stroke="var(--cyan)"
                    strokeWidth="0.9"
                    opacity={0.95}
                  />
                  <text
                    x={0}
                    y={-3}
                    textAnchor="middle"
                    fill="var(--cyan)"
                    fontSize="8.8"
                    className="kv-mono"
                  >
                    {compSim.voltageDrop !== null ? `${compSim.voltageDrop.toFixed(2)}V` : '—'}{' '}
                    {compSim.current !== null ? `| ${(compSim.current * 1000).toFixed(1)}mA` : ''}
                  </text>
                </g>
              )}

              {/* Terminal connection pins (keyboard focusable + pointer clickable) */}
              {terms.map(({ def, x, y }) => {
                const pin: PinRef = { componentId: comp.id, terminalId: def.id };
                const isWireOrigin =
                  wireStart?.componentId === comp.id && wireStart?.terminalId === def.id;
                const isPosProbe =
                  probeState?.posPin?.componentId === comp.id &&
                  probeState?.posPin?.terminalId === def.id;
                const isNegProbe =
                  probeState?.negPin?.componentId === comp.id &&
                  probeState?.negPin?.terminalId === def.id;

                const pinNetId = sim.pinToNet[`${comp.id}:${def.id}`];
                const isRefNode = pinNetId && pinNetId === sim.referenceNetId;

                return (
                  <g key={def.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isWireOrigin ? 7.5 : 5.5}
                      fill={
                        isPosProbe
                          ? 'var(--coral)'
                          : isNegProbe
                            ? 'var(--cyan)'
                            : isWireOrigin
                              ? 'var(--cyan)'
                              : 'var(--bg)'
                      }
                      stroke={
                        isWireOrigin || wireStart
                          ? 'var(--cyan)'
                          : def.polarity === 'positive' || def.polarity === 'anode'
                            ? 'var(--copper)'
                            : 'var(--text)'
                      }
                      strokeWidth="2"
                      role="button"
                      tabIndex={0}
                      aria-label={`${comp.label || comp.type} ${def.label}`}
                      style={{ cursor: 'crosshair' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTerminalActivate(pin, { x, y });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTerminalActivate(pin, { x, y });
                        }
                      }}
                    />

                    {/* Reference node 0V tag in Voltage or X-Ray mode */}
                    {(overlays.showVoltage || overlays.xrayMode) && isRefNode && comp.type === 'ground' && (
                      <text x={x + 12} y={y + 4} fill="var(--cyan)" fontSize="9" className="kv-mono">
                        0.00 V REF
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Connection pulse effect */}
        {snapPulsePos && (
          <circle
            key={snapPulsePos.key}
            cx={snapPulsePos.x}
            cy={snapPulsePos.y}
            r={16}
            fill="none"
            stroke="var(--green)"
            strokeWidth="2.5"
            opacity={0.75}
            pointerEvents="none"
          />
        )}
      </svg>

      {/* Bottom status bar inside canvas */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.75rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          fontSize: '0.76rem',
          color: 'var(--muted)',
        }}
      >
        <span>
          {wireStart
            ? lang === 'ru'
              ? `Провод от ${wireStart.componentId}:${wireStart.terminalId} — кликни второй контакт (Esc отмена)`
              : `Wiring from ${wireStart.componentId}:${wireStart.terminalId} — click destination pin (Esc cancels)`
            : lang === 'ru'
              ? 'Кликни по контакту (○) чтобы соединить проводом · Клик по SW/BTN переключает'
              : 'Click any terminal (○) to draw wire · Click SW/BTN to toggle'}
        </span>
        {overlays.showCurrent && <span>{t.workbench.currentDisclaimer}</span>}
      </div>
    </div>
  );
};
