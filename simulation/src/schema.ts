import { z } from 'zod';

export const MAX_CIRCUIT_JSON_BYTES = 256 * 1024;
export const MAX_COMPONENTS = 200;
export const MAX_WIRES = 500;

export const ComponentTypeSchema = z.enum([
  'voltage_source',
  'battery',
  'ground',
  'resistor',
  'potentiometer',
  'led',
  'diode',
  'switch_spst',
  'pushbutton',
  'fuse',
  'voltmeter',
  'ammeter',
  'logic_input',
  'logic_gate',
  'logic_output',
]);

export type ComponentType = z.infer<typeof ComponentTypeSchema>;

export const LedColorSchema = z.enum(['red', 'amber', 'green', 'blue', 'white']);
export type LedColor = z.infer<typeof LedColorSchema>;

export const LogicGateKindSchema = z.enum(['NOT', 'AND', 'OR', 'XOR', 'NAND', 'NOR']);
export type LogicGateKind = z.infer<typeof LogicGateKindSchema>;

export interface TerminalDef {
  id: string;
  label: string;
  polarity?: 'positive' | 'negative' | 'anode' | 'cathode' | 'neutral';
  /** Relative offset in schematic grid units (1 unit = 20px) */
  offsetX: number;
  offsetY: number;
}

export const COMPONENT_TERMINALS: Record<ComponentType, TerminalDef[]> = {
  voltage_source: [
    { id: 'pos', label: '+', polarity: 'positive', offsetX: 0, offsetY: -2 },
    { id: 'neg', label: '-', polarity: 'negative', offsetX: 0, offsetY: 2 },
  ],
  battery: [
    { id: 'pos', label: '+', polarity: 'positive', offsetX: 0, offsetY: -2 },
    { id: 'neg', label: '-', polarity: 'negative', offsetX: 0, offsetY: 2 },
  ],
  ground: [{ id: 'gnd', label: 'GND', polarity: 'neutral', offsetX: 0, offsetY: -1 }],
  resistor: [
    { id: 'a', label: '1', polarity: 'neutral', offsetX: -2, offsetY: 0 },
    { id: 'b', label: '2', polarity: 'neutral', offsetX: 2, offsetY: 0 },
  ],
  potentiometer: [
    { id: 'a', label: 'A', polarity: 'neutral', offsetX: -2, offsetY: 0 },
    { id: 'wiper', label: 'W', polarity: 'neutral', offsetX: 0, offsetY: -2 },
    { id: 'b', label: 'B', polarity: 'neutral', offsetX: 2, offsetY: 0 },
  ],
  led: [
    { id: 'anode', label: 'A (+)', polarity: 'anode', offsetX: -2, offsetY: 0 },
    { id: 'cathode', label: 'K (-)', polarity: 'cathode', offsetX: 2, offsetY: 0 },
  ],
  diode: [
    { id: 'anode', label: 'A', polarity: 'anode', offsetX: -2, offsetY: 0 },
    { id: 'cathode', label: 'K', polarity: 'cathode', offsetX: 2, offsetY: 0 },
  ],
  switch_spst: [
    { id: 'a', label: '1', polarity: 'neutral', offsetX: -2, offsetY: 0 },
    { id: 'b', label: '2', polarity: 'neutral', offsetX: 2, offsetY: 0 },
  ],
  pushbutton: [
    { id: 'a', label: '1', polarity: 'neutral', offsetX: -2, offsetY: 0 },
    { id: 'b', label: '2', polarity: 'neutral', offsetX: 2, offsetY: 0 },
  ],
  fuse: [
    { id: 'a', label: '1', polarity: 'neutral', offsetX: -2, offsetY: 0 },
    { id: 'b', label: '2', polarity: 'neutral', offsetX: 2, offsetY: 0 },
  ],
  voltmeter: [
    { id: 'pos', label: '+', polarity: 'positive', offsetX: -2, offsetY: 0 },
    { id: 'neg', label: '-', polarity: 'negative', offsetX: 2, offsetY: 0 },
  ],
  ammeter: [
    { id: 'pos', label: '+', polarity: 'positive', offsetX: -2, offsetY: 0 },
    { id: 'neg', label: '-', polarity: 'negative', offsetX: 2, offsetY: 0 },
  ],
  logic_input: [{ id: 'out', label: 'OUT', polarity: 'neutral', offsetX: 2, offsetY: 0 }],
  logic_gate: [
    { id: 'inA', label: 'A', polarity: 'neutral', offsetX: -2, offsetY: -1 },
    { id: 'inB', label: 'B', polarity: 'neutral', offsetX: -2, offsetY: 1 },
    { id: 'out', label: 'Y', polarity: 'neutral', offsetX: 2, offsetY: 0 },
  ],
  logic_output: [{ id: 'in', label: 'IN', polarity: 'neutral', offsetX: -2, offsetY: 0 }],
};

export const LED_FORWARD_VOLTAGE: Record<LedColor, number> = {
  red: 2.0,
  amber: 2.05,
  green: 2.1,
  blue: 3.1,
  white: 3.1,
};

export const BreadboardHoleSchema = z.string().regex(/^[a-zA-Z0-9_-]{2,24}$/);

export const ComponentParamsSchema = z.object({
  voltage: z.number().min(0).max(1000).optional(),
  resistance: z.number().min(0.01).max(1e9).optional(),
  powerRating: z.number().min(0.01).max(1000).optional(),
  wiperPosition: z.number().min(0).max(1).optional(),
  color: LedColorSchema.optional(),
  forwardVoltage: z.number().min(0.2).max(12).optional(),
  nominalCurrent: z.number().min(0.0005).max(1).optional(),
  maxCurrent: z.number().min(0.001).max(10).optional(),
  closed: z.boolean().optional(),
  pressed: z.boolean().optional(),
  ratedCurrent: z.number().min(0.005).max(100).optional(),
  blown: z.boolean().optional(),
  gateKind: LogicGateKindSchema.optional(),
  logicLevel: z.boolean().optional(),
});

export type ComponentParams = z.infer<typeof ComponentParamsSchema>;

export const CircuitComponentSchema = z.object({
  id: z.string().min(1).max(64),
  type: ComponentTypeSchema,
  label: z.string().max(48).default(''),
  params: ComponentParamsSchema.default({}),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).default(0),
  breadboardPins: z.record(z.string(), BreadboardHoleSchema).optional(),
  locked: z.boolean().optional(),
  faulty: z.boolean().optional(),
});

export type CircuitComponent = z.infer<typeof CircuitComponentSchema>;

export const PinRefSchema = z.object({
  componentId: z.string().min(1).max(64),
  terminalId: z.string().min(1).max(32),
});

export type PinRef = z.infer<typeof PinRefSchema>;

export const CircuitWireSchema = z.object({
  id: z.string().min(1).max(64),
  from: PinRefSchema,
  to: PinRefSchema,
  color: z.enum(['copper', 'red', 'black', 'cyan', 'green', 'amber']).optional(),
  locked: z.boolean().optional(),
});

export type CircuitWire = z.infer<typeof CircuitWireSchema>;

export const CircuitDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1).max(80).default('untitled'),
  name: z.string().min(1).max(120).default('Circuit'),
  viewMode: z.enum(['schematic', 'breadboard']).default('schematic'),
  components: z.array(CircuitComponentSchema).max(MAX_COMPONENTS),
  wires: z.array(CircuitWireSchema).max(MAX_WIRES),
  metadata: z
    .object({
      authorNote: z.string().max(1000).optional(),
      createdAt: z.string().max(64).optional(),
      updatedAt: z.string().max(64).optional(),
    })
    .optional(),
});

export type CircuitDocument = z.infer<typeof CircuitDocumentSchema>;

export interface SafeImportResult {
  ok: true;
  document: CircuitDocument;
}

export interface SafeImportError {
  ok: false;
  errorCode: 'PAYLOAD_TOO_LARGE' | 'INVALID_JSON' | 'UNSAFE_KEYS' | 'SCHEMA_MISMATCH';
  details: string;
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function containsForbiddenKeys(value: unknown, depth = 0): boolean {
  if (depth > 24 || value === null || typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenKeys(item, depth + 1));
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return true;
    }
    if (containsForbiddenKeys(record[key], depth + 1)) {
      return true;
    }
  }
  return false;
}

export function parseAndValidateCircuitJson(raw: string): SafeImportResult | SafeImportError {
  const byteLength = new TextEncoder().encode(raw).byteLength;
  if (byteLength > MAX_CIRCUIT_JSON_BYTES) {
    return {
      ok: false,
      errorCode: 'PAYLOAD_TOO_LARGE',
      details: `Payload exceeds ${MAX_CIRCUIT_JSON_BYTES} bytes limit`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      errorCode: 'INVALID_JSON',
      details: err instanceof Error ? err.message : 'Malformed JSON',
    };
  }

  if (containsForbiddenKeys(parsed)) {
    return {
      ok: false,
      errorCode: 'UNSAFE_KEYS',
      details: 'Prototype pollution keys are not permitted in circuit files',
    };
  }

  const result = CircuitDocumentSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errorCode: 'SCHEMA_MISMATCH',
      details: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    };
  }

  return { ok: true, document: result.data };
}

export function getComponentTerminals(comp: CircuitComponent): TerminalDef[] {
  if (comp.type === 'logic_gate' && comp.params.gateKind === 'NOT') {
    return [
      { id: 'inA', label: 'A', polarity: 'neutral', offsetX: -2, offsetY: 0 },
      { id: 'out', label: 'Y', polarity: 'neutral', offsetX: 2, offsetY: 0 },
    ];
  }
  return COMPONENT_TERMINALS[comp.type];
}
