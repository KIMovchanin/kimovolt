import { describe, expect, it } from 'vitest';
import {
  colorBandsToOhms,
  computeSignalMetrics,
  E12_SERIES,
  evaluateTruthTable,
  formatMetric,
  measureMultimeter,
  nearestStandardValue,
  ohmsToColorBands,
  parseAndValidateCircuitJson,
  sampleWaveform,
  solveCircuit,
  solveLogicCircuit,
  type CircuitDocument,
} from '../index';

function baseDoc(overrides: Partial<CircuitDocument> = {}): CircuitDocument {
  return {
    schemaVersion: 1,
    id: 'test-circuit',
    name: 'Test Circuit',
    viewMode: 'schematic',
    components: [],
    wires: [],
    ...overrides,
  };
}

describe('Resistor Color Code & Standard Series', () => {
  it('encodes and decodes 330 Ohm 4-band resistor accurately', () => {
    const bands = ohmsToColorBands(330, 4, 5);
    expect(bands).toEqual(['orange', 'orange', 'brown', 'gold']);
    const decoded = colorBandsToOhms(bands);
    expect(decoded).toEqual({ ohms: 330, tolerancePercent: 5 });
  });

  it('encodes and decodes 4.7 kOhm and 10 kOhm 5-band resistors', () => {
    const b47k = ohmsToColorBands(4700, 4, 1);
    expect(b47k).toEqual(['yellow', 'violet', 'red', 'brown']);
    expect(colorBandsToOhms(b47k)?.ohms).toBe(4700);

    const b10k5 = ohmsToColorBands(10_000, 5, 1);
    expect(b10k5).toEqual(['brown', 'black', 'black', 'red', 'brown']);
    expect(colorBandsToOhms(b10k5)?.ohms).toBe(10_000);
  });

  it('finds nearest E12 standard values correctly', () => {
    expect(nearestStandardValue(300, E12_SERIES, true)).toBe(330);
    expect(nearestStandardValue(290, E12_SERIES, false)).toBe(270);
    expect(nearestStandardValue(4500, E12_SERIES, false)).toBe(4700);
  });

  it('formats physical metrics cleanly with SI prefixes', () => {
    expect(formatMetric(3.3, 'V').fullText).toBe('3.30 V');
    expect(formatMetric(0.00908, 'A').fullText).toBe('9.08 mA');
    expect(formatMetric(330, 'Ω').fullText).toBe('330 Ω');
    expect(formatMetric(1250, 'Ω').fullText).toBe('1.25 kΩ');
  });
});

describe('MNA DC Linear Circuit Solver', () => {
  it('solves Ohm law single resistor circuit exactly', () => {
    const doc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: 'V1', params: { voltage: 9 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 1000 }, position: { x: 4, y: 0 }, rotation: 0 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 0, y: 4 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w3', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    });

    const sim = solveCircuit(doc);
    expect(sim.solvable).toBe(true);
    expect(sim.components.r1?.voltageDrop).toBeCloseTo(9, 4);
    expect(sim.components.r1?.current).toBeCloseTo(0.009, 5);
    expect(sim.components.r1?.powerWatts).toBeCloseTo(0.081, 5);
  });

  it('solves textbook LED + 330 Ohm + 5V source + switch correctly (~9.08 mA)', () => {
    const doc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: true }, position: { x: 2, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 4, y: 0 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 6, y: 0 }, rotation: 0 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 0, y: 4 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'sw1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    });

    const closedSim = solveCircuit(doc);
    expect(closedSim.solvable).toBe(true);
    expect(closedSim.components.d1?.conducting).toBe(true);
    expect(closedSim.components.d1?.current).toBeCloseTo(0.00908, 4); // (5 - 2) / 330.5 = 9.077 mA
    expect(closedSim.components.d1?.brightness).toBeGreaterThan(0.5);

    // Open the switch -> LED must turn off cleanly
    doc.components[1]!.params.closed = false;
    const openSim = solveCircuit(doc);
    expect(openSim.solvable).toBe(true);
    expect(openSim.components.d1?.conducting).toBe(false);
    expect(openSim.components.d1?.brightness).toBe(0);
    expect(openSim.diagnostics.some((d) => d.code === 'OPEN_CIRCUIT')).toBe(true);
  });

  it('detects reversed LED polarity without current flow', () => {
    const doc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 2, y: 0 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 4, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'cathode' } },
        { id: 'w3', from: { componentId: 'd1', terminalId: 'anode' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });

    const sim = solveCircuit(doc);
    expect(sim.components.d1?.state).toBe('reverse_biased');
    expect(sim.components.d1?.brightness).toBe(0);
    expect(sim.diagnostics.some((d) => d.code === 'LED_REVERSED')).toBe(true);
  });

  it('flags unprotected LED overcurrent and sandbox magic smoke easter egg', () => {
    const doc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 4, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w2', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });

    const sim = solveCircuit(doc, { sandboxMode: true });
    expect(sim.components.d1?.state).toBe('overcurrent');
    expect(sim.diagnostics.some((d) => d.code === 'LED_OVERCURRENT')).toBe(true);
    expect(sim.diagnostics.some((d) => d.code === 'NO_CURRENT_LIMITING_RESISTOR')).toBe(true);
    expect(sim.diagnostics.some((d) => d.code === 'MAGIC_SMOKE_SANDBOX')).toBe(true);
  });

  it('solves voltage divider series & parallel resistor networks accurately', () => {
    // Series 1k + 2k across 9V => midpoint = 6V, current = 3mA
    const seriesDoc = baseDoc({
      components: [
        { id: 'v1', type: 'battery', label: '9V', params: { voltage: 9 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 1000 }, position: { x: 2, y: 0 }, rotation: 0 },
        { id: 'r2', type: 'resistor', label: 'R2', params: { resistance: 2000 }, position: { x: 4, y: 0 }, rotation: 0 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 0, y: 4 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'r2', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w4', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    });

    const simS = solveCircuit(seriesDoc);
    expect(simS.components.r1?.voltageDrop).toBeCloseTo(3, 4);
    expect(simS.components.r2?.voltageDrop).toBeCloseTo(6, 4);
    expect(simS.components.r1?.current).toBeCloseTo(0.003, 5);

    // Parallel 100 Ohm + 100 Ohm across 10V => Req = 50 Ohm, total I = 200 mA
    const parallelDoc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '10V', params: { voltage: 10 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 100, powerRating: 2 }, position: { x: 2, y: 0 }, rotation: 0 },
        { id: 'r2', type: 'resistor', label: 'R2', params: { resistance: 100, powerRating: 2 }, position: { x: 4, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r2', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w4', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });

    const simP = solveCircuit(parallelDoc);
    expect(simP.components.v1?.current).toBeCloseTo(0.2, 4);
    expect(simP.components.r1?.current).toBeCloseTo(0.1, 4);
    expect(simP.components.r2?.current).toBeCloseTo(0.1, 4);
  });

  it('solves non-trivial Wheatstone bridge circuit via MNA', () => {
    // Unbalanced Wheatstone bridge: V=10V, R1=100, R2=200, R3=300, R4=400, Rbridge=500
    const bridgeDoc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '10V', params: { voltage: 10 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 100 }, position: { x: 2, y: 0 }, rotation: 0 },
        { id: 'r2', type: 'resistor', label: 'R2', params: { resistance: 200 }, position: { x: 2, y: 2 }, rotation: 0 },
        { id: 'r3', type: 'resistor', label: 'R3', params: { resistance: 300 }, position: { x: 4, y: 0 }, rotation: 0 },
        { id: 'r4', type: 'resistor', label: 'R4', params: { resistance: 400 }, position: { x: 4, y: 2 }, rotation: 0 },
        { id: 'rb', type: 'resistor', label: 'Rb', params: { resistance: 500 }, position: { x: 3, y: 1 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r3', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'r2', terminalId: 'a' } },
        { id: 'w4', from: { componentId: 'r3', terminalId: 'b' }, to: { componentId: 'r4', terminalId: 'a' } },
        { id: 'w5', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'rb', terminalId: 'a' } },
        { id: 'w6', from: { componentId: 'r3', terminalId: 'b' }, to: { componentId: 'rb', terminalId: 'b' } },
        { id: 'w7', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w8', from: { componentId: 'r4', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });

    const sim = solveCircuit(bridgeDoc);
    expect(sim.solvable).toBe(true);
    // Exact analytical bridge voltage V_left - V_right for 10V*(200/300 - 400/700) loaded by 500 Ohm:
    // Let's verify KCL at left & right nodes = 0
    const i1 = sim.components.r1!.current!;
    const i2 = sim.components.r2!.current!;
    const ib = sim.components.rb!.current!;
    expect(i1 - i2 - ib).toBeCloseTo(0, 6);
  });

  it('connects pins through breadboard internal contact buses', () => {
    const bbDoc = baseDoc({
      viewMode: 'breadboard',
      components: [
        {
          id: 'v1',
          type: 'voltage_source',
          label: '5V',
          params: { voltage: 5 },
          position: { x: 0, y: 0 },
          rotation: 0,
          breadboardPins: { pos: 'tp_1', neg: 'tn_1' },
        },
        {
          id: 'r1',
          type: 'resistor',
          label: 'R1',
          params: { resistance: 1000 },
          position: { x: 2, y: 0 },
          rotation: 0,
          breadboardPins: { a: '10a', b: '15a' },
        },
        {
          id: 'd1',
          type: 'led',
          label: 'LED1',
          params: { color: 'red' },
          position: { x: 4, y: 0 },
          rotation: 0,
          breadboardPins: { anode: '15e', cathode: '20e' },
        },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        // Notice NO direct wire between r1.b (15a) and d1.anode (15e) — breadboard strip 15_upper connects them!
        { id: 'w2', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });

    const sim = solveCircuit(bbDoc);
    expect(sim.solvable).toBe(true);
    expect(sim.components.d1?.conducting).toBe(true);
    expect(sim.components.d1?.current).toBeCloseTo(0.003, 4);
  });

  it('detects short circuit, conflicting sources, strict ground, fuse blow, and parallel ammeter fault', () => {
    // Short circuit
    const shortDoc = baseDoc({
      components: [{ id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 }],
      wires: [{ id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'v1', terminalId: 'neg' } }],
    });
    const shortSim = solveCircuit(shortDoc);
    expect(shortSim.solvable).toBe(false);
    expect(shortSim.diagnostics.some((d) => d.code === 'SHORT_CIRCUIT')).toBe(true);

    // Conflicting sources
    const conflictDoc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'v2', type: 'voltage_source', label: '9V', params: { voltage: 9 }, position: { x: 2, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'v2', terminalId: 'pos' } },
        { id: 'w2', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'v2', terminalId: 'neg' } },
      ],
    });
    expect(solveCircuit(conflictDoc).diagnostics.some((d) => d.code === 'CONFLICTING_SOURCES')).toBe(true);

    // Strict ground missing
    const noGndDoc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 100 }, position: { x: 2, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });
    expect(solveCircuit(noGndDoc, { strictGround: true }).diagnostics.some((d) => d.code === 'NO_GROUND_REFERENCE')).toBe(true);

    // Fuse blow when current > ratedCurrent
    const fuseDoc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '12V', params: { voltage: 12 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'f1', type: 'fuse', label: 'F1', params: { ratedCurrent: 0.5 }, position: { x: 1, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 10, powerRating: 20 }, position: { x: 2, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'f1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'f1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });
    const fuseSim = solveCircuit(fuseDoc);
    expect(fuseSim.components.f1?.blown).toBe(true);
    expect(fuseSim.components.r1?.current).toBe(0);

    // Parallel Red LED (Vf=2V) + Blue LED (Vf=3.1V) sharing a single resistor across 5V -> Red clamps at ~2V, Blue stays OFF!
    const sharedLedDoc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 2, y: 0 }, rotation: 0 },
        { id: 'd_red', type: 'led', label: 'Red', params: { color: 'red' }, position: { x: 4, y: 0 }, rotation: 0 },
        { id: 'd_blue', type: 'led', label: 'Blue', params: { color: 'blue' }, position: { x: 4, y: 2 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd_red', terminalId: 'anode' } },
        { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd_blue', terminalId: 'anode' } },
        { id: 'w4', from: { componentId: 'd_red', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w5', from: { componentId: 'd_blue', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });
    const sharedLedSim = solveCircuit(sharedLedDoc);
    expect(sharedLedSim.components.d_red?.conducting).toBe(true);
    expect(sharedLedSim.components.d_blue?.conducting).toBe(false);
    expect(sharedLedSim.components.d_blue?.brightness).toBe(0);

    // Ammeter in parallel across source
    const parallelAmmDoc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'a1', type: 'ammeter', label: 'A1', params: { maxCurrent: 1 }, position: { x: 2, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'a1', terminalId: 'pos' } },
        { id: 'w2', from: { componentId: 'a1', terminalId: 'neg' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });
    const ammSim = solveCircuit(parallelAmmDoc);
    expect(ammSim.solvable).toBe(false);
    expect(ammSim.diagnostics.some((d) => d.code === 'AMMETER_PARALLEL_FAULT')).toBe(true);
  });

  it('supports virtual multimeter voltage, ohmmeter, and parallel-ammeter protection', () => {
    const doc = baseDoc({
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V', params: { voltage: 5 }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: true }, position: { x: 1, y: 0 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 1000 }, position: { x: 2, y: 0 }, rotation: 0 },
        { id: 'r2', type: 'resistor', label: 'R2', params: { resistance: 1000 }, position: { x: 4, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'sw1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'r2', terminalId: 'a' } },
        { id: 'w4', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    });

    const sim = solveCircuit(doc);
    const vReading = measureMultimeter(doc, sim, {
      mode: 'dc_v',
      posPin: { componentId: 'r2', terminalId: 'a' },
      negPin: { componentId: 'r2', terminalId: 'b' },
    });
    expect(vReading.valid).toBe(true);
    expect(vReading.value).toBeCloseTo(2.5, 2);

    // Parallel ammeter across powered R2 blows probe protection
    const badMa = measureMultimeter(doc, sim, {
      mode: 'dc_ma',
      posPin: { componentId: 'r1', terminalId: 'a' },
      negPin: { componentId: 'r2', terminalId: 'b' },
    });
    expect(badMa.valid).toBe(false);
    expect(badMa.warningCode).toBe('AMMETER_PARALLEL_FAULT');

    // Open switch and measure resistance of R1+R2 = 2000 Ohm
    doc.components[1]!.params.closed = false;
    const openSim = solveCircuit(doc);
    const ohmReading = measureMultimeter(doc, openSim, {
      mode: 'ohm',
      posPin: { componentId: 'r1', terminalId: 'a' },
      negPin: { componentId: 'r2', terminalId: 'b' },
    });
    expect(ohmReading.valid).toBe(true);
    expect(ohmReading.value).toBeCloseTo(2000, 0);
  });
});

describe('Logic Gate Solver & Waveform / Security Validator', () => {
  it('evaluates full truth table for AND + NOT gates and detects combinational cycles', () => {
    const logicDoc = baseDoc({
      components: [
        { id: 'in1', type: 'logic_input', label: 'A', params: { logicLevel: false }, position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'in2', type: 'logic_input', label: 'B', params: { logicLevel: false }, position: { x: 0, y: 2 }, rotation: 0 },
        { id: 'g1', type: 'logic_gate', label: 'AND1', params: { gateKind: 'AND' }, position: { x: 3, y: 1 }, rotation: 0 },
        { id: 'g2', type: 'logic_gate', label: 'NOT1', params: { gateKind: 'NOT' }, position: { x: 6, y: 1 }, rotation: 0 },
        { id: 'out1', type: 'logic_output', label: 'Y', params: {}, position: { x: 9, y: 1 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'in1', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inA' } },
        { id: 'w2', from: { componentId: 'in2', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inB' } },
        { id: 'w3', from: { componentId: 'g1', terminalId: 'out' }, to: { componentId: 'g2', terminalId: 'inA' } },
        { id: 'w4', from: { componentId: 'g2', terminalId: 'out' }, to: { componentId: 'out1', terminalId: 'in' } },
      ],
    });

    const tt = evaluateTruthTable(logicDoc);
    expect(tt.hasCycle).toBe(false);
    expect(tt.rows.length).toBe(4);
    // NAND behavior: true, true, true, false
    expect(tt.rows.map((r) => r.outputs.out1)).toEqual([true, true, true, false]);

    // Combinational loop test
    const cycleDoc = baseDoc({
      components: [
        { id: 'g1', type: 'logic_gate', label: 'NOT', params: { gateKind: 'NOT' }, position: { x: 0, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'g1', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inA' } },
      ],
    });
    expect(solveLogicCircuit(cycleDoc).hasCycle).toBe(true);
  });

  it('samples PWM and RC waveforms with exact analytical metrics', () => {
    const pwmCfg = { mode: 'pwm' as const, amplitudeV: 5, frequencyHz: 1000, dutyCyclePercent: 25 };
    const pts = sampleWaveform(pwmCfg, 0.002, 200);
    expect(pts.length).toBe(200);
    const metrics = computeSignalMetrics(pwmCfg);
    expect(metrics.periodSec).toBeCloseTo(0.001, 6);
    expect(metrics.vAvg).toBeCloseTo(1.25, 3);

    const rcMetrics = computeSignalMetrics({
      mode: 'rc_charge',
      amplitudeV: 5,
      frequencyHz: 100,
      resistanceOhms: 1000,
      capacitanceFarads: 100e-6,
    });
    expect(rcMetrics.timeConstantSec).toBeCloseTo(0.1, 6);
  });

  it('rejects oversized payloads and prototype-pollution JSON imports safely', () => {
    const evilJson = '{"schemaVersion":1,"__proto__":{"polluted":true},"components":[],"wires":[]}';
    const res1 = parseAndValidateCircuitJson(evilJson);
    expect(res1.ok).toBe(false);
    if (!res1.ok) expect(res1.errorCode).toBe('UNSAFE_KEYS');

    const hugeJson = ' '.repeat(300 * 1024);
    const res2 = parseAndValidateCircuitJson(hugeJson);
    expect(res2.ok).toBe(false);
    if (!res2.ok) expect(res2.errorCode).toBe('PAYLOAD_TOO_LARGE');
  });
});
