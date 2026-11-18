import type { LessonDefinition } from '../schema';

export const LESSONS_PART_3: LessonDefinition[] = [
  // =========================================================================
  // LESSON 11: VOLTMETER PROBING
  // =========================================================================
  {
    id: 'm6-voltmeter',
    version: 1,
    moduleId: 'mod-6',
    order: 11,
    title: { ru: 'Измерение напряжения вольтметром', en: 'Measuring Voltage with a Voltmeter' },
    subtitle: {
      ru: 'Высокое входное сопротивление, полярность щупов и поиск узла с обрывом.',
      en: 'High input impedance, probe polarity, and spotting open-circuit voltage drops.',
    },
    objective: {
      ru: 'Уметь правильно подключать вольтметр параллельно участку цепи и интерпретировать знак показаний.',
      en: 'Probe voltage in parallel accurately and interpret signed polarity readings.',
    },
    estimatedMinutes: 7,
    practiceType: { ru: 'Интерактивный мультиметр', en: 'Interactive Multimeter' },
    skillIds: ['voltmeter_probing'],
    prerequisites: ['m4-series-divider'],
    xpReward: 120,
    notebookTakeaway: {
      ru: 'Вольтметр обладает огромным входным сопротивлением (~10 MΩ) и всегда подключается ПАРАЛЛЕЛЬНО к двум точкам, между которыми измеряют разность потенциалов. Если поменять щупы местами, число сохранится, но появится знак «−».',
      en: 'A voltmeter has huge input impedance (~10 MΩ) and is ALWAYS placed in PARALLEL across two points. Swapping red and black probes flips the sign to negative.',
    },
    notebookFormula: 'R_in ≈ 10 MΩ  (подключение: параллельно)',
    mapNode: { x: 895, y: 140 },
    steps: [
      {
        id: 'm6v-s1',
        phase: 'observe',
        title: { ru: 'Почему вольтметр не портит схему?', en: 'Why Voltmeters Barely Load Circuits' },
        body: {
          ru: 'Чтобы прибор при подключении не менял режим схемы, вольтметр имеет сопротивление около 10 MΩ. Через него утекают лишь доли микроампера, поэтому делитель и светодиод продолжают работать как раньше.',
          en: 'To avoid altering the circuit under test, a voltmeter has ~10 MΩ input impedance, drawing only sub-microampere current.',
        },
      },
      {
        id: 'm6v-s2',
        phase: 'measure',
        title: { ru: 'Измерь падение на резисторе', en: 'Measure Resistor Voltage Drop' },
        body: {
          ru: 'В этой цепи питание 5 V, резистор R1 = 330 Ω и красный LED. Подключи щупы мультиметра в режиме V⎓ параллельно резистору R1 (красный к R1:1, чёрный к R1:2) и впиши показание.',
          en: 'In this 5 V + 330 Ω + red LED loop, measure the DC voltage across R1 (red to R1:1, black to R1:2) and enter the reading.',
        },
        exercise: {
          id: 'm6v-ex-measure',
          type: 'measure_multimeter',
          prompt: {
            ru: 'Измерь напряжение на резисторе R1 мультиметром и введи результат (в Вольтах):',
            en: 'Measure the voltage across R1 with the multimeter and enter the value (V):',
          },
          hints: [{ ru: 'На LED падает около 2.00 V, значит на резисторе должно быть 5.00 − 2.00 ≈ 3.00 V!', en: 'The LED drops ~2.00 V, leaving ~3.00 V across R1!' }],
          explanation: {
            ru: '3.00 V! Сумма напряжений 3.00 V (R1) + 2.00 V (LED) = 5.00 V — это второй закон Кирхгофа в действии.',
            en: '3.00 V! Notice 3.00 V (R1) + 2.00 V (LED) = 5.00 V — Kirchhoff’s Voltage Law confirmed!',
          },
          skillIds: ['voltmeter_probing'],
          difficulty: 2,
          requiredMode: 'dc_v',
          targetPinPair: { componentId: 'r1', termA: 'a', termB: 'b', polarSensitive: true },
          expectedReading: 3.0,
          tolerancePercent: 4,
          circuit: {
            schemaVersion: 1,
            id: 'm6v-circ',
            name: 'Measure R1 Drop',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
              { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 11, y: 3 }, rotation: 0 },
              { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 16, y: 7 }, rotation: 90 },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
              { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
              { id: 'w3', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
              { id: 'w4', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 12: AMMETER PROBING & SHORT PROTECTION
  // =========================================================================
  {
    id: 'm6-ammeter',
    version: 1,
    moduleId: 'mod-6',
    order: 12,
    title: { ru: 'Измерение тока амперметром', en: 'Measuring Current with an Ammeter' },
    subtitle: {
      ru: 'Почему амперметр ставят только в разрыв цепи и чем грозит параллельное включение.',
      en: 'Why ammeters go in series only and what happens if placed in parallel.',
    },
    objective: {
      ru: 'Безопасно включать амперметр в разрыв ветви и проверять точность показаний.',
      en: 'Insert an ammeter in series safely without shorting the power supply.',
    },
    estimatedMinutes: 8,
    practiceType: { ru: 'Сборка с амперметром', en: 'Series Ammeter Wiring' },
    skillIds: ['ammeter_probing'],
    prerequisites: ['m6-voltmeter'],
    xpReward: 130,
    notebookTakeaway: {
      ru: 'У амперметра минимальное сопротивление шунта (~0.01 Ω). Его ВСЕГДА включают ПОСЛЕДОВАТЕЛЬНО (в разрыв цепи). Параллельное подключение амперметра к батарее или нагрузке — это короткое замыкание через прибор!',
      en: 'An ammeter uses a near-zero shunt (~0.01 Ω) and MUST ALWAYS go IN SERIES (breaking the loop). Parallel wiring shorts the supply through the meter!',
    },
    notebookFormula: 'R_shunt ≈ 0.01 Ω  (подключение: только в разрыв!)',
    mapNode: { x: 895, y: 270 },
    steps: [
      {
        id: 'm6a-s1',
        phase: 'predict',
        title: { ru: 'Главная ошибка новичка', en: 'The #1 Beginner Meter Mistake' },
        body: {
          ru: 'Что случится в реальной лаборатории, если щупы мультиметра в режиме измерения тока (mA/A) приложить параллельно к клеммам (+) и (−) батареи?',
          en: 'In a real lab, what happens if probes set to current (mA/A) mode are touched directly across battery (+) and (-)?',
        },
        exercise: {
          id: 'm6a-ex-predict',
          type: 'predict_outcome',
          prompt: {
            ru: 'Выбери верное последствие параллельного подключения амперметра к источнику:',
            en: 'Select the outcome of wiring an ammeter in parallel across a source:',
          },
          hints: [{ ru: 'Сопротивление амперметра около 0.01 Ω. При 5 V ток составит 5 / 0.01 = 500 A!', en: 'Ammeter shunt is ~0.01 Ω: 5 V / 0.01 Ω = 500 A!' }],
          explanation: {
            ru: 'Именно так! Возникнет короткое замыкание через шунт, и перегорит защитный предохранитель мультиметра.',
            en: 'Correct! It creates a direct short across the shunt and blows the meter’s internal fuse.',
          },
          skillIds: ['ammeter_probing'],
          difficulty: 1,
          options: [
            { id: 'a', text: { ru: 'Покажет напряжение батареи', en: 'Displays battery voltage' }, misconceptionCode: 'AMMETER_PARALLEL_MISUSE' },
            { id: 'b', text: { ru: 'Произойдёт короткое замыкание и сгорит предохранитель прибора', en: 'Creates a short circuit and blows the meter fuse' } },
            { id: 'c', text: { ru: 'Ничего не произойдёт, он покажет 0 mA', en: 'Nothing happens, displays 0 mA' }, misconceptionCode: 'AMMETER_PARALLEL_MISUSE' },
          ],
          correctOptionId: 'b',
        },
      },
      {
        id: 'm6a-s2',
        phase: 'apply',
        title: { ru: 'Включи амперметр A1 в разрыв цепи', en: 'Wire Ammeter A1 in Series' },
        body: {
          ru: 'Перед тобой источник 5 V, резистор 330 Ω, красный LED и амперметр A1. Провод между резистором и светодиодом ещё не проложен. Включи амперметр A1 ПОСЛЕДОВАТЕЛЬНО между R1 и LED1, чтобы измерить ток ~9.1 mA.',
          en: 'Wire ammeter A1 IN SERIES between R1 (330 Ω) and the red LED to measure the ~9.1 mA branch current safely.',
        },
        exercise: {
          id: 'm6a-ex-build',
          type: 'build_circuit',
          prompt: {
            ru: 'Подключи A1 в разрыв между R1:2 и LED1(анод) — без короткого замыкания и с горящим LED.',
            en: 'Insert A1 in series between R1:2 and LED1(anode) so the LED lights safely without meter fault.',
          },
          hints: [{ ru: 'Соедини R1(2) → A1(+) и A1(−) → LED1(анод).', en: 'Wire R1(2) → A1(+) and A1(-) → LED1(anode).' }],
          explanation: {
            ru: 'Отлично! Амперметр A1 в разрыве ветви показывает точные 9.08 mA без вмешательства в работу схемы.',
            en: 'Well done! Inserted in series, A1 reads ~9.08 mA accurately without shorting the rail.',
          },
          skillIds: ['ammeter_probing'],
          difficulty: 2,
          palette: [],
          initialCircuit: {
            schemaVersion: 1,
            id: 'm6a-build',
            name: 'Series Ammeter',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0, locked: true },
              { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 9, y: 3 }, rotation: 0, locked: true },
              { id: 'a1', type: 'ammeter', label: 'A1', params: { maxCurrent: 0.5 }, position: { x: 15, y: 3 }, rotation: 0 },
              { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 18, y: 8 }, rotation: 90, locked: true },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0, locked: true },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' }, locked: true },
              { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' }, locked: true },
              { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' }, locked: true },
            ],
          },
          requirements: {
            requireLedLit: true,
            requireNoWarnings: true,
            minCurrentMa: 5,
            maxCurrentMa: 15,
          },
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 13: QUEST "DEAD BEACON" (DIAGNOSTICS)
  // =========================================================================
  {
    id: 'm6-diagnostics-beacon',
    version: 1,
    moduleId: 'mod-6',
    order: 13,
    questId: 'quest-beacon',
    title: { ru: 'Квест: Погасший маяк (диагностика)', en: 'Quest: Dead Beacon Diagnostics' },
    subtitle: {
      ru: 'Устройство не работает: изучи симптомы, измерь узлы мультиметром, найди и устрани поломки.',
      en: 'The beacon failed: inspect symptoms, probe with the multimeter, and repair the faults.',
    },
    objective: {
      ru: 'Провести системную диагностику неизвестной неисправной схемы и восстановить безопасное свечение маяка.',
      en: 'Diagnose a broken device systematically and restore safe LED beacon operation.',
    },
    estimatedMinutes: 10,
    practiceType: { ru: 'Квест-диагностика', en: 'Quest Diagnostics' },
    skillIds: ['fault_diagnostics'],
    prerequisites: ['m6-ammeter', 'm5-leds-polarity'],
    xpReward: 170,
    notebookTakeaway: {
      ru: 'Алгоритм диагностики: 1) Проверить напряжение питания относительно GND; 2) Найти, на каком элементе теряется весь потенциал (обрыв / сгоревший предохранитель); 3) Проверить полярность и номиналы перед запуском.',
      en: 'Diagnostic workflow: 1) Verify supply voltage vs GND; 2) Find which component drops the entire voltage (open / blown fuse); 3) Verify polarity and resistor sizing before energizing.',
    },
    mapNode: { x: 895, y: 360 },
    steps: [
      {
        id: 'm6d-s1',
        phase: 'observe',
        title: { ru: 'Брифинг квеста «Погасший маяк»', en: 'Quest Briefing: Dead Beacon' },
        body: {
          ru: 'Сигнальный маяк лаборатории питается от 9 V, но светодиод погас. Известно, что в схеме есть сработавший предохранитель F1 (или обрыв) и неправильно выбранный резистор. Исследуй схему и верни маяк в строй!',
          en: 'The lab signal beacon runs on 9 V, but its LED went dark. A blown fuse (or open path) and an incorrect resistor value are suspected. Investigate and repair!',
        },
      },
      {
        id: 'm6d-s2',
        phase: 'apply',
        title: { ru: 'Отремонтируй маяк', en: 'Repair the Beacon Circuit' },
        body: {
          ru: 'В схеме повреждён предохранитель F1 (сгорел от слишком маленького резистора 10 Ω!). Чтобы починить маяк: 1) Замени/сбрось предохранитель F1 или замкни цепь через целый путь; 2) Увеличь резистор R1 с 10 Ω до безопасного значения (например, 470 Ω или 680 Ω для 9 V), чтобы ток через LED был 5–18 mA.',
          en: 'Fuse F1 blew because R1 was mistakenly set to 10 Ω! Repair the beacon: 1) Fix/replace fuse F1 (click Reset Fuse in Inspector or rewire cleanly); 2) Increase R1 from 10 Ω to 470–680 Ω so LED current is 5–18 mA.',
        },
        exercise: {
          id: 'm6d-ex-repair',
          type: 'unknown_circuit_diagnosis',
          prompt: {
            ru: 'Устрани первопричину перегрузки (подними R1 для 9 V до 470–1000 Ω) и восстанови предохранитель F1, чтобы зажечь маяк с током 5–18 mA.',
            en: 'Fix the root cause overcurrent (raise R1 to 470–1000 Ω for 9 V) and reset/restore fuse F1 so the beacon lights safely at 5–18 mA.',
          },
          hints: [
            { ru: 'Сначала выдели R1 и измени сопротивление на 470 Ω (при 9 V ток (9−2)/470 ≈ 14.9 mA). Затем выдели F1 и нажми «Заменить предохранитель» в инспекторе!', en: 'First select R1 and set resistance to 470 Ω ((9-2)/470 ≈ 14.9 mA). Then select F1 and click "Replace Fuse" in the inspector!' },
          ],
          explanation: {
            ru: 'Квест выполнен! Ты не просто поменял сгоревший предохранитель, а нашёл и устранил причину перегрузки (10 Ω). Новый маяк работает стабильно и безопасно!',
            en: 'Quest complete! You fixed both the blown fuse AND the 10 Ω root-cause overload. The beacon shines safely!',
          },
          skillIds: ['fault_diagnostics'],
          difficulty: 3,
          faultyCircuit: {
            schemaVersion: 1,
            id: 'm6d-beacon',
            name: 'Dead Beacon',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'battery', label: '9 V', params: { voltage: 9 }, position: { x: 4, y: 6 }, rotation: 0, locked: true },
              { id: 'f1', type: 'fuse', label: 'F1 (0.5A)', params: { ratedCurrent: 0.5, blown: true }, position: { x: 9, y: 3 }, rotation: 0, locked: true },
              { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 10 }, position: { x: 14, y: 3 }, rotation: 0, locked: true },
              { id: 'd1', type: 'led', label: 'BEACON LED', params: { color: 'amber' }, position: { x: 17, y: 8 }, rotation: 90, locked: true },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0, locked: true },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'f1', terminalId: 'a' } },
              { id: 'w2', from: { componentId: 'f1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
              { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
              { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
              { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
          requireFixedCircuit: true,
          targetLedId: 'd1',
          minCurrentMa: 5,
          maxCurrentMa: 18,
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 14: DIGITAL LOGIC & ENGINEERING SPEC
  // =========================================================================
  {
    id: 'm9-logic-gates',
    version: 1,
    moduleId: 'mod-9',
    order: 14,
    title: { ru: 'Логика и двухкнопочный замок', en: 'Logic Gates & Safety Interlock' },
    subtitle: {
      ru: 'HIGH/LOW, таблица истинности вентиля и инженерная задача на макетной цепи.',
      en: 'HIGH/LOW logic levels, gate truth tables, and a real 2-button interlock spec.',
    },
    objective: {
      ru: 'Понимать таблицы истинности NOT/AND/OR/XOR и реализовывать спецификацию «включение только при нажатии обеих кнопок».',
      en: 'Evaluate gate truth tables and implement a two-button AND safety interlock.',
    },
    estimatedMinutes: 9,
    practiceType: { ru: 'Логическая схема + спецификация', en: 'Logic Truth Table + Engineering Spec' },
    skillIds: ['digital_logic'],
    prerequisites: ['m0-first-led'],
    xpReward: 150,
    notebookTakeaway: {
      ru: 'Логические уровни HIGH (1) и LOW (0) задают абстрактные состояния (например, 3.3 V или 5 V в зависимости от семейства). Элемент AND (И) выдаёт 1 только когда оба входа равны 1 — физический аналог последовательного соединения двух кнопок.',
      en: 'Logic HIGH (1) and LOW (0) are discrete states mapped to family voltages (e.g. 3.3 V or 5 V). An AND gate outputs 1 only when all inputs are 1 — analogous to two switches wired in series.',
    },
    notebookFormula: 'AND: Y = A · B  |  OR: Y = A + B  |  NOT: Y = Ā',
    mapNode: { x: 255, y: 450 },
    steps: [
      {
        id: 'm9-s1',
        phase: 'observe',
        title: { ru: 'Логические уровни — не конкретное напряжение', en: 'Logic Levels Are Voltage-Family Dependent' },
        body: {
          ru: 'Важное правило: HIGH («1») на Arduino UNO — это ~5 V, а на ESP32 — ~3.3 V. Логика оперирует состояниями Истина (1) и Ложь (0), независимо от конкретного питания. В задании ниже проверь работу вентиля XOR («Исключающее ИЛИ»).',
          en: 'Key distinction: HIGH ("1") is ~5 V on Arduino UNO and ~3.3 V on ESP32. Digital logic deals with abstract 1/0 states. Below, wire an XOR gate and verify all 4 input combinations.',
        },
        exercise: {
          id: 'm9-ex-xor',
          type: 'logic_circuit',
          prompt: {
            ru: 'Подключи входы A и B к вентилю XOR1, а его выход Y — к индикатору OUT, чтобы реализовать таблицу истинности XOR (0, 1, 1, 0).',
            en: 'Wire inputs A and B to XOR1 and output Y to indicator OUT to satisfy the XOR truth table (0, 1, 1, 0).',
          },
          hints: [{ ru: 'Соедини A(OUT)→XOR1(A), B(OUT)→XOR1(B), XOR1(Y)→OUT(IN).', en: 'Connect A(OUT)→XOR1(A), B(OUT)→XOR1(B), XOR1(Y)→OUT(IN).' }],
          explanation: {
            ru: 'Таблица истинности XOR пройдена для всех 4 комбинаций (00→0, 01→1, 10→1, 11→0)!',
            en: 'XOR truth table verified across all 4 input states (00→0, 01→1, 10→1, 11→0)!',
          },
          skillIds: ['digital_logic'],
          difficulty: 2,
          availableGates: ['XOR'],
          expectedOutputs: [false, true, true, false],
          initialCircuit: {
            schemaVersion: 1,
            id: 'm9-xor',
            name: 'Wire XOR Gate',
            viewMode: 'schematic',
            components: [
              { id: 'inA', type: 'logic_input', label: 'A', params: { logicLevel: false }, position: { x: 4, y: 4 }, rotation: 0 },
              { id: 'inB', type: 'logic_input', label: 'B', params: { logicLevel: false }, position: { x: 4, y: 8 }, rotation: 0 },
              { id: 'g1', type: 'logic_gate', label: 'XOR1', params: { gateKind: 'XOR' }, position: { x: 11, y: 6 }, rotation: 0 },
              { id: 'out1', type: 'logic_output', label: 'OUT', params: {}, position: { x: 18, y: 6 }, rotation: 0 },
            ],
            wires: [],
          },
        },
      },
      {
        id: 'm9-s2',
        phase: 'apply',
        title: { ru: 'Инженерная задача: двухкнопочный замок', en: 'Engineering Spec: Two-Button Safety Lock' },
        body: {
          ru: 'Техническое задание: «Создай схему для станка с двумя кнопками BTN1 и BTN2, в которой светодиод LED1 включается ТОЛЬКО при одновременном нажатии обеих кнопок». Система сама протестирует все 4 комбинации (обе отжаты, первая, вторая, обе нажаты)!',
          en: 'Spec: "Build a safety interlock with BTN1 and BTN2 where LED1 lights ONLY when BOTH buttons are pressed simultaneously." The checker tests all 4 combinations automatically!',
        },
        exercise: {
          id: 'm9-ex-spec',
          type: 'engineering_spec',
          prompt: {
            ru: 'Соедини источник 5 V, кнопки BTN1 и BTN2, резистор R1 (330 Ω) и LED1 так, чтобы диод горел ТОЛЬКО при нажатии обеих кнопок.',
            en: 'Wire 5 V, BTN1, BTN2, resistor R1 (330 Ω), and LED1 so the LED lights ONLY when both buttons are pressed.',
          },
          hints: [
            { ru: 'Последовательное соединение кнопок реализует логическое «И» (AND): V1(+) → BTN1 → BTN2 → R1 → LED1 → V1(−).', en: 'Wiring BTN1 and BTN2 in series forms a hardware AND gate: V1(+) → BTN1 → BTN2 → R1 → LED1 → V1(-).' },
          ],
          explanation: {
            ru: 'Все 4 комбинации кнопок проверены физическим решателем! Последовательное включение контактов — простейший аппаратный элемент «И».',
            en: 'All 4 button combinations verified via MNA! Series switches implement a physical hardware AND interlock.',
          },
          skillIds: ['digital_logic'],
          difficulty: 3,
          palette: [],
          inputIds: ['btn1', 'btn2'],
          outputLedId: 'd1',
          expectedLitStates: [false, false, false, true],
          initialCircuit: {
            schemaVersion: 1,
            id: 'm9-spec',
            name: 'Two-Button Safety Lock',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 3, y: 6 }, rotation: 0 },
              { id: 'btn1', type: 'pushbutton', label: 'BTN1', params: { pressed: false }, position: { x: 8, y: 3 }, rotation: 0 },
              { id: 'btn2', type: 'pushbutton', label: 'BTN2', params: { pressed: false }, position: { x: 13, y: 3 }, rotation: 0 },
              { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 18, y: 3 }, rotation: 0 },
              { id: 'd1', type: 'led', label: 'LED1', params: { color: 'green' }, position: { x: 18, y: 9 }, rotation: 90 },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 3, y: 11 }, rotation: 0 },
            ],
            wires: [
              { id: 'w-g', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 15: OSCILLOSCOPE & PWM (QUEST "UNKNOWN SIGNAL")
  // =========================================================================
  {
    id: 'm10-oscilloscope-pwm',
    version: 1,
    moduleId: 'mod-10',
    order: 15,
    questId: 'quest-signal',
    title: { ru: 'Квест: Неизвестный сигнал (ШИМ и осциллограф)', en: 'Quest: Unknown Signal (PWM & Scope)' },
    subtitle: {
      ru: 'Расшифруй период, частоту и коэффициент заполнения Duty Cycle на экране осциллографа.',
      en: 'Measure period, frequency, and PWM duty cycle on a live interactive oscilloscope.',
    },
    objective: {
      ru: 'Управлять развёрткой Time/div и Volt/div осциллографа и вычислять параметры ШИМ-сигнала.',
      en: 'Adjust oscilloscope Time/div and Volt/div scales to extract frequency and duty cycle.',
    },
    estimatedMinutes: 9,
    practiceType: { ru: 'Виртуальный осциллограф', en: 'Virtual Oscilloscope' },
    skillIds: ['pwm_oscilloscope'],
    prerequisites: ['m9-logic-gates', 'm6-voltmeter'],
    xpReward: 165,
    notebookTakeaway: {
      ru: 'Период T — длительность одного полного цикла сигнала. Частота f = 1 / T (в Герцах). Скважность / заполнение ШИМ (Duty Cycle) = (t_high / T) · 100%, что позволяет плавно управлять средней мощностью на LED или моторе.',
      en: 'Period T is one full cycle duration. Frequency f = 1 / T (Hz). PWM Duty Cycle = (t_high / T) · 100%, controlling average power delivered to LEDs or motors.',
    },
    notebookFormula: 'f = 1 / T  |  Duty = (t_on / T) · 100%',
    mapNode: { x: 485, y: 450 },
    steps: [
      {
        id: 'm10-s1',
        phase: 'observe',
        title: { ru: 'Наблюдай неизвестный импульс', en: 'Inspect the Unknown Pulse' },
        body: {
          ru: 'К светодиодам и сервоприводам подают не меняющееся напряжение, а быстрые импульсы HIGH/LOW — ШИМ (PWM). Изменяй ручки Time/div и Volt/div на виртуальном осциллографе и измерь период сигнала в миллисекундах.',
          en: 'Instead of varying DC voltage, controllers drive LEDs and servos with fast HIGH/LOW pulses — PWM. Adjust Time/div and Volt/div and measure the signal period in ms.',
        },
        exercise: {
          id: 'm10-ex-period',
          type: 'oscilloscope_analysis',
          prompt: {
            ru: 'Определи период T этого прямоугольного сигнала по сетке осциллографа (в миллисекундах, ms):',
            en: 'Measure the period T of this pulse train from the scope grid (in ms):',
          },
          hints: [
            { ru: 'Посчитай, сколько горизонтальных клеток занимает один полный цикл (от переднего фронта до следующего переднего фронта), и умножь на Time/div.', en: 'Count horizontal grid divisions for one full cycle (rising edge to next rising edge) and multiply by Time/div.' },
          ],
          explanation: {
            ru: '2.00 ms! При периоде 2 мс частота составляет f = 1 / 0.002 = 500 Hz (стандартная частота ШИМ на многих пинах Arduino).',
            en: '2.00 ms! A 2 ms period corresponds to f = 1 / 0.002 = 500 Hz (standard Arduino PWM frequency).',
          },
          skillIds: ['pwm_oscilloscope'],
          difficulty: 2,
          signal: {
            mode: 'pwm',
            amplitudeV: 5.0,
            frequencyHz: 500,
            dutyCyclePercent: 30,
          },
          questionKind: 'period_ms',
          expectedValue: 2.0,
          unit: 'ms',
          tolerancePercent: 5,
        },
      },
      {
        id: 'm10-s2',
        phase: 'measure',
        title: { ru: 'Найди коэффициент заполнения (Duty Cycle)', en: 'Find the PWM Duty Cycle' },
        body: {
          ru: 'Теперь определи, какую долю периода сигнал находится в высоком уровне 5 V (Duty Cycle в %). Это напрямую задаёт яркость светодиода!',
          en: 'Now determine what percentage of each period the signal stays HIGH at 5 V (Duty Cycle %). This directly controls LED brightness!',
        },
        exercise: {
          id: 'm10-ex-duty',
          type: 'oscilloscope_analysis',
          prompt: {
            ru: 'Вычисли Duty Cycle (в процентах %) по длительности высокого импульса:',
            en: 'Compute the Duty Cycle (%) from the HIGH pulse width vs total period:',
          },
          hints: [
            { ru: 'Высокий уровень длится 0.6 ms из полного периода 2.0 ms: (0.6 / 2.0) × 100% = ? %.', en: 'The pulse stays HIGH for 0.6 ms out of 2.0 ms total period: (0.6 / 2.0) × 100% = ? %.' },
          ],
          explanation: {
            ru: '30%! Среднее напряжение такого 5-вольтового ШИМ-сигнала равно 5 V × 0.30 = 1.50 V — квест «Неизвестный сигнал» успешно завершён!',
            en: '30%! Average voltage of this 5 V PWM train is 1.50 V — Quest "Unknown Signal" complete!',
          },
          skillIds: ['pwm_oscilloscope'],
          difficulty: 2,
          signal: {
            mode: 'pwm',
            amplitudeV: 5.0,
            frequencyHz: 500,
            dutyCyclePercent: 30,
          },
          questionKind: 'duty_cycle',
          expectedValue: 30,
          unit: '%',
          tolerancePercent: 6,
        },
      },
    ],
  },
];
