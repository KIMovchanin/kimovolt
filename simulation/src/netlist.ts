import type { CircuitComponent, CircuitDocument } from './schema';

export interface PinKey {
  componentId: string;
  terminalId: string;
}

export function pinKeyString(componentId: string, terminalId: string): string {
  return `${componentId}:${terminalId}`;
}

/**
 * Maps a physical breadboard hole identifier to its internally connected electrical bus ID.
 * Breadboard rules (standard 60-col or 30-col solderless breadboard):
 * - Top/Bottom power rails: `rail_top_pos`, `rail_top_neg`, `rail_bot_pos`, `rail_bot_neg`
 *   (any hole like `tp_12`, `tn_5`, `bp_20`, `bn_1` maps to its rail)
 * - Main tie-point matrix: `<col>_<row>` where rows a..e share one strip (`col_top`),
 *   and rows f..j share another strip (`col_bot`). E.g. `12a` and `12e` are connected,
 *   while `12e` and `12f` are isolated across the center DIP trench.
 */
export function breadboardHoleToBusId(hole: string): string | null {
  const railMatch = /^(tp|tn|bp|bn)_?\d+$/i.exec(hole);
  if (railMatch && railMatch[1]) {
    return `bb_rail_${railMatch[1].toLowerCase()}`;
  }
  const stripMatch = /^(\d{1,2})([a-jA-J])$/.exec(hole);
  if (stripMatch && stripMatch[1] && stripMatch[2]) {
    const col = stripMatch[1];
    const row = stripMatch[2].toLowerCase();
    const half = row <= 'e' ? 'upper' : 'lower';
    return `bb_strip_${col}_${half}`;
  }
  return null;
}

export class DisjointSet {
  private parent = new Map<string, string>();

  make(id: string): void {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
    }
  }

  find(id: string): string {
    this.make(id);
    let root = id;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    let curr = id;
    while (curr !== root) {
      const next = this.parent.get(curr)!;
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent.set(rb, ra);
    }
  }
}

export interface NetlistBuildResult {
  /** Mapping from pin key (`compId:termId`) to canonical net ID (`net_0`, `net_1`, ...) */
  pinToNet: Map<string, string>;
  /** Mapping from canonical net ID to list of member pin keys */
  netToPins: Map<string, string[]>;
  /** All canonical net IDs */
  nets: string[];
  /** Components treated as ideal closed shorts (closed switches, pressed pushbuttons, intact fuses, ammeters?) */
  closedSwitches: Set<string>;
}

export function isSwitchClosed(comp: CircuitComponent): boolean {
  if (comp.faulty) {
    // A faulty switch in diagnostic exercises stays stuck open
    return false;
  }
  if (comp.type === 'switch_spst') {
    return Boolean(comp.params.closed);
  }
  if (comp.type === 'pushbutton') {
    return Boolean(comp.params.pressed);
  }
  return false;
}

export function buildNetlist(doc: CircuitDocument): NetlistBuildResult {
  const dsu = new DisjointSet();
  const allPinKeys: string[] = [];
  const closedSwitches = new Set<string>();

  for (const comp of doc.components) {
    // Register common terminals based on component type
    const terminals =
      comp.type === 'ground'
        ? ['gnd']
        : comp.type === 'potentiometer'
          ? ['a', 'wiper', 'b']
          : comp.type === 'voltage_source' || comp.type === 'battery' || comp.type === 'voltmeter' || comp.type === 'ammeter'
            ? ['pos', 'neg']
            : comp.type === 'led' || comp.type === 'diode'
              ? ['anode', 'cathode']
              : comp.type === 'logic_input'
                ? ['out']
                : comp.type === 'logic_output'
                  ? ['in']
                  : comp.type === 'logic_gate'
                    ? comp.params.gateKind === 'NOT'
                      ? ['inA', 'out']
                      : ['inA', 'inB', 'out']
                    : ['a', 'b'];

    for (const term of terminals) {
      const pk = pinKeyString(comp.id, term);
      dsu.make(pk);
      allPinKeys.push(pk);

      // In breadboard mode, also merge pins inserted into the same physical breadboard bus
      if (doc.viewMode === 'breadboard' && comp.breadboardPins?.[term]) {
        const busId = breadboardHoleToBusId(comp.breadboardPins[term]!);
        if (busId) {
          dsu.make(busId);
          dsu.union(pk, busId);
        }
      }
    }

    if (isSwitchClosed(comp)) {
      closedSwitches.add(comp.id);
      dsu.union(pinKeyString(comp.id, 'a'), pinKeyString(comp.id, 'b'));
    }
  }

  for (const wire of doc.wires) {
    const a = pinKeyString(wire.from.componentId, wire.from.terminalId);
    const b = pinKeyString(wire.to.componentId, wire.to.terminalId);
    dsu.union(a, b);
  }

  const rootToCanonical = new Map<string, string>();
  const pinToNet = new Map<string, string>();
  const netToPins = new Map<string, string[]>();
  const nets: string[] = [];
  let counter = 0;

  for (const pk of allPinKeys) {
    const root = dsu.find(pk);
    let netId = rootToCanonical.get(root);
    if (!netId) {
      netId = `net_${counter++}`;
      rootToCanonical.set(root, netId);
      nets.push(netId);
      netToPins.set(netId, []);
    }
    pinToNet.set(pk, netId);
    netToPins.get(netId)!.push(pk);
  }

  return {
    pinToNet,
    netToPins,
    nets,
    closedSwitches,
  };
}
