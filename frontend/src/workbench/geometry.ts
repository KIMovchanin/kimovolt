import { getComponentTerminals, type CircuitComponent, type TerminalDef } from '@kimovolt/simulation';

export const GRID_PX = 28;

export function rotateOffset(ox: number, oy: number, rotation: 0 | 90 | 180 | 270): { dx: number; dy: number } {
  switch (rotation) {
    case 0:
      return { dx: ox, dy: oy };
    case 90:
      return { dx: -oy, dy: ox };
    case 180:
      return { dx: -ox, dy: -oy };
    case 270:
      return { dx: oy, dy: -ox };
  }
}

export function getAbsoluteTerminalPos(
  comp: CircuitComponent,
  terminalId: string
): { x: number; y: number } | null {
  const defs = getComponentTerminals(comp);
  const def = defs.find((d) => d.id === terminalId);
  if (!def) return null;
  const { dx, dy } = rotateOffset(def.offsetX, def.offsetY, comp.rotation);
  return {
    x: (comp.position.x + dx) * GRID_PX,
    y: (comp.position.y + dy) * GRID_PX,
  };
}

export function getAllAbsoluteTerminals(
  comp: CircuitComponent
): Array<{ def: TerminalDef; x: number; y: number }> {
  return getComponentTerminals(comp).map((def) => {
    const { dx, dy } = rotateOffset(def.offsetX, def.offsetY, comp.rotation);
    return {
      def,
      x: (comp.position.x + dx) * GRID_PX,
      y: (comp.position.y + dy) * GRID_PX,
    };
  });
}

export function orthogonalWirePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  laneBias = 0
): string {
  if (Math.abs(x1 - x2) < 2 || Math.abs(y1 - y2) < 2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  const midX = Math.round(((x1 + x2) / 2 + laneBias * 8) / 4) * 4;
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
}
