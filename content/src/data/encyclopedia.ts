import type { EncyclopediaEntry } from '../schema';

export const ENCYCLOPEDIA_ENTRIES: EncyclopediaEntry[] = [
  {
    id: 'resistor',
    type: 'resistor',
    name: { ru: 'Резистор (Resistor)', en: 'Resistor' },
    designator: 'R',
    category: 'passive',
    summary: {
      ru: 'Пассивный двухполюсник, создающий заданное сопротивление электрическому току.',
      en: 'Passive two-terminal component providing calibrated electrical resistance.',
    },
    howItWorks: {
      ru: 'Ограничивает ток по закону Ома I = U / R и преобразует часть электрической энергии в тепловую мощность P = I² · R.',
      en: 'Limits current via Ohm’s law I = V / R and dissipates power P = I² · R as heat.',
    },
    typicalParams: {
      ru: 'Номиналы: 1 Ω – 10 MΩ (ряды E12/E24); мощность типовых выводных: 0.25 W; допуск: ±5% или ±1%.',
      en: 'Values: 1 Ω – 10 MΩ (E12/E24 series); common axial rating: 0.25 W; tolerance: ±5% or ±1%.',
    },
    commonMistakes: [
      { ru: 'Выбор слишком малого номинала, ведущий к перегреву P > 0.25 W или выгоранию LED.', en: 'Picking too low a value causing P > 0.25 W overheating or LED overcurrent.' },
      { ru: 'Неверное чтение 3-й полосы-множителя (например, 4.7 kΩ вместо 470 Ω).', en: 'Misreading the 3rd multiplier band (e.g., 4.7 kΩ vs 470 Ω).' },
    ],
    linkedLessonIds: ['m1-resistance-power', 'm2-components-color-code', 'm3-resistor-sizing'],
    interactiveDemo: {
      kind: 'circuit',
      sliderComponentId: 'r1',
      sliderParam: 'resistance',
      min: 100,
      max: 2200,
      step: 10,
      circuit: {
        schemaVersion: 1,
        id: 'ref-resistor-demo',
        name: 'Resistor Live Demo',
        viewMode: 'schematic',
        components: [
          { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
          { id: 'r1', type: 'resistor', label: 'R1', params: { resistance: 330 }, position: { x: 10, y: 3 }, rotation: 0 },
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
  {
    id: 'led',
    type: 'led',
    name: { ru: 'Светодиод (LED)', en: 'Light Emitting Diode (LED)' },
    designator: 'D / LED',
    category: 'semiconductors',
    summary: {
      ru: 'Полупроводниковый диод, излучающий свет при протекании прямого тока от анода к катоду.',
      en: 'Semiconductor diode that emits light when forward current flows from anode to cathode.',
    },
    howItWorks: {
      ru: 'Проводит ток только в одном направлении после преодоления порога прямого падения Vf (около 2.0 V для красного, 3.1 V для синего/белого). В симуляторе используется кусочно-линейная модель; у реального LED экспоненциальная ВАХ.',
      en: 'Conducts in one direction above forward voltage Vf (~2.0 V red, ~3.1 V blue/white). Simulator uses a piecewise-linear model; real LEDs have an exponential I-V curve.',
    },
    typicalParams: {
      ru: 'Прямой ток: 5–20 mA (макс. обычно 25–30 mA); прямое напряжение Vf: 1.8–3.3 V; обратное пробивное: ~5 V.',
      en: 'Forward current: 5–20 mA (max ~25–30 mA); forward drop Vf: 1.8–3.3 V; max reverse voltage: ~5 V.',
    },
    polarityNote: {
      ru: 'Анод (+) — длинная ножка; Катод (−) — короткая ножка и плоский срез на ободке корпуса.',
      en: 'Anode (+) is the longer lead; Cathode (-) is the shorter lead and flat housing rim.',
    },
    commonMistakes: [
      { ru: 'Подключение без токоограничивающего резистора (мгновенный перегрев кристалла).', en: 'Wiring directly to a voltage source without a series resistor.' },
      { ru: 'Использование одного общего резистора на несколько параллельных LED разных цветов.', en: 'Sharing one resistor across parallel LEDs of different colors.' },
    ],
    linkedLessonIds: ['m0-first-led', 'm5-leds-polarity'],
    interactiveDemo: {
      kind: 'circuit',
      sliderComponentId: 'v1',
      sliderParam: 'voltage',
      min: 1.5,
      max: 9,
      step: 0.5,
      circuit: {
        schemaVersion: 1,
        id: 'ref-led-demo',
        name: 'LED Forward Threshold Demo',
        viewMode: 'schematic',
        components: [
          { id: 'v1', type: 'voltage_source', label: 'V_src', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
          { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 10, y: 3 }, rotation: 0 },
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
  {
    id: 'potentiometer',
    type: 'potentiometer',
    name: { ru: 'Потенциометр (Potentiometer)', en: 'Potentiometer' },
    designator: 'RV / POT',
    category: 'passive',
    summary: {
      ru: 'Регулируемый делитель напряжения с тремя контактами: два крайних (A, B) и подвижный движок (W).',
      en: 'Three-terminal variable voltage divider with fixed ends (A, B) and movable wiper (W).',
    },
    howItWorks: {
      ru: 'Дорожка с общим сопротивлением R_total делится подвижным контактом на два плеча: α·R и (1−α)·R.',
      en: 'A resistive track R_total is split by the wiper into α·R and (1-α)·R segments.',
    },
    typicalParams: {
      ru: 'Популярные номиналы: 1 kΩ, 10 kΩ, 100 kΩ; линейная (B) или логарифмическая (A) характеристика.',
      en: 'Common values: 1 kΩ, 10 kΩ, 100 kΩ; linear (B) or audio log (A) taper.',
    },
    commonMistakes: [
      { ru: 'Использование только одного крайнего контакта и движка без резистора (в крайнем положении R→0 Ω и возникает КЗ).', en: 'Wiring wiper directly to supply without a series safety resistor when tuned to 0 Ω.' },
    ],
    linkedLessonIds: ['m2-components-color-code', 'm4-series-divider'],
    interactiveDemo: {
      kind: 'circuit',
      sliderComponentId: 'pot1',
      sliderParam: 'wiperPosition',
      min: 0.05,
      max: 0.95,
      step: 0.05,
      circuit: {
        schemaVersion: 1,
        id: 'ref-pot-demo',
        name: 'Potentiometer Divider',
        viewMode: 'schematic',
        components: [
          { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
          { id: 'pot1', type: 'potentiometer', label: 'POT 10k', params: { resistance: 10_000, wiperPosition: 0.5 }, position: { x: 11, y: 6 }, rotation: 0 },
          { id: 'vm', type: 'voltmeter', label: 'V_wiper', params: {}, position: { x: 16, y: 6 }, rotation: 90 },
          { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
        ],
        wires: [
          { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'pot1', terminalId: 'a' } },
          { id: 'w2', from: { componentId: 'pot1', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
          { id: 'w3', from: { componentId: 'pot1', terminalId: 'wiper' }, to: { componentId: 'vm', terminalId: 'pos' } },
          { id: 'w4', from: { componentId: 'vm', terminalId: 'neg' }, to: { componentId: 'v1', terminalId: 'neg' } },
          { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
        ],
      },
    },
  },
  {
    id: 'capacitor',
    type: 'capacitor',
    name: { ru: 'Конденсатор (Capacitor)', en: 'Capacitor' },
    designator: 'C',
    category: 'passive',
    summary: {
      ru: 'Компонент, накапливающий электрический заряд в электрическом поле между обкладками.',
      en: 'Passive component storing electrical energy in an electric field across its plates.',
    },
    howItWorks: {
      ru: 'В DC-цепи при полном заряде ток через идеальный конденсатор прекращается. Скорость заряда и разряда через резистор задаётся постоянной времени τ = R · C (за 1τ напряжение достигает 63.2%).',
      en: 'Once charged to steady state in DC, current stops. Charge/discharge follows τ = R · C (reaching 63.2% at 1τ).',
    },
    typicalParams: {
      ru: 'Керамика: 10 pF – 10 µF (без полярности); Электролитические: 1 µF – 10 000 µF (полярны!).',
      en: 'Ceramic: 10 pF – 10 µF (non-polar); Electrolytic: 1 µF – 10,000 µF (polarized!).',
    },
    polarityNote: {
      ru: 'Электролитические конденсаторы имеют полосу (−) на корпусе. Переполюсовка разрушает оксидный слой.',
      en: 'Electrolytic capacitors mark the negative (-) stripe on the housing. Reverse voltage damages them.',
    },
    commonMistakes: [
      { ru: 'Переполюсовка электролитического конденсатора или превышение рабочего напряжения (WVDC).', en: 'Reversing electrolytic polarity or exceeding rated WVDC voltage.' },
    ],
    linkedLessonIds: ['m10-oscilloscope-pwm'],
    interactiveDemo: {
      kind: 'rc_waveform',
      signal: {
        mode: 'rc_charge',
        amplitudeV: 5,
        frequencyHz: 10,
        resistanceOhms: 1000,
        capacitanceFarads: 100e-6,
      },
    },
  },
  {
    id: 'diode',
    type: 'diode',
    name: { ru: 'Выпрямительный диод (Diode)', en: 'Rectifier Diode' },
    designator: 'D',
    category: 'semiconductors',
    summary: {
      ru: 'Полупроводниковый клапан для тока с низким прямым падением (~0.7 V у кремниевых диодов).',
      en: 'Unidirectional semiconductor check-valve with ~0.7 V silicon forward drop.',
    },
    howItWorks: {
      ru: 'Пропускает ток от анода к катоду и блокирует в обратном направлении. Используется для защиты от переполюсовки, выпрямления и гашения выбросов катушек.',
      en: 'Conducts from anode to cathode and blocks reverse flow. Used for reverse-polarity protection, rectification, and flyback suppression.',
    },
    typicalParams: {
      ru: '1N4148 (сигнальный, 200 mA), 1N4007 (силовой, 1 A), 1N5819 (Шоттки, Vf ≈ 0.35 V).',
      en: '1N4148 (signal, 200 mA), 1N4007 (1 A rectifier), 1N5819 (Schottky, Vf ≈ 0.35 V).',
    },
    polarityNote: {
      ru: 'Кольцо (серая/белая полоса) на корпусе обозначает КАТОД (−).',
      en: 'The silver/white stripe band on the package marks the CATHODE (-).',
    },
    commonMistakes: [
      { ru: 'Забывают про падение 0.7 V при питании от маловольтных батарей.', en: 'Forgetting the 0.7 V forward voltage loss on low-voltage battery rails.' },
    ],
    linkedLessonIds: ['m5-leds-polarity'],
  },
  {
    id: 'voltage_source',
    type: 'voltage_source',
    name: { ru: 'Источник постоянного напряжения (DC Source)', en: 'DC Voltage Source' },
    designator: 'V / VCC',
    category: 'sources',
    summary: {
      ru: 'Регулируемый лабораторный источник, поддерживающий заданное напряжение между клеммами (+) и (−).',
      en: 'Regulated bench supply maintaining a constant DC voltage between (+) and (-).',
    },
    howItWorks: {
      ru: 'Удерживает фиксированную разность потенциалов, отдавая ток в зависимости от подключённого сопротивления нагрузки.',
      en: 'Holds fixed potential difference while delivering whatever current the load demands.',
    },
    typicalParams: {
      ru: 'Стандартные шины электроники: 3.3 V (ESP32/ARM), 5.0 V (USB/Arduino UNO), 9 V, 12 V.',
      en: 'Standard rails: 3.3 V (ESP32/ARM), 5.0 V (USB/Arduino UNO), 9 V, 12 V.',
    },
    polarityNote: {
      ru: 'Красный (+) — высокий потенциал; Чёрный (−) — возврат / GND.',
      en: 'Red (+) is positive potential; Black (-) is negative return / GND.',
    },
    commonMistakes: [
      { ru: 'Замыкание (+) и (−) напрямую без нагрузки (КЗ) или соединение двух разных источников параллельно.', en: 'Shorting (+) directly to (-) or paralleling two different ideal sources.' },
    ],
    linkedLessonIds: ['m0-first-led', 'm1-voltage'],
  },
  {
    id: 'battery',
    type: 'battery',
    name: { ru: 'Батарея (Battery)', en: 'Battery' },
    designator: 'BT',
    category: 'sources',
    summary: {
      ru: 'Автономный химический источник питания постоянного тока (например, элемент 1.5 V, Li-ion 3.7 V или «Крона» 9 V).',
      en: 'Portable electrochemical DC power source (e.g., 1.5 V AA, 3.7 V Li-ion, 9 V PP3).',
    },
    howItWorks: {
      ru: 'Преобразует химическую энергию в разность потенциалов. Реальные батареи имеют внутреннее сопротивление и ограниченный запас энергии (мА·ч).',
      en: 'Converts chemical energy to potential difference. Real batteries also have internal resistance and finite mAh capacity.',
    },
    typicalParams: {
      ru: 'Щелочная AA: 1.5 V; «Крона» 6F22: 9 V; CR2032: 3.0 V.',
      en: 'Alkaline AA: 1.5 V; 9 V PP3: 9 V; CR2032 coin cell: 3.0 V.',
    },
    polarityNote: {
      ru: 'Обратите внимание на знаки (+) и (−). Не разбирайте и не перезаряжайте неперезаряжаемые элементы.',
      en: 'Always verify (+) and (-). Never recharge primary non-rechargeable cells.',
    },
    commonMistakes: [
      { ru: 'Попытка запитать мощные моторы от 9 V «Кроны» (у неё высокое внутреннее сопротивление и малый ток).', en: 'Driving motors from a 9 V PP3 cell whose high internal resistance drops voltage rapidly.' },
    ],
    linkedLessonIds: ['m1-voltage'],
  },
  {
    id: 'switch_spst',
    type: 'switch_spst',
    name: { ru: 'Выключатель (SPST Switch)', en: 'SPST Switch' },
    designator: 'SW',
    category: 'controls',
    summary: {
      ru: 'Механический двухпозиционный коммутатор, замыкающий и размыкающий один проводник (Single Pole Single Throw).',
      en: 'Mechanical toggle switch opening or closing a single electrical path.',
    },
    howItWorks: {
      ru: 'В замкнутом состоянии представляет собой перемычку с близким к нулю сопротивлением; в разомкнутом — воздушный разрыв цепи.',
      en: 'Acts as a near-zero wire when closed and an open circuit air gap when open.',
    },
    typicalParams: {
      ru: 'Ток контактов для макетных плат: обычно 0.1–2 A при низком DC напряжении.',
      en: 'Breadboard switch contacts typically rated for 0.1–2 A low-voltage DC.',
    },
    commonMistakes: [
      { ru: 'Подключение выключателя параллельно нагрузке вместо последовательного: при нажатии происходит КЗ питания!', en: 'Wiring a switch in parallel across the load instead of in series, causing a short when closed!' },
    ],
    linkedLessonIds: ['m0-first-led'],
  },
  {
    id: 'pushbutton',
    type: 'pushbutton',
    name: { ru: 'Тактовая кнопка (Pushbutton)', en: 'Tactile Pushbutton' },
    designator: 'BTN',
    category: 'controls',
    summary: {
      ru: 'Кнопка без фиксации (Normally Open): цепь замкнута только пока кнопка удерживается нажатой.',
      en: 'Momentary normally-open switch conducting only while actively pressed.',
    },
    howItWorks: {
      ru: 'При нажатии металлическая мембрана соединяет пары контактов; в цифровой электронике требует pull-up или pull-down резистора для исключения плавающего входа.',
      en: 'A dome contacts opposite pins when pressed; MCU inputs need pull-up or pull-down resistors to prevent floating pins.',
    },
    typicalParams: {
      ru: '6×6 мм тактовая кнопка: макс. ~50 mA при 12 V DC, механический дребезг контактов 5–20 мс.',
      en: '6×6 mm tact switch: ~50 mA @ 12 V DC, mechanical contact bounce ~5–20 ms.',
    },
    commonMistakes: [
      { ru: 'Забывают подтягивающий резистор к входу микроконтроллера, из-за чего вход ловит случайные помехи.', en: 'Leaving MCU input floating without a pull-up or pull-down resistor.' },
    ],
    linkedLessonIds: ['m9-logic-gates'],
  },
  {
    id: 'fuse',
    type: 'fuse',
    name: { ru: 'Предохранитель (Fuse)', en: 'Fuse' },
    designator: 'F',
    category: 'controls',
    summary: {
      ru: 'Защитный элемент, необратимо размыкающий цепь при превышении допустимого тока.',
      en: 'Overcurrent protection device that melts open when current exceeds its rating.',
    },
    howItWorks: {
      ru: 'Тонкая калиброванная проволочка плавится от джоулева тепла I²·R, защищая провода и приборы от пожара и разрушения.',
      en: 'A calibrated filament heats up via I²·R and melts open before downstream wiring or components catch fire.',
    },
    typicalParams: {
      ru: 'В мультиметрах часто стоят 200 mA / 400 mA (на гнезде mA) и 10 A предохранители.',
      en: 'Multimeters commonly protect mA jacks with 200–400 mA fuses and high-current jacks with 10 A fuses.',
    },
    commonMistakes: [
      { ru: 'Замена перегоревшего предохранителя без устранения самой причины перегрузки.', en: 'Replacing a blown fuse without fixing the underlying short or overload.' },
    ],
    linkedLessonIds: ['m6-diagnostics-beacon'],
  },
  {
    id: 'voltmeter',
    type: 'voltmeter',
    name: { ru: 'Вольтметр / Амперметр', en: 'Voltmeter & Ammeter' },
    designator: 'V / A',
    category: 'instruments',
    summary: {
      ru: 'Измерительные приборы: вольтметр (R ≈ 10 MΩ, параллельно) и амперметр (R ≈ 0.01 Ω, в разрыв цепи).',
      en: 'Measuring instruments: voltmeter (10 MΩ in parallel) and ammeter (0.01 Ω in series).',
    },
    howItWorks: {
      ru: 'Вольтметр измеряет разность потенциалов с минимальной утечкой, а амперметр измеряет падение напряжения на крошечном шунте, пересчитывая его в ток.',
      en: 'A voltmeter samples node voltage difference with minimal draw; an ammeter measures tiny voltage across an internal shunt to read branch current.',
    },
    typicalParams: {
      ru: 'R_voltmeter ≈ 10 MΩ; R_ammeter ≈ 0.01 Ω.',
      en: 'R_voltmeter ≈ 10 MΩ; R_ammeter ≈ 0.01 Ω.',
    },
    commonMistakes: [
      { ru: 'Включение амперметра параллельно источнику питания (создаёт КЗ!).', en: 'Connecting an ammeter in parallel across a power source (creates a short!).' },
    ],
    linkedLessonIds: ['m6-voltmeter', 'm6-ammeter'],
  },
  {
    id: 'logic_gate',
    type: 'logic_gate',
    name: { ru: 'Логический элемент (Logic Gate)', en: 'Logic Gate (AND / OR / NOT / XOR)' },
    designator: 'U / IC',
    category: 'logic',
    summary: {
      ru: 'Базовый строительный блок цифровой электроники, реализующий булеву функцию над уровнями HIGH/LOW.',
      en: 'Fundamental digital building block computing Boolean functions over HIGH/LOW states.',
    },
    howItWorks: {
      ru: 'Комбинирует входные биты по таблице истинности. Например, AND даёт 1 только когда оба входа 1; XOR — когда входы различны.',
      en: 'Combines input logic bits according to a truth table. E.g. AND outputs 1 only if both inputs are 1; XOR outputs 1 when inputs differ.',
    },
    typicalParams: {
      ru: 'Серии микросхем: 74HC08 (4×AND), 74HC04 (6×NOT), 74HC32 (4×OR).',
      en: 'Classic IC series: 74HC08 (Quad AND), 74HC04 (Hex NOT), 74HC32 (Quad OR).',
    },
    commonMistakes: [
      { ru: 'Оставлять неиспользуемые входы микросхем КМОП (CMOS 74HC) неподключёнными в воздухе.', en: 'Leaving unused CMOS logic inputs floating instead of tying them to GND or VCC.' },
    ],
    linkedLessonIds: ['m9-logic-gates'],
    interactiveDemo: {
      kind: 'logic_and',
      circuit: {
        schemaVersion: 1,
        id: 'ref-logic-and-demo',
        name: 'Interactive AND Gate',
        viewMode: 'schematic',
        components: [
          { id: 'inA', type: 'logic_input', label: 'A', params: { logicLevel: true }, position: { x: 4, y: 4 }, rotation: 0 },
          { id: 'inB', type: 'logic_input', label: 'B', params: { logicLevel: false }, position: { x: 4, y: 8 }, rotation: 0 },
          { id: 'g1', type: 'logic_gate', label: 'AND', params: { gateKind: 'AND' }, position: { x: 11, y: 6 }, rotation: 0 },
          { id: 'out1', type: 'logic_output', label: 'Y', params: {}, position: { x: 17, y: 6 }, rotation: 0 },
        ],
        wires: [
          { id: 'w1', from: { componentId: 'inA', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inA' } },
          { id: 'w2', from: { componentId: 'inB', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inB' } },
          { id: 'w3', from: { componentId: 'g1', terminalId: 'out' }, to: { componentId: 'out1', terminalId: 'in' } },
        ],
      },
    },
  },
];
