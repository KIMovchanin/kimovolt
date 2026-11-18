import {
  colorBandsToOhms,
  computeSignalMetrics,
  E12_SERIES,
  evaluateTruthTable,
  measureMultimeter,
  solveCircuit,
  type CircuitDocument,
  type MultimeterMode,
  type ResistorBandColor,
} from '@kimovolt/simulation';
import type {
  Exercise,
  LocalizedText,
  MisconceptionCode,
} from './schema';

export interface ExerciseSubmissionInput {
  selectedOptionId?: string;
  numericInput?: string;
  bands?: ResistorBandColor[];
  circuit?: CircuitDocument;
  multimeter?: {
    mode: MultimeterMode;
    posPin: { componentId: string; terminalId: string } | null;
    negPin: { componentId: string; terminalId: string } | null;
  };
}

export interface ValidationOutcome {
  passed: boolean;
  feedback: LocalizedText;
  misconceptionCode?: MisconceptionCode;
  measuredSummary?: LocalizedText;
}

/**
 * Parses a numeric answer with optional SI prefix and RU/EN unit into the target expected unit.
 * Supports commas (e.g. "9,1 мА") and dots ("9.08 mA").
 */
export function parseNumericAnswerInUnit(raw: string, targetUnit: string): number | null {
  const cleaned = raw.trim().replace(',', '.');
  const match = /^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*([a-zA-Zа-яА-ЯёЁΩµμ%]*)$/.exec(cleaned);
  if (!match || !match[1]) return null;
  const num = Number(match[1]);
  if (!Number.isFinite(num)) return null;

  const rawUnit = (match[2] ?? '')
    .replace(/ом/gi, 'Ω')
    .replace(/ohm/gi, 'Ω')
    .replace(/в/gi, 'V')
    .replace(/а/gi, 'A')
    .replace(/м/g, 'm')
    .replace(/к/gi, 'k')
    .replace(/гц/gi, 'Hz')
    .replace(/мс/gi, 'ms')
    .replace(/с/gi, 's')
    .trim();

  if (!rawUnit) {
    return num;
  }

  const unitScale = (u: string): { base: string; mult: number } | null => {
    const normalized = u.toLowerCase();
    if (normalized === '%') return { base: '%', mult: 1 };
    if (normalized === 'v') return { base: 'V', mult: 1 };
    if (normalized === 'mv') return { base: 'V', mult: 1e-3 };
    if (normalized === 'kv') return { base: 'V', mult: 1e3 };
    if (normalized === 'a') return { base: 'A', mult: 1 };
    if (normalized === 'ma') return { base: 'A', mult: 1e-3 };
    if (normalized === 'ua' || normalized === 'µa' || normalized === 'μa') return { base: 'A', mult: 1e-6 };
    if (normalized === 'ω' || normalized === 'o') return { base: 'Ω', mult: 1 };
    if (normalized === 'kω' || normalized === 'k' || normalized === 'ko') return { base: 'Ω', mult: 1e3 };
    if (normalized === 'mω') return { base: 'Ω', mult: 1e6 };
    if (normalized === 'w' || normalized === 'вт') return { base: 'W', mult: 1 };
    if (normalized === 'mw' || normalized === 'мвт') return { base: 'W', mult: 1e-3 };
    if (normalized === 'hz') return { base: 'Hz', mult: 1 };
    if (normalized === 'khz') return { base: 'Hz', mult: 1e3 };
    if (normalized === 'ms') return { base: 's', mult: 1e-3 };
    if (normalized === 's') return { base: 's', mult: 1 };
    return null;
  };

  const parsedTarget = unitScale(targetUnit);
  const parsedInput = unitScale(rawUnit);
  if (!parsedTarget || !parsedInput || parsedTarget.base !== parsedInput.base) {
    // Allow plain number or mismatch fallback check
    return null;
  }

  return (num * parsedInput.mult) / parsedTarget.mult;
}

export function validateExerciseAnswer(
  exercise: Exercise,
  input: ExerciseSubmissionInput
): ValidationOutcome {
  switch (exercise.type) {
    case 'multiple_choice':
    case 'predict_outcome':
    case 'component_recognition': {
      const selected = input.selectedOptionId;
      if (!selected) {
        return {
          passed: false,
          feedback: {
            ru: 'Выберите один из вариантов ответа.',
            en: 'Select one of the answer options.',
          },
        };
      }
      if (selected === exercise.correctOptionId) {
        return {
          passed: true,
          feedback: exercise.explanation,
        };
      }
      const chosenOpt = exercise.options.find((o) => o.id === selected);
      return {
        passed: false,
        misconceptionCode: chosenOpt?.misconceptionCode,
        feedback: chosenOpt?.feedback ?? {
          ru: 'Пока неверно. Попробуй перепроверить физический принцип или открой подсказку.',
          en: 'Not quite. Re-check the underlying physical principle or view a hint.',
        },
      };
    }

    case 'numeric': {
      const raw = input.numericInput ?? '';
      const val = parseNumericAnswerInUnit(raw, exercise.unit);
      if (val === null) {
        return {
          passed: false,
          feedback: {
            ru: `Введите число (единица: ${exercise.unit}). Например: ${exercise.expectedValue}`,
            en: `Enter a valid number (unit: ${exercise.unit}). Example: ${exercise.expectedValue}`,
          },
        };
      }
      const tol = Math.max(0.001, Math.abs(exercise.expectedValue) * (exercise.tolerancePercent / 100));
      if (Math.abs(val - exercise.expectedValue) <= tol) {
        return { passed: true, feedback: exercise.explanation };
      }
      const misc = exercise.misconceptionHints?.find(
        (h) => (h.min === undefined || val >= h.min) && (h.max === undefined || val <= h.max)
      );
      return {
        passed: false,
        misconceptionCode: misc?.code,
        feedback: {
          ru: `Получено ${val.toFixed(2)} ${exercise.unit}, но это выходит за допуск ±${exercise.tolerancePercent}%. Проверь формулу и единицы измерения.`,
          en: `Got ${val.toFixed(2)} ${exercise.unit}, outside ±${exercise.tolerancePercent}% tolerance. Check the formula and units.`,
        },
      };
    }

    case 'resistor_color_code': {
      if (exercise.mode === 'decode_bands_to_ohms') {
        const val = parseNumericAnswerInUnit(input.numericInput ?? '', 'Ω');
        if (val === null) {
          return {
            passed: false,
            feedback: {
              ru: 'Введи номинал резистора в Омах или кОмах (например: 330 или 4.7 kΩ).',
              en: 'Enter resistor value in Ohms or kOhms (e.g. 330 or 4.7 kΩ).',
            },
          };
        }
        const ok = Math.abs(val - exercise.targetOhms) <= Math.max(0.5, exercise.targetOhms * 0.02);
        return ok
          ? { passed: true, feedback: exercise.explanation }
          : {
              passed: false,
              feedback: {
                ru: `Не совпадает: ты ввёл ${val} Ω. Вспомни: 1-я и 2-я полосы — цифры, 3-я — множитель 10^n.`,
                en: `Mismatch: entered ${val} Ω. Remember: bands 1 & 2 are digits, band 3 is multiplier 10^n.`,
              },
            };
      } else {
        const decoded = input.bands ? colorBandsToOhms(input.bands) : null;
        if (!decoded) {
          return {
            passed: false,
            feedback: {
              ru: 'Выбери все 4 цветовые полосы на корпусе резистора.',
              en: 'Select all 4 color bands on the resistor body.',
            },
          };
        }
        const ok = Math.abs(decoded.ohms - exercise.targetOhms) <= Math.max(0.5, exercise.targetOhms * 0.02);
        return ok
          ? { passed: true, feedback: exercise.explanation }
          : {
              passed: false,
              feedback: {
                ru: `Выбранные полосы дают ${decoded.ohms} Ω, а требуется ${exercise.targetOhms} Ω.`,
                en: `Selected bands decode to ${decoded.ohms} Ω, expected ${exercise.targetOhms} Ω.`,
              },
            };
      }
    }

    case 'tune_parameter': {
      const doc = input.circuit;
      if (!doc) {
        return { passed: false, feedback: { ru: 'Схема не загружена.', en: 'Circuit not loaded.' } };
      }
      const comp = doc.components.find((c) => c.id === exercise.targetComponentId);
      const sim = solveCircuit(doc);
      if (!sim.solvable) {
        return {
          passed: false,
          feedback: {
            ru: 'Схема не решается — проверь соединения.',
            en: 'Circuit cannot be solved — check connections.',
          },
        };
      }
      if (exercise.requireStandardE12 && comp?.type === 'resistor') {
        const r = comp.params.resistance ?? 0;
        const isE12 = E12_SERIES.some((v) => Math.abs(v - r) / v < 0.01);
        if (!isE12) {
          return {
            passed: false,
            feedback: {
              ru: `Значение ${r} Ω не входит в стандартный ряд E12 (например: 220, 270, 330, 470, 680, 1000 Ω).`,
              en: `${r} Ω is not a standard E12 value (e.g. 220, 270, 330, 470, 680, 1000 Ω).`,
            },
          };
        }
      }

      if (exercise.targetLedId) {
        const ledRes = sim.components[exercise.targetLedId];
        const iMa = (ledRes?.current ?? 0) * 1000;
        if (!ledRes?.conducting) {
          return {
            passed: false,
            misconceptionCode: 'LED_POLARITY_IGNORED',
            feedback: {
              ru: 'Светодиод сейчас не светится. Проверь напряжение и сопротивление.',
              en: 'LED is currently off. Check voltage and resistance.',
            },
          };
        }
        if (exercise.maxCurrentMa !== undefined && iMa > exercise.maxCurrentMa) {
          return {
            passed: false,
            misconceptionCode: 'RESISTANCE_INCREASES_CURRENT',
            feedback: {
              ru: `Ток ${iMa.toFixed(1)} mA слишком велик (предел ${exercise.maxCurrentMa} mA)! Чтобы уменьшить ток, увеличь сопротивление.`,
              en: `Current ${iMa.toFixed(1)} mA is too high (limit ${exercise.maxCurrentMa} mA)! Increase resistance to reduce current.`,
            },
          };
        }
        if (exercise.minCurrentMa !== undefined && iMa < exercise.minCurrentMa) {
          return {
            passed: false,
            feedback: {
              ru: `Ток ${iMa.toFixed(1)} mA слишком мал (нужно от ${exercise.minCurrentMa} mA). Уменьши сопротивление.`,
              en: `Current ${iMa.toFixed(1)} mA is too low (need at least ${exercise.minCurrentMa} mA). Lower the resistance.`,
            },
          };
        }
        return {
          passed: true,
          feedback: exercise.explanation,
          measuredSummary: {
            ru: `Ток через LED: ${iMa.toFixed(2)} mA`,
            en: `LED current: ${iMa.toFixed(2)} mA`,
          },
        };
      }

      if (exercise.targetVoltageDrop) {
        const targetRes = sim.components[exercise.targetVoltageDrop.componentId];
        const vDrop = Math.abs(targetRes?.voltageDrop ?? 0);
        const ok = vDrop >= exercise.targetVoltageDrop.minV && vDrop <= exercise.targetVoltageDrop.maxV;
        return ok
          ? {
              passed: true,
              feedback: exercise.explanation,
              measuredSummary: { ru: `Напряжение: ${vDrop.toFixed(2)} V`, en: `Voltage: ${vDrop.toFixed(2)} V` },
            }
          : {
              passed: false,
              feedback: {
                ru: `Напряжение на целевом элементе сейчас ${vDrop.toFixed(2)} V, нужно от ${exercise.targetVoltageDrop.minV} до ${exercise.targetVoltageDrop.maxV} V.`,
                en: `Target voltage is ${vDrop.toFixed(2)} V, expected between ${exercise.targetVoltageDrop.minV} and ${exercise.targetVoltageDrop.maxV} V.`,
              },
            };
      }

      return { passed: true, feedback: exercise.explanation };
    }

    case 'build_circuit': {
      const doc = input.circuit;
      if (!doc) {
        return { passed: false, feedback: { ru: 'Собери схему в рабочей области.', en: 'Build the circuit on the canvas.' } };
      }

      const req = exercise.requirements;
      // Ensure switch closed when testing ON state if toggleSwitchId is requested
      const testDoc: CircuitDocument = req.toggleSwitchId
        ? {
            ...doc,
            components: doc.components.map((c) =>
              c.id === req.toggleSwitchId
                ? { ...c, params: { ...c.params, closed: true, pressed: true } }
                : c
            ),
          }
        : doc;

      const sim = solveCircuit(testDoc);
      if (!sim.solvable) {
        const errDiag = sim.diagnostics.find((d) => d.severity === 'error');
        return {
          passed: false,
          misconceptionCode: errDiag?.code === 'AMMETER_PARALLEL_FAULT' ? 'AMMETER_PARALLEL_MISUSE' : undefined,
          feedback: errDiag
            ? { ru: errDiag.messageRu, en: errDiag.messageEn }
            : { ru: 'Схема содержит критическую ошибку соединений.', en: 'Circuit contains a wiring error.' },
        };
      }

      if (req.requireNoWarnings) {
        const severe = sim.diagnostics.find((d) => d.severity === 'error' || d.code === 'LED_OVERCURRENT' || d.code === 'RESISTOR_OVERPOWER');
        if (severe) {
          return {
            passed: false,
            misconceptionCode: severe.code === 'LED_OVERCURRENT' ? 'UNPROTECTED_LED' : undefined,
            feedback: { ru: severe.messageRu, en: severe.messageEn },
          };
        }
      }

      const leds = Object.values(sim.components).filter((c) => c.type === 'led');
      if (req.requireLedLit) {
        const reversed = sim.diagnostics.find((d) => d.code === 'LED_REVERSED');
        if (reversed) {
          return {
            passed: false,
            misconceptionCode: 'LED_POLARITY_IGNORED',
            feedback: { ru: reversed.messageRu, en: reversed.messageEn },
          };
        }
        const litLed = leds.find((l) => l.conducting && (l.current ?? 0) > 1e-4);
        if (!litLed) {
          return {
            passed: false,
            feedback: {
              ru: 'Светодиод ещё не горит. Проверь, замкнут ли полный контур от (+) источника через резистор и LED обратно к (-).',
              en: 'LED is not lit yet. Check that a complete loop runs from (+) through resistor and LED back to (-).',
            },
          };
        }
        const iMa = (litLed.current ?? 0) * 1000;
        if (req.minCurrentMa !== undefined && iMa < req.minCurrentMa) {
          return {
            passed: false,
            feedback: {
              ru: `Ток через LED (${iMa.toFixed(2)} mA) ниже требуемых ${req.minCurrentMa} mA.`,
              en: `LED current (${iMa.toFixed(2)} mA) is below ${req.minCurrentMa} mA.`,
            },
          };
        }
        if (req.maxCurrentMa !== undefined && iMa > req.maxCurrentMa) {
          return {
            passed: false,
            misconceptionCode: 'UNPROTECTED_LED',
            feedback: {
              ru: `Ток через LED (${iMa.toFixed(2)} mA) превышает безопасный предел ${req.maxCurrentMa} mA! Добавь или увеличь резистор.`,
              en: `LED current (${iMa.toFixed(2)} mA) exceeds safe limit ${req.maxCurrentMa} mA! Add or increase resistor.`,
            },
          };
        }
      }

      if (req.toggleSwitchId) {
        const offDoc: CircuitDocument = {
          ...doc,
          components: doc.components.map((c) =>
            c.id === req.toggleSwitchId
              ? { ...c, params: { ...c.params, closed: false, pressed: false } }
              : c
          ),
        };
        const offSim = solveCircuit(offDoc);
        const stillLit = Object.values(offSim.components).some((c) => c.type === 'led' && c.conducting);
        if (stillLit) {
          return {
            passed: false,
            feedback: {
              ru: 'Выключатель обойдён (при размыкании светодиод всё равно горит). Включи выключатель последовательно в цепь!',
              en: 'Switch is bypassed (LED stays lit when open). Wire the switch in series with the loop!',
            },
          };
        }
      }

      if (req.requireMultipleSeriesResistors !== undefined) {
        const activeResistors = Object.values(sim.components).filter(
          (c) => c.type === 'resistor' && Math.abs(c.current ?? 0) > 1e-4
        );
        if (activeResistors.length < req.requireMultipleSeriesResistors) {
          return {
            passed: false,
            misconceptionCode: 'SERIES_VS_PARALLEL',
            feedback: {
              ru: `Должно работать не менее ${req.requireMultipleSeriesResistors} резисторов с током в цепи.`,
              en: `At least ${req.requireMultipleSeriesResistors} resistors must carry current in the circuit.`,
            },
          };
        }
      }

      if (req.requireParallelBranches !== undefined) {
        const activeLoads = Object.values(sim.components).filter(
          (c) => (c.type === 'resistor' || c.type === 'led') && Math.abs(c.current ?? 0) > 1e-4
        );
        const sourceVoltage = Math.max(
          ...doc.components
            .filter((c) => c.type === 'voltage_source' || c.type === 'battery')
            .map((c) => c.params.voltage ?? 5),
          0
        );
        const fullVoltageBranches = activeLoads.filter(
          (l) => Math.abs(Math.abs(l.voltageDrop ?? 0) - sourceVoltage) < 0.25
        );
        if (fullVoltageBranches.length < req.requireParallelBranches) {
          return {
            passed: false,
            misconceptionCode: 'SERIES_VS_PARALLEL',
            feedback: {
              ru: `В параллельном соединении каждая ветвь должна получать полное напряжение источника (~${sourceVoltage} V).`,
              en: `In parallel wiring, each branch must receive full source voltage (~${sourceVoltage} V).`,
            },
          };
        }
      }

      return { passed: true, feedback: exercise.explanation };
    }

    case 'find_fault':
    case 'unknown_circuit_diagnosis': {
      if (exercise.faultQuestion && input.selectedOptionId) {
        if (input.selectedOptionId !== exercise.faultQuestion.correctOptionId && !exercise.requireFixedCircuit) {
          const opt = exercise.faultQuestion.options.find((o) => o.id === input.selectedOptionId);
          return {
            passed: false,
            misconceptionCode: opt?.misconceptionCode,
            feedback: opt?.feedback ?? {
              ru: 'Это не корневая причина. Проверь полярность, соединения и номиналы.',
              en: 'That is not the root cause. Check polarity, wiring, and component values.',
            },
          };
        }
      }

      if (!exercise.requireFixedCircuit) {
        if (!input.selectedOptionId) {
          return { passed: false, feedback: { ru: 'Выбери причину неисправности.', en: 'Select the cause of the fault.' } };
        }
        return input.selectedOptionId === exercise.faultQuestion?.correctOptionId
          ? { passed: true, feedback: exercise.explanation }
          : { passed: false, feedback: { ru: 'Попробуй диагностировать точнее.', en: 'Re-check the circuit carefully.' } };
      }

      const doc = input.circuit;
      if (!doc) {
        return { passed: false, feedback: { ru: 'Исправь неисправность на схеме.', en: 'Fix the fault on the schematic.' } };
      }

      const sim = solveCircuit(doc);
      const err = sim.diagnostics.find((d) => d.severity === 'error');
      if (!sim.solvable || err) {
        return {
          passed: false,
          feedback: err
            ? { ru: err.messageRu, en: err.messageEn }
            : { ru: 'Неисправность ещё не устранена.', en: 'The fault has not been resolved yet.' },
        };
      }

      if (exercise.targetLedId) {
        const led = sim.components[exercise.targetLedId];
        const iMa = (led?.current ?? 0) * 1000;
        if (!led?.conducting || led.state === 'overcurrent') {
          return {
            passed: false,
            misconceptionCode: led?.state === 'reverse_biased' ? 'LED_POLARITY_IGNORED' : undefined,
            feedback: {
              ru: 'Целевой светодиод должен безопасно светиться без перегрузки.',
              en: 'Target LED must light safely without overcurrent.',
            },
          };
        }
        if (
          (exercise.minCurrentMa !== undefined && iMa < exercise.minCurrentMa) ||
          (exercise.maxCurrentMa !== undefined && iMa > exercise.maxCurrentMa)
        ) {
          return {
            passed: false,
            feedback: {
              ru: `Ток LED (${iMa.toFixed(2)} mA) должен быть в пределах ${exercise.minCurrentMa ?? 1}–${exercise.maxCurrentMa ?? 25} mA.`,
              en: `LED current (${iMa.toFixed(2)} mA) must stay within ${exercise.minCurrentMa ?? 1}–${exercise.maxCurrentMa ?? 25} mA.`,
            },
          };
        }
      }

      if (!sim.hasActiveCurrent) {
        return {
          passed: false,
          feedback: {
            ru: 'В цепи всё ещё нет тока — проверь выключатели, обрывы или перегоревшие элементы.',
            en: 'Still no current flowing — check switches, open wires, or blown components.',
          },
        };
      }

      return { passed: true, feedback: exercise.explanation };
    }

    case 'measure_multimeter': {
      const mm = input.multimeter;
      if (!mm || !mm.posPin || !mm.negPin) {
        return {
          passed: false,
          feedback: {
            ru: 'Подключи красный (+) и чёрный (-) щупы мультиметра к нужным точкам схемы.',
            en: 'Connect red (+) and black (-) multimeter probes to the circuit terminals.',
          },
        };
      }
      if (mm.mode !== exercise.requiredMode) {
        return {
          passed: false,
          misconceptionCode: mm.mode === 'dc_ma' ? 'AMMETER_PARALLEL_MISUSE' : 'CURRENT_VS_VOLTAGE',
          feedback: {
            ru: `Переключи селектор мультиметра в режим ${exercise.requiredMode.toUpperCase()}.`,
            en: `Switch the multimeter selector to ${exercise.requiredMode.toUpperCase()} mode.`,
          },
        };
      }

      const sim = solveCircuit(exercise.circuit);
      const reading = measureMultimeter(exercise.circuit, sim, mm);
      if (!reading.valid || reading.value === null) {
        return {
          passed: false,
          misconceptionCode: reading.warningCode === 'AMMETER_PARALLEL_FAULT' ? 'AMMETER_PARALLEL_MISUSE' : undefined,
          feedback: {
            ru: reading.warningRu ?? 'Измерение некорректно — проверь положение щупов.',
            en: reading.warningEn ?? 'Invalid measurement — check probe placement.',
          },
        };
      }

      if (exercise.targetPinPair) {
        const pair = exercise.targetPinPair;
        const netPos = sim.pinToNet[`${mm.posPin.componentId}:${mm.posPin.terminalId}`];
        const netNeg = sim.pinToNet[`${mm.negPin.componentId}:${mm.negPin.terminalId}`];
        const expectedNetA = sim.pinToNet[`${pair.componentId}:${pair.termA}`];
        const expectedNetB = sim.pinToNet[`${pair.componentId}:${pair.termB}`];
        const directMatch = netPos === expectedNetA && netNeg === expectedNetB;
        const swappedMatch = !pair.polarSensitive && netPos === expectedNetB && netNeg === expectedNetA;
        if (!directMatch && !swappedMatch) {
          return {
            passed: false,
            feedback: {
              ru: 'Щупы подключены не к тем узлам. Проверь, относительно какой точки требуется измерение.',
              en: 'Probes are attached to the wrong nodes. Check which component/nodes should be measured.',
            },
          };
        }
      }

      const expectedUnit = exercise.requiredMode === 'dc_v' ? 'V' : exercise.requiredMode === 'dc_ma' ? 'mA' : 'Ω';
      const numVal = parseNumericAnswerInUnit(input.numericInput ?? '', expectedUnit);
      if (numVal === null) {
        return {
          passed: false,
          feedback: {
            ru: `Сними показание с дисплея мультиметра (${reading.displayText}) и впиши значение в поле ответа.`,
            en: `Read the multimeter display (${reading.displayText}) and enter the measured value.`,
          },
        };
      }

      const tol = Math.max(0.05, Math.abs(exercise.expectedReading) * (exercise.tolerancePercent / 100));
      if (Math.abs(numVal - exercise.expectedReading) <= tol) {
        return {
          passed: true,
          feedback: exercise.explanation,
          measuredSummary: {
            ru: `Измерено: ${reading.displayText}`,
            en: `Measured: ${reading.displayText}`,
          },
        };
      }

      return {
        passed: false,
        feedback: {
          ru: `Ты указал ${numVal} ${expectedUnit}, а мультиметр показывает ${reading.displayText}. Проверь знак, единицы и точки подключения.`,
          en: `Entered ${numVal} ${expectedUnit}, while meter reads ${reading.displayText}. Check sign, units, and probe points.`,
        },
      };
    }

    case 'oscilloscope_analysis': {
      const metrics = computeSignalMetrics(exercise.signal);
      const val = parseNumericAnswerInUnit(input.numericInput ?? '', exercise.unit);
      if (val === null) {
        return {
          passed: false,
          feedback: {
            ru: `Измерь значение по сетке осциллографа и введи в ${exercise.unit}.`,
            en: `Measure the value on the oscilloscope grid and enter it in ${exercise.unit}.`,
          },
        };
      }
      const target =
        exercise.questionKind === 'frequency'
          ? metrics.frequencyHz ?? exercise.expectedValue
          : exercise.questionKind === 'period_ms'
            ? (metrics.periodSec ?? 0) * 1000
            : exercise.questionKind === 'duty_cycle'
              ? metrics.dutyCyclePercent ?? exercise.expectedValue
              : metrics.vpp;

      const tol = Math.max(0.05, Math.abs(target) * (exercise.tolerancePercent / 100));
      if (Math.abs(val - target) <= tol) {
        return { passed: true, feedback: exercise.explanation };
      }
      return {
        passed: false,
        feedback: {
          ru: `Пока не сходится (введено ${val} ${exercise.unit}). Используй курсоры на экране осциллографа и деления Time/div или Volt/div.`,
          en: `Not quite (entered ${val} ${exercise.unit}). Use the scope cursors and Time/div or Volt/div scale.`,
        },
      };
    }

    case 'logic_circuit': {
      const doc = input.circuit;
      if (!doc) {
        return { passed: false, feedback: { ru: 'Собери логическую схему.', en: 'Build the logic circuit.' } };
      }
      const tt = evaluateTruthTable(doc);
      if (tt.hasCycle) {
        return {
          passed: false,
          feedback: {
            ru: 'Обнаружена комбинационная обратная связь (цикл вентилей). Убери замыкание выхода на собственный вход.',
            en: 'Combinational feedback loop detected. Remove the cycle from output back to input.',
          },
        };
      }
      if (tt.rows.length !== exercise.expectedOutputs.length) {
        return {
          passed: false,
          feedback: {
            ru: 'Количество входов не соответствует заданию.',
            en: 'Number of inputs does not match the specification.',
          },
        };
      }
      const outId = tt.outputIds[0];
      if (!outId) {
        return { passed: false, feedback: { ru: 'Нет выходного индикатора.', en: 'Missing logic output node.' } };
      }
      for (let i = 0; i < tt.rows.length; i++) {
        const row = tt.rows[i]!;
        const actual = row.outputs[outId];
        if (actual === null || actual === undefined) {
          return {
            passed: false,
            feedback: {
              ru: 'Не все входы и выходы соединены — на выходе неопределённое состояние.',
              en: 'Not all gates are wired — output state is floating/undefined.',
            },
          };
        }
        if (actual !== exercise.expectedOutputs[i]) {
          const combo = tt.inputIds.map((id) => `${id}=${row.inputs[id] ? 1 : 0}`).join(', ');
          return {
            passed: false,
            feedback: {
              ru: `Для комбинации (${combo}) выход равен ${actual ? 1 : 0}, а по таблице истинности ожидается ${exercise.expectedOutputs[i] ? 1 : 0}.`,
              en: `For (${combo}), output is ${actual ? 1 : 0}, expected ${exercise.expectedOutputs[i] ? 1 : 0} from truth table.`,
            },
          };
        }
      }
      return { passed: true, feedback: exercise.explanation };
    }

    case 'engineering_spec': {
      const doc = input.circuit;
      if (!doc) {
        return { passed: false, feedback: { ru: 'Собери устройство в рабочей области.', en: 'Build the device on the canvas.' } };
      }
      const k = exercise.inputIds.length;
      const total = 1 << k;
      for (let mask = 0; mask < total; mask++) {
        const stateDoc: CircuitDocument = {
          ...doc,
          components: doc.components.map((comp) => {
            const idx = exercise.inputIds.indexOf(comp.id);
            if (idx === -1) return comp;
            const active = Boolean((mask >> (k - 1 - idx)) & 1);
            return {
              ...comp,
              params: { ...comp.params, closed: active, pressed: active },
            };
          }),
        };
        const sim = solveCircuit(stateDoc);
        if (!sim.solvable) {
          return {
            passed: false,
            feedback: {
              ru: 'При одном из положений кнопок возникает короткое замыкание или ошибка цепи!',
              en: 'A short circuit or wiring fault occurs in one of the button combinations!',
            },
          };
        }
        const led = sim.components[exercise.outputLedId];
        if (led?.state === 'overcurrent') {
          return {
            passed: false,
            misconceptionCode: 'UNPROTECTED_LED',
            feedback: {
              ru: 'Светодиод перегружен по току — обязателен токоограничивающий резистор.',
              en: 'LED is overcurrent — a current-limiting resistor is mandatory.',
            },
          };
        }
        const isLit = Boolean(led?.conducting && (led.current ?? 0) > 5e-4);
        const expectedLit = exercise.expectedLitStates[mask] ?? false;
        if (isLit !== expectedLit) {
          const desc = exercise.inputIds
            .map((id, idx) => `${id}:${(mask >> (k - 1 - idx)) & 1 ? 'ON' : 'OFF'}`)
            .join(', ');
          return {
            passed: false,
            misconceptionCode: 'SERIES_VS_PARALLEL',
            feedback: {
              ru: `Проверка спецификации (${desc}): светодиод ${isLit ? 'горит' : 'не горит'}, а по заданию должен ${expectedLit ? 'гореть' : 'не гореть'}.`,
              en: `Spec test (${desc}): LED is ${isLit ? 'ON' : 'OFF'}, expected ${expectedLit ? 'ON' : 'OFF'}.`,
            },
          };
        }
      }
      return { passed: true, feedback: exercise.explanation };
    }
  }
}
