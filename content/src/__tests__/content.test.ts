import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  BOARD_PROFILES,
  computeLessonStatus,
  createEmptyProgressState,
  ENCYCLOPEDIA_ENTRIES,
  EN_STRINGS,
  evaluateAchievements,
  getLessonById,
  HARDWARE_PROJECTS,
  LESSONS,
  MISCONCEPTIONS,
  MODULES,
  recordSkillAttempt,
  RU_STRINGS,
  SANDBOX_PRESETS,
  SKILLS,
  SRS_INTERVAL_HOURS,
  updateStreakAndXp,
  validateExerciseAnswer,
  type BuildCircuitExercise,
  type EngineeringSpecExercise,
  type FindFaultExercise,
  type LogicCircuitExercise,
  type MeasureMultimeterExercise,
  type OscilloscopeExercise,
  type ResistorColorExercise,
  type TuneParameterExercise,
} from '../index';
import { solveCircuit } from '@kimovolt/simulation';

describe('Curriculum & Content Integrity', () => {
  it('contains at least 15 complete lessons with valid DAG prerequisites and skills', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(15);
    const lessonIds = new Set(LESSONS.map((l) => l.id));
    const skillIds = new Set(SKILLS.map((s) => s.id));
    const moduleIds = new Set(MODULES.map((m) => m.id));

    expect(lessonIds.size).toBe(LESSONS.length);
    for (const lesson of LESSONS) {
      expect(moduleIds.has(lesson.moduleId)).toBe(true);
      expect(lesson.version).toBeGreaterThanOrEqual(1);
      expect(lesson.steps.length).toBeGreaterThanOrEqual(2);
      for (const prereq of lesson.prerequisites) {
        expect(lessonIds.has(prereq)).toBe(true);
      }
      for (const sid of lesson.skillIds) {
        expect(skillIds.has(sid)).toBe(true);
      }
    }
  });

  it('has complete Russian and English i18n key parity', () => {
    expect(Object.keys(RU_STRINGS)).toEqual(Object.keys(EN_STRINGS));
    expect(Object.keys(RU_STRINGS.nav)).toEqual(Object.keys(EN_STRINGS.nav));
    expect(Object.keys(RU_STRINGS.workbench)).toEqual(Object.keys(EN_STRINGS.workbench));
  });

  it('includes valid encyclopedia, board profiles, hardware projects, and sandbox presets', () => {
    expect(ENCYCLOPEDIA_ENTRIES.length).toBeGreaterThanOrEqual(12);
    expect(BOARD_PROFILES.map((b) => b.id)).toEqual(['arduino_uno', 'esp32_c3', 'esp32_s3']);
    expect(HARDWARE_PROJECTS.length).toBeGreaterThanOrEqual(6);
    expect(SANDBOX_PRESETS.length).toBeGreaterThanOrEqual(8);

    // Every project circuit must solve cleanly without fatal errors
    for (const proj of HARDWARE_PROJECTS) {
      const sim = solveCircuit(proj.circuit);
      expect(sim.solvable).toBe(true);
      expect(sim.diagnostics.some((d) => d.severity === 'error')).toBe(false);
    }
  });
});

describe('Exercise Validators', () => {
  it('validates Reference Lesson 1 (m0-first-led) across all 7 scenes including equivalent wiring and switch bypass rejection', () => {
    const l1 = getLessonById('m0-first-led')!;
    expect(l1.steps.length).toBe(7);

    // Scene 2: switch close check
    const exSwitch = l1.steps[1]!.exercise as BuildCircuitExercise;
    expect(validateExerciseAnswer(exSwitch, { circuit: exSwitch.initialCircuit }).passed).toBe(false);
    const closedCircuit = {
      ...exSwitch.initialCircuit,
      components: exSwitch.initialCircuit.components.map((c) =>
        c.id === 'sw1' ? { ...c, params: { ...c.params, closed: true } } : c
      ),
    };
    expect(validateExerciseAnswer(exSwitch, { circuit: closedCircuit }).passed).toBe(true);

    // Scene 4: tune resistor
    const exTune = l1.steps[3]!.exercise as TuneParameterExercise;
    expect(validateExerciseAnswer(exTune, { circuit: exTune.initialCircuit }).passed).toBe(false);
    const tunedCircuit = {
      ...exTune.initialCircuit,
      components: exTune.initialCircuit.components.map((c) =>
        c.id === 'r1' ? { ...c, params: { ...c.params, resistance: 330 } } : c
      ),
    };
    expect(validateExerciseAnswer(exTune, { circuit: tunedCircuit }).passed).toBe(true);

    // Scene 6: build from scratch — reject switch bypass!
    const exBuild = l1.steps[5]!.exercise as BuildCircuitExercise;
    const bypassedDoc = {
      ...exBuild.initialCircuit,
      wires: [
        ...exBuild.initialCircuit.wires,
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w3', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    };
    expect(validateExerciseAnswer(exBuild, { circuit: bypassedDoc }).passed).toBe(false);

    // Valid equivalent order: V+ -> R1 -> SW1 -> LED -> V-
    const validAltDoc = {
      ...exBuild.initialCircuit,
      wires: [
        ...exBuild.initialCircuit.wires,
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'sw1', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'sw1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    };
    expect(validateExerciseAnswer(exBuild, { circuit: validAltDoc }).passed).toBe(true);
  });

  it('parses numeric answers with commas and RU/EN SI units', () => {
    const l6 = getLessonById('m3-ohms-law')!;
    const numEx = l6.steps[1]!.exercise!; // expects 15 mA
    expect(validateExerciseAnswer(numEx, { numericInput: '15' }).passed).toBe(true);
    expect(validateExerciseAnswer(numEx, { numericInput: '15,0 мА' }).passed).toBe(true);
    expect(validateExerciseAnswer(numEx, { numericInput: '0.015 A' }).passed).toBe(true);
    expect(validateExerciseAnswer(numEx, { numericInput: '5 mA' }).passed).toBe(false);
  });

  it('validates resistor color code decoding & encoding, multimeter probing, oscilloscope & logic/engineering spec', () => {
    const l5 = getLessonById('m2-components-color-code')!;
    const decodeEx = l5.steps[1]!.exercise as ResistorColorExercise;
    expect(validateExerciseAnswer(decodeEx, { numericInput: '4.7 kΩ' }).passed).toBe(true);

    const encodeEx = l5.steps[2]!.exercise as ResistorColorExercise;
    expect(validateExerciseAnswer(encodeEx, { bands: ['orange', 'orange', 'brown', 'gold'] }).passed).toBe(true);
    expect(validateExerciseAnswer(encodeEx, { bands: ['red', 'red', 'brown', 'gold'] }).passed).toBe(false);

    // Multimeter
    const l11 = getLessonById('m6-voltmeter')!;
    const mmEx = l11.steps[1]!.exercise as MeasureMultimeterExercise;
    expect(
      validateExerciseAnswer(mmEx, {
        numericInput: '3.0',
        multimeter: {
          mode: 'dc_v',
          posPin: { componentId: 'r1', terminalId: 'a' },
          negPin: { componentId: 'r1', terminalId: 'b' },
        },
      }).passed
    ).toBe(true);

    // Quest Dead Beacon
    const l13 = getLessonById('m6-diagnostics-beacon')!;
    const repairEx = l13.steps[1]!.exercise as FindFaultExercise;
    expect(validateExerciseAnswer(repairEx, { circuit: repairEx.faultyCircuit }).passed).toBe(false);
    const repaired = {
      ...repairEx.faultyCircuit,
      components: repairEx.faultyCircuit.components.map((c) =>
        c.id === 'f1'
          ? { ...c, params: { ...c.params, blown: false } }
          : c.id === 'r1'
            ? { ...c, params: { ...c.params, resistance: 470 } }
            : c
      ),
    };
    expect(validateExerciseAnswer(repairEx, { circuit: repaired }).passed).toBe(true);

    // Logic XOR & 2-Button Engineering Spec
    const l14 = getLessonById('m9-logic-gates')!;
    const xorEx = l14.steps[0]!.exercise as LogicCircuitExercise;
    const wiredXor = {
      ...xorEx.initialCircuit,
      wires: [
        { id: 'w1', from: { componentId: 'inA', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inA' } },
        { id: 'w2', from: { componentId: 'inB', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inB' } },
        { id: 'w3', from: { componentId: 'g1', terminalId: 'out' }, to: { componentId: 'out1', terminalId: 'in' } },
      ],
    };
    expect(validateExerciseAnswer(xorEx, { circuit: wiredXor }).passed).toBe(true);

    const specEx = l14.steps[1]!.exercise as EngineeringSpecExercise;
    const seriesSpec = {
      ...specEx.initialCircuit,
      wires: [
        ...specEx.initialCircuit.wires,
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'btn1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'btn1', terminalId: 'b' }, to: { componentId: 'btn2', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'btn2', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w4', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w5', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
      ],
    };
    expect(validateExerciseAnswer(specEx, { circuit: seriesSpec }).passed).toBe(true);

    // Oscilloscope
    const l15 = getLessonById('m10-oscilloscope-pwm')!;
    const scopeEx = l15.steps[0]!.exercise as OscilloscopeExercise;
    expect(validateExerciseAnswer(scopeEx, { numericInput: '2.0 ms' }).passed).toBe(true);
    expect(validateExerciseAnswer(l15.steps[1]!.exercise!, { numericInput: '30%' }).passed).toBe(true);
  });
});

describe('Progression, Mastery, SRS & Achievements', () => {
  it('computes lesson lock states, SRS schedules, misconceptions, and achievements accurately', () => {
    let state = createEmptyProgressState();
    const l1 = getLessonById('m0-first-led')!;
    const l2 = getLessonById('m1-voltage')!;

    expect(computeLessonStatus(l1, state)).toBe('available');
    expect(computeLessonStatus(l2, state)).toBe('locked');

    const t0 = '2026-11-19T10:00:00.000Z';
    state = recordSkillAttempt(state, ['closed_loop'], {
      passed: false,
      firstTry: true,
      hintsUsed: 0,
      difficulty: 1,
      misconceptionCode: 'LED_POLARITY_IGNORED',
      nowIso: t0,
    });
    expect(state.misconceptionCounts.LED_POLARITY_IGNORED).toBe(1);
    expect(MISCONCEPTIONS.LED_POLARITY_IGNORED.recommendedLessonId).toBe('m5-leds-polarity');

    state = recordSkillAttempt(state, ['closed_loop'], {
      passed: true,
      firstTry: true,
      hintsUsed: 0,
      difficulty: 2,
      nowIso: t0,
    });
    expect(state.skills.closed_loop!.mastery).toBeGreaterThan(20);
    expect(state.skills.closed_loop!.reviewIntervalIndex).toBe(1);
    const dueMs = Date.parse(state.skills.closed_loop!.nextReviewAt!);
    expect(dueMs - Date.parse(t0)).toBe(SRS_INTERVAL_HOURS[1] * 3600 * 1000);

    state = {
      ...state,
      lessons: {
        ...state.lessons,
        'm0-first-led': {
          lessonId: 'm0-first-led',
          version: 1,
          status: 'completed',
          currentStepIndex: 6,
          completedStepIds: l1.steps.map((s) => s.id),
          attempts: 1,
          hintsUsed: 0,
          mistakes: 0,
          bestScore: 100,
          completedAt: t0,
        },
      },
      skills: {
        ...state.skills,
        closed_loop: { ...state.skills.closed_loop!, mastery: 92 },
      },
    };
    state = updateStreakAndXp(state, 120, new Date(t0));
    state.achievements = evaluateAchievements(state);
    expect(state.achievements).toContain('FIRST_SPARK');
    expect(ACHIEVEMENTS.some((a) => a.id === 'FIRST_SPARK')).toBe(true);

    expect(computeLessonStatus(l1, state, Date.parse(t0))).toBe('mastered');
    expect(computeLessonStatus(l2, state, Date.parse(t0))).toBe('available');
    // After SRS due time elapses, status switches cleanly to needs_review!
    expect(computeLessonStatus(l1, state, dueMs + 1000)).toBe('needs_review');
  });
});
