import type {
  AchievementDefinition,
  MisconceptionCode,
  MisconceptionRule,
  ModuleDefinition,
  QuestDefinition,
  SkillNode,
  TrackDefinition,
} from '../schema';

export const TRACKS: TrackDefinition[] = [
  {
    id: 'track-a',
    code: 'A',
    title: { ru: 'Основы электричества', en: 'Electricity Fundamentals' },
    description: {
      ru: 'Цепи, напряжение, ток, сопротивление, закон Ома и законы соединений.',
      en: 'Circuits, voltage, current, resistance, Ohm’s law, and circuit topologies.',
    },
  },
  {
    id: 'track-b',
    code: 'B',
    title: { ru: 'Практическая электроника', en: 'Practical Electronics' },
    description: {
      ru: 'Светодиоды, мультиметр, поиск неисправностей и инженерная диагностика.',
      en: 'LEDs, multimeter probing, fault finding, and circuit diagnostics.',
    },
  },
  {
    id: 'track-c',
    code: 'C',
    title: { ru: 'Цифровая электроника', en: 'Digital Electronics' },
    description: {
      ru: 'Логические элементы, таблицы истинности, ШИМ и анализ осциллографом.',
      en: 'Logic gates, truth tables, PWM signals, and oscilloscope analysis.',
    },
  },
  {
    id: 'track-d',
    code: 'D',
    title: { ru: 'Микроконтроллеры и время (Этап 2)', en: 'MCUs & Time-Domain (Stage 2)' },
    description: {
      ru: 'Следующие модули программы: RC-цепи, транзисторы и периферия Arduino / ESP32.',
      en: 'Upcoming modules: RC transients, transistors, and Arduino / ESP32 peripherals.',
    },
  },
];

export const MODULES: ModuleDefinition[] = [
  {
    id: 'mod-0',
    trackId: 'track-a',
    numberLabel: 'M0',
    title: { ru: 'Добро пожаловать в лабораторию', en: 'Welcome to the Lab' },
    description: {
      ru: 'Замкнутая цепь, безопасность и первый управляемый эксперимент со светодиодом.',
      en: 'Closed loops, safety habits, and your first controlled LED experiment.',
    },
    status: 'active',
  },
  {
    id: 'mod-1',
    trackId: 'track-a',
    numberLabel: 'M1',
    title: { ru: 'Электрические величины', en: 'Electrical Quantities' },
    description: {
      ru: 'Напряжение, сила тока, сопротивление и тепловая мощность.',
      en: 'Voltage, current, resistance, and thermal power.',
    },
    status: 'active',
  },
  {
    id: 'mod-2',
    trackId: 'track-a',
    numberLabel: 'M2',
    title: { ru: 'Электронные компоненты', en: 'Electronic Components' },
    description: {
      ru: 'Узнавание деталей, цветовая маркировка резисторов и стандартные ряды.',
      en: 'Component identification, resistor color bands, and standard series.',
    },
    status: 'active',
  },
  {
    id: 'mod-3',
    trackId: 'track-a',
    numberLabel: 'M3',
    title: { ru: 'Закон Ома на практике', en: 'Ohm’s Law in Practice' },
    description: {
      ru: 'Расчёт тока и подбор токоограничивающих резисторов.',
      en: 'Calculating current and sizing current-limiting resistors.',
    },
    status: 'active',
  },
  {
    id: 'mod-4',
    trackId: 'track-a',
    numberLabel: 'M4',
    title: { ru: 'Соединения и законы Кирхгофа', en: 'Topologies & Kirchhoff’s Laws' },
    description: {
      ru: 'Последовательные и параллельные цепи, делитель напряжения.',
      en: 'Series and parallel circuits, voltage dividers.',
    },
    status: 'active',
  },
  {
    id: 'mod-5',
    trackId: 'track-b',
    numberLabel: 'M5',
    title: { ru: 'Светодиоды и полярность', en: 'LEDs & Polarity' },
    description: {
      ru: 'Падение напряжения, диоды, защита от обратного включения.',
      en: 'Forward voltage drop, diodes, and polarity rules.',
    },
    status: 'active',
  },
  {
    id: 'mod-6',
    trackId: 'track-b',
    numberLabel: 'M6',
    title: { ru: 'Измерительные приборы и диагностика', en: 'Instruments & Diagnostics' },
    description: {
      ru: 'Вольтметр, амперметр и поиск неисправностей в реальных схемах.',
      en: 'Voltmeter, ammeter, and methodical circuit fault diagnostics.',
    },
    status: 'active',
  },
  {
    id: 'mod-9',
    trackId: 'track-c',
    numberLabel: 'M9',
    title: { ru: 'Логические элементы', en: 'Logic Gates' },
    description: {
      ru: 'HIGH/LOW, NOT, AND, OR, XOR, таблицы истинности и инженерная задача.',
      en: 'HIGH/LOW levels, NOT, AND, OR, XOR, truth tables, and specs.',
    },
    status: 'active',
  },
  {
    id: 'mod-10',
    trackId: 'track-c',
    numberLabel: 'M10',
    title: { ru: 'Цифровые сигналы и осциллограф', en: 'Digital Signals & Scope' },
    description: {
      ru: 'Частота, период, Duty Cycle, ШИМ и работа с виртуальным осциллографом.',
      en: 'Frequency, period, duty cycle, PWM, and oscilloscope measurement.',
    },
    status: 'active',
  },
  // Upcoming roadmap modules (clearly marked, never faked as playable)
  {
    id: 'mod-7',
    trackId: 'track-d',
    numberLabel: 'M7',
    title: { ru: 'Конденсаторы и RC-цепи', en: 'Capacitors & RC Timing' },
    description: {
      ru: 'Заряд, разряд, постоянная времени τ = R·C и фильтрация (интерактивная модель τ уже доступна в Справочнике).',
      en: 'Charging, discharging, time constant τ = R·C (live τ curve already available in Reference).',
    },
    status: 'upcoming',
    plannedTopics: [
      { ru: 'Постоянная времени RC', en: 'RC Time Constant' },
      { ru: 'Фильтрация и сглаживание пульсаций', en: 'Ripple Filtering' },
    ],
  },
  {
    id: 'mod-8',
    trackId: 'track-d',
    numberLabel: 'M8',
    title: { ru: 'Транзисторы BJT и MOSFET', en: 'BJT & MOSFET Switches' },
    description: {
      ru: 'Транзистор как ключ, расчёт базового/затворного резистора и управление нагрузкой.',
      en: 'Transistor switching, base/gate resistors, and flyback protection.',
    },
    status: 'upcoming',
    plannedTopics: [
      { ru: 'NPN и N-MOSFET в ключевом режиме', en: 'NPN & N-MOSFET Switching' },
      { ru: 'Диодная защита от индуктивных выбросов', en: 'Inductive Flyback Protection' },
    ],
  },
  {
    id: 'mod-11',
    trackId: 'track-d',
    numberLabel: 'M11–12',
    title: { ru: 'Arduino UNO и ESP32', en: 'Arduino UNO & ESP32 Peripherals' },
    description: {
      ru: 'GPIO, ADC, I2C, SPI и безопасная эмуляция периферии (распиновки уже в разделе Проекты).',
      en: 'GPIO, ADC, I2C, SPI and safe peripheral models (verified pinouts already in Projects).',
    },
    status: 'upcoming',
    plannedTopics: [
      { ru: 'GPIO 5V vs 3.3V логика', en: '5V vs 3.3V GPIO Logic' },
      { ru: 'ADC, PWM и шина I2C', en: 'ADC, PWM & I2C Bus' },
    ],
  },
];

export const SKILLS: SkillNode[] = [
  {
    id: 'closed_loop',
    name: { ru: 'Замкнутая цепь', en: 'Closed Circuit Loop' },
    description: { ru: 'Понимание полного пути тока и роли выключателя.', en: 'Understanding complete current paths and switching.' },
    prerequisites: [],
    lessonIds: ['m0-first-led'],
  },
  {
    id: 'voltage',
    name: { ru: 'Напряжение и потенциал', en: 'Voltage & Potential' },
    description: { ru: 'Разность потенциалов и опорный узел GND.', en: 'Potential difference and the 0 V GND reference.' },
    prerequisites: ['closed_loop'],
    lessonIds: ['m1-voltage'],
  },
  {
    id: 'current',
    name: { ru: 'Электрический ток', en: 'Electric Current' },
    description: { ru: 'Величина тока, условное направление и закон сохранения заряда.', en: 'Current flow, conventional direction, and charge conservation.' },
    prerequisites: ['closed_loop'],
    lessonIds: ['m1-current'],
  },
  {
    id: 'resistance_power',
    name: { ru: 'Сопротивление и мощность', en: 'Resistance & Power' },
    description: { ru: 'Ограничение тока и расчёт тепловой мощности P = U·I.', en: 'Limiting current and calculating power dissipation P = V·I.' },
    prerequisites: ['voltage', 'current'],
    lessonIds: ['m1-resistance-power'],
  },
  {
    id: 'component_reading',
    name: { ru: 'Чтение компонентов и полос', en: 'Component & Color Reading' },
    description: { ru: 'Обозначения деталей и декодирование цветовых полос резисторов.', en: 'Schematic symbols and resistor color band decoding.' },
    prerequisites: ['closed_loop'],
    lessonIds: ['m2-components-color-code'],
  },
  {
    id: 'ohms_law',
    name: { ru: 'Закон Ома', en: 'Ohm’s Law' },
    description: { ru: 'Точный расчёт U, I и R в рабочих цепях.', en: 'Solving V, I, and R across live circuits.' },
    prerequisites: ['voltage', 'current', 'resistance_power'],
    lessonIds: ['m3-ohms-law'],
  },
  {
    id: 'resistor_sizing',
    name: { ru: 'Подбор номиналов E12/E24', en: 'Resistor Sizing (E12/E24)' },
    description: { ru: 'Выбор безопасного стандартного резистора для нагрузки.', en: 'Selecting standard E12/E24 resistors for LEDs and loads.' },
    prerequisites: ['ohms_law', 'component_reading'],
    lessonIds: ['m3-resistor-sizing'],
  },
  {
    id: 'series_divider',
    name: { ru: 'Последовательные цепи и делитель', en: 'Series & Voltage Divider' },
    description: { ru: 'Деление напряжения, эквивалентное сопротивление и общий ток.', en: 'Voltage division, equivalent resistance, and shared current.' },
    prerequisites: ['ohms_law'],
    lessonIds: ['m4-series-divider'],
  },
  {
    id: 'parallel_kirchhoff',
    name: { ru: 'Параллельные цепи и Кирхгоф', en: 'Parallel & Kirchhoff’s Laws' },
    description: { ru: 'Распределение токов по ветвям, КЗ и обрыв.', en: 'Branch current division, shorts, and opens.' },
    prerequisites: ['series_divider'],
    lessonIds: ['m4-parallel-kirchhoff'],
  },
  {
    id: 'led_polarity',
    name: { ru: 'Светодиоды и полярность', en: 'LEDs & Polarity' },
    description: { ru: 'Прямое падение Vf, анод/катод, правило индивидуальных резисторов.', en: 'Forward voltage drop Vf, anode/cathode, per-LED resistors.' },
    prerequisites: ['resistor_sizing'],
    lessonIds: ['m5-leds-polarity'],
  },
  {
    id: 'voltmeter_probing',
    name: { ru: 'Измерение вольтметром', en: 'Voltmeter Probing' },
    description: { ru: 'Параллельное подключение щупов и проверка полярности.', en: 'Parallel probing and reading signed voltage differences.' },
    prerequisites: ['series_divider'],
    lessonIds: ['m6-voltmeter'],
  },
  {
    id: 'ammeter_probing',
    name: { ru: 'Измерение амперметром', en: 'Ammeter Probing' },
    description: { ru: 'Измерение тока в разрыв цепи без короткого замыкания прибора.', en: 'Series current measurement without parallel shorting.' },
    prerequisites: ['voltmeter_probing'],
    lessonIds: ['m6-ammeter'],
  },
  {
    id: 'fault_diagnostics',
    name: { ru: 'Диагностика неисправностей', en: 'Circuit Diagnostics' },
    description: { ru: 'Поиск скрытых обрывов, переполюсовок и перегрузок по приборам.', en: 'Tracing opens, reversed parts, and overloads using instruments.' },
    prerequisites: ['ammeter_probing', 'led_polarity', 'parallel_kirchhoff'],
    lessonIds: ['m6-diagnostics-beacon'],
  },
  {
    id: 'digital_logic',
    name: { ru: 'Цифровая логика', en: 'Digital Logic' },
    description: { ru: 'Вентили NOT, AND, OR, XOR и проектирование по спецификации.', en: 'NOT, AND, OR, XOR gates and logic circuit synthesis.' },
    prerequisites: ['closed_loop'],
    lessonIds: ['m9-logic-gates'],
  },
  {
    id: 'pwm_oscilloscope',
    name: { ru: 'Осциллограф и ШИМ (PWM)', en: 'Oscilloscope & PWM' },
    description: { ru: 'Анализ периода, частоты, амплитуды и скважности сигнала.', en: 'Measuring period, frequency, Vpp, and duty cycle.' },
    prerequisites: ['digital_logic', 'voltmeter_probing'],
    lessonIds: ['m10-oscilloscope-pwm'],
  },
];

export const MISCONCEPTIONS: Record<MisconceptionCode, MisconceptionRule> = {
  CURRENT_VS_VOLTAGE: {
    code: 'CURRENT_VS_VOLTAGE',
    title: { ru: 'Смешение тока и напряжения', en: 'Confusing Current and Voltage' },
    explanation: {
      ru: 'Напряжение (V) — это разность потенциалов между двумя точками, она существует даже при разомкнутом ключе. Ток (A) — это поток зарядов через сечение проводника при замкнутой цепи.',
      en: 'Voltage (V) is the potential difference between two points and exists even in an open circuit. Current (A) is charge flow only present in a closed path.',
    },
    remedialHint: {
      ru: 'Проверь: вольтметр ставят параллельно между двумя точками, а амперметр — в разрыв проводника.',
      en: 'Remember: a voltmeter goes across two points in parallel; an ammeter breaks into the current path in series.',
    },
    recommendedLessonId: 'm1-voltage',
  },
  RESISTANCE_INCREASES_CURRENT: {
    code: 'RESISTANCE_INCREASES_CURRENT',
    title: { ru: 'Ошибочная связь R и I', en: 'Assuming Higher Resistance Increases Current' },
    explanation: {
      ru: 'По закону Ома I = U / R ток обратно пропорционален сопротивлению. Увеличивая сопротивление, мы ограничиваем ток, а не усиливаем его.',
      en: 'By Ohm’s law I = V / R, current is inversely proportional to resistance. Increasing R limits current instead of increasing it.',
    },
    remedialHint: {
      ru: 'Для уменьшения тока через LED выбери резистор БОЛЬШЕГО номинала (например, 470 Ω вместо 100 Ω).',
      en: 'To lower LED current, pick a LARGER resistor value (e.g. 470 Ω instead of 100 Ω).',
    },
    recommendedLessonId: 'm3-ohms-law',
  },
  SERIES_VS_PARALLEL: {
    code: 'SERIES_VS_PARALLEL',
    title: { ru: 'Путаница последовательного и параллельного соединений', en: 'Confusing Series and Parallel Wiring' },
    explanation: {
      ru: 'При последовательном соединении ток один и тот же, а напряжение делится. При параллельном — напряжение на ветвях одинаково, а токи складываются.',
      en: 'In series, current is identical and voltage divides. In parallel, voltage is identical across branches and currents add.',
    },
    remedialHint: {
      ru: 'Проследи путь от (+): если путь один без развилок — это последовательно; если ток ветвится на два независимых пути — параллельно.',
      en: 'Trace from (+): a single unbranched path is series; independent split paths sharing both nodes are parallel.',
    },
    recommendedLessonId: 'm4-series-divider',
  },
  LED_POLARITY_IGNORED: {
    code: 'LED_POLARITY_IGNORED',
    title: { ru: 'Игнорирование полярности светодиода', en: 'Ignoring LED Polarity' },
    explanation: {
      ru: 'Светодиод — это полупроводниковый диод: он проводит ток только от анода (+) к катоду (−). При обратном включении он запирает цепь.',
      en: 'An LED is a semiconductor diode: it conducts only from anode (+) to cathode (-). Reverse wiring blocks current.',
    },
    remedialHint: {
      ru: 'Соедини длинный вывод / сторону со знаком + (анод) ближе к плюсу питания, а плоский срез корпуса / чёрточку (катод) — к минусу/GND.',
      en: 'Connect the anode (+) toward positive supply and the cathode (-) flat edge/bar toward negative/GND.',
    },
    recommendedLessonId: 'm5-leds-polarity',
  },
  MISSING_COMMON_GND: {
    code: 'MISSING_COMMON_GND',
    title: { ru: 'Отсутствие общей земли (GND)', en: 'Missing Common Ground (GND)' },
    explanation: {
      ru: 'Без общей опорной шины (GND) у частей схемы нет общего возвратного пути и единой точки отсчёта 0 V.',
      en: 'Without a common ground return, subcircuits lack a return loop and shared 0 V reference.',
    },
    remedialHint: {
      ru: 'Проверь, замкнут ли обратный провод к отрицательному полюсу источника / узлу GND.',
      en: 'Verify the return wire connects back to the negative terminal / GND node.',
    },
    recommendedLessonId: 'm1-voltage',
  },
  AMMETER_PARALLEL_MISUSE: {
    code: 'AMMETER_PARALLEL_MISUSE',
    title: { ru: 'Параллельное включение амперметра', en: 'Wiring an Ammeter in Parallel' },
    explanation: {
      ru: 'Амперметр имеет очень малое внутреннее сопротивление (около 0.01 Ω). Подключив его параллельно источнику или нагрузке, вы создаёте короткое замыкание через прибор.',
      en: 'An ammeter has near-zero shunt resistance (~0.01 Ω). Wiring it in parallel creates a direct short through the meter.',
    },
    remedialHint: {
      ru: 'Разорви провод в ветви и вставь амперметр последовательно в разрыв.',
      en: 'Break the wire in the branch and insert the ammeter in series with the load.',
    },
    recommendedLessonId: 'm6-ammeter',
  },
  UNPROTECTED_LED: {
    code: 'UNPROTECTED_LED',
    title: { ru: 'Светодиод без токоограничения', en: 'Unprotected LED Without Resistor' },
    explanation: {
      ru: 'Выше порога Vf ток через светодиод растёт лавинообразно. Без резистора источник 5 V создаёт ток в несколько ампер и мгновенно выводит кристалл из строя.',
      en: 'Above Vf, LED current rises steeply. Without a limiting resistor, a 5 V source drives amperes of current and destroys the junction.',
    },
    remedialHint: {
      ru: 'Всегда ставь последовательный резистор (обычно 220–470 Ω для 5 V).',
      en: 'Always place a series resistor (typically 220–470 Ω for a 5 V supply).',
    },
    recommendedLessonId: 'm3-resistor-sizing',
  },
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'FIRST_SPARK',
    code: 'KL-01',
    title: { ru: 'FIRST SPARK', en: 'FIRST SPARK' },
    description: { ru: 'Зажёг первый светодиод в замкнутой цепи с нуля.', en: 'Lit your first LED in a circuit wired from scratch.' },
    xpBonus: 50,
  },
  {
    id: 'OHM_SWEET_OHM',
    code: 'KL-02',
    title: { ru: 'OHM SWEET OHM', en: 'OHM SWEET OHM' },
    description: { ru: 'Уверенно освоил расчёты по закону Ома.', en: 'Demonstrated mastery of Ohm’s law calculations.' },
    xpBonus: 75,
  },
  {
    id: 'NO_SHORTCUTS',
    code: 'KL-03',
    title: { ru: 'NO SHORTCUTS', en: 'NO SHORTCUTS' },
    description: { ru: 'Прошёл сложную диагностику без единой подсказки и ошибки.', en: 'Completed fault diagnostics with zero hints and zero errors.' },
    xpBonus: 100,
  },
  {
    id: 'CIRCUIT_WHISPERER',
    code: 'KL-04',
    title: { ru: 'CIRCUIT WHISPERER', en: 'CIRCUIT WHISPERER' },
    description: { ru: 'Успешно завершил 6 практических уроков на плате.', en: 'Completed 6 practical circuit lessons.' },
    xpBonus: 100,
  },
  {
    id: 'SIGNAL_HUNTER',
    code: 'KL-05',
    title: { ru: 'SIGNAL HUNTER', en: 'SIGNAL HUNTER' },
    description: { ru: 'Расшифровал неизвестный ШИМ-сигнал по осциллографу.', en: 'Decoded an unknown PWM signal using the oscilloscope.' },
    xpBonus: 90,
  },
  {
    id: 'ZERO_GUESSWORK',
    code: 'KL-06',
    title: { ru: 'ZERO GUESSWORK', en: 'ZERO GUESSWORK' },
    description: { ru: 'Завершил 3 урока подряд без единой ошибки.', en: 'Completed 3 lessons with zero mistakes.' },
    xpBonus: 90,
  },
  {
    id: 'THE_DEBUGGER',
    code: 'KL-07',
    title: { ru: 'THE DEBUGGER', en: 'THE DEBUGGER' },
    description: { ru: 'Восстановил питание маяка в диагностическом квесте.', en: 'Repaired the dead beacon in the diagnostics quest.' },
    xpBonus: 110,
  },
  {
    id: 'MASTER_OF_CURRENT',
    code: 'KL-08',
    title: { ru: 'MASTER OF CURRENT', en: 'MASTER OF CURRENT' },
    description: { ru: 'Освоил базовую программу из 12+ уроков электроники.', en: 'Completed the core 12+ lesson electronics curriculum.' },
    xpBonus: 200,
  },
  {
    id: 'COMPONENT_SCHOLAR',
    code: 'KL-X1',
    title: { ru: 'COMPONENT SCHOLAR', en: 'COMPONENT SCHOLAR' },
    description: { ru: 'Скрытый знак: изучил характеристики не менее 8 компонентов в справочнике.', en: 'Hidden badge: explored 8+ component specs in the encyclopedia.' },
    hidden: true,
    xpBonus: 60,
  },
  {
    id: 'ANSWER_42',
    code: 'KL-X2',
    title: { ru: '42 OHMS TO EVERYTHING', en: '42 OHMS TO EVERYTHING' },
    description: { ru: 'Скрытый знак: нашёл ответ на главный вопрос электроники в лаборатории.', en: 'Hidden badge: discovered the 42 Ω resistance secret in the lab.' },
    hidden: true,
    xpBonus: 42,
  },
];

export const QUESTS: QuestDefinition[] = [
  {
    id: 'quest-beacon',
    title: { ru: 'Квест: Погасший маяк', en: 'Quest: Dead Beacon' },
    briefing: {
      ru: 'Сигнальный маяк лаборатории перестал светить. У тебя есть мультиметр и схема — выясни, какие две ошибки мешают ему работать, и верни питание.',
      en: 'The lab signal beacon went dark. Use your multimeter and schematic to diagnose two faults and restore safe operation.',
    },
    lessonId: 'm6-diagnostics-beacon',
  },
  {
    id: 'quest-signal',
    title: { ru: 'Квест: Неизвестный сигнал', en: 'Quest: Unknown Signal' },
    briefing: {
      ru: 'С линии управления поступает импульсный сигнал. Подключи виртуальный осциллограф и расшифруй частоту, период и скважность (Duty Cycle).',
      en: 'A control line is carrying an unknown pulse train. Probe it with the oscilloscope and determine frequency, period, and duty cycle.',
    },
    lessonId: 'm10-oscilloscope-pwm',
  },
];
