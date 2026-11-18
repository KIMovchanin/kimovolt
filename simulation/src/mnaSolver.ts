import { buildNetlist, pinKeyString } from './netlist';
import {
  LED_FORWARD_VOLTAGE,
  type CircuitComponent,
  type CircuitDocument,
} from './schema';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export type DiagnosticCode =
  | 'NO_GROUND_REFERENCE'
  | 'AUTO_GROUND_ASSIGNED'
  | 'SHORT_CIRCUIT'
  | 'CONFLICTING_SOURCES'
  | 'OPEN_CIRCUIT'
  | 'FLOATING_NODES'
  | 'LED_REVERSED'
  | 'LED_OVERCURRENT'
  | 'NO_CURRENT_LIMITING_RESISTOR'
  | 'RESISTOR_OVERPOWER'
  | 'FUSE_BLOWN'
  | 'AMMETER_PARALLEL_FAULT'
  | 'MAGIC_SMOKE_SANDBOX'
  | 'UNSOLVABLE_SINGULAR';

export interface SimulationDiagnostic {
  code: DiagnosticCode;
  severity: DiagnosticSeverity;
  componentIds: string[];
  netIds: string[];
  messageRu: string;
  messageEn: string;
}

export type ComponentOperatingState =
  | 'normal'
  | 'unpowered'
  | 'open'
  | 'reverse_biased'
  | 'overcurrent'
  | 'overpower'
  | 'blown'
  | 'short_circuit'
  | 'faulty';

export interface ComponentSimResult {
  componentId: string;
  type: CircuitComponent['type'];
  /** Voltage drop across primary terminals: V(+) - V(-) or V(anode) - V(cathode) or V(a) - V(b) */
  voltageDrop: number | null;
  /** Current flowing from positive/anode/a to negative/cathode/b in Amperes */
  current: number | null;
  /** Dissipated power in Watts (always >= 0 for passive loads; supplied power for sources) */
  powerWatts: number | null;
  /** 0..1.35 visual luminance for LEDs */
  brightness: number;
  /** Potentiometer wiper voltage if applicable */
  wiperVoltage?: number | null;
  conducting?: boolean;
  blown?: boolean;
  state: ComponentOperatingState;
}

export interface WireSimResult {
  wireId: string;
  netId: string;
  voltage: number | null;
  /** True when attached to a live powered loop with non-negligible current or closed loop */
  energized: boolean;
  /** Estimated visual current direction hint (+1 from->to, -1 to->from, 0 static) */
  flowMagnitude: number;
}

export interface SimulationResult {
  solvable: boolean;
  referenceNetId: string | null;
  autoAssignedGround: boolean;
  netVoltages: Record<string, number | null>;
  pinToNet: Record<string, string>;
  components: Record<string, ComponentSimResult>;
  wires: Record<string, WireSimResult>;
  diagnostics: SimulationDiagnostic[];
  /** Non-zero conventional current loop detected somewhere in circuit */
  hasActiveCurrent: boolean;
  /** Total source power delivered in Watts */
  totalSuppliedPowerWatts: number;
}

export interface SolveOptions {
  strictGround?: boolean;
  sandboxMode?: boolean;
}

const R_LED_ON = 0.5;
const R_DIODE_OFF = 1e7; // 10 MOhm
const R_VOLTMETER = 1e7; // 10 MOhm ideal-like input impedance
const R_AMMETER = 0.01; // 10 mOhm shunt
const R_FUSE_INTACT = 0.05;
const R_FAULTY_OPEN = 1e9;

function getDiodeThreshold(comp: CircuitComponent): number {
  if (comp.params.forwardVoltage !== undefined) {
    return comp.params.forwardVoltage;
  }
  if (comp.type === 'diode') {
    return 0.7;
  }
  const color = comp.params.color ?? 'red';
  return LED_FORWARD_VOLTAGE[color];
}

function getSourceVoltage(comp: CircuitComponent): number {
  if (comp.params.voltage !== undefined) return comp.params.voltage;
  return comp.type === 'battery' ? 9 : 5;
}

/**
 * Dense Gaussian elimination with partial pivoting for linear system A * x = b.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  if (n === 0) return [];
  const M = A.map((row, idx) => [...row, b[idx] ?? 0]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(M[col]![col]!);
    for (let r = col + 1; r < n; r++) {
      const candidate = Math.abs(M[r]![col]!);
      if (candidate > maxAbs) {
        maxAbs = candidate;
        pivotRow = r;
      }
    }
    if (maxAbs < 1e-12 || !Number.isFinite(maxAbs)) {
      return null;
    }
    if (pivotRow !== col) {
      const tmp = M[col]!;
      M[col] = M[pivotRow]!;
      M[pivotRow] = tmp;
    }

    const pivotVal = M[col]![col]!;
    for (let r = col + 1; r < n; r++) {
      const factor = M[r]![col]! / pivotVal;
      if (Math.abs(factor) < 1e-18) continue;
      for (let c = col; c <= n; c++) {
        M[r]![c]! -= factor * M[col]![c]!;
      }
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = M[r]![n]!;
    for (let c = r + 1; c < n; c++) {
      sum -= M[r]![c]! * x[c]!;
    }
    x[r] = sum / M[r]![r]!;
    if (!Number.isFinite(x[r]!)) {
      return null;
    }
  }
  return x;
}

export function solveCircuit(doc: CircuitDocument, options: SolveOptions = {}): SimulationResult {
  const netlist = buildNetlist(doc);
  const pinToNetRecord: Record<string, string> = {};
  for (const [k, v] of netlist.pinToNet.entries()) {
    pinToNetRecord[k] = v;
  }

  const diagnostics: SimulationDiagnostic[] = [];
  const netVoltages: Record<string, number | null> = {};
  for (const netId of netlist.nets) {
    netVoltages[netId] = null;
  }

  const componentResults: Record<string, ComponentSimResult> = {};
  const wireResults: Record<string, WireSimResult> = {};
  for (const comp of doc.components) {
    componentResults[comp.id] = {
      componentId: comp.id,
      type: comp.type,
      voltageDrop: null,
      current: null,
      powerWatts: null,
      brightness: 0,
      state: 'unpowered',
    };
  }
  for (const wire of doc.wires) {
    const netId = netlist.pinToNet.get(pinKeyString(wire.from.componentId, wire.from.terminalId)) ?? '';
    wireResults[wire.id] = {
      wireId: wire.id,
      netId,
      voltage: null,
      energized: false,
      flowMagnitude: 0,
    };
  }

  const getPinNet = (compId: string, termId: string): string | undefined =>
    netlist.pinToNet.get(pinKeyString(compId, termId));

  // 1. Determine ground / reference net
  const groundComps = doc.components.filter((c) => c.type === 'ground');
  const sources = doc.components.filter((c) => c.type === 'voltage_source' || c.type === 'battery');

  // If multiple ground components exist, treat their nets as tied to 0V reference
  const referenceNets = new Set<string>();
  let referenceNetId: string | null = null;
  let autoAssignedGround = false;

  for (const g of groundComps) {
    const net = getPinNet(g.id, 'gnd');
    if (net) {
      if (!referenceNetId) referenceNetId = net;
      referenceNets.add(net);
    }
  }

  if (referenceNets.size === 0) {
    if (options.strictGround && sources.length > 0) {
      diagnostics.push({
        code: 'NO_GROUND_REFERENCE',
        severity: 'error',
        componentIds: sources.map((s) => s.id),
        netIds: [],
        messageRu: 'Отсутствует опорный узел (GND). Добавьте элемент земли или соедините общий провод.',
        messageEn: 'Missing ground reference (GND). Add a Ground node to establish 0 V reference.',
      });
      return {
        solvable: false,
        referenceNetId: null,
        autoAssignedGround: false,
        netVoltages,
        pinToNet: pinToNetRecord,
        components: componentResults,
        wires: wireResults,
        diagnostics,
        hasActiveCurrent: false,
        totalSuppliedPowerWatts: 0,
      };
    }

    if (sources.length > 0) {
      const negNet = getPinNet(sources[0]!.id, 'neg');
      if (negNet) {
        referenceNetId = negNet;
        referenceNets.add(negNet);
        autoAssignedGround = true;
        diagnostics.push({
          code: 'AUTO_GROUND_ASSIGNED',
          severity: 'info',
          componentIds: [sources[0]!.id],
          netIds: [negNet],
          messageRu: 'Опорный узел 0.00 V автоматически назначен на отрицательный полюс источника.',
          messageEn: 'Reference 0.00 V automatically assigned to negative terminal of the primary source.',
        });
      }
    } else if (netlist.nets.length > 0) {
      referenceNetId = netlist.nets[0]!;
      referenceNets.add(referenceNetId);
      autoAssignedGround = true;
    }
  }

  // Collapse multiple ground nets into canonical reference net 0
  const canonNet = (netId: string): string => (referenceNets.has(netId) && referenceNetId ? referenceNetId : netId);

  // 2. Pre-check ideal voltage source loops / direct short circuits
  const shortCircuitedSources: string[] = [];
  for (const src of sources) {
    const nPos = canonNet(getPinNet(src.id, 'pos') ?? '');
    const nNeg = canonNet(getPinNet(src.id, 'neg') ?? '');
    if (nPos && nPos === nNeg && getSourceVoltage(src) > 0) {
      shortCircuitedSources.push(src.id);
    }
  }

  if (shortCircuitedSources.length > 0) {
    diagnostics.push({
      code: 'SHORT_CIRCUIT',
      severity: 'error',
      componentIds: shortCircuitedSources,
      netIds: [],
      messageRu: 'Короткое замыкание: положительный и отрицательный выводы источника соединены накоротко без нагрузки.',
      messageEn: 'Short circuit detected: source terminals are connected directly with near-zero impedance.',
    });
    if (options.sandboxMode) {
      diagnostics.push({
        code: 'MAGIC_SMOKE_SANDBOX',
        severity: 'warning',
        componentIds: shortCircuitedSources,
        netIds: [],
        messageRu: 'В реальной лаборатории это могло бы закончиться волшебным дымом.',
        messageEn: 'In a real lab, this configuration could let out the magic smoke.',
      });
    }
    for (const id of shortCircuitedSources) {
      componentResults[id]!.state = 'short_circuit';
    }
    return {
      solvable: false,
      referenceNetId,
      autoAssignedGround,
      netVoltages,
      pinToNet: pinToNetRecord,
      components: componentResults,
      wires: wireResults,
      diagnostics,
      hasActiveCurrent: false,
      totalSuppliedPowerWatts: 0,
    };
  }

  // Check for cycles of ideal voltage sources (contradictory/indeterminate parallel sources)
  const srcAdj = new Map<string, Array<{ to: string; srcId: string; dv: number }>>();
  for (const src of sources) {
    const nPos = canonNet(getPinNet(src.id, 'pos') ?? '');
    const nNeg = canonNet(getPinNet(src.id, 'neg') ?? '');
    if (!nPos || !nNeg) continue;
    const v = getSourceVoltage(src);
    if (!srcAdj.has(nPos)) srcAdj.set(nPos, []);
    if (!srcAdj.has(nNeg)) srcAdj.set(nNeg, []);
    srcAdj.get(nNeg)!.push({ to: nPos, srcId: src.id, dv: v });
    srcAdj.get(nPos)!.push({ to: nNeg, srcId: src.id, dv: -v });
  }

  const visitedSrcNet = new Set<string>();
  const srcParentEdge = new Map<string, string>();
  let conflictingFound = false;
  const conflictIds = new Set<string>();
  const bfsCheck = (start: string) => {
    const queue = [start];
    visitedSrcNet.add(start);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const edge of srcAdj.get(curr) ?? []) {
        if (edge.srcId === srcParentEdge.get(curr)) continue;
        if (!visitedSrcNet.has(edge.to)) {
          visitedSrcNet.add(edge.to);
          srcParentEdge.set(edge.to, edge.srcId);
          queue.push(edge.to);
        } else {
          conflictingFound = true;
          conflictIds.add(edge.srcId);
        }
      }
    }
  };
  for (const net of srcAdj.keys()) {
    if (!visitedSrcNet.has(net)) bfsCheck(net);
  }

  if (conflictingFound) {
    diagnostics.push({
      code: 'CONFLICTING_SOURCES',
      severity: 'error',
      componentIds: [...conflictIds],
      netIds: [],
      messageRu: 'Противоречивое включение идеальных источников напряжения в одном контуре.',
      messageEn: 'Conflicting or redundant ideal voltage sources connected directly in a loop.',
    });
    return {
      solvable: false,
      referenceNetId,
      autoAssignedGround,
      netVoltages,
      pinToNet: pinToNetRecord,
      components: componentResults,
      wires: wireResults,
      diagnostics,
      hasActiveCurrent: false,
      totalSuppliedPowerWatts: 0,
    };
  }

  // Track blown fuses across solver passes
  const blownFuses = new Set<string>();
  for (const c of doc.components) {
    if (c.type === 'fuse' && (c.params.blown || c.faulty)) {
      blownFuses.add(c.id);
    }
  }

  // Helper to execute MNA for a given blownFuse set & diode active set
  const runPass = (currentBlownFuses: Set<string>) => {
    // 3. Determine nets reachable from referenceNetId via conductive branches
    const adj = new Map<string, Set<string>>();
    const connectNets = (n1?: string, n2?: string) => {
      if (!n1 || !n2) return;
      const c1 = canonNet(n1);
      const c2 = canonNet(n2);
      if (!adj.has(c1)) adj.set(c1, new Set());
      if (!adj.has(c2)) adj.set(c2, new Set());
      adj.get(c1)!.add(c2);
      adj.get(c2)!.add(c1);
    };

    for (const comp of doc.components) {
      if (comp.type === 'voltage_source' || comp.type === 'battery' || comp.type === 'voltmeter' || comp.type === 'ammeter') {
        connectNets(getPinNet(comp.id, 'pos'), getPinNet(comp.id, 'neg'));
      } else if (comp.type === 'resistor') {
        if (!comp.faulty) connectNets(getPinNet(comp.id, 'a'), getPinNet(comp.id, 'b'));
      } else if (comp.type === 'potentiometer') {
        const na = getPinNet(comp.id, 'a');
        const nw = getPinNet(comp.id, 'wiper');
        const nb = getPinNet(comp.id, 'b');
        connectNets(na, nw);
        connectNets(nw, nb);
      } else if (comp.type === 'fuse') {
        if (!currentBlownFuses.has(comp.id)) {
          connectNets(getPinNet(comp.id, 'a'), getPinNet(comp.id, 'b'));
        }
      } else if (comp.type === 'led' || comp.type === 'diode') {
        if (!comp.faulty) connectNets(getPinNet(comp.id, 'anode'), getPinNet(comp.id, 'cathode'));
      }
    }

    const reachable = new Set<string>();
    if (referenceNetId) {
      const q = [referenceNetId];
      reachable.add(referenceNetId);
      while (q.length > 0) {
        const cur = q.shift()!;
        for (const nxt of adj.get(cur) ?? []) {
          if (!reachable.has(nxt)) {
            reachable.add(nxt);
            q.push(nxt);
          }
        }
      }
    }

    const activeNonRefNets = [...reachable].filter((n) => n !== referenceNetId);
    const netIndex = new Map<string, number>();
    activeNonRefNets.forEach((n, idx) => netIndex.set(n, idx));

    const activeSources = sources.filter((src) => {
      const nPos = canonNet(getPinNet(src.id, 'pos') ?? '');
      const nNeg = canonNet(getPinNet(src.id, 'neg') ?? '');
      return reachable.has(nPos) && reachable.has(nNeg);
    });

    const diodeComps = doc.components.filter(
      (c) =>
        (c.type === 'led' || c.type === 'diode') &&
        !c.faulty &&
        reachable.has(canonNet(getPinNet(c.id, 'anode') ?? '')) &&
        reachable.has(canonNet(getPinNet(c.id, 'cathode') ?? ''))
    );

    // Active-set piecewise-linear iteration for diodes & LEDs
    const diodeOn = new Array<boolean>(diodeComps.length).fill(false);
    const visitedMasks = new Set<string>();
    let nodeVoltagesVec: number[] | null = null;

    const N = activeNonRefNets.length;
    const M = activeSources.length;
    const dim = N + M;

    const solveForDiodeState = (): number[] | null => {
      if (dim === 0) return [];
      const A = Array.from({ length: dim }, () => new Array<number>(dim).fill(0));
      const b = new Array<number>(dim).fill(0);

      const stampConductance = (n1: string, n2: string, g: number) => {
        const i1 = netIndex.get(n1);
        const i2 = netIndex.get(n2);
        if (i1 !== undefined) A[i1]![i1]! += g;
        if (i2 !== undefined) A[i2]![i2]! += g;
        if (i1 !== undefined && i2 !== undefined) {
          A[i1]![i2]! -= g;
          A[i2]![i1]! -= g;
        }
      };

      const stampCurrentSource = (fromNet: string, toNet: string, current: number) => {
        // Current enters toNet and leaves fromNet
        const iFrom = netIndex.get(fromNet);
        const iTo = netIndex.get(toNet);
        if (iFrom !== undefined) b[iFrom]! -= current;
        if (iTo !== undefined) b[iTo]! += current;
      };

      for (const comp of doc.components) {
        if (comp.type === 'resistor') {
          const n1 = canonNet(getPinNet(comp.id, 'a') ?? '');
          const n2 = canonNet(getPinNet(comp.id, 'b') ?? '');
          if (!reachable.has(n1) || !reachable.has(n2)) continue;
          const r = comp.faulty ? R_FAULTY_OPEN : Math.max(0.01, comp.params.resistance ?? 330);
          stampConductance(n1, n2, 1 / r);
        } else if (comp.type === 'potentiometer') {
          const na = canonNet(getPinNet(comp.id, 'a') ?? '');
          const nw = canonNet(getPinNet(comp.id, 'wiper') ?? '');
          const nb = canonNet(getPinNet(comp.id, 'b') ?? '');
          if (!reachable.has(na) || !reachable.has(nw) || !reachable.has(nb)) continue;
          const totalR = Math.max(1, comp.params.resistance ?? 10_000);
          const alpha = Math.max(0.005, Math.min(0.995, comp.params.wiperPosition ?? 0.5));
          stampConductance(na, nw, 1 / (totalR * alpha));
          stampConductance(nw, nb, 1 / (totalR * (1 - alpha)));
        } else if (comp.type === 'voltmeter') {
          const n1 = canonNet(getPinNet(comp.id, 'pos') ?? '');
          const n2 = canonNet(getPinNet(comp.id, 'neg') ?? '');
          if (reachable.has(n1) && reachable.has(n2)) {
            stampConductance(n1, n2, 1 / R_VOLTMETER);
          }
        } else if (comp.type === 'ammeter') {
          const n1 = canonNet(getPinNet(comp.id, 'pos') ?? '');
          const n2 = canonNet(getPinNet(comp.id, 'neg') ?? '');
          if (reachable.has(n1) && reachable.has(n2)) {
            stampConductance(n1, n2, 1 / R_AMMETER);
          }
        } else if (comp.type === 'fuse') {
          if (!currentBlownFuses.has(comp.id)) {
            const n1 = canonNet(getPinNet(comp.id, 'a') ?? '');
            const n2 = canonNet(getPinNet(comp.id, 'b') ?? '');
            if (reachable.has(n1) && reachable.has(n2)) {
              stampConductance(n1, n2, 1 / R_FUSE_INTACT);
            }
          }
        }
      }

      diodeComps.forEach((comp, idx) => {
        const na = canonNet(getPinNet(comp.id, 'anode') ?? '');
        const nk = canonNet(getPinNet(comp.id, 'cathode') ?? '');
        if (diodeOn[idx]) {
          const vf = getDiodeThreshold(comp);
          const gOn = 1 / R_LED_ON;
          stampConductance(na, nk, gOn);
          // Norton current equivalent: I_ak = gOn * (Va - Vk) - gOn * Vf
          // Current entering node `a` from source is +gOn*Vf; leaving `k` is -gOn*Vf => stamp from k to a
          stampCurrentSource(nk, na, gOn * vf);
        } else {
          stampConductance(na, nk, 1 / R_DIODE_OFF);
        }
      });

      activeSources.forEach((src, mIdx) => {
        const nPos = canonNet(getPinNet(src.id, 'pos') ?? '');
        const nNeg = canonNet(getPinNet(src.id, 'neg') ?? '');
        const row = N + mIdx;
        const iPos = netIndex.get(nPos);
        const iNeg = netIndex.get(nNeg);
        if (iPos !== undefined) {
          A[iPos]![row]! += 1;
          A[row]![iPos]! += 1;
        }
        if (iNeg !== undefined) {
          A[iNeg]![row]! -= 1;
          A[row]![iNeg]! -= 1;
        }
        b[row] = getSourceVoltage(src);
      });

      // Tiny diagonal Gmin on voltage nodes improves numerical stability without altering physical accuracy
      for (let i = 0; i < N; i++) {
        A[i]![i]! += 1e-12;
      }

      return solveLinearSystem(A, b);
    };

    const maxIter = Math.max(16, diodeComps.length * 4 + 4);
    for (let iter = 0; iter < maxIter; iter++) {
      const mask = diodeOn.map((v) => (v ? '1' : '0')).join('');
      visitedMasks.add(mask);
      const sol = solveForDiodeState();
      if (!sol) {
        return { solvable: false as const, reachable, netIndex, activeSources, diodeComps, diodeOn, sol: null };
      }
      nodeVoltagesVec = sol;

      const getV = (netId: string): number => {
        const cn = canonNet(netId);
        if (cn === referenceNetId) return 0;
        const idx = netIndex.get(cn);
        return idx !== undefined ? sol[idx]! : 0;
      };

      let bestFlipIdx = -1;
      let maxViolation = 0;

      diodeComps.forEach((comp, idx) => {
        const va = getV(getPinNet(comp.id, 'anode') ?? '');
        const vk = getV(getPinNet(comp.id, 'cathode') ?? '');
        const vf = getDiodeThreshold(comp);
        if (diodeOn[idx]) {
          const iAk = (va - vk - vf) / R_LED_ON;
          if (iAk < -1e-6 && Math.abs(iAk) > maxViolation) {
            maxViolation = Math.abs(iAk);
            bestFlipIdx = idx;
          }
        } else {
          const dv = va - vk - vf;
          if (dv > 1e-4 && dv > maxViolation) {
            maxViolation = dv;
            bestFlipIdx = idx;
          }
        }
      });

      if (bestFlipIdx === -1) {
        break;
      }

      diodeOn[bestFlipIdx] = !diodeOn[bestFlipIdx];
      const nextMask = diodeOn.map((v) => (v ? '1' : '0')).join('');
      if (visitedMasks.has(nextMask)) {
        // Cycle guard: keep best consistent state and exit
        break;
      }
    }

    return {
      solvable: nodeVoltagesVec !== null,
      reachable,
      netIndex,
      activeSources,
      diodeComps,
      diodeOn,
      sol: nodeVoltagesVec,
    };
  };

  let pass = runPass(blownFuses);

  // Check if any intact fuse exceeded its rated current, blow it and re-solve once
  if (pass.solvable && pass.sol) {
    const getPassV = (netId: string): number | null => {
      const cn = canonNet(netId);
      if (!pass.reachable.has(cn)) return null;
      if (cn === referenceNetId) return 0;
      const idx = pass.netIndex.get(cn);
      return idx !== undefined ? pass.sol![idx]! : null;
    };

    let newBlown = false;
    for (const comp of doc.components) {
      if (comp.type === 'fuse' && !blownFuses.has(comp.id)) {
        const v1 = getPassV(getPinNet(comp.id, 'a') ?? '');
        const v2 = getPassV(getPinNet(comp.id, 'b') ?? '');
        if (v1 !== null && v2 !== null) {
          const i = Math.abs((v1 - v2) / R_FUSE_INTACT);
          const rated = comp.params.ratedCurrent ?? 0.5;
          if (i > rated) {
            blownFuses.add(comp.id);
            newBlown = true;
          }
        }
      }
    }
    if (newBlown) {
      pass = runPass(blownFuses);
    }
  }

  if (!pass.solvable || !pass.sol) {
    diagnostics.push({
      code: 'UNSOLVABLE_SINGULAR',
      severity: 'error',
      componentIds: [],
      netIds: [],
      messageRu: 'Матрица цепи вырождена и не имеет однозначного решения. Проверьте соединения.',
      messageEn: 'Circuit matrix is singular and has no unique solution. Check connections.',
    });
    return {
      solvable: false,
      referenceNetId,
      autoAssignedGround,
      netVoltages,
      pinToNet: pinToNetRecord,
      components: componentResults,
      wires: wireResults,
      diagnostics,
      hasActiveCurrent: false,
      totalSuppliedPowerWatts: 0,
    };
  }

  const sol = pass.sol;
  const N = pass.netIndex.size;

  // Assign solved net voltages
  for (const netId of netlist.nets) {
    const cn = canonNet(netId);
    if (!pass.reachable.has(cn)) {
      netVoltages[netId] = null;
    } else if (cn === referenceNetId) {
      netVoltages[netId] = 0;
    } else {
      const idx = pass.netIndex.get(cn);
      netVoltages[netId] = idx !== undefined ? Math.round(sol[idx]! * 1e6) / 1e6 : null;
    }
  }

  // Track floating nets (components disconnected from ground island)
  const floatingNets = netlist.nets.filter((n) => netVoltages[n] === null);
  if (floatingNets.length > 0 && sources.length > 0) {
    diagnostics.push({
      code: 'FLOATING_NODES',
      severity: 'info',
      componentIds: [],
      netIds: floatingNets,
      messageRu: 'Часть цепи не подключена к замкнутому контуру и не имеет опорного потенциала.',
      messageEn: 'Some circuit nodes are disconnected from the reference path (floating).',
    });
  }

  let hasActiveCurrent = false;
  let totalSuppliedPowerWatts = 0;

  const getNetV = (compId: string, termId: string): number | null => {
    const net = getPinNet(compId, termId);
    return net ? netVoltages[net] ?? null : null;
  };

  // Compute component results & collect physical diagnostics
  const sourceIndexMap = new Map<string, number>();
  pass.activeSources.forEach((s, idx) => sourceIndexMap.set(s.id, idx));

  const diodeIndexMap = new Map<string, number>();
  pass.diodeComps.forEach((d, idx) => diodeIndexMap.set(d.id, idx));

  const ammeterFaultIds: string[] = [];
  const overcurrentLedIds: string[] = [];
  const reversedLedIds: string[] = [];
  const overpowerResistorIds: string[] = [];
  const blownFuseIds: string[] = [];
  const openSwitchIds: string[] = [];

  for (const comp of doc.components) {
    const res = componentResults[comp.id]!;

    if (comp.type === 'voltage_source' || comp.type === 'battery') {
      const vp = getNetV(comp.id, 'pos');
      const vn = getNetV(comp.id, 'neg');
      const mIdx = sourceIndexMap.get(comp.id);
      if (vp !== null && vn !== null && mIdx !== undefined) {
        const drop = vp - vn;
        // In standard MNA, source branch variable I_s flows from pos (+) into the source to neg (-)
        // so supplied current out of (+) terminal is -sol[N + mIdx]
        const iSupplied = -sol[N + mIdx]!;
        const pSupplied = Math.abs(drop * iSupplied);
        res.voltageDrop = drop;
        res.current = iSupplied;
        res.powerWatts = pSupplied;
        res.state = 'normal';
        if (Math.abs(iSupplied) > 1e-5) {
          hasActiveCurrent = true;
          totalSuppliedPowerWatts += pSupplied;
        }
      } else {
        res.voltageDrop = getSourceVoltage(comp);
        res.current = 0;
        res.powerWatts = 0;
        res.state = 'unpowered';
      }
    } else if (comp.type === 'ground') {
      res.voltageDrop = 0;
      res.current = 0;
      res.powerWatts = 0;
      res.state = 'normal';
    } else if (comp.type === 'resistor') {
      const va = getNetV(comp.id, 'a');
      const vb = getNetV(comp.id, 'b');
      if (comp.faulty) {
        res.voltageDrop = va !== null && vb !== null ? va - vb : null;
        res.current = 0;
        res.powerWatts = 0;
        res.state = 'faulty';
      } else if (va !== null && vb !== null) {
        const drop = va - vb;
        const r = Math.max(0.01, comp.params.resistance ?? 330);
        const i = drop / r;
        const p = Math.abs(drop * i);
        const rated = comp.params.powerRating ?? 0.25;
        res.voltageDrop = drop;
        res.current = i;
        res.powerWatts = p;
        if (Math.abs(i) > 1e-5) hasActiveCurrent = true;
        if (p > rated) {
          res.state = 'overpower';
          overpowerResistorIds.push(comp.id);
        } else {
          res.state = Math.abs(i) > 1e-6 ? 'normal' : 'unpowered';
        }
      }
    } else if (comp.type === 'potentiometer') {
      const va = getNetV(comp.id, 'a');
      const vw = getNetV(comp.id, 'wiper');
      const vb = getNetV(comp.id, 'b');
      res.wiperVoltage = vw;
      if (va !== null && vw !== null && vb !== null) {
        const totalR = Math.max(1, comp.params.resistance ?? 10_000);
        const alpha = Math.max(0.005, Math.min(0.995, comp.params.wiperPosition ?? 0.5));
        const i1 = (va - vw) / (totalR * alpha);
        const i2 = (vw - vb) / (totalR * (1 - alpha));
        const p = Math.abs((va - vw) * i1) + Math.abs((vw - vb) * i2);
        res.voltageDrop = va - vb;
        res.current = i1;
        res.powerWatts = p;
        if (Math.abs(i1) > 1e-5 || Math.abs(i2) > 1e-5) hasActiveCurrent = true;
        res.state = Math.abs(i1) > 1e-6 || Math.abs(i2) > 1e-6 ? 'normal' : 'unpowered';
      }
    } else if (comp.type === 'led' || comp.type === 'diode') {
      const va = getNetV(comp.id, 'anode');
      const vk = getNetV(comp.id, 'cathode');
      const dIdx = diodeIndexMap.get(comp.id);
      if (comp.faulty) {
        res.voltageDrop = va !== null && vk !== null ? va - vk : null;
        res.current = 0;
        res.powerWatts = 0;
        res.brightness = 0;
        res.conducting = false;
        res.state = 'faulty';
      } else if (va !== null && vk !== null && dIdx !== undefined) {
        const drop = va - vk;
        const isOn = pass.diodeOn[dIdx] ?? false;
        const vf = getDiodeThreshold(comp);
        const i = isOn ? (drop - vf) / R_LED_ON : drop / R_DIODE_OFF;
        const p = Math.abs(drop * i);
        const nominalI = comp.params.nominalCurrent ?? 0.015;
        const maxI = comp.params.maxCurrent ?? 0.025;

        res.voltageDrop = drop;
        res.current = i;
        res.powerWatts = p;
        res.conducting = isOn && i > 1e-5;
        if (res.conducting) hasActiveCurrent = true;

        if (isOn && i > maxI) {
          res.brightness = 1.35;
          res.state = 'overcurrent';
          if (comp.type === 'led') overcurrentLedIds.push(comp.id);
        } else if (isOn && i > 1e-5) {
          res.brightness = comp.type === 'led' ? Math.max(0.08, Math.min(1.15, i / nominalI)) : 0;
          res.state = 'normal';
        } else if (drop < -0.2) {
          res.brightness = 0;
          res.state = 'reverse_biased';
          if (comp.type === 'led') reversedLedIds.push(comp.id);
        } else {
          res.brightness = 0;
          res.state = 'unpowered';
        }
      }
    } else if (comp.type === 'switch_spst' || comp.type === 'pushbutton') {
      const va = getNetV(comp.id, 'a');
      const vb = getNetV(comp.id, 'b');
      const closed = netlist.closedSwitches.has(comp.id);
      res.voltageDrop = va !== null && vb !== null ? va - vb : null;
      res.current = closed ? null : 0;
      res.powerWatts = 0;
      res.state = comp.faulty ? 'faulty' : closed ? 'normal' : 'open';
      if (!closed) openSwitchIds.push(comp.id);
    } else if (comp.type === 'fuse') {
      const va = getNetV(comp.id, 'a');
      const vb = getNetV(comp.id, 'b');
      const blown = blownFuses.has(comp.id);
      res.blown = blown;
      if (blown) {
        res.voltageDrop = va !== null && vb !== null ? va - vb : null;
        res.current = 0;
        res.powerWatts = 0;
        res.state = 'blown';
        blownFuseIds.push(comp.id);
      } else if (va !== null && vb !== null) {
        const drop = va - vb;
        const i = drop / R_FUSE_INTACT;
        res.voltageDrop = drop;
        res.current = i;
        res.powerWatts = Math.abs(drop * i);
        if (Math.abs(i) > 1e-5) hasActiveCurrent = true;
        res.state = 'normal';
      }
    } else if (comp.type === 'voltmeter') {
      const vp = getNetV(comp.id, 'pos');
      const vn = getNetV(comp.id, 'neg');
      if (vp !== null && vn !== null) {
        const drop = vp - vn;
        const i = drop / R_VOLTMETER;
        res.voltageDrop = drop;
        res.current = i;
        res.powerWatts = Math.abs(drop * i);
        res.state = 'normal';
      }
    } else if (comp.type === 'ammeter') {
      const vp = getNetV(comp.id, 'pos');
      const vn = getNetV(comp.id, 'neg');
      if (vp !== null && vn !== null) {
        const drop = vp - vn;
        const i = drop / R_AMMETER;
        const maxI = comp.params.maxCurrent ?? 1.0;
        res.voltageDrop = drop;
        res.current = i;
        res.powerWatts = Math.abs(drop * i);
        if (Math.abs(i) > maxI) {
          res.state = 'overcurrent';
          ammeterFaultIds.push(comp.id);
        } else {
          res.state = 'normal';
          if (Math.abs(i) > 1e-5) hasActiveCurrent = true;
        }
      }
    }
  }

  // Diagnostic messages
  if (ammeterFaultIds.length > 0) {
    diagnostics.push({
      code: 'AMMETER_PARALLEL_FAULT',
      severity: 'error',
      componentIds: ammeterFaultIds,
      netIds: [],
      messageRu:
        'Амперметр перегружен (>1 A)! Вероятно, он включён параллельно источнику вместо разрыва цепи — внутренний шунт создал почти короткое замыкание.',
      messageEn:
        'Ammeter overcurrent (>1 A)! It is likely wired in parallel across the source instead of in series, creating a near-short.',
    });
  }

  if (overcurrentLedIds.length > 0) {
    diagnostics.push({
      code: 'LED_OVERCURRENT',
      severity: 'error',
      componentIds: overcurrentLedIds,
      netIds: [],
      messageRu:
        'Чрезмерный ток через светодиод (>25 mA)! Нужен токоограничивающий резистор большего номинала.',
      messageEn: 'Excessive LED current (>25 mA)! Add or increase the current-limiting resistor.',
    });
    const hasResistor = doc.components.some((c) => c.type === 'resistor');
    if (!hasResistor) {
      diagnostics.push({
        code: 'NO_CURRENT_LIMITING_RESISTOR',
        severity: 'error',
        componentIds: overcurrentLedIds,
        netIds: [],
        messageRu: 'Светодиод подключён без токоограничивающего резистора.',
        messageEn: 'LED is wired without a current-limiting resistor.',
      });
    }
    if (options.sandboxMode) {
      diagnostics.push({
        code: 'MAGIC_SMOKE_SANDBOX',
        severity: 'warning',
        componentIds: overcurrentLedIds,
        netIds: [],
        messageRu: 'В реальной лаборатории это могло бы закончиться волшебным дымом.',
        messageEn: 'In a real lab, this configuration could let out the magic smoke.',
      });
    }
  }

  if (overpowerResistorIds.length > 0) {
    diagnostics.push({
      code: 'RESISTOR_OVERPOWER',
      severity: 'warning',
      componentIds: overpowerResistorIds,
      netIds: [],
      messageRu: 'Превышена допустимая мощность рассеивания резистора (0.25 W). Возможен перегрев.',
      messageEn: 'Resistor power dissipation exceeds its 0.25 W rating and would overheat.',
    });
    if (options.sandboxMode) {
      diagnostics.push({
        code: 'MAGIC_SMOKE_SANDBOX',
        severity: 'warning',
        componentIds: overpowerResistorIds,
        netIds: [],
        messageRu: 'В реальной лаборатории это могло бы закончиться волшебным дымом.',
        messageEn: 'In a real lab, this configuration could let out the magic smoke.',
      });
    }
  }

  if (reversedLedIds.length > 0) {
    diagnostics.push({
      code: 'LED_REVERSED',
      severity: 'warning',
      componentIds: reversedLedIds,
      netIds: [],
      messageRu: 'Светодиод подключён в обратной полярности (на катоде потенциал выше, чем на аноде). Ток не течёт.',
      messageEn: 'LED is reverse-biased (cathode potential exceeds anode). No current flows.',
    });
  }

  if (blownFuseIds.length > 0) {
    diagnostics.push({
      code: 'FUSE_BLOWN',
      severity: 'warning',
      componentIds: blownFuseIds,
      netIds: [],
      messageRu: 'Сработал предохранитель из-за превышения номинального тока — цепь разомкнута.',
      messageEn: 'Fuse blew due to overcurrent and safely opened the circuit.',
    });
  }

  if (!hasActiveCurrent && sources.length > 0 && ammeterFaultIds.length === 0 && overcurrentLedIds.length === 0) {
    diagnostics.push({
      code: 'OPEN_CIRCUIT',
      severity: openSwitchIds.length > 0 ? 'info' : 'warning',
      componentIds: openSwitchIds,
      netIds: [],
      messageRu:
        openSwitchIds.length > 0
          ? 'Цепь разомкнута выключателем или кнопкой — ток равен 0 mA.'
          : 'Цепь разомкнута — замкните полный контур от (+) к (−), чтобы пошёл ток.',
      messageEn:
        openSwitchIds.length > 0
          ? 'Circuit is open at the switch or pushbutton — current is 0 mA.'
          : 'Open circuit — complete a closed loop from (+) to (-) for current to flow.',
    });
  }

  // Wire visualization attributes
  for (const wire of doc.wires) {
    const netId = netlist.pinToNet.get(pinKeyString(wire.from.componentId, wire.from.terminalId)) ?? '';
    const v = netVoltages[netId] ?? null;
    const isRef = canonNet(netId) === referenceNetId;
    const poweredByLoop =
      hasActiveCurrent &&
      v !== null &&
      doc.components.some((c) => {
        const cr = componentResults[c.id];
        if (!cr || cr.current === null || Math.abs(cr.current) < 1e-5) return false;
        return Object.values(netlist.pinToNet).length > 0 &&
          (canonNet(getPinNet(c.id, 'pos') ?? '') === canonNet(netId) ||
            canonNet(getPinNet(c.id, 'neg') ?? '') === canonNet(netId) ||
            canonNet(getPinNet(c.id, 'a') ?? '') === canonNet(netId) ||
            canonNet(getPinNet(c.id, 'b') ?? '') === canonNet(netId) ||
            canonNet(getPinNet(c.id, 'anode') ?? '') === canonNet(netId) ||
            canonNet(getPinNet(c.id, 'cathode') ?? '') === canonNet(netId));
      });
    wireResults[wire.id] = {
      wireId: wire.id,
      netId,
      voltage: v,
      energized: Boolean(poweredByLoop || (v !== null && Math.abs(v) > 1e-3) || (hasActiveCurrent && isRef)),
      flowMagnitude: poweredByLoop ? 1 : 0,
    };
  }

  return {
    solvable: ammeterFaultIds.length === 0,
    referenceNetId,
    autoAssignedGround,
    netVoltages,
    pinToNet: pinToNetRecord,
    components: componentResults,
    wires: wireResults,
    diagnostics,
    hasActiveCurrent,
    totalSuppliedPowerWatts,
  };
}

export type MultimeterMode = 'dc_v' | 'dc_ma' | 'ohm' | 'continuity';

export interface MultimeterProbeInput {
  mode: MultimeterMode;
  posPin: { componentId: string; terminalId: string } | null;
  negPin: { componentId: string; terminalId: string } | null;
}

export interface MultimeterReading {
  valid: boolean;
  value: number | null;
  unit: 'V' | 'mA' | 'Ω' | '';
  displayText: string;
  continuityBeep: boolean;
  warningCode?: string;
  warningRu?: string;
  warningEn?: string;
}

/**
 * Computes physically accurate virtual multimeter measurements on the circuit.
 * - `dc_v`: high-impedance voltmeter V(pos) - V(neg)
 * - `dc_ma`: warns if measuring directly across a voltage source; otherwise injects a temporary 0.01 Ohm shunt
 *   into a component branch or measures between adjacent nodes safely with parallel-short protection
 * - `ohm` / `continuity`: disables active voltage sources and injects 1 mA test signal across passive network
 */
export function measureMultimeter(
  doc: CircuitDocument,
  currentResult: SimulationResult,
  probe: MultimeterProbeInput
): MultimeterReading {
  if (!probe.posPin || !probe.negPin) {
    return {
      valid: false,
      value: null,
      unit: probe.mode === 'dc_v' ? 'V' : probe.mode === 'dc_ma' ? 'mA' : 'Ω',
      displayText: '---',
      continuityBeep: false,
      warningRu: 'Подключите оба щупа (красный и чёрный) к контактам схемы.',
      warningEn: 'Attach both red (+) and black (-) probes to circuit terminals.',
    };
  }

  const posKey = pinKeyString(probe.posPin.componentId, probe.posPin.terminalId);
  const negKey = pinKeyString(probe.negPin.componentId, probe.negPin.terminalId);
  const posNet = currentResult.pinToNet[posKey];
  const negNet = currentResult.pinToNet[negKey];

  if (!posNet || !negNet) {
    return {
      valid: false,
      value: null,
      unit: '',
      displayText: 'ERR',
      continuityBeep: false,
      warningRu: 'Выбранный контакт не найден.',
      warningEn: 'Selected terminal not found.',
    };
  }

  if (probe.mode === 'dc_v') {
    const vp = currentResult.netVoltages[posNet];
    const vn = currentResult.netVoltages[negNet];
    if (vp === null || vp === undefined || vn === null || vn === undefined) {
      return {
        valid: false,
        value: null,
        unit: 'V',
        displayText: 'OL',
        continuityBeep: false,
        warningRu: 'Один из щупов на изолированном участке цепи без опорного потенциала.',
        warningEn: 'One probe is on a floating node with no reference potential.',
      };
    }
    const diff = vp - vn;
    return {
      valid: true,
      value: diff,
      unit: 'V',
      displayText: `${diff.toFixed(2)} V`,
      continuityBeep: false,
    };
  }

  if (probe.mode === 'dc_ma') {
    if (posNet === negNet) {
      return {
        valid: true,
        value: 0,
        unit: 'mA',
        displayText: '0.00 mA',
        continuityBeep: false,
        warningRu: 'Оба щупа находятся на одном узле.',
        warningEn: 'Both probes are touching the same electrical node.',
      };
    }

    // Clone doc and add temporary ammeter between posPin and negPin to detect real shunt behavior
    const tempDoc: CircuitDocument = {
      ...doc,
      components: [
        ...doc.components,
        {
          id: '__probe_ammeter__',
          type: 'ammeter',
          label: 'DMM mA',
          params: { maxCurrent: 0.4 },
          position: { x: 0, y: 0 },
          rotation: 0,
        },
      ],
      wires: [
        ...doc.wires,
        { id: '__probe_w1__', from: probe.posPin, to: { componentId: '__probe_ammeter__', terminalId: 'pos' } },
        { id: '__probe_w2__', from: probe.negPin, to: { componentId: '__probe_ammeter__', terminalId: 'neg' } },
      ],
    };

    const probeSim = solveCircuit(tempDoc);
    const ammRes = probeSim.components['__probe_ammeter__'];
    if (!probeSim.solvable || ammRes?.state === 'overcurrent' || (ammRes?.current !== null && Math.abs(ammRes?.current ?? 0) > 0.4)) {
      return {
        valid: false,
        value: null,
        unit: 'mA',
        displayText: 'FUSE!',
        continuityBeep: false,
        warningCode: 'AMMETER_PARALLEL_FAULT',
        warningRu:
          'Опасно! Щупы в режиме амперметра включены параллельно узлам под напряжением — сработал бы предохранитель. Амперметр подключают только в разрыв цепи.',
        warningEn:
          'Danger! Probes in ammeter mode bridged powered nodes in parallel and would blow the meter fuse. Always wire an ammeter in series.',
      };
    }

    const ma = (ammRes?.current ?? 0) * 1000;
    return {
      valid: true,
      value: ma,
      unit: 'mA',
      displayText: `${ma.toFixed(2)} mA`,
      continuityBeep: false,
    };
  }

  // Ohmmeter / Continuity mode: require circuit de-energized if source is connected to loop
  if (currentResult.hasActiveCurrent) {
    return {
      valid: false,
      value: null,
      unit: 'Ω',
      displayText: 'ERR PWR',
      continuityBeep: false,
      warningCode: 'OHMMETER_LIVE_CIRCUIT',
      warningRu: 'Отключите питание или разомкните выключатель перед измерением сопротивления/прозвонкой.',
      warningEn: 'Turn off power or open the circuit switch before measuring resistance or continuity.',
    };
  }

  if (posNet === negNet) {
    return {
      valid: true,
      value: 0,
      unit: 'Ω',
      displayText: probe.mode === 'continuity' ? '0.1 Ω ♪' : '0.0 Ω',
      continuityBeep: probe.mode === 'continuity',
    };
  }

  // De-energize all active voltage sources (0V short) and measure passive resistance via 1V test source
  // Wait: to avoid shorting across zero-volt sources if measuring a disconnected resistor, replace sources with open when measuring offline passive network!
  const passiveComps = doc.components.filter((c) => c.type !== 'voltage_source' && c.type !== 'battery');
  const testDoc: CircuitDocument = {
    ...doc,
    components: [
      ...passiveComps,
      {
        id: '__ohm_src__',
        type: 'voltage_source',
        label: 'OhmTest',
        params: { voltage: 1.0 },
        position: { x: 0, y: 0 },
        rotation: 0,
      },
      {
        id: '__ohm_gnd__',
        type: 'ground',
        label: 'GND',
        params: {},
        position: { x: 0, y: 0 },
        rotation: 0,
      },
    ],
    wires: [
      ...doc.wires.filter(
        (w) =>
          passiveComps.some((c) => c.id === w.from.componentId) &&
          passiveComps.some((c) => c.id === w.to.componentId)
      ),
      { id: '__ohm_w1__', from: probe.posPin, to: { componentId: '__ohm_src__', terminalId: 'pos' } },
      { id: '__ohm_w2__', from: probe.negPin, to: { componentId: '__ohm_src__', terminalId: 'neg' } },
      { id: '__ohm_w3__', from: { componentId: '__ohm_src__', terminalId: 'neg' }, to: { componentId: '__ohm_gnd__', terminalId: 'gnd' } },
    ],
  };

  const ohmSim = solveCircuit(testDoc);
  const srcRes = ohmSim.components['__ohm_src__'];
  const iTest = srcRes?.current ?? 0;
  if (!ohmSim.solvable || Math.abs(iTest) < 1e-8) {
    return {
      valid: true,
      value: null,
      unit: 'Ω',
      displayText: 'OL',
      continuityBeep: false,
    };
  }
  const rEq = 1.0 / Math.abs(iTest);
  if (rEq > 1e7) {
    return { valid: true, value: null, unit: 'Ω', displayText: 'OL', continuityBeep: false };
  }
  const beep = probe.mode === 'continuity' && rEq < 50;
  const formatted = rEq >= 1000 ? `${(rEq / 1000).toFixed(2)} kΩ` : `${rEq.toFixed(1)} Ω`;
  return {
    valid: true,
    value: Math.round(rEq * 100) / 100,
    unit: 'Ω',
    displayText: beep ? `${formatted} ♪` : formatted,
    continuityBeep: beep,
  };
}
