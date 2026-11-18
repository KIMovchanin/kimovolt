import { buildNetlist, pinKeyString } from './netlist';
import type { CircuitComponent, CircuitDocument, LogicGateKind } from './schema';

export interface LogicSimulationResult {
  solvable: boolean;
  hasCycle: boolean;
  /** High/Low per net ID */
  netLevels: Record<string, boolean | null>;
  /** Output levels per component ID */
  componentOutputs: Record<string, boolean | null>;
  errors: string[];
}

export interface TruthTableRow {
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean | null>;
}

export interface TruthTableResult {
  inputIds: string[];
  outputIds: string[];
  rows: TruthTableRow[];
  hasCycle: boolean;
}

export function evalGate(kind: LogicGateKind, a: boolean, b: boolean): boolean {
  switch (kind) {
    case 'NOT':
      return !a;
    case 'AND':
      return a && b;
    case 'OR':
      return a || b;
    case 'XOR':
      return a !== b;
    case 'NAND':
      return !(a && b);
    case 'NOR':
      return !(a || b);
  }
}

export function solveLogicCircuit(
  doc: CircuitDocument,
  inputOverrides?: Record<string, boolean>
): LogicSimulationResult {
  const netlist = buildNetlist(doc);
  const netLevels: Record<string, boolean | null> = {};
  const componentOutputs: Record<string, boolean | null> = {};
  for (const n of netlist.nets) {
    netLevels[n] = null;
  }

  const inputs = doc.components.filter((c) => c.type === 'logic_input');
  const gates = doc.components.filter((c) => c.type === 'logic_gate');
  const outputs = doc.components.filter((c) => c.type === 'logic_output');

  const netDrivers = new Map<string, string[]>();
  const registerDriver = (netId: string | undefined, compId: string) => {
    if (!netId) return;
    if (!netDrivers.has(netId)) netDrivers.set(netId, []);
    netDrivers.get(netId)!.push(compId);
  };

  for (const inp of inputs) {
    const level = inputOverrides?.[inp.id] ?? Boolean(inp.params.logicLevel);
    const outNet = netlist.pinToNet.get(pinKeyString(inp.id, 'out'));
    registerDriver(outNet, inp.id);
    if (outNet) {
      netLevels[outNet] = level;
    }
    componentOutputs[inp.id] = level;
  }

  for (const g of gates) {
    const outNet = netlist.pinToNet.get(pinKeyString(g.id, 'out'));
    registerDriver(outNet, g.id);
  }

  const errors: string[] = [];
  for (const [netId, drivers] of netDrivers.entries()) {
    if (drivers.length > 1) {
      errors.push(`CONFLICTING_LOGIC_DRIVERS:${netId}`);
    }
  }
  if (errors.length > 0) {
    return { solvable: false, hasCycle: false, netLevels, componentOutputs, errors };
  }

  // Detect directed combinational cycles structurally using 3-color DFS over gate graph
  const netToGateDriver = new Map<string, string>();
  for (const g of gates) {
    const outNet = netlist.pinToNet.get(pinKeyString(g.id, 'out'));
    if (outNet) netToGateDriver.set(outNet, g.id);
  }
  const gateDeps = new Map<string, string[]>();
  for (const g of gates) {
    const deps: string[] = [];
    const kind: LogicGateKind = g.params.gateKind ?? 'AND';
    const netA = netlist.pinToNet.get(pinKeyString(g.id, 'inA'));
    if (netA && netToGateDriver.has(netA)) deps.push(netToGateDriver.get(netA)!);
    if (kind !== 'NOT') {
      const netB = netlist.pinToNet.get(pinKeyString(g.id, 'inB'));
      if (netB && netToGateDriver.has(netB)) deps.push(netToGateDriver.get(netB)!);
    }
    gateDeps.set(g.id, deps);
  }

  const color = new Map<string, 0 | 1 | 2>();
  let hasCycle = false;
  const dfsCycle = (gid: string) => {
    color.set(gid, 1);
    for (const dep of gateDeps.get(gid) ?? []) {
      const c = color.get(dep) ?? 0;
      if (c === 1) {
        hasCycle = true;
      } else if (c === 0) {
        dfsCycle(dep);
      }
    }
    color.set(gid, 2);
  };
  for (const g of gates) {
    if ((color.get(g.id) ?? 0) === 0) dfsCycle(g.id);
  }

  if (hasCycle) {
    errors.push('COMBINATIONAL_FEEDBACK_CYCLE');
    return { solvable: false, hasCycle: true, netLevels, componentOutputs, errors };
  }

  // Topological / iterative pass for acyclic combinational graph
  let changed = true;
  let iter = 0;
  const maxIter = Math.max(gates.length + 2, 4);

  while (changed && iter < maxIter) {
    changed = false;
    iter++;
    for (const gate of gates) {
      const kind: LogicGateKind = gate.params.gateKind ?? 'AND';
      const netA = netlist.pinToNet.get(pinKeyString(gate.id, 'inA'));
      const netB = netlist.pinToNet.get(pinKeyString(gate.id, 'inB'));
      const netOut = netlist.pinToNet.get(pinKeyString(gate.id, 'out'));
      const valA = netA ? netLevels[netA] : null;
      const valB = kind === 'NOT' ? false : netB ? netLevels[netB] : null;

      let nextOut: boolean | null = null;
      if (kind === 'NOT') {
        if (valA !== null && valA !== undefined) {
          nextOut = !valA;
        }
      } else if (valA !== null && valA !== undefined && valB !== null && valB !== undefined) {
        nextOut = evalGate(kind, valA, valB);
      }

      if (componentOutputs[gate.id] !== nextOut) {
        componentOutputs[gate.id] = nextOut;
        changed = true;
      }
      if (netOut && netLevels[netOut] !== nextOut) {
        netLevels[netOut] = nextOut;
        changed = true;
      }
    }
  }

  for (const out of outputs) {
    const inNet = netlist.pinToNet.get(pinKeyString(out.id, 'in'));
    const val = inNet ? netLevels[inNet] ?? null : null;
    componentOutputs[out.id] = val;
  }

  return {
    solvable: !hasCycle,
    hasCycle,
    netLevels,
    componentOutputs,
    errors,
  };
}

export function evaluateTruthTable(doc: CircuitDocument): TruthTableResult {
  const inputs: CircuitComponent[] = doc.components
    .filter((c) => c.type === 'logic_input')
    .sort((a, b) => a.id.localeCompare(b.id));
  const outputs: CircuitComponent[] = doc.components
    .filter((c) => c.type === 'logic_output')
    .sort((a, b) => a.id.localeCompare(b.id));

  const k = Math.min(inputs.length, 6);
  const totalRows = 1 << k;
  const rows: TruthTableRow[] = [];
  let hasCycle = false;

  for (let mask = 0; mask < totalRows; mask++) {
    const overrides: Record<string, boolean> = {};
    for (let bit = 0; bit < k; bit++) {
      const inp = inputs[bit]!;
      overrides[inp.id] = Boolean((mask >> (k - 1 - bit)) & 1);
    }
    const sim = solveLogicCircuit(doc, overrides);
    if (sim.hasCycle) hasCycle = true;

    const outRecord: Record<string, boolean | null> = {};
    for (const out of outputs) {
      outRecord[out.id] = sim.componentOutputs[out.id] ?? null;
    }
    rows.push({ inputs: overrides, outputs: outRecord });
  }

  return {
    inputIds: inputs.map((c) => c.id),
    outputIds: outputs.map((c) => c.id),
    rows,
    hasCycle,
  };
}
