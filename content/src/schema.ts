import type {
  CircuitDocument,
  ComponentType,
  LogicGateKind,
  ResistorBandColor,
  SignalGeneratorConfig,
} from '@kimovolt/simulation';

export const BRAND_CONFIG = {
  shortName: 'KIMOVOLT',
  fullName: 'KIMOVOLT LAB',
  domainPlaceholder: 'kimovolt.lab',
  motto: {
    ru: 'Не просто изучай электронику. Заставь её работать.',
    en: "Don't just learn electronics. Make it work.",
  },
  circuitFileExtension: '.kimovolt.json',
} as const;

export interface LocalizedText {
  ru: string;
  en: string;
}

export type ExerciseType =
  | 'multiple_choice'
  | 'predict_outcome'
  | 'numeric'
  | 'component_recognition'
  | 'resistor_color_code'
  | 'tune_parameter'
  | 'build_circuit'
  | 'find_fault'
  | 'measure_multimeter'
  | 'oscilloscope_analysis'
  | 'logic_circuit'
  | 'unknown_circuit_diagnosis'
  | 'engineering_spec';

export type MisconceptionCode =
  | 'CURRENT_VS_VOLTAGE'
  | 'RESISTANCE_INCREASES_CURRENT'
  | 'SERIES_VS_PARALLEL'
  | 'LED_POLARITY_IGNORED'
  | 'MISSING_COMMON_GND'
  | 'AMMETER_PARALLEL_MISUSE'
  | 'UNPROTECTED_LED';

export interface MisconceptionRule {
  code: MisconceptionCode;
  title: LocalizedText;
  explanation: LocalizedText;
  remedialHint: LocalizedText;
  recommendedLessonId: string;
}

export interface ChoiceOption {
  id: string;
  text: LocalizedText;
  misconceptionCode?: MisconceptionCode;
  feedback?: LocalizedText;
}

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt: LocalizedText;
  hints: LocalizedText[];
  explanation: LocalizedText;
  skillIds: string[];
  difficulty: 1 | 2 | 3;
}

export interface ChoiceExercise extends BaseExercise {
  type: 'multiple_choice' | 'predict_outcome' | 'component_recognition';
  componentPreview?: ComponentType;
  options: ChoiceOption[];
  correctOptionId: string;
  /** Optional interactive verification circuit shown after prediction */
  verifyCircuit?: CircuitDocument;
}

export interface NumericExercise extends BaseExercise {
  type: 'numeric';
  expectedValue: number; // in base SI unit (V, A, Ω, W, Hz, s) or explicit display unit
  unit: 'V' | 'mA' | 'A' | 'Ω' | 'kΩ' | 'W' | 'Hz' | 'ms' | '%';
  tolerancePercent: number;
  misconceptionHints?: Array<{
    min?: number;
    max?: number;
    code: MisconceptionCode;
  }>;
}

export interface ResistorColorExercise extends BaseExercise {
  type: 'resistor_color_code';
  mode: 'decode_bands_to_ohms' | 'pick_bands_for_ohms';
  bands?: ResistorBandColor[];
  targetOhms: number;
}

export interface TuneParameterExercise extends BaseExercise {
  type: 'tune_parameter';
  initialCircuit: CircuitDocument;
  targetComponentId: string;
  paramKey: 'resistance' | 'voltage' | 'wiperPosition';
  minVal: number;
  maxVal: number;
  stepVal: number;
  /** Evaluation conditions checked via MNA */
  targetLedId?: string;
  minCurrentMa?: number;
  maxCurrentMa?: number;
  targetVoltageDrop?: { componentId: string; minV: number; maxV: number };
  requireStandardE12?: boolean;
}

export interface BuildCircuitExercise extends BaseExercise {
  type: 'build_circuit';
  initialCircuit: CircuitDocument;
  palette: ComponentType[];
  requirements: {
    requireLedLit?: boolean;
    requireNoWarnings?: boolean;
    minCurrentMa?: number;
    maxCurrentMa?: number;
    toggleSwitchId?: string;
    requireMultipleSeriesResistors?: number;
    requireParallelBranches?: number;
  };
}

export interface FindFaultExercise extends BaseExercise {
  type: 'find_fault' | 'unknown_circuit_diagnosis';
  faultyCircuit: CircuitDocument;
  /** Optional first-step symptom question */
  faultQuestion?: {
    options: ChoiceOption[];
    correctOptionId: string;
  };
  requireFixedCircuit: boolean;
  targetLedId?: string;
  minCurrentMa?: number;
  maxCurrentMa?: number;
}

export interface MeasureMultimeterExercise extends BaseExercise {
  type: 'measure_multimeter';
  circuit: CircuitDocument;
  requiredMode: 'dc_v' | 'dc_ma' | 'ohm' | 'continuity';
  targetPinPair?: {
    componentId: string;
    termA: string;
    termB: string;
    polarSensitive?: boolean;
  };
  expectedReading: number; // V, mA, or Ohm
  tolerancePercent: number;
}

export interface OscilloscopeExercise extends BaseExercise {
  type: 'oscilloscope_analysis';
  signal: SignalGeneratorConfig;
  questionKind: 'frequency' | 'period_ms' | 'vpp' | 'duty_cycle';
  expectedValue: number;
  unit: 'Hz' | 'ms' | 'V' | '%';
  tolerancePercent: number;
}

export interface LogicCircuitExercise extends BaseExercise {
  type: 'logic_circuit';
  initialCircuit: CircuitDocument;
  availableGates: LogicGateKind[];
  /** Truth table expected by output pin ID for ordered input IDs */
  expectedOutputs: boolean[];
}

export interface EngineeringSpecExercise extends BaseExercise {
  type: 'engineering_spec';
  initialCircuit: CircuitDocument;
  palette: ComponentType[];
  inputIds: string[]; // switch / pushbutton IDs toggled through all 2^k combos
  outputLedId: string;
  /** Expected LED lit state for bitmask 0..(2^k - 1) where bit 0 is last input */
  expectedLitStates: boolean[];
}

export type Exercise =
  | ChoiceExercise
  | NumericExercise
  | ResistorColorExercise
  | TuneParameterExercise
  | BuildCircuitExercise
  | FindFaultExercise
  | MeasureMultimeterExercise
  | OscilloscopeExercise
  | LogicCircuitExercise
  | EngineeringSpecExercise;

export interface LessonStep {
  id: string;
  phase: 'observe' | 'predict' | 'experiment' | 'measure' | 'explain' | 'apply';
  title: LocalizedText;
  body: LocalizedText;
  formula?: string;
  safetyNote?: LocalizedText;
  /** Optional passive/interactive showcase circuit when step has no exercise */
  demoCircuit?: CircuitDocument;
  exercise?: Exercise;
}

export interface LessonDefinition {
  id: string;
  version: number;
  moduleId: string;
  order: number;
  title: LocalizedText;
  subtitle: LocalizedText;
  objective: LocalizedText;
  estimatedMinutes: number;
  practiceType: LocalizedText;
  skillIds: string[];
  prerequisites: string[];
  questId?: string;
  xpReward: number;
  notebookTakeaway: LocalizedText;
  notebookFormula?: string;
  steps: LessonStep[];
  /** Coordinates on the PCB learning map (0..1000 x 0..640) */
  mapNode: { x: number; y: number };
}

export interface ModuleDefinition {
  id: string;
  trackId: string;
  numberLabel: string;
  title: LocalizedText;
  description: LocalizedText;
  status: 'active' | 'upcoming';
  plannedTopics?: LocalizedText[];
}

export interface TrackDefinition {
  id: string;
  code: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface SkillNode {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  prerequisites: string[];
  lessonIds: string[];
}

export interface AchievementDefinition {
  id: string;
  code: string;
  title: LocalizedText;
  description: LocalizedText;
  hidden?: boolean;
  xpBonus: number;
}

export interface QuestDefinition {
  id: string;
  title: LocalizedText;
  briefing: LocalizedText;
  lessonId: string;
}

export interface EncyclopediaEntry {
  id: string;
  type: ComponentType | 'capacitor';
  name: LocalizedText;
  designator: string;
  category: 'sources' | 'passive' | 'semiconductors' | 'controls' | 'instruments' | 'logic';
  summary: LocalizedText;
  howItWorks: LocalizedText;
  typicalParams: LocalizedText;
  polarityNote?: LocalizedText;
  commonMistakes: LocalizedText[];
  linkedLessonIds: string[];
  /** Live simulation preset or RC mode */
  interactiveDemo?:
    | { kind: 'circuit'; circuit: CircuitDocument; sliderComponentId?: string; sliderParam?: 'resistance' | 'wiperPosition' | 'voltage'; min?: number; max?: number; step?: number }
    | { kind: 'rc_waveform'; signal: SignalGeneratorConfig }
    | { kind: 'logic_and'; circuit: CircuitDocument };
}

export interface BoardPinInfo {
  pin: string;
  role: string;
  notes: LocalizedText;
}

export interface BoardProfile {
  id: 'arduino_uno' | 'esp32_c3' | 'esp32_s3';
  name: string;
  mcu: string;
  operatingVoltage: string;
  logicLevel: string;
  maxPinCurrent: string;
  safetyRules: LocalizedText;
  pins: BoardPinInfo[];
  blinkCodeSnippet: string;
}

export interface HardwareProject {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  requiredSkills: string[];
  componentsList: LocalizedText[];
  safetyNotes: LocalizedText;
  assemblySteps: LocalizedText[];
  expectedMeasurements: LocalizedText[];
  circuit: CircuitDocument;
  boardHint?: 'arduino_uno' | 'esp32_c3' | 'esp32_s3';
}
