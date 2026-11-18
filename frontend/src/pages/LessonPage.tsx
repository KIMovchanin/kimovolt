import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getLessonById,
  LESSONS,
  MISCONCEPTIONS,
  validateExerciseAnswer,
  type Exercise,
  type LessonStep,
  type ValidationOutcome,
} from '@kimovolt/content';
import {
  formatMetric,
  type CircuitDocument,
  type MultimeterMode,
  type PinRef,
  type ResistorBandColor,
} from '@kimovolt/simulation';
import { KeyboardShortcutsDialog } from '../components/ui/KeyboardShortcutsDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useSimulation } from '../hooks/useSimulation';
import { useApp } from '../state/AppStore';
import { labSound } from '../utils/sound';
import { CircuitCanvas, type OverlayOptions } from '../workbench/CircuitCanvas';
import { ComponentInspector } from '../workbench/ComponentInspector';
import { DiagnosticConsole } from '../workbench/DiagnosticConsole';
import { MultimeterWidget } from '../workbench/MultimeterWidget';
import { OscilloscopeWidget } from '../workbench/OscilloscopeWidget';
import { ResistorColorBandInteractive } from '../workbench/ResistorColorBandInteractive';
import { SchematicSymbol } from '../workbench/SchematicSymbol';

function getStepInitialCircuit(step: LessonStep): CircuitDocument | null {
  if (step.demoCircuit) return structuredClone(step.demoCircuit);
  const ex = step.exercise;
  if (!ex) return null;
  if (ex.type === 'tune_parameter' || ex.type === 'build_circuit' || ex.type === 'logic_circuit' || ex.type === 'engineering_spec') {
    return structuredClone(ex.initialCircuit);
  }
  if (ex.type === 'find_fault' || ex.type === 'unknown_circuit_diagnosis') {
    return structuredClone(ex.faultyCircuit);
  }
  if (ex.type === 'measure_multimeter') {
    return structuredClone(ex.circuit);
  }
  if ((ex.type === 'predict_outcome' || ex.type === 'multiple_choice') && ex.verifyCircuit) {
    return structuredClone(ex.verifyCircuit);
  }
  return null;
}

const DEFAULT_EMPTY_CIRCUIT: CircuitDocument = {
  schemaVersion: 1,
  id: 'empty-placeholder',
  name: 'Empty',
  viewMode: 'schematic',
  components: [],
  wires: [],
};

export const LessonPage: React.FC = () => {
  const { lessonId } = useParams();
  const lesson = useMemo(() => (lessonId ? getLessonById(lessonId) : undefined), [lessonId]);
  const { lang, t, recordStepAttempt, completeLesson, addNotebookEntry } = useApp();

  const [stepIdx, setStepIdx] = useState(0);
  const [circuit, setCircuit] = useState<CircuitDocument>(DEFAULT_EMPTY_CIRCUIT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayOptions>({
    showCurrent: true,
    showVoltage: false,
    showPower: false,
    xrayMode: false,
  });

  // Exercise input states
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [numericInput, setNumericInput] = useState<string>('');
  const [colorBands, setColorBands] = useState<ResistorBandColor[]>(['brown', 'black', 'brown', 'gold']);
  const [hintsShown, setHintsShown] = useState(0);
  const [stepMistakes, setStepMistakes] = useState(0);
  const [totalLessonMistakes, setTotalLessonMistakes] = useState(0);
  const [totalLessonHints, setTotalLessonHints] = useState(0);
  const [outcome, setOutcome] = useState<ValidationOutcome | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [lessonFinished, setLessonFinished] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  // Multimeter state
  const [mmMode, setMmMode] = useState<MultimeterMode>('dc_v');
  const [mmPosPin, setMmPosPin] = useState<PinRef | null>(null);
  const [mmNegPin, setMmNegPin] = useState<PinRef | null>(null);
  const [mmPicker, setMmPicker] = useState<'pos' | 'neg' | null>(null);

  // Panels & responsive tabs
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [mobileTab, setMobileTab] = useState<'task' | 'workspace' | 'instruments'>('task');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Reset entire lesson state when lessonId changes
  useEffect(() => {
    setStepIdx(0);
    setCompletedSteps({});
    setLessonFinished(false);
    setNewlyUnlocked([]);
    setTotalLessonMistakes(0);
    setTotalLessonHints(0);
  }, [lessonId]);

  const currentStep = lesson?.steps[stepIdx];

  // Reset step-specific state when step changes
  useEffect(() => {
    if (!currentStep) return;
    const initDoc = getStepInitialCircuit(currentStep);
    setCircuit(initDoc ?? DEFAULT_EMPTY_CIRCUIT);
    setSelectedId(
      currentStep.exercise?.type === 'tune_parameter' ? currentStep.exercise.targetComponentId : null
    );
    setSelectedOption('');
    setNumericInput('');
    setColorBands(['brown', 'black', 'brown', 'gold']);
    setHintsShown(0);
    setStepMistakes(0);
    setOutcome(null);
    setMmPosPin(null);
    setMmNegPin(null);
    setMmPicker(null);
    if (currentStep.exercise?.type === 'measure_multimeter') {
      setMmMode(currentStep.exercise.requiredMode);
    }
  }, [lesson?.id, stepIdx]);

  const { sim, logicSim } = useSimulation(circuit);

  if (!lesson || !currentStep) {
    return (
      <div className="kv-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 id="main-content" tabIndex={-1}>{lang === 'ru' ? 'Урок не найден' : 'Lesson not found'}</h1>
        <Link to="/learn" className="kv-btn kv-btn-primary">
          {lang === 'ru' ? 'Вернуться к карте обучения' : 'Back to Learning Map'}
        </Link>
      </div>
    );
  }

  const exercise: Exercise | undefined = currentStep.exercise;
  const stepDone = !exercise || Boolean(completedSteps[currentStep.id]);

  const handleCheckExercise = () => {
    if (!exercise) return;
    const res = validateExerciseAnswer(exercise, {
      selectedOptionId: selectedOption,
      numericInput,
      bands: colorBands,
      circuit,
      multimeter: { mode: mmMode, posPin: mmPosPin, negPin: mmNegPin },
    });
    setOutcome(res);

    const isFirstTry = stepMistakes === 0;
    recordStepAttempt({
      lessonId: lesson.id,
      stepId: currentStep.id,
      skillIds: exercise.skillIds,
      passed: res.passed,
      firstTry: isFirstTry,
      hintsUsed: hintsShown,
      difficulty: exercise.difficulty,
      misconceptionCode: res.misconceptionCode,
    });

    if (res.passed) {
      setCompletedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
      labSound.playSuccessChime();
    } else {
      setStepMistakes((m) => m + 1);
      setTotalLessonMistakes((m) => m + 1);
      labSound.playWarningTick();
    }
  };

  const handleNextStep = () => {
    if (stepIdx < lesson.steps.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      const unlocked = completeLesson(lesson.id, {
        hintsUsed: totalLessonHints,
        mistakes: totalLessonMistakes,
      });
      setNewlyUnlocked(unlocked);
      setLessonFinished(true);
    }
  };

  const nextLesson = LESSONS.find((l) => l.order === lesson.order + 1);

  if (lessonFinished) {
    return (
      <section className="kv-panel-elevated" style={{ padding: '2rem', maxInlineSize: 740, marginInline: 'auto' }}>
        <StatusBadge tone="ok" shape="diamond" label={lang === 'ru' ? 'УЗЕЛ ПЛАТЫ АКТИВИРОВАН' : 'NODE ENERGIZED'} />
        <h1 id="main-content" tabIndex={-1} style={{ marginTop: '0.75rem', fontSize: '1.75rem' }}>
          {lesson.title[lang]}
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          {lang === 'ru'
            ? 'Урок успешно завершён, узел учебной карты переключён, а ключевой вывод записан в Инженерный блокнот.'
            : 'Lesson completed! Your PCB map node is active and the takeaway was saved to your Engineering Notebook.'}
        </p>

        <div className="kv-panel" style={{ padding: '1rem', marginBlock: '1rem', background: 'var(--bg)' }}>
          <div className="kv-mono" style={{ fontSize: '0.78rem', color: 'var(--copper)', marginBottom: '0.35rem' }}>
            NOTEBOOK TAKEAWAY
          </div>
          <p style={{ margin: 0 }}>{lesson.notebookTakeaway[lang]}</p>
          {lesson.notebookFormula && (
            <div className="kv-mono" style={{ marginTop: '0.5rem', color: 'var(--cyan)', fontWeight: 700 }}>
              {lesson.notebookFormula}
            </div>
          )}
        </div>

        <div className="kv-mono" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span className="kv-badge kv-badge-copper">+{lesson.xpReward} XP</span>
          <span className="kv-badge kv-badge-info">
            {lang === 'ru' ? 'Ошибок:' : 'Mistakes:'} {totalLessonMistakes}
          </span>
          <span className="kv-badge">
            {lang === 'ru' ? 'Подсказок:' : 'Hints:'} {totalLessonHints}
          </span>
          {newlyUnlocked.map((ach) => (
            <span key={ach} className="kv-badge kv-badge-ok">
              ★ {ach}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {nextLesson && (
            <Link to={`/learn/${nextLesson.id}`} className="kv-btn kv-btn-primary">
              {lang === 'ru' ? `Следующий урок: ${nextLesson.title.ru}` : `Next: ${nextLesson.title.en}`} →
            </Link>
          )}
          <Link to="/learn" className="kv-btn">
            {lang === 'ru' ? 'К карте обучения' : 'Back to Map'}
          </Link>
          <Link to="/progress" className="kv-btn kv-btn-cyan">
            {lang === 'ru' ? 'Открыть блокнот' : 'Engineering Notebook'}
          </Link>
        </div>
      </section>
    );
  }

  const hasCircuit = Boolean(getStepInitialCircuit(currentStep));
  const readOnlyStructure =
    !exercise ||
    exercise.type === 'tune_parameter' ||
    exercise.type === 'measure_multimeter' ||
    exercise.type === 'predict_outcome' ||
    exercise.type === 'multiple_choice' ||
    exercise.id === 'm0-ex-close-switch';

  const hasLed = circuit.components.some((c) => c.type === 'led');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Top Lesson Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link to="/learn" className="kv-btn kv-btn-sm">
            ← {t.nav.learn}
          </Link>
          <span className="kv-mono" style={{ fontSize: '0.78rem', color: 'var(--copper)' }}>
            LESSON {String(lesson.order).padStart(2, '0')} · {stepIdx + 1}/{lesson.steps.length}
          </span>
          <h1 id="main-content" tabIndex={-1} style={{ margin: 0, fontSize: '1.18rem' }}>
            {lesson.title[lang]}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="kv-btn kv-btn-sm"
            onClick={() => setShowLeftPanel((v) => !v)}
          >
            {showLeftPanel ? (lang === 'ru' ? 'Скрыть задание' : 'Hide Task') : (lang === 'ru' ? 'Показать задание' : 'Show Task')}
          </button>
          <button
            type="button"
            className="kv-btn kv-btn-sm"
            onClick={() => setShowRightPanel((v) => !v)}
          >
            {showRightPanel ? (lang === 'ru' ? 'Скрыть приборы' : 'Hide Meters') : (lang === 'ru' ? 'Показать приборы' : 'Show Meters')}
          </button>
          <button type="button" className="kv-btn kv-btn-sm" onClick={() => setShortcutsOpen(true)}>
            ? {t.common.shortcuts}
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="kv-lesson-mobile-tabs" style={{ display: 'none', gap: '0.35rem' }}>
        {(['task', 'workspace', 'instruments'] as const).map((tabId) => (
          <button
            key={tabId}
            type="button"
            className={`kv-btn kv-btn-sm ${mobileTab === tabId ? 'kv-btn-primary' : ''}`}
            onClick={() => setMobileTab(tabId)}
            style={{ flex: 1 }}
          >
            {tabId === 'task'
              ? lang === 'ru'
                ? 'Задание'
                : 'Task'
              : tabId === 'workspace'
                ? lang === 'ru'
                  ? 'Схема'
                  : 'Circuit'
                : lang === 'ru'
                  ? 'Приборы'
                  : 'Meters'}
          </button>
        ))}
      </div>

      {/* Responsive Studio Layout */}
      <style>{`
        .kv-studio-grid {
          display: grid;
          gap: 0.85rem;
          align-items: start;
          grid-template-columns: ${
            showLeftPanel && showRightPanel
              ? 'minmax(290px, 340px) minmax(0, 1fr) minmax(270px, 310px)'
              : showLeftPanel
                ? 'minmax(290px, 360px) minmax(0, 1fr)'
                : showRightPanel
                  ? 'minmax(0, 1fr) minmax(270px, 320px)'
                  : 'minmax(0, 1fr)'
          };
        }
        @media (max-width: 1080px) {
          .kv-studio-grid {
            grid-template-columns: 1fr;
          }
          .kv-lesson-mobile-tabs {
            display: flex !important;
          }
          .kv-mobile-hide {
            display: none !important;
          }
        }
      `}</style>

      <div className="kv-studio-grid">
        {/* LEFT COLUMN: Narrative, Exercise Controls, Hints & Feedback */}
        {showLeftPanel && (
          <section
            className={`kv-panel-elevated ${mobileTab !== 'task' ? 'kv-mobile-hide' : ''}`}
            style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            aria-label={lang === 'ru' ? 'Задача урока' : 'Lesson task'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--cyan)', textTransform: 'uppercase' }}>
                {currentStep.phase}
              </span>
              <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                {stepIdx + 1} / {lesson.steps.length}
              </span>
            </div>

            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{currentStep.title[lang]}</h2>
            <p style={{ margin: 0, fontSize: '0.92rem' }}>{currentStep.body[lang]}</p>

            {currentStep.formula && (
              <div
                className="kv-mono"
                style={{
                  padding: '0.5rem 0.7rem',
                  borderRadius: 4,
                  background: 'var(--bg)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--cyan)',
                  fontSize: '0.88rem',
                }}
              >
                {currentStep.formula}
              </div>
            )}

            {/* Exercise Interaction Controls */}
            {exercise && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{exercise.prompt[lang]}</div>

                {/* Multiple choice / Predict / Component Recognition / Fault Question */}
                {(() => {
                  const choiceOptions =
                    exercise.type === 'multiple_choice' ||
                    exercise.type === 'predict_outcome' ||
                    exercise.type === 'component_recognition'
                      ? exercise.options
                      : (exercise.type === 'find_fault' || exercise.type === 'unknown_circuit_diagnosis') &&
                          exercise.faultQuestion
                        ? exercise.faultQuestion.options
                        : null;
                  if (!choiceOptions) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {choiceOptions.map((opt) => (
                        <label
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.55rem',
                            padding: '0.55rem 0.65rem',
                            borderRadius: 4,
                            background: 'var(--bg)',
                            border: `1px solid ${selectedOption === opt.id ? 'var(--copper)' : 'var(--border)'}`,
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                          }}
                        >
                          <input
                            type="radio"
                            name={`ex-${exercise.id}`}
                            value={opt.id}
                            checked={selectedOption === opt.id}
                            onChange={() => setSelectedOption(opt.id)}
                            style={{ marginTop: '0.2rem' }}
                          />
                          <span>{opt.text[lang]}</span>
                        </label>
                      ))}
                    </div>
                  );
                })()}

                {/* Numeric / Multimeter / Scope / Color Decode text input */}
                {(exercise.type === 'numeric' ||
                  exercise.type === 'measure_multimeter' ||
                  exercise.type === 'oscilloscope_analysis' ||
                  (exercise.type === 'resistor_color_code' && exercise.mode === 'decode_bands_to_ohms')) && (
                  <div className="kv-field">
                    <label htmlFor={`num-${exercise.id}`}>
                      {lang === 'ru' ? 'Ответ' : 'Your Answer'} (
                      {exercise.type === 'numeric'
                        ? exercise.unit
                        : exercise.type === 'oscilloscope_analysis'
                          ? exercise.unit
                          : exercise.type === 'measure_multimeter'
                            ? exercise.requiredMode === 'dc_v'
                              ? 'V'
                              : exercise.requiredMode === 'dc_ma'
                                ? 'mA'
                                : 'Ω'
                            : 'Ω / kΩ'}
                      )
                    </label>
                    <input
                      id={`num-${exercise.id}`}
                      type="text"
                      className="kv-input kv-mono"
                      value={numericInput}
                      onChange={(e) => setNumericInput(e.target.value)}
                      placeholder={lang === 'ru' ? 'Например: 15' : 'e.g. 15'}
                    />
                  </div>
                )}

                {/* Tune Parameter Slider */}
                {exercise.type === 'tune_parameter' && (() => {
                  const targetComp = circuit.components.find((c) => c.id === exercise.targetComponentId);
                  const val =
                    exercise.paramKey === 'resistance'
                      ? targetComp?.params.resistance ?? exercise.minVal
                      : exercise.paramKey === 'voltage'
                        ? targetComp?.params.voltage ?? exercise.minVal
                        : targetComp?.params.wiperPosition ?? 0.5;
                  return (
                    <div className="kv-panel" style={{ padding: '0.7rem', background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.35rem' }}>
                        <span>{targetComp?.label || exercise.targetComponentId}</span>
                        <span className="kv-mono" style={{ color: 'var(--copper)', fontWeight: 700 }}>
                          {exercise.paramKey === 'resistance'
                            ? formatMetric(val, 'Ω').fullText
                            : `${val} V`}
                        </span>
                      </div>
                      <input
                        type="range"
                        aria-label="Parameter tuner"
                        min={exercise.minVal}
                        max={exercise.maxVal}
                        step={exercise.stepVal}
                        value={val}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setCircuit((prev) => ({
                            ...prev,
                            components: prev.components.map((c) =>
                              c.id === exercise.targetComponentId
                                ? { ...c, params: { ...c.params, [exercise.paramKey]: n } }
                                : c
                            ),
                          }));
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                  );
                })()}

                {/* Action buttons: Check + Hint + Reset */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  <button type="button" className="kv-btn kv-btn-primary" onClick={handleCheckExercise}>
                    {t.common.check}
                  </button>
                  {exercise.hints.length > 0 && hintsShown < exercise.hints.length && (
                    <button
                      type="button"
                      className="kv-btn"
                      onClick={() => {
                        setHintsShown((h) => h + 1);
                        setTotalLessonHints((tH) => tH + 1);
                      }}
                    >
                      {t.common.hint} ({hintsShown}/{exercise.hints.length})
                    </button>
                  )}
                  {hasCircuit && (
                    <button
                      type="button"
                      className="kv-btn kv-btn-sm"
                      onClick={() => {
                        const init = getStepInitialCircuit(currentStep);
                        if (init) setCircuit(init);
                        setOutcome(null);
                      }}
                    >
                      {t.common.reset}
                    </button>
                  )}
                </div>

                {/* Shown hints */}
                {hintsShown > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {exercise.hints.slice(0, hintsShown).map((h, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: 4,
                          background: 'var(--bg)',
                          borderLeft: '3px solid var(--amber)',
                          fontSize: '0.83rem',
                        }}
                      >
                        {h[lang]}
                      </div>
                    ))}
                  </div>
                )}

                {/* Validation outcome + Misconception Coaching */}
                {outcome && (
                  <div
                    role="status"
                    data-testid="exercise-feedback"
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 4,
                      background: 'var(--bg)',
                      border: `1px solid ${outcome.passed ? 'var(--green)' : 'var(--coral)'}`,
                      fontSize: '0.86rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: outcome.passed ? 'var(--green)' : 'var(--coral)', marginBottom: '0.2rem' }}>
                      {outcome.passed ? (lang === 'ru' ? '✓ Верно' : '✓ Correct') : lang === 'ru' ? '✕ Проверь решение' : '✕ Check Solution'}
                    </div>
                    <div>{outcome.feedback[lang]}</div>
                    {outcome.measuredSummary && (
                      <div className="kv-mono" style={{ marginTop: '0.35rem', color: 'var(--cyan)', fontSize: '0.8rem' }}>
                        {outcome.measuredSummary[lang]}
                      </div>
                    )}
                    {!outcome.passed && outcome.misconceptionCode && MISCONCEPTIONS[outcome.misconceptionCode] && (
                      <div style={{ marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border)', color: 'var(--amber)', fontSize: '0.82rem' }}>
                        <strong>{MISCONCEPTIONS[outcome.misconceptionCode].title[lang]}:</strong>{' '}
                        {MISCONCEPTIONS[outcome.misconceptionCode].remedialHint[lang]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* CENTER COLUMN: Maximum-space Interactive Workbench / Instrument */}
        <section
          className={mobileTab !== 'workspace' ? 'kv-mobile-hide' : ''}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minInlineSize: 0 }}
          aria-label={lang === 'ru' ? 'Рабочая зона схемы' : 'Interactive workspace'}
        >
          {/* Overlay Toolbar */}
          {hasCircuit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`kv-btn kv-btn-sm ${overlays.xrayMode ? 'kv-btn-primary' : ''}`}
                  onClick={() => setOverlays((o) => ({ ...o, xrayMode: !o.xrayMode }))}
                >
                  {t.workbench.xrayMode}
                </button>
                <button
                  type="button"
                  className={`kv-btn kv-btn-sm ${overlays.showCurrent ? 'kv-btn-cyan' : ''}`}
                  onClick={() => setOverlays((o) => ({ ...o, showCurrent: !o.showCurrent }))}
                >
                  {t.workbench.currentOverlay}
                </button>
                <button
                  type="button"
                  className={`kv-btn kv-btn-sm ${overlays.showVoltage ? 'kv-btn-cyan' : ''}`}
                  onClick={() => setOverlays((o) => ({ ...o, showVoltage: !o.showVoltage }))}
                >
                  {t.workbench.voltageOverlay}
                </button>
                <button
                  type="button"
                  className={`kv-btn kv-btn-sm ${overlays.showPower ? 'kv-btn-cyan' : ''}`}
                  onClick={() => setOverlays((o) => ({ ...o, showPower: !o.showPower }))}
                >
                  {t.workbench.powerOverlay}
                </button>
              </div>
              <button
                type="button"
                className="kv-btn kv-btn-sm"
                onClick={() =>
                  setCircuit((prev) => ({
                    ...prev,
                    viewMode: prev.viewMode === 'schematic' ? 'breadboard' : 'schematic',
                  }))
                }
              >
                {circuit.viewMode === 'schematic' ? t.workbench.breadboardMode : t.workbench.schematicMode}
              </button>
            </div>
          )}

          {exercise?.type === 'oscilloscope_analysis' ? (
            <OscilloscopeWidget signal={exercise.signal} />
          ) : exercise?.type === 'resistor_color_code' ? (
            <ResistorColorBandInteractive
              mode={exercise.mode}
              bands={exercise.mode === 'decode_bands_to_ohms' && exercise.bands ? exercise.bands : colorBands}
              onChangeBands={setColorBands}
            />
          ) : exercise?.type === 'component_recognition' && exercise.componentPreview ? (
            <div className="kv-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 280 220" width="280" height="220" role="img" aria-label={exercise.componentPreview}>
                <SchematicSymbol
                  comp={{
                    id: 'preview',
                    type: exercise.componentPreview,
                    label: '',
                    params: {},
                    position: { x: 5, y: 4 },
                    rotation: 0,
                  }}
                />
              </svg>
            </div>
          ) : hasCircuit ? (
            <CircuitCanvas
              doc={circuit}
              sim={sim}
              logicSim={logicSim}
              overlays={overlays}
              readOnlyStructure={readOnlyStructure}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              onChangeDoc={(next) => setCircuit(next)}
              probeState={{ activePicker: mmPicker, posPin: mmPosPin, negPin: mmNegPin }}
              onPickProbePin={(role, pin) => {
                if (role === 'pos') setMmPosPin(pin);
                else setMmNegPin(pin);
                setMmPicker(null);
              }}
            />
          ) : (
            <div className="kv-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              {lang === 'ru'
                ? 'Изучи материал слева и введи ответ в форму проверки.'
                : 'Review the concept on the left and enter your answer to test understanding.'}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Instruments, Component Inspector & Diagnostics */}
        {showRightPanel && (
          <aside
            className={mobileTab !== 'instruments' ? 'kv-mobile-hide' : ''}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minInlineSize: 0 }}
            aria-label={lang === 'ru' ? 'Измерительные приборы и диагностика' : 'Instruments and diagnostics'}
          >
            {hasCircuit && (
              <>
                <ComponentInspector
                  doc={circuit}
                  selectedId={selectedId}
                  simResult={selectedId ? sim.components[selectedId] : undefined}
                  onChangeDoc={(next) => setCircuit(next)}
                  readOnlyStructure={readOnlyStructure}
                />
                <MultimeterWidget
                  doc={circuit}
                  sim={sim}
                  mode={mmMode}
                  onChangeMode={setMmMode}
                  posPin={mmPosPin}
                  negPin={mmNegPin}
                  activePicker={mmPicker}
                  onSetActivePicker={setMmPicker}
                  onClearProbes={() => {
                    setMmPosPin(null);
                    setMmNegPin(null);
                    setMmPicker(null);
                  }}
                />
                <DiagnosticConsole sim={sim} hasLed={hasLed} />
              </>
            )}
          </aside>
        )}
      </div>

      {/* BOTTOM BAR: Progress Track, Actions & Engineering Notebook Quick Pin */}
      <footer
        className="kv-panel"
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {lesson.steps.map((s, idx) => {
            const done = !s.exercise || Boolean(completedSteps[s.id]);
            const current = idx === stepIdx;
            return (
              <button
                key={s.id}
                type="button"
                className="kv-btn kv-btn-sm kv-mono"
                onClick={() => setStepIdx(idx)}
                style={{
                  borderColor: current ? 'var(--copper)' : done ? 'var(--green)' : 'var(--border)',
                  color: current ? 'var(--copper)' : done ? 'var(--green)' : 'var(--muted)',
                }}
              >
                {idx + 1}
              </button>
            );
          })}
          <button
            type="button"
            className="kv-btn kv-btn-sm"
            onClick={() => {
              addNotebookEntry({
                kind: 'note',
                title: `${lesson.title[lang]} — ${currentStep.title[lang]}`,
                body: currentStep.body[lang],
                formula: currentStep.formula,
                lessonId: lesson.id,
              });
            }}
          >
            + {lang === 'ru' ? 'В блокнот' : 'Save Note'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="kv-btn"
            disabled={stepIdx === 0}
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          >
            ← {t.common.prev}
          </button>
          <button
            type="button"
            data-testid="lesson-next-btn"
            className="kv-btn kv-btn-primary"
            disabled={!stepDone}
            onClick={handleNextStep}
          >
            {stepIdx === lesson.steps.length - 1
              ? lang === 'ru'
                ? 'Завершить урок ✓'
                : 'Complete Lesson ✓'
              : `${t.common.next} →`}
          </button>
        </div>
      </footer>

      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};
