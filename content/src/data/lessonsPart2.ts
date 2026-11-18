import type { LessonDefinition } from '../schema';

export const LESSONS_PART_2: LessonDefinition[] = [
  // =========================================================================
  // LESSON 6: OHM'S LAW
  // =========================================================================
  {
    id: 'm3-ohms-law',
    version: 1,
    moduleId: 'mod-3',
    order: 6,
    title: { ru: 'Закон Ома: связь U, I и R', en: 'Ohm’s Law: V, I & R' },
    subtitle: {
      ru: 'Главная формула электроники: прогноз, живой эксперимент и точные расчёты.',
      en: 'The core law of electronics: prediction, live experiment, and quantitative checks.',
    },
    objective: {
      ru: 'Уверенно вычислять любую из величин U, I, R и предсказывать поведение цепи при изменении параметров.',
      en: 'Solve for any of V, I, or R and predict how parameter changes affect current.',
    },
    estimatedMinutes: 8,
    practiceType: { ru: 'Прогноз + расчёт', en: 'Predict + Calculate' },
    skillIds: ['ohms_law'],
    prerequisites: ['m1-resistance-power'],
    xpReward: 120,
    notebookTakeaway: {
      ru: 'Закон Ома: I = U / R, откуда U = I · R и R = U / I. При неизменном напряжении удвоение сопротивления уменьшает ток ровно вдвое.',
      en: 'Ohm’s law: I = V / R, V = I · R, R = V / I. At constant voltage, doubling resistance cuts current exactly in half.',
    },
    notebookFormula: 'I = U / R  |  U = I · R  |  R = U / I',
    mapNode: { x: 585, y: 200 },
    steps: [
      {
        id: 'm3o-s1',
        phase: 'predict',
        title: { ru: 'Прогноз до запуска', en: 'Predict Before Solving' },
        body: {
          ru: 'К источнику 10 V подключён резистор 500 Ω (ток = 20 мА). Что произойдёт с током, если увеличить сопротивление в 2 раза (до 1000 Ω) при неизменном напряжении?',
          en: 'A 500 Ω resistor across 10 V draws 20 mA. What happens to current if resistance doubles to 1000 Ω at constant voltage?',
        },
        exercise: {
          id: 'm3o-ex-predict',
          type: 'predict_outcome',
          prompt: {
            ru: 'Как изменится ток при удвоении сопротивления (U = const)?',
            en: 'How does current change when resistance doubles (V = const)?',
          },
          hints: [{ ru: 'Посмотри на формулу I = U / R: R стоит в знаменателе.', en: 'Check I = V / R: R is in the denominator.' }],
          explanation: {
            ru: 'Точно! Ток уменьшится ровно в два раза (с 20 мА до 10 мА).',
            en: 'Exact! Current drops by half (from 20 mA to 10 mA).',
          },
          skillIds: ['ohms_law'],
          difficulty: 1,
          options: [
            { id: 'a', text: { ru: 'Увеличится вдвое (до 40 mA)', en: 'Doubles to 40 mA' }, misconceptionCode: 'RESISTANCE_INCREASES_CURRENT' },
            { id: 'b', text: { ru: 'Уменьшится вдвое (до 10 mA)', en: 'Halves to 10 mA' } },
            { id: 'c', text: { ru: 'Не изменится (останется 20 mA)', en: 'Unchanged at 20 mA' } },
          ],
          correctOptionId: 'b',
          verifyCircuit: {
            schemaVersion: 1,
            id: 'm3o-verify',
            name: 'Ohm Law Check',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '10 V', params: { voltage: 10 }, position: { x: 5, y: 6 }, rotation: 0 },
              { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 1000 }, position: { x: 14, y: 6 }, rotation: 90 },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 5, y: 11 }, rotation: 0 },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
              { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
              { id: 'w3', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
        },
      },
      {
        id: 'm3o-s2',
        phase: 'measure',
        title: { ru: 'Вычисли ток на 3.3 V (логика ESP32)', en: 'Solve 3.3 V ESP32 Load' },
        body: {
          ru: 'К выходу питания 3.3 V подключена нагрузка сопротивлением 220 Ω. Вычисли силу тока в миллиамперах.',
          en: 'A 220 Ω load is connected across a 3.3 V rail. Calculate current in milliamperes.',
        },
        exercise: {
          id: 'm3o-ex-calc-i',
          type: 'numeric',
          prompt: {
            ru: 'Рассчитай ток I = 3.3 V / 220 Ω в миллиамперах (mA):',
            en: 'Compute I = 3.3 V / 220 Ω in mA:',
          },
          hints: [{ ru: '3.3 / 220 = 0.015 A = 15 mA.', en: '3.3 / 220 = 0.015 A = 15 mA.' }],
          explanation: {
            ru: '15 mA! Именно поэтому резистор 220 Ω так популярен на 3.3-вольтовых платах ESP32.',
            en: '15 mA! That is why 220 Ω is a common choice on 3.3 V ESP32 pins.',
          },
          skillIds: ['ohms_law'],
          difficulty: 2,
          expectedValue: 15,
          unit: 'mA',
          tolerancePercent: 3,
          misconceptionHints: [{ min: 0.01, max: 0.02, code: 'CURRENT_VS_VOLTAGE' }],
        },
      },
      {
        id: 'm3o-s3',
        phase: 'apply',
        title: { ru: 'Найди неизвестное напряжение', en: 'Find Unknown Voltage' },
        body: {
          ru: 'Амперметр показывает ток 12 мА через резистор 1.5 kΩ (1500 Ω). Какое напряжение падает на этом резисторе?',
          en: 'An ammeter reads 12 mA through a 1.5 kΩ (1500 Ω) resistor. What voltage drops across it?',
        },
        exercise: {
          id: 'm3o-ex-calc-v',
          type: 'numeric',
          prompt: {
            ru: 'Рассчитай U = I · R (I = 0.012 A, R = 1500 Ω) в Вольтах:',
            en: 'Compute V = I · R (I = 0.012 A, R = 1500 Ω) in Volts:',
          },
          hints: [{ ru: '0.012 × 1500 = 12 × 1.5 = ? V.', en: '0.012 × 1500 = 12 × 1.5 = ? V.' }],
          explanation: {
            ru: '18.0 V! Проверить это помогает правило: мА × кОм = Вольты (12 mA × 1.5 kΩ = 18 V).',
            en: '18.0 V! Handy engineering shortcut: mA × kΩ = Volts (12 × 1.5 = 18 V).',
          },
          skillIds: ['ohms_law'],
          difficulty: 2,
          expectedValue: 18,
          unit: 'V',
          tolerancePercent: 2,
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 7: RESISTOR SIZING E12/E24
  // =========================================================================
  {
    id: 'm3-resistor-sizing',
    version: 1,
    moduleId: 'mod-3',
    order: 7,
    title: { ru: 'Как подобрать резистор (ряд E12)', en: 'Sizing Standard Resistors (E12)' },
    subtitle: {
      ru: 'Расчёт по падению на LED и выбор ближайшего стандартного номинала из магазина.',
      en: 'Calculating LED series resistance and picking standard E12 values.',
    },
    objective: {
      ru: 'Подбирать стандартный номинал E12 для светодиода, чтобы не превысить целевой ток.',
      en: 'Select real-world E12 resistors to satisfy current targets safely.',
    },
    estimatedMinutes: 8,
    practiceType: { ru: 'Расчёт + настройка схемы', en: 'Sizing + Tuning' },
    skillIds: ['resistor_sizing'],
    prerequisites: ['m3-ohms-law', 'm2-components-color-code'],
    xpReward: 125,
    notebookTakeaway: {
      ru: 'Реальные резисторы выпускаются стандартными рядами (E12: 10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82). Если расчёт даёт 300 Ω, безопасно округлить ВВЕРХ до 330 Ω.',
      en: 'Real resistors come in standard series (E12: 10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82). Round UP from 300 Ω to 330 Ω to stay within current limits.',
    },
    notebookFormula: 'R >= (U_src - U_led) / I_max',
    mapNode: { x: 585, y: 80 },
    steps: [
      {
        id: 'm3s-s1',
        phase: 'observe',
        title: { ru: 'Почему не продают резистор ровно на 300 Ω в ряду E12?', en: 'Why Real Parts Use E12 Steps' },
        body: {
          ru: 'Допустим, при питании 5 V и падении на красном LED 2 V нужен ток не выше 10 мА: R = (5 − 2) / 0.01 = 300 Ω. Но в самом распространённом ряду E12 есть 270 Ω и 330 Ω. Выбирая 330 Ω, получаем ~9.1 мА — безопасно и ярко.',
          en: 'Suppose at 5 V and Vf = 2 V you want at most 10 mA: R = (5 - 2) / 0.01 = 300 Ω. E12 offers 270 Ω and 330 Ω. Picking 330 Ω yields ~9.1 mA — safe and bright.',
        },
      },
      {
        id: 'm3s-s2',
        phase: 'measure',
        title: { ru: 'Рассчитай сопротивление для 9 V питания', en: 'Calculate for 9 V Supply' },
        body: {
          ru: 'Синий светодиод (Vf = 3.1 V) питается от кроны 9 V. Какое точное минимальное сопротивление нужно для тока 15 мА (0.015 A)?',
          en: 'A blue LED (Vf = 3.1 V) runs from a 9 V battery. What exact minimum resistance yields 15 mA (0.015 A)?',
        },
        exercise: {
          id: 'm3s-ex-num',
          type: 'numeric',
          prompt: {
            ru: 'Вычисли R = (9 V − 3.1 V) / 0.015 A в Омах (Ω):',
            en: 'Calculate R = (9 V - 3.1 V) / 0.015 A in Ohms (Ω):',
          },
          hints: [{ ru: '5.9 / 0.015 ≈ 393.3 Ω.', en: '5.9 / 0.015 ≈ 393.3 Ω.' }],
          explanation: {
            ru: '393 Ω! Ближайшие номиналы E12 — 390 Ω (15.1 mA) или с запасом 470 Ω (12.5 mA).',
            en: '393 Ω! Nearest E12 values are 390 Ω (15.1 mA) or 470 Ω (12.5 mA) for margin.',
          },
          skillIds: ['resistor_sizing'],
          difficulty: 2,
          expectedValue: 393.3,
          unit: 'Ω',
          tolerancePercent: 3,
        },
      },
      {
        id: 'm3s-s3',
        phase: 'apply',
        title: { ru: 'Подбери стандартный E12 номинал на плате', en: 'Pick Standard E12 Value Live' },
        body: {
          ru: 'Перед тобой цепь 5 V + синий LED (Vf = 3.1 V). Подбери СТАНДАРТНЫЙ номинал из ряда E12 для R1 (например, 180 Ω или 220 Ω), чтобы ток был от 6 до 12 мА и не превышал 12 мА.',
          en: 'Here is a 5 V + blue LED (Vf = 3.1 V) loop. Pick a STANDARD E12 resistor value for R1 so LED current lands between 6 mA and 12 mA.',
        },
        exercise: {
          id: 'm3s-ex-tune-e12',
          type: 'tune_parameter',
          prompt: {
            ru: 'Установи стандартный номинал E12 (например 180 Ω или 220 Ω) для тока 6–12 mA.',
            en: 'Set a standard E12 value (e.g. 180 Ω or 220 Ω) for 6–12 mA current.',
          },
          hints: [
            { ru: '(5 − 3.1) / 0.010 = 190 Ω. Из ряда E12 подходят 180 Ω (~10.5 mA) или 220 Ω (~8.6 mA).', en: '(5 - 3.1) / 0.010 = 190 Ω. Standard E12 matches are 180 Ω (~10.5 mA) or 220 Ω (~8.6 mA).' },
          ],
          explanation: {
            ru: 'Блестяще! И ток в цели, и реальный стандартный резистор ряда E12 подобран без перерасхода деталей.',
            en: 'Excellent! Both the target current and a real-world E12 standard value match cleanly.',
          },
          skillIds: ['resistor_sizing'],
          difficulty: 2,
          initialCircuit: {
            schemaVersion: 1,
            id: 'm3s-e12-tune',
            name: 'Blue LED E12',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0, locked: true },
              { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 100 }, position: { x: 11, y: 3 }, rotation: 0 },
              { id: 'd1', type: 'led', label: 'LED (Blue)', params: { color: 'blue' }, position: { x: 16, y: 7 }, rotation: 90, locked: true },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0, locked: true },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' }, locked: true },
              { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' }, locked: true },
              { id: 'w3', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' }, locked: true },
              { id: 'w4', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' }, locked: true },
            ],
          },
          targetComponentId: 'r1',
          paramKey: 'resistance',
          minVal: 68,
          maxVal: 1000,
          stepVal: 1,
          targetLedId: 'd1',
          minCurrentMa: 6,
          maxCurrentMa: 12,
          requireStandardE12: true,
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 8: SERIES & VOLTAGE DIVIDER
  // =========================================================================
  {
    id: 'm4-series-divider',
    version: 1,
    moduleId: 'mod-4',
    order: 8,
    title: { ru: 'Последовательное соединение и делитель', en: 'Series Circuits & Voltage Divider' },
    subtitle: {
      ru: 'Сложение сопротивлений и получение нужного напряжения из двух резисторов.',
      en: 'Adding resistances in series and building an accurate voltage divider.',
    },
    objective: {
      ru: 'Рассчитывать эквивалентное сопротивление и выходное напряжение резистивного делителя.',
      en: 'Calculate series equivalent resistance and voltage divider output.',
    },
    estimatedMinutes: 9,
    practiceType: { ru: 'Расчёт + сборка делителя', en: 'Math + Divider Build' },
    skillIds: ['series_divider'],
    prerequisites: ['m3-ohms-law'],
    xpReward: 130,
    notebookTakeaway: {
      ru: 'При последовательном соединении R_экв = R₁ + R₂, ток одинаков, а напряжение делится: U_out = U_in · R₂ / (R₁ + R₂). Делитель нельзя сильно нагружать без учёта сопротивления нагрузки!',
      en: 'In series: R_eq = R₁ + R₂, current is shared, and V_out = V_in · R₂ / (R₁ + R₂). Heavy external loads pull V_out down!',
    },
    notebookFormula: 'U_out = U_in · R₂ / (R₁ + R₂)',
    mapNode: { x: 745, y: 140 },
    steps: [
      {
        id: 'm4s-s1',
        phase: 'observe',
        title: { ru: 'Как 5 V превратить в 3.3 V для датчика?', en: 'Stepping 5 V Down to ~3.3 V' },
        body: {
          ru: 'Два последовательных резистора образуют делитель напряжения. Посмотри на схему: сверху 1 kΩ, снизу 2 kΩ на земле. Общее R = 3 kΩ, ток = 9 V / 3 kΩ = 3 mA, а в средней точке ровно 6.00 V! (Важно: делитель напряжения используют для сигналов/ADC, а не для питания мощных моторов).',
          en: 'Two series resistors divide voltage proportionally. With 1 kΩ on top and 2 kΩ to ground across 9 V, R_total = 3 kΩ, I = 3 mA, and the midpoint is exactly 6.00 V! (Note: dividers are for sensing/signals, not powering heavy loads.)',
        },
        demoCircuit: {
          schemaVersion: 1,
          id: 'm4s-demo',
          name: 'Voltage Divider 1k/2k',
          viewMode: 'schematic',
          components: [
            { id: 'v1', type: 'voltage_source', label: '9 V', params: { voltage: 9 }, position: { x: 5, y: 6 }, rotation: 0 },
            { id: 'r1', type: 'resistor', label: 'R1 (1k)', params: { resistance: 1000 }, position: { x: 13, y: 4 }, rotation: 90 },
            { id: 'r2', type: 'resistor', label: 'R2 (2k)', params: { resistance: 2000 }, position: { x: 13, y: 9 }, rotation: 90 },
            { id: 'vm', type: 'voltmeter', label: 'Vout', params: {}, position: { x: 18, y: 9 }, rotation: 90 },
            { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 5, y: 12 }, rotation: 0 },
          ],
          wires: [
            { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
            { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'r2', terminalId: 'a' } },
            { id: 'w3', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
            { id: 'w4', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            { id: 'w5', from: { componentId: 'r2', terminalId: 'a' }, to: { componentId: 'vm', terminalId: 'pos' } },
            { id: 'w6', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'vm', terminalId: 'neg' } },
          ],
        },
      },
      {
        id: 'm4s-s2',
        phase: 'measure',
        title: { ru: 'Рассчитай выход делителя', en: 'Calculate Divider Output' },
        body: {
          ru: 'На вход делителя подано 5 V. Верхний резистор R₁ = 1000 Ω, нижний резистор к земле R₂ = 2000 Ω. Какое напряжение будет в точке между R₁ и R₂?',
          en: 'Input is 5 V, top R₁ = 1000 Ω, bottom R₂ = 2000 Ω. What is the midpoint voltage?',
        },
        exercise: {
          id: 'm4s-ex-num',
          type: 'numeric',
          prompt: {
            ru: 'Вычисли U_out = 5 · 2000 / (1000 + 2000) в Вольтах:',
            en: 'Compute V_out = 5 · 2000 / (1000 + 2000) in Volts:',
          },
          hints: [{ ru: '5 × 2 / 3 ≈ 3.33 V — классическое согласование 5 V сигнала с 3.3 V входом ESP32!', en: '5 × 2 / 3 ≈ 3.33 V — classic 5 V to 3.3 V logic signal level divider!' }],
          explanation: {
            ru: '3.33 V! Именно такой делитель 1 kΩ + 2 kΩ защищает 3.3 V вход ESP32 от 5 V датчика.',
            en: '3.33 V! That 1 kΩ + 2 kΩ divider safely scales a 5 V sensor signal for a 3.3 V ESP32 pin.',
          },
          skillIds: ['series_divider'],
          difficulty: 2,
          expectedValue: 3.33,
          unit: 'V',
          tolerancePercent: 2,
        },
      },
      {
        id: 'm4s-s3',
        phase: 'apply',
        title: { ru: 'Собери последовательную цепь из двух резисторов', en: 'Build a Series Divider Circuit' },
        body: {
          ru: 'Соедини источник 9 V, оба резистора R1 (1 kΩ) и R2 (2 kΩ) последовательно в замкнутый контур с общим GND.',
          en: 'Wire the 9 V source, R1 (1 kΩ), and R2 (2 kΩ) in a closed series loop with GND.',
        },
        exercise: {
          id: 'm4s-ex-build',
          type: 'build_circuit',
          prompt: {
            ru: 'Соедини R1 и R2 последовательно к источнику 9 V так, чтобы через оба резистора протекал общий ток.',
            en: 'Connect R1 and R2 in series across the 9 V supply so current flows through both.',
          },
          hints: [{ ru: 'V1(+) → R1(1) → R1(2) → R2(1) → R2(2) → V1(−).', en: 'V1(+) → R1(1) → R1(2) → R2(1) → R2(2) → V1(-).' }],
          explanation: {
            ru: 'Отлично! В обоих резисторах одинаковый ток 3.00 mA, а сумма падений 3 V + 6 V равна 9 V.',
            en: 'Great! Both resistors carry 3.00 mA, and their drops 3 V + 6 V sum to 9 V.',
          },
          skillIds: ['series_divider'],
          difficulty: 2,
          palette: [],
          initialCircuit: {
            schemaVersion: 1,
            id: 'm4s-build',
            name: 'Build Series Loop',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '9 V', params: { voltage: 9 }, position: { x: 4, y: 6 }, rotation: 0 },
              { id: 'r1', type: 'resistor', label: 'R1 (1k)', params: { resistance: 1000 }, position: { x: 10, y: 3 }, rotation: 0 },
              { id: 'r2', type: 'resistor', label: 'R2 (2k)', params: { resistance: 2000 }, position: { x: 16, y: 7 }, rotation: 90 },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
            ],
            wires: [
              { id: 'w-g', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
          requirements: {
            requireNoWarnings: true,
            requireMultipleSeriesResistors: 2,
          },
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 9: PARALLEL & KIRCHHOFF'S LAWS
  // =========================================================================
  {
    id: 'm4-parallel-kirchhoff',
    version: 1,
    moduleId: 'mod-4',
    order: 9,
    title: { ru: 'Параллельное соединение и Кирхгоф', en: 'Parallel Circuits & Kirchhoff’s Laws' },
    subtitle: {
      ru: 'Почему при добавлении ветви общее сопротивление падает, а общий ток растёт.',
      en: 'Why adding parallel branches lowers total resistance and increases source current.',
    },
    objective: {
      ru: 'Применять 1-й закон Кирхгофа (сумма токов в узле) и правильно собирать параллельные ветви.',
      en: 'Apply KCL (node currents sum) and wire parallel branches properly.',
    },
    estimatedMinutes: 8,
    practiceType: { ru: 'Прогноз + сборка ветвей', en: 'Predict + Parallel Build' },
    skillIds: ['parallel_kirchhoff'],
    prerequisites: ['m4-series-divider'],
    xpReward: 130,
    notebookTakeaway: {
      ru: 'В параллельных ветвях напряжение одинаково (U₁ = U₂), а по первому закону Кирхгофа общий ток равен сумме токов ветвей: I_общ = I₁ + I₂. Общее сопротивление ВСЕГДА меньше наименьшего резистора!',
      en: 'Parallel branches share equal voltage (V₁ = V₂), and by KCL total current equals branch sum: I_total = I₁ + I₂. Equivalent R is ALWAYS smaller than the smallest branch R.',
    },
    notebookFormula: '1/R_eq = 1/R₁ + 1/R₂  |  I_total = I₁ + I₂',
    mapNode: { x: 745, y: 270 },
    steps: [
      {
        id: 'm4p-s1',
        phase: 'predict',
        title: { ru: 'Парадокс второй дороги', en: 'The Extra Lane Paradox' },
        body: {
          ru: 'К источнику 10 V подключён резистор 100 Ω (ток = 100 мА). Если параллельно добавить ещё один такой же резистор 100 Ω, как изменится ОБЩИЙ ток от батареи?',
          en: 'A 100 Ω resistor across 10 V draws 100 mA. If you add a second 100 Ω resistor in parallel, what happens to total battery current?',
        },
        exercise: {
          id: 'm4p-ex-predict',
          type: 'predict_outcome',
          prompt: {
            ru: 'Каким станет общий ток от источника 10 V при двух параллельных резисторах 100 Ω?',
            en: 'What is the total current from 10 V with two parallel 100 Ω branches?',
          },
          hints: [{ ru: 'Вторая ветвь — это дополнительная полоса движения: через каждую текут свои 100 мА.', en: 'The second branch opens a second current path carrying another 100 mA.' }],
          explanation: {
            ru: 'Общий ток удвоится до 200 mA (100 mA + 100 mA), а общее сопротивление станет 50 Ω!',
            en: 'Total current doubles to 200 mA (100 mA + 100 mA), so equivalent R drops to 50 Ω!',
          },
          skillIds: ['parallel_kirchhoff'],
          difficulty: 2,
          options: [
            { id: 'a', text: { ru: 'Уменьшится до 50 mA, так как стало два резистора', en: 'Drops to 50 mA because there are two resistors' }, misconceptionCode: 'SERIES_VS_PARALLEL' },
            { id: 'b', text: { ru: 'Увеличится до 200 mA (по 100 mA в каждой ветви)', en: 'Increases to 200 mA (100 mA in each branch)' } },
            { id: 'c', text: { ru: 'Останется 100 mA, разделившись по 50 mA', en: 'Stays 100 mA split as 50 mA each' }, misconceptionCode: 'SERIES_VS_PARALLEL' },
          ],
          correctOptionId: 'b',
        },
      },
      {
        id: 'm4p-s2',
        phase: 'apply',
        title: { ru: 'Собери две параллельные ветви', en: 'Wire Two Parallel Branches' },
        body: {
          ru: 'Собери параллельную цепь на 9 V с резисторами R1 (1 kΩ) и R2 (1 kΩ): каждый должен получить полные 9.00 V и работать независимо от другого.',
          en: 'Wire R1 (1 kΩ) and R2 (1 kΩ) in parallel across the 9 V source so each receives the full 9.00 V.',
        },
        exercise: {
          id: 'm4p-ex-build',
          type: 'build_circuit',
          prompt: {
            ru: 'Подключи R1 и R2 параллельно к 9 V (на каждом падает ~9 V, ток по 9 mA в каждой ветви).',
            en: 'Connect R1 and R2 in parallel across 9 V (~9 V drop and 9 mA each).',
          },
          hints: [{ ru: 'Соедини оба верхних вывода (R1:1 и R2:1) с V1(+), а оба нижних (R1:2 и R2:2) с V1(−).', en: 'Tie both top pins (R1:1, R2:1) to V1(+) and both bottom pins (R1:2, R2:2) to V1(-).' }],
          explanation: {
            ru: 'Идеально! На обоих резисторах 9.00 V, в каждой ветви 9 mA, от источника 18 mA — 1-й закон Кирхгофа подтверждён.',
            en: 'Ideal! Both branches see 9.00 V and carry 9 mA each, totaling 18 mA from the source.',
          },
          skillIds: ['parallel_kirchhoff'],
          difficulty: 2,
          palette: [],
          initialCircuit: {
            schemaVersion: 1,
            id: 'm4p-build',
            name: 'Parallel Branches',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '9 V', params: { voltage: 9 }, position: { x: 4, y: 6 }, rotation: 0 },
              { id: 'r1', type: 'resistor', label: 'R1 (1k)', params: { resistance: 1000 }, position: { x: 11, y: 6 }, rotation: 90 },
              { id: 'r2', type: 'resistor', label: 'R2 (1k)', params: { resistance: 1000 }, position: { x: 16, y: 6 }, rotation: 90 },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
            ],
            wires: [
              { id: 'w-g', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
          requirements: {
            requireNoWarnings: true,
            requireParallelBranches: 2,
          },
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 10: LEDs & POLARITY
  // =========================================================================
  {
    id: 'm5-leds-polarity',
    version: 1,
    moduleId: 'mod-5',
    order: 10,
    title: { ru: 'Светодиоды, диоды и полярность', en: 'LEDs, Diodes & Polarity' },
    subtitle: {
      ru: 'Почему нельзя ставить один резистор на два разных светодиода в параллель.',
      en: 'Why parallel LEDs of different colors must never share a single resistor.',
    },
    objective: {
      ru: 'Понимать разницу прямого падения Vf разных цветов LED и грамотно подключать несколько светодиодов.',
      en: 'Understand color-dependent Vf drops and wire multiple LEDs safely.',
    },
    estimatedMinutes: 8,
    practiceType: { ru: 'Эксперимент + починка схемы', en: 'Experiment + Circuit Fix' },
    skillIds: ['led_polarity'],
    prerequisites: ['m3-resistor-sizing', 'm4-parallel-kirchhoff'],
    xpReward: 135,
    notebookTakeaway: {
      ru: 'Красный LED имеет прямое падение ~2.0 V, синий/белый — ~3.1 V. При параллельном подключении к одному общему резистору весь ток заберёт красный LED, а синий останется тёмным! Каждому параллельному LED нужен свой резистор.',
      en: 'Red LEDs drop ~2.0 V while blue/white drop ~3.1 V. Sharing one resistor across parallel LEDs clamps voltage to ~2.0 V so the blue LED stays dark! Give each parallel LED its own resistor.',
    },
    notebookFormula: 'Red Vf ≈ 2.0 V | Green Vf ≈ 2.1 V | Blue/White Vf ≈ 3.1 V',
    mapNode: { x: 585, y: 360 },
    steps: [
      {
        id: 'm5-s1',
        phase: 'observe',
        title: { ru: 'Загадка погасшего синего LED', en: 'The Dark Blue LED Mystery' },
        body: {
          ru: 'Посмотри на схему: красный LED (Vf = 2.0 V) и синий LED (Vf = 3.1 V) подключены параллельно через ОДИН общий резистор 330 Ω. На красном светодиоде узел «зажимается» около 2.0 V — для синего этого не хватает! (В нашем движке даже эта тонкость ВАХ рассчитывается автоматически!)',
          en: 'Look at this circuit: red LED (Vf = 2.0 V) and blue LED (Vf = 3.1 V) share ONE 330 Ω resistor. The red LED clamps the shared node at ~2.0 V, starving the blue LED!',
        },
        demoCircuit: {
          schemaVersion: 1,
          id: 'm5-clamped-demo',
          name: 'Shared Resistor LED Trap',
          viewMode: 'schematic',
          components: [
            { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
            { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 10, y: 3 }, rotation: 0 },
            { id: 'd_red', type: 'led', label: 'Red (2.0V)', params: { color: 'red' }, position: { x: 14, y: 7 }, rotation: 90 },
            { id: 'd_blue', type: 'led', label: 'Blue (3.1V)', params: { color: 'blue' }, position: { x: 18, y: 7 }, rotation: 90 },
            { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
          ],
          wires: [
            { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
            { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd_red', terminalId: 'anode' } },
            { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd_blue', terminalId: 'anode' } },
            { id: 'w4', from: { componentId: 'd_red', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
            { id: 'w5', from: { componentId: 'd_blue', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
            { id: 'w6', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
          ],
        },
      },
      {
        id: 'm5-s2',
        phase: 'apply',
        title: { ru: 'Почини двухцветный индикатор', en: 'Fix the Dual-Color Indicator' },
        body: {
          ru: 'Дай синему светодиоду собственный путь через второй резистор R2 (220 Ω) напрямую от +5 V, а красный оставь через R1 (330 Ω), либо устрани переполюсовку. Тогда загорятся ОБА светодиода!',
          en: 'Wire the blue LED through its own resistor R2 (220 Ω) from +5 V instead of sharing R1 with the red LED so BOTH light up cleanly.',
        },
        exercise: {
          id: 'm5-ex-fix-dual',
          type: 'find_fault',
          prompt: {
            ru: 'Переподключи синий светодиод к +5 V через отдельный резистор R2, чтобы зажечь синий LED безопасно (3–20 mA).',
            en: 'Rewire the blue LED to +5 V via its own R2 resistor so the blue LED lights safely (3–20 mA).',
          },
          hints: [
            { ru: 'Проведи провод от V1(+) к R2(1), от R2(2) к аноду синего LED, а катод к GND/V1(−), убрав лишнее соединение с R1.', en: 'Wire V1(+) → R2(1) → R2(2) → Blue LED anode (delete the wire tying Blue anode to R1).' },
          ],
          explanation: {
            ru: 'Точно! Теперь у каждой ветви независимое ограничение тока, и синий LED стабильно получает свои ~8.6 mA.',
            en: 'Spot on! Each parallel LED has its own limiting resistor and the blue LED receives ~8.6 mA.',
          },
          skillIds: ['led_polarity'],
          difficulty: 3,
          faultyCircuit: {
            schemaVersion: 1,
            id: 'm5-fix-dual',
            name: 'Dual LED Fix',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0, locked: true },
              { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 10, y: 3 }, rotation: 0, locked: true },
              { id: 'r2', type: 'resistor', label: 'R2 (220)', params: { resistance: 220 }, position: { x: 16, y: 3 }, rotation: 0, locked: true },
              { id: 'd_red', type: 'led', label: 'Red', params: { color: 'red' }, position: { x: 12, y: 8 }, rotation: 90, locked: true },
              { id: 'd_blue', type: 'led', label: 'Blue', params: { color: 'blue' }, position: { x: 18, y: 8 }, rotation: 90, locked: true },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0, locked: true },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
              { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd_red', terminalId: 'anode' } },
              { id: 'w-bad', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd_blue', terminalId: 'anode' } },
              { id: 'w4', from: { componentId: 'd_red', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
              { id: 'w5', from: { componentId: 'd_blue', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
              { id: 'w6', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
          requireFixedCircuit: true,
          targetLedId: 'd_blue',
          minCurrentMa: 3,
          maxCurrentMa: 20,
        },
      },
    ],
  },
];
