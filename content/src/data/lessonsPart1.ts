import type { LessonDefinition } from '../schema';

export const LESSONS_PART_1: LessonDefinition[] = [
  // =========================================================================
  // LESSON 1 (REFERENCE STANDARD — 7 SCENES FROM DIRECTIVE §47)
  // =========================================================================
  {
    id: 'm0-first-led',
    version: 1,
    moduleId: 'mod-0',
    order: 1,
    title: { ru: 'Зажги первый светодиод', en: 'Light Your First LED' },
    subtitle: {
      ru: 'Эталонное занятие: замкнутая цепь, ток через LED, полярность и сборка с нуля.',
      en: 'Flagship lesson: closed loop, LED current limiting, polarity, and wiring from scratch.',
    },
    objective: {
      ru: 'Понять условие замкнутой цепи, рассчитать безопасный ток через светодиод и самостоятельно собрать рабочую схему.',
      en: 'Understand closed loops, inspect LED current, diagnose polarity, and wire a complete circuit from scratch.',
    },
    estimatedMinutes: 8,
    practiceType: { ru: 'Сборка цепи + эксперимент', en: 'Circuit Build + Lab Experiment' },
    skillIds: ['closed_loop'],
    prerequisites: [],
    xpReward: 120,
    notebookTakeaway: {
      ru: 'Электрический ток течёт только по замкнутому контуру от (+) к (−). Светодиоду обязателен токоограничивающий резистор и правильная полярность (Анод к +, Катод к −).',
      en: 'Current flows only in a closed loop from (+) to (-). An LED requires a series current-limiting resistor and correct polarity (Anode to +, Cathode to -).',
    },
    notebookFormula: 'I = (U_src - U_led) / R',
    mapNode: { x: 95, y: 140 },
    steps: [
      {
        id: 'm0-s1-intro',
        phase: 'observe',
        title: { ru: 'Сцена 1. Знакомство с лабораторией', en: 'Scene 1. Welcome to the Lab' },
        body: {
          ru: 'Электроника начинается с простой вещи: замкнутой цепи. Перед тобой источник 5 V, выключатель, резистор 330 Ω и красный светодиод. Сейчас ключ разомкнут — путь для заряда прерван.',
          en: 'Electronics begins with one core rule: a closed circuit. Here are a 5 V supply, a switch, a 330 Ω resistor, and a red LED. Right now the switch is open, breaking the path.',
        },
        demoCircuit: {
          schemaVersion: 1,
          id: 'm0-scene1-demo',
          name: 'First LED Demo',
          viewMode: 'schematic',
          components: [
            { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
            { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: false }, position: { x: 10, y: 3 }, rotation: 0 },
            { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 16, y: 3 }, rotation: 0 },
            { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 16, y: 9 }, rotation: 180 },
            { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
          ],
          wires: [
            { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw1', terminalId: 'a' } },
            { id: 'w2', from: { componentId: 'sw1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
            { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
            { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
            { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
          ],
        },
      },
      {
        id: 'm0-s2-switch',
        phase: 'experiment',
        title: { ru: 'Сцена 2. Первое действие', en: 'Scene 2. Close the Loop' },
        body: {
          ru: 'Нажми на выключатель SW1 на схеме, чтобы замкнуть контур. Обрати внимание: яркость светодиода рассчитывается физическим движком по реальному току, а не «рисуется кнопкой».',
          en: 'Click switch SW1 on the schematic to close the loop. Notice how LED brightness is solved mathematically from actual current, not faked by the button.',
        },
        exercise: {
          id: 'm0-ex-close-switch',
          type: 'build_circuit',
          prompt: {
            ru: 'Замкни выключатель SW1 прямо на рабочей схеме (клик или клавиша Space/Enter по SW1), чтобы светодиод зажёгся.',
            en: 'Toggle switch SW1 ON directly on the canvas so the LED turns on safely.',
          },
          hints: [
            { ru: 'Кликни прямо по компоненту SW1 на схеме или нажми на него с помощью Tab + Enter.', en: 'Click directly on switch SW1 or focus it via Tab and press Enter.' },
          ],
          explanation: {
            ru: 'Контур замкнулся! Ток пошёл от +5 V через SW1, резистор 330 Ω и светодиод к земле 0 V.',
            en: 'Loop closed! Current flows from +5 V through SW1, the 330 Ω resistor, and the LED to 0 V ground.',
          },
          skillIds: ['closed_loop'],
          difficulty: 1,
          palette: [],
          initialCircuit: {
            schemaVersion: 1,
            id: 'm0-scene2',
            name: 'Close SW1',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0, locked: true },
              { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: false }, position: { x: 10, y: 3 }, rotation: 0, locked: true },
              { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 16, y: 3 }, rotation: 0, locked: true },
              { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 16, y: 9 }, rotation: 180, locked: true },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0, locked: true },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw1', terminalId: 'a' }, locked: true },
              { id: 'w2', from: { componentId: 'sw1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' }, locked: true },
              { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' }, locked: true },
              { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' }, locked: true },
              { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' }, locked: true },
            ],
          },
          requirements: {
            requireLedLit: true,
            requireNoWarnings: true,
            minCurrentMa: 5,
            maxCurrentMa: 20,
          },
        },
      },
      {
        id: 'm0-s3-why',
        phase: 'explain',
        title: { ru: 'Сцена 3. Почему он загорелся и откуда 9.1 мА?', en: 'Scene 3. Why 9.1 mA?' },
        body: {
          ru: 'Источник даёт 5 V. В нашей учебной модели на красном светодиоде падает около 2 V (в реальности ВАХ нелинейна). Оставшиеся 5 V − 2 V = 3 V приходятся на резистор 330 Ω, что даёт ток I ≈ 3 V / 330 Ω ≈ 9.1 мА — яркий и безопасный режим! Анимация тока показывает условное направление (+ → −), а не буквальную скорость электронов.',
          en: 'The supply provides 5 V. In our linear-piecewise model, the red LED drops ~2 V (real LEDs follow an exponential I-V curve). The remaining 3 V across 330 Ω produces I ≈ 3 V / 330 Ω ≈ 9.1 mA — safe and bright! Note that pulse flow shows conventional current (+ to -), not physical electron drift speed.',
        },
        formula: 'I = (5 V − 2 V) / 330 Ω ≈ 9.08 mA',
        demoCircuit: {
          schemaVersion: 1,
          id: 'm0-scene3-live',
          name: 'Live 9.1 mA Circuit',
          viewMode: 'schematic',
          components: [
            { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
            { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: true }, position: { x: 10, y: 3 }, rotation: 0 },
            { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 16, y: 3 }, rotation: 0 },
            { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 16, y: 9 }, rotation: 180 },
            { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
          ],
          wires: [
            { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw1', terminalId: 'a' } },
            { id: 'w2', from: { componentId: 'sw1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
            { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
            { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
            { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
          ],
        },
      },
      {
        id: 'm0-s4-tune',
        phase: 'measure',
        title: { ru: 'Сцена 4. Эксперимент с сопротивлением', en: 'Scene 4. Experiment with Resistance' },
        body: {
          ru: 'Двигай ползунок сопротивления R1 (сейчас там опасные 47 Ω и ток около 63 мА!). Подбери такое сопротивление, чтобы ток через LED находился в безопасном диапазоне от 5 мА до 12 мА.',
          en: 'Adjust resistor R1 (currently an unsafe 47 Ω driving ~63 mA!). Tune R1 so the LED current lands safely between 5 mA and 12 mA.',
        },
        exercise: {
          id: 'm0-ex-tune-r',
          type: 'tune_parameter',
          prompt: {
            ru: 'Настрой сопротивление R1 так, чтобы ток через светодиод стал от 5 до 12 мА (например, 330 Ω или 470 Ω).',
            en: 'Adjust R1 so LED current falls between 5 mA and 12 mA (for example, 330 Ω or 470 Ω).',
          },
          hints: [
            { ru: 'При слишком малом резисторе ток выше 25 мА опасен для LED. Увеличивай R!', en: 'Small R causes >25 mA overcurrent. Increase R to limit current!' },
            { ru: 'Попробуй диапазон 270–560 Ω.', en: 'Try values around 270–560 Ω.' },
          ],
          explanation: {
            ru: 'Отлично! Чем больше сопротивление резистора, тем ниже ток через светодиод и мягче его свечение.',
            en: 'Great! Higher resistance restricts current through the LED and dims it safely.',
          },
          skillIds: ['closed_loop'],
          difficulty: 1,
          initialCircuit: {
            schemaVersion: 1,
            id: 'm0-scene4-tune',
            name: 'Tune R1',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0, locked: true },
              { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 47 }, position: { x: 11, y: 3 }, rotation: 0 },
              { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 16, y: 7 }, rotation: 90, locked: true },
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
          minVal: 47,
          maxVal: 1200,
          stepVal: 10,
          targetLedId: 'd1',
          minCurrentMa: 5,
          maxCurrentMa: 12,
        },
      },
      {
        id: 'm0-s5-polarity-fault',
        phase: 'predict',
        title: { ru: 'Сцена 5. Почему светодиод не горит?', en: 'Scene 5. Spot the Polarity Error' },
        body: {
          ru: 'В этой схеме цепь замкнута, напряжение 5 V подано, резистор 330 Ω на месте — но светодиод не светится. Посмотри на его выводы на схеме.',
          en: 'In this circuit the loop is closed, 5 V is applied, and 330 Ω is wired — yet the LED stays dark. Inspect its terminals.',
        },
        exercise: {
          id: 'm0-ex-polarity',
          type: 'find_fault',
          prompt: {
            ru: 'Определи причину, по которой светодиод не горит в этой схеме.',
            en: 'Identify why the LED fails to light in this circuit.',
          },
          hints: [
            { ru: 'Посмотри, к какому выводу LED (Анод A+ или Катод K−) приходит провод от плюса через резистор.', en: 'Check whether the positive side connects to Anode (A+) or Cathode (K-).' },
          ],
          explanation: {
            ru: 'Верно! Светодиод имеет полярность: катод (K−) подключён к плюсу, поэтому ток заперт.',
            en: 'Correct! LEDs are polarized: wiring cathode (K-) toward positive blocks current.',
          },
          skillIds: ['closed_loop'],
          difficulty: 1,
          faultyCircuit: {
            schemaVersion: 1,
            id: 'm0-scene5-fault',
            name: 'Reversed LED',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
              { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 11, y: 3 }, rotation: 0 },
              { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 16, y: 7 }, rotation: 90 },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
              { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'cathode' } },
              { id: 'w3', from: { componentId: 'd1', terminalId: 'anode' }, to: { componentId: 'v1', terminalId: 'neg' } },
              { id: 'w4', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
          faultQuestion: {
            options: [
              {
                id: 'opt-r',
                text: { ru: 'Сопротивление 330 Ω слишком велико', en: '330 Ω resistance is too high' },
                misconceptionCode: 'RESISTANCE_INCREASES_CURRENT',
              },
              {
                id: 'opt-pol',
                text: { ru: 'Светодиод включён в обратной полярности (катод к плюсу)', en: 'LED is reversed (cathode wired toward positive)' },
              },
              {
                id: 'opt-v',
                text: { ru: 'Батарея 5 V слишком слабая для красного LED', en: '5 V is too low for a red LED' },
                misconceptionCode: 'CURRENT_VS_VOLTAGE',
              },
            ],
            correctOptionId: 'opt-pol',
          },
          requireFixedCircuit: false,
        },
      },
      {
        id: 'm0-s6-build',
        phase: 'apply',
        title: { ru: 'Сцена 6. Самостоятельная сборка', en: 'Scene 6. Wire It Yourself' },
        body: {
          ru: 'Теперь компоненты лежат отдельно. Соедини источник 5 V, выключатель SW1, резистор R1 (330 Ω) и светодиод LED1 в единую замкнутую цепь. Не забудь полярность: анод LED — со стороны плюса, катод — к минусу.',
          en: 'Now the components are unwired. Connect the 5 V source, switch SW1, resistor R1 (330 Ω), and LED1 into a valid closed loop. Watch LED polarity!',
        },
        exercise: {
          id: 'm0-ex-build-own',
          type: 'build_circuit',
          prompt: {
            ru: 'Собери управляемую цепь: при замкнутом SW1 светодиод безопасно горит, а при разомкнутом SW1 — гаснет.',
            en: 'Wire a switched LED circuit: LED lights safely when SW1 is closed and turns off when SW1 is open.',
          },
          hints: [
            { ru: 'Последовательность: V1(+) → SW1 → R1 → LED1(анод A) → LED1(катод K) → V1(−).', en: 'Order: V1(+) → SW1 → R1 → LED1(anode A) → LED1(cathode K) → V1(-).' },
            { ru: 'Кликни по контакту (или выбери контакт клавишей Enter) и протяни провод до следующего контакта. Потом переключи SW1 в замкнутое положение.', en: 'Click one terminal (or press Enter) and click the target terminal to wire. Then close SW1.' },
          ],
          explanation: {
            ru: 'Безупречно! Ты не просто нажал кнопку «Готово» — ты собрал физически корректную цепь, проверил выключатель и зажёг светодиод.',
            en: 'Flawless! You wired a physically valid switched LED circuit verified across both open and closed switch states.',
          },
          skillIds: ['closed_loop'],
          difficulty: 2,
          palette: [],
          initialCircuit: {
            schemaVersion: 1,
            id: 'm0-scene6-build',
            name: 'Build First LED Circuit',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
              { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: true }, position: { x: 10, y: 3 }, rotation: 0 },
              { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 16, y: 3 }, rotation: 0 },
              { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 16, y: 9 }, rotation: 90 },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
            ],
            wires: [
              { id: 'w-gnd', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
          requirements: {
            requireLedLit: true,
            requireNoWarnings: true,
            minCurrentMa: 3,
            maxCurrentMa: 20,
            toggleSwitchId: 'sw1',
          },
        },
      },
      {
        id: 'm0-s7-complete',
        phase: 'explain',
        title: { ru: 'Сцена 7. Итог лаборатории', en: 'Scene 7. Lab Complete' },
        body: {
          ru: 'Поздравляю! Первый узел платы активирован, а в твоём Инженерном блокноте появилась первая запись. Дальше мы разберёмся, что такое напряжение и почему оно существует даже в разомкнутой цепи.',
          en: 'Congratulations! Your first PCB learning node is energized and your first Engineering Notebook note has been recorded. Next up: voltage and potential difference.',
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 2: VOLTAGE
  // =========================================================================
  {
    id: 'm1-voltage',
    version: 1,
    moduleId: 'mod-1',
    order: 2,
    title: { ru: 'Что такое напряжение', en: 'What Is Voltage?' },
    subtitle: {
      ru: 'Разность потенциалов, 0 V опорная точка (GND) и почему напряжение есть без тока.',
      en: 'Potential difference, 0 V GND reference, and why voltage exists without current.',
    },
    objective: {
      ru: 'Различать потенциал узла и напряжение между точками, понимать роль земли GND в схемах.',
      en: 'Distinguish node potential from voltage drop and understand GND reference.',
    },
    estimatedMinutes: 7,
    practiceType: { ru: 'Прогноз + измерения', en: 'Predict + Probe' },
    skillIds: ['voltage'],
    prerequisites: ['m0-first-led'],
    xpReward: 100,
    notebookTakeaway: {
      ru: 'Напряжение U — всегда разность потенциалов между ДВУМЯ точками (измеряется в Вольтах, V). GND — это точка отсчёта 0.00 V в схеме, а не обязательно заземление в розетке.',
      en: 'Voltage V is always a difference between TWO points. GND is the 0.00 V reference node in a circuit, not necessarily AC earth ground.',
    },
    notebookFormula: 'U_AB = φ_A - φ_B [V]',
    mapNode: { x: 255, y: 140 },
    steps: [
      {
        id: 'm1v-s1',
        phase: 'observe',
        title: { ru: 'Разность, а не точка', en: 'Difference Between Two Points' },
        body: {
          ru: 'Высота горы измеряется относительно уровня моря. В электронике электрический «уровень моря» — это узел GND (0.00 V). Напряжение 9 V на батарее означает, что на (+) потенциал на 9 В выше, чем на (−).',
          en: 'Mountain elevation is measured relative to sea level. In electronics, our "sea level" is GND (0.00 V). A 9 V battery means (+) is 9 V higher in potential than (-).',
        },
        demoCircuit: {
          schemaVersion: 1,
          id: 'm1v-demo',
          name: 'Open Battery Voltage',
          viewMode: 'schematic',
          components: [
            { id: 'b1', type: 'battery', label: '9 V', params: { voltage: 9 }, position: { x: 6, y: 6 }, rotation: 0 },
            { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: false }, position: { x: 12, y: 3 }, rotation: 0 },
            { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 1000 }, position: { x: 17, y: 6 }, rotation: 90 },
            { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 6, y: 11 }, rotation: 0 },
          ],
          wires: [
            { id: 'w1', from: { componentId: 'b1', terminalId: 'pos' }, to: { componentId: 'sw1', terminalId: 'a' } },
            { id: 'w2', from: { componentId: 'sw1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
            { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'b1', terminalId: 'neg' } },
            { id: 'w4', from: { componentId: 'b1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
          ],
        },
      },
      {
        id: 'm1v-s2',
        phase: 'predict',
        title: { ru: 'Предскажи потенциал при разомкнутом ключе', en: 'Predict Open-Switch Voltage' },
        body: {
          ru: 'Выключатель SW1 разомкнут. Ток в цепи равен 0 мА. Какое напряжение покажет вольтметр между клеммами (+) и (−) самой батареи 9 V?',
          en: 'Switch SW1 is open, so current is 0 mA. What voltage will a meter read across the 9 V battery terminals (+) and (-)?',
        },
        exercise: {
          id: 'm1v-ex-predict',
          type: 'predict_outcome',
          prompt: {
            ru: 'Выбери верное показание напряжения прямо на выводах батареи, пока ключ разомкнут:',
            en: 'Select the voltage across the battery terminals while the switch is open:',
          },
          hints: [
            { ru: 'Напряжение — это разность потенциалов, создаваемая химической реакцией батареи. Для неё ток не обязателен.', en: 'Voltage is potential difference maintained by the battery even without current flow.' },
          ],
          explanation: {
            ru: 'Точно! На батарее по-прежнему 9.00 V, даже когда ток равен нулю. Отсутствие тока не означает отсутствие напряжения.',
            en: 'Exactly! The battery still maintains 9.00 V with zero current. Zero current does not mean zero voltage.',
          },
          skillIds: ['voltage'],
          difficulty: 1,
          options: [
            { id: 'a', text: { ru: '0.00 V, потому что цепь разомкнута', en: '0.00 V because the circuit is open' }, misconceptionCode: 'CURRENT_VS_VOLTAGE' },
            { id: 'b', text: { ru: '9.00 V между (+) и (−) батареи', en: '9.00 V across battery (+) and (-)' } },
            { id: 'c', text: { ru: '4.50 V — половина напряжения', en: '4.50 V — half voltage' } },
          ],
          correctOptionId: 'b',
        },
      },
      {
        id: 'm1v-s3',
        phase: 'measure',
        title: { ru: 'Проверь мультиметром (и не путай GND)', en: 'Probe with Multimeter' },
        body: {
          ru: 'Подключи красный щуп (+) к верхнему выводу резистора R1 (при замкнутом ключе), а чёрный щуп (−) к GND/нижнему выводу. Сними показание напряжения и введи его.',
          en: 'Probe across resistor R1 in DC Volt mode (red to R1 pin 1, black to R1 pin 2) and enter the voltage reading.',
        },
        exercise: {
          id: 'm1v-ex-measure',
          type: 'measure_multimeter',
          prompt: {
            ru: 'Измерь напряжение на резисторе R1 в режиме DC V и запиши число.',
            en: 'Measure the DC voltage across R1 and enter the value.',
          },
          hints: [
            { ru: 'Переключи мультиметр в режим V⎓, красный щуп на r1:a, чёрный на r1:b.', en: 'Set meter to V⎓, red probe on r1:a, black probe on r1:b.' },
          ],
          explanation: {
            ru: '9.00 V! В простом контуре с одним резистором всё напряжение источника падает на нём.',
            en: '9.00 V! In a single-resistor loop, the full supply voltage drops across the resistor.',
          },
          skillIds: ['voltage'],
          difficulty: 1,
          requiredMode: 'dc_v',
          targetPinPair: { componentId: 'r1', termA: 'a', termB: 'b', polarSensitive: true },
          expectedReading: 9,
          tolerancePercent: 3,
          circuit: {
            schemaVersion: 1,
            id: 'm1v-measure-circ',
            name: 'Measure R1 Voltage',
            viewMode: 'schematic',
            components: [
              { id: 'b1', type: 'battery', label: '9 V', params: { voltage: 9 }, position: { x: 6, y: 6 }, rotation: 0 },
              { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 1000 }, position: { x: 15, y: 6 }, rotation: 90 },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 6, y: 11 }, rotation: 0 },
            ],
            wires: [
              { id: 'w1', from: { componentId: 'b1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
              { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'b1', terminalId: 'neg' } },
              { id: 'w3', from: { componentId: 'b1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
            ],
          },
        },
      },
      {
        id: 'm1v-s4-gnd',
        phase: 'explain',
        title: { ru: 'GND ≠ заземление розетки', en: 'Circuit GND vs Earth Ground' },
        body: {
          ru: 'Важное уточнение: в низковольтной электронике GND (Common Ground) означает «общий возвратный провод и ноль отсчёта», а не защитное заземление электросети 220/230 V.',
          en: 'Important distinction: in low-voltage electronics, GND means the common 0 V return reference, NOT protective AC mains earth ground.',
        },
        exercise: {
          id: 'm1v-ex-gnd',
          type: 'multiple_choice',
          prompt: {
            ru: 'Зачем в схеме с двумя модулями (например, датчик и контроллер) их выводы GND соединяют вместе?',
            en: 'Why must two connected modules (e.g., sensor and controller) share a common GND wire?',
          },
          hints: [
            { ru: 'Напряжение измеряется относительно общей точки отсчёта, а току нужен замкнутый возвратный путь.', en: 'Voltage needs a shared reference and current needs a return loop.' },
          ],
          explanation: {
            ru: 'Верно! Общий GND задаёт единый нулевой уровень потенциала и замыкает контур обратного тока.',
            en: 'Correct! Common GND establishes a shared 0 V reference and closes the return current path.',
          },
          skillIds: ['voltage'],
          difficulty: 1,
          options: [
            { id: 'a', text: { ru: 'Чтобы задать общий уровень 0 V и замкнуть обратный путь тока', en: 'To establish a shared 0 V reference and return current path' } },
            { id: 'b', text: { ru: 'Чтобы лишний ток ушёл в землю и исчез', en: 'So excess current drains into the earth and disappears' }, misconceptionCode: 'MISSING_COMMON_GND' },
            { id: 'c', text: { ru: 'Это необязательно, достаточно соединить только +5 V', en: 'Optional — wiring +5 V alone is enough' }, misconceptionCode: 'MISSING_COMMON_GND' },
          ],
          correctOptionId: 'a',
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 3: CURRENT
  // =========================================================================
  {
    id: 'm1-current',
    version: 1,
    moduleId: 'mod-1',
    order: 3,
    title: { ru: 'Что такое электрический ток', en: 'What Is Electric Current?' },
    subtitle: {
      ru: 'Поток зарядов (Амперы), условное направление и почему ток не «расходуется» по кругу.',
      en: 'Charge flow (Amperes), conventional current direction, and current conservation.',
    },
    objective: {
      ru: 'Отличать ток от напряжения, понимать сохранение тока вдоль одной ветви и условное направление от (+) к (−).',
      en: 'Distinguish current from voltage and verify current conservation along a single branch.',
    },
    estimatedMinutes: 7,
    practiceType: { ru: 'Прогноз + измерение', en: 'Predict + Measurement' },
    skillIds: ['current'],
    prerequisites: ['m0-first-led'],
    xpReward: 100,
    notebookTakeaway: {
      ru: 'Сила тока I (измеряется в Амперах, A; 1 A = 1000 mA) одинакова во всех точках одной неразветвлённой цепи: резистор не «съедает» ток после светодиода, он ограничивает его во всём контуре.',
      en: 'Current I (Amperes, 1 A = 1000 mA) is identical everywhere in a single series loop: a resistor limits current throughout the entire loop, not just downstream.',
    },
    notebookFormula: 'I_before = I_after  |  1 A = 1000 mA',
    mapNode: { x: 255, y: 260 },
    steps: [
      {
        id: 'm1c-s1',
        phase: 'observe',
        title: { ru: 'Условный ток vs электроны', en: 'Conventional Current vs Electron Drift' },
        body: {
          ru: 'В металлах носителями заряда служат электроны (текут от − к + со скоростью доли миллиметра в секунду). Но в схемах исторически принято условное направление тока от (+) к (−). В KIMOVOLT LAB анимация импульсов показывает именно условный ток и не отображает буквальную скорость дрейфа электронов.',
          en: 'In metals, electrons carry negative charge (- to +) drifting fractions of a mm/s, while engineering schematics use conventional current (+ to -). Our flow pulses visualize conventional current direction, not literal electron drift speed.',
        },
        demoCircuit: {
          schemaVersion: 1,
          id: 'm1c-demo',
          name: 'Two Series Elements Current',
          viewMode: 'schematic',
          components: [
            { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
            { id: 'a1', type: 'ammeter', label: 'A1', params: {}, position: { x: 9, y: 3 }, rotation: 0 },
            { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 14, y: 3 }, rotation: 0 },
            { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 16, y: 8 }, rotation: 90 },
            { id: 'a2', type: 'ammeter', label: 'A2', params: {}, position: { x: 9, y: 10 }, rotation: 180 },
            { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
          ],
          wires: [
            { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'a1', terminalId: 'pos' } },
            { id: 'w2', from: { componentId: 'a1', terminalId: 'neg' }, to: { componentId: 'd1', terminalId: 'anode' } },
            { id: 'w3', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'r1', terminalId: 'a' } },
            { id: 'w4', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'a2', terminalId: 'pos' } },
            { id: 'w5', from: { componentId: 'a2', terminalId: 'neg' }, to: { componentId: 'v1', terminalId: 'neg' } },
            { id: 'w6', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
          ],
        },
      },
      {
        id: 'm1c-s2',
        phase: 'predict',
        title: { ru: 'До или после резистора?', en: 'Before or After the Resistor?' },
        body: {
          ru: 'Резистор 330 Ω стоит ПОСЛЕ светодиода (между катодом и минусом). Защитит ли он светодиод? И что покажут амперметры A1 (до LED) и A2 (после резистора)?',
          en: 'Here the 330 Ω resistor sits AFTER the LED. Will it still protect the LED, and how will ammeters A1 and A2 compare?',
        },
        exercise: {
          id: 'm1c-ex-predict',
          type: 'predict_outcome',
          prompt: {
            ru: 'Сравни показания A1 и A2 в одной последовательной цепи:',
            en: 'Compare ammeters A1 and A2 in the single series loop:',
          },
          hints: [
            { ru: 'Заряд не исчезает и не накапливается в проводе — сколько вошло в участок цепи, столько и вышло.', en: 'Charge does not vanish or pile up — current entering equals current leaving.' },
          ],
          explanation: {
            ru: 'Верно! Ток A1 = A2 ≈ 9.08 мА в любой точке контура, поэтому резистор одинаково защищает LED и до, и после него!',
            en: 'Correct! A1 = A2 ≈ 9.08 mA everywhere in the loop, so a series resistor protects the LED whether placed before or after it.',
          },
          skillIds: ['current'],
          difficulty: 2,
          options: [
            { id: 'a', text: { ru: 'A1 больше, чем A2, и светодиод сгорит до резистора', en: 'A1 > A2 and the LED burns before reaching the resistor' } },
            { id: 'b', text: { ru: 'A1 и A2 покажут одинаковый ток (~9.1 mA), резистор защищает всю цепь', en: 'A1 and A2 show the same ~9.1 mA; resistor limits the whole loop' } },
            { id: 'c', text: { ru: 'A2 покажет 0 mA, так как ток расходуется в светодиоде', en: 'A2 reads 0 mA because the LED uses up all current' } },
          ],
          correctOptionId: 'b',
        },
      },
      {
        id: 'm1c-s3',
        phase: 'apply',
        title: { ru: 'Перевод мА и А', en: 'Converting mA and A' },
        body: {
          ru: 'В документации микроконтроллеров токи часто пишут в миллиамперах (mA). 1 A = 1000 mA. Переведи ток 0.025 A в миллиамперы.',
          en: 'Datasheets often specify pin currents in milliamperes (mA). 1 A = 1000 mA. Convert 0.025 A into mA.',
        },
        exercise: {
          id: 'm1c-ex-num',
          type: 'numeric',
          prompt: {
            ru: 'Сколько миллиампер (mA) составляет ток 0.025 A?',
            en: 'How many milliamperes (mA) is 0.025 A?',
          },
          hints: [{ ru: 'Умножь значение в Амперах на 1000.', en: 'Multiply Amperes by 1000.' }],
          explanation: {
            ru: '25 mA! Это типичный максимальный рабочий ток стандартного 5-мм светодиода.',
            en: '25 mA! That is the typical upper safe current for a standard 5 mm indicator LED.',
          },
          skillIds: ['current'],
          difficulty: 1,
          expectedValue: 25,
          unit: 'mA',
          tolerancePercent: 1,
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 4: RESISTANCE & POWER
  // =========================================================================
  {
    id: 'm1-resistance-power',
    version: 1,
    moduleId: 'mod-1',
    order: 4,
    title: { ru: 'Сопротивление, мощность и нагрев', en: 'Resistance, Power & Heat' },
    subtitle: {
      ru: 'Почему резисторы греются и как не превысить 0.25 Вт.',
      en: 'Why resistors heat up and how to stay under the 0.25 W rating.',
    },
    objective: {
      ru: 'Понимать разницу между мощностью (Вт) и энергией (Дж), проверять нагрев резисторов по P = U·I.',
      en: 'Distinguish power (W) from energy (J) and check resistor thermal ratings using P = V·I.',
    },
    estimatedMinutes: 7,
    practiceType: { ru: 'Расчёт + подбор номинала', en: 'Calculation + Tuning' },
    skillIds: ['resistance_power'],
    prerequisites: ['m1-voltage', 'm1-current'],
    xpReward: 110,
    notebookTakeaway: {
      ru: 'Электрическая мощность P = U · I = I² · R (Ватты, W) — это скорость превращения энергии в тепло/свет. Обычные выводные резисторы рассчитаны на 0.25 W.',
      en: 'Power P = V · I = I² · R (Watts) is the rate of energy transfer. Standard axial resistors are rated for 0.25 W.',
    },
    notebookFormula: 'P = U · I = I² · R = U² / R',
    mapNode: { x: 425, y: 200 },
    steps: [
      {
        id: 'm1p-s1',
        phase: 'observe',
        title: { ru: 'Мощность ≠ Энергия', en: 'Power Is Not Energy' },
        body: {
          ru: 'Мощность (Вт, W) показывает, СКОЛЬКО энергии выделяется каждую секунду: 1 Вт = 1 Дж/с. Обычный резистор рассчитан на 0.25 Вт (250 мВт). Посмотри на схему 12 V с резистором 100 Ω: P = 12² / 100 = 1.44 Вт — перегрев почти в 6 раз!',
          en: 'Power (Watts) is energy per second: 1 W = 1 J/s. Standard resistors handle 0.25 W (250 mW). At 12 V across 100 Ω, P = 12² / 100 = 1.44 W — nearly 6x over its rating!',
        },
        demoCircuit: {
          schemaVersion: 1,
          id: 'm1p-demo',
          name: 'Overpower Resistor 12V 100R',
          viewMode: 'schematic',
          components: [
            { id: 'v1', type: 'voltage_source', label: '12 V', params: { voltage: 12 }, position: { x: 5, y: 6 }, rotation: 0 },
            { id: 'r1', type: 'resistor', label: 'R1 (0.25W)', params: { resistance: 100, powerRating: 0.25 }, position: { x: 14, y: 6 }, rotation: 90 },
            { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 5, y: 11 }, rotation: 0 },
          ],
          wires: [
            { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
            { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
            { id: 'w3', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
          ],
        },
      },
      {
        id: 'm1p-s2',
        phase: 'measure',
        title: { ru: 'Рассчитай мощность сам', en: 'Calculate Power Dissipation' },
        body: {
          ru: 'Через резистор течёт ток 20 мА (0.02 A) при падении напряжения 5 V. Какая тепловая мощность выделяется на нём в Ваттах?',
          en: 'A resistor carries 20 mA (0.02 A) with a 5 V drop across it. How much power in Watts does it dissipate?',
        },
        exercise: {
          id: 'm1p-ex-calc',
          type: 'numeric',
          prompt: {
            ru: 'Вычисли мощность P = U · I в Ваттах (W) для U = 5 V и I = 0.02 A:',
            en: 'Compute power P = V · I in Watts (W) for V = 5 V and I = 0.02 A:',
          },
          hints: [{ ru: '5 × 0.02 = ? (это меньше 0.25 W, значит стандартный резистор выдержит).', en: '5 × 0.02 = ? (under 0.25 W, so a quarter-watt resistor is safe).' }],
          explanation: {
            ru: '0.10 W (100 мВт)! Хороший запас относительно номинала 0.25 W.',
            en: '0.10 W (100 mW)! Comfortable thermal margin below 0.25 W.',
          },
          skillIds: ['resistance_power'],
          difficulty: 2,
          expectedValue: 0.1,
          unit: 'W',
          tolerancePercent: 5,
        },
      },
      {
        id: 'm1p-s3',
        phase: 'apply',
        title: { ru: 'Спаси резистор от перегрева', en: 'Cool Down the Resistor' },
        body: {
          ru: 'При 12 V на резисторе R1 нельзя превышать 0.25 W. По формуле R_min = U² / P = 144 / 0.25 = 576 Ω. Установи безопасное сопротивление так, чтобы напряжение на R1 оставалось 12 V, а перегрев исчез (ток стал ниже 20 mA).',
          en: 'At 12 V, staying under 0.25 W requires R >= V² / P = 576 Ω. Increase R1 so power drops safely and current stays below 20 mA.',
        },
        exercise: {
          id: 'm1p-ex-tune',
          type: 'tune_parameter',
          prompt: {
            ru: 'Увеличь сопротивление R1 до безопасного номинала (например, 680 Ω – 1000 Ω), чтобы резистор перестал перегреваться.',
            en: 'Increase R1 to a safe value (e.g., 680 Ω – 1000 Ω) to clear the overpower warning.',
          },
          hints: [{ ru: 'Для 12 V при 680 Ω ток 17.6 mA, мощность 0.21 W — безопасно!', en: 'At 12 V and 680 Ω, current is 17.6 mA and power is 0.21 W — safe!' }],
          explanation: {
            ru: 'Перегрев устранён! Включённый режим "Показать мощность" сразу подтверждает снижение тепловой нагрузки.',
            en: 'Overpower cleared! Power overlay confirms safe thermal dissipation.',
          },
          skillIds: ['resistance_power'],
          difficulty: 2,
          initialCircuit: {
            schemaVersion: 1,
            id: 'm1p-tune',
            name: 'Save 0.25W Resistor',
            viewMode: 'schematic',
            components: [
              { id: 'v1', type: 'voltage_source', label: '12 V', params: { voltage: 12 }, position: { x: 5, y: 6 }, rotation: 0, locked: true },
              { id: 'r1', type: 'resistor', label: 'R1 (0.25W)', params: { resistance: 100, powerRating: 0.25 }, position: { x: 14, y: 6 }, rotation: 90 },
              { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 14, y: 11 }, rotation: 180, locked: true },
              { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 5, y: 12 }, rotation: 0, locked: true },
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
          minVal: 100,
          maxVal: 2200,
          stepVal: 20,
          targetLedId: 'd1',
          minCurrentMa: 3,
          maxCurrentMa: 18,
        },
      },
    ],
  },

  // =========================================================================
  // LESSON 5: COMPONENTS & RESISTOR COLOR CODE
  // =========================================================================
  {
    id: 'm2-components-color-code',
    version: 1,
    moduleId: 'mod-2',
    order: 5,
    title: { ru: 'Компоненты и цветовая маркировка', en: 'Components & Color Codes' },
    subtitle: {
      ru: 'Условные обозначения на схемах и чтение 4-полосных резисторов без подсказок.',
      en: 'Schematic symbols and reading 4-band resistor color codes.',
    },
    objective: {
      ru: 'Уверенно узнавать базовые компоненты по условным знакам и расшифровывать номинал резистора по цветовым полосам.',
      en: 'Recognize schematic symbols and decode 4-band resistor markings.',
    },
    estimatedMinutes: 8,
    practiceType: { ru: 'Распознавание + цветные полосы', en: 'Recognition + Color Bands' },
    skillIds: ['component_reading'],
    prerequisites: ['m0-first-led'],
    xpReward: 115,
    notebookTakeaway: {
      ru: 'На 4-полосном резисторе: 1-я и 2-я полосы — цифры, 3-я — множитель (количество нулей), 4-я — допуск (Золотой = ±5%, Коричневый = ±1%).',
      en: '4-band resistor: bands 1 & 2 are digits, band 3 is multiplier (10^n zeros), band 4 is tolerance (Gold = ±5%, Brown = ±1%).',
    },
    notebookFormula: 'R = (D₁·10 + D₂) × 10^M  [Ω]',
    mapNode: { x: 425, y: 80 },
    steps: [
      {
        id: 'm2-s1-symbol',
        phase: 'observe',
        title: { ru: 'Узнай условное обозначение', en: 'Identify the Schematic Symbol' },
        body: {
          ru: 'Принципиальная схема использует точные инженерные символы вместо фотографий деталей. Выбери правильное название компонента, показанного справа.',
          en: 'Schematics use standardized engineering symbols instead of photos. Identify the component symbol displayed.',
        },
        exercise: {
          id: 'm2-ex-rec1',
          type: 'component_recognition',
          componentPreview: 'potentiometer',
          prompt: {
            ru: 'Какой компонент обозначается резистором с подвижным средним контактом-стрелкой?',
            en: 'Which component has a resistor body with a movable wiper arrow?',
          },
          hints: [{ ru: 'У него три вывода: крайние A и B и подвижный движок W.', en: 'It has three terminals: ends A, B and movable wiper W.' }],
          explanation: {
            ru: 'Это потенциометр (переменный резистор) — основа регуляторов громкости, яркости и датчиков положения.',
            en: 'A potentiometer — used for tuning knobs, dimmers, and analog voltage dividers.',
          },
          skillIds: ['component_reading'],
          difficulty: 1,
          options: [
            { id: 'a', text: { ru: 'Предохранитель', en: 'Fuse' } },
            { id: 'b', text: { ru: 'Потенциометр (переменный резистор)', en: 'Potentiometer' } },
            { id: 'c', text: { ru: 'Светодиод (LED)', en: 'Light Emitting Diode (LED)' } },
          ],
          correctOptionId: 'b',
        },
      },
      {
        id: 'm2-s2-decode',
        phase: 'measure',
        title: { ru: 'Прочитай цветовые полосы', en: 'Decode Resistor Color Bands' },
        body: {
          ru: 'На корпусе резистора видны полосы: Жёлтый (4) — Фиолетовый (7) — Красный (×100, два нуля) — Золотой (±5%). Какое это сопротивление?',
          en: 'This resistor has bands: Yellow (4) — Violet (7) — Red (×100) — Gold (±5%). What is its resistance?',
        },
        exercise: {
          id: 'm2-ex-decode',
          type: 'resistor_color_code',
          mode: 'decode_bands_to_ohms',
          bands: ['yellow', 'violet', 'red', 'gold'],
          targetOhms: 4700,
          prompt: {
            ru: 'Введи номинал резистора (в Омах или кОмах, например 4700 Ω или 4.7 kΩ):',
            en: 'Enter the resistor value (in Ω or kΩ, e.g. 4700 Ω or 4.7 kΩ):',
          },
          hints: [{ ru: '4 и 7 дают число 47, красный множитель добавляет два нуля: 4700 Ω.', en: '4 and 7 make 47; red adds two zeros: 4700 Ω (4.7 kΩ).' }],
          explanation: {
            ru: '4700 Ω = 4.7 kΩ! Это один из самых популярных номиналов в цифровой электронике (подтягивающие резисторы I2C и кнопок).',
            en: '4700 Ω = 4.7 kΩ! One of the most common pull-up values in digital electronics.',
          },
          skillIds: ['component_reading'],
          difficulty: 2,
        },
      },
      {
        id: 'm2-s3-pick',
        phase: 'apply',
        title: { ru: 'Собери цветовую маркировку 330 Ω', en: 'Encode 330 Ω Color Bands' },
        body: {
          ru: 'Наоборот: тебе нужен легендарный токоограничивающий резистор 330 Ω ±5% для светодиода на 5 V. Выбери 4 полосы на виртуальном корпусе.',
          en: 'Now in reverse: dial the 4 color bands for a classic 330 Ω ±5% LED resistor.',
        },
        exercise: {
          id: 'm2-ex-encode',
          type: 'resistor_color_code',
          mode: 'pick_bands_for_ohms',
          targetOhms: 330,
          prompt: {
            ru: 'Выставь цветовые полосы для 330 Ω ±5%:',
            en: 'Set the color bands for 330 Ω ±5%:',
          },
          hints: [
            { ru: 'Цифра 3 — Оранжевый, множитель ×10 (один ноль) — Коричневый, допуск ±5% — Золотой.', en: 'Digit 3 is Orange, ×10 multiplier is Brown, ±5% tolerance is Gold.' },
          ],
          explanation: {
            ru: 'Оранжевый — Оранжевый — Коричневый — Золотой = 33 × 10 = 330 Ω!',
            en: 'Orange — Orange — Brown — Gold = 33 × 10 = 330 Ω!',
          },
          skillIds: ['component_reading'],
          difficulty: 2,
        },
      },
    ],
  },
];
