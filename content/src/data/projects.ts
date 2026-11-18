import type { BoardProfile, HardwareProject } from '../schema';

export const BOARD_PROFILES: BoardProfile[] = [
  {
    id: 'arduino_uno',
    name: 'Arduino UNO R3',
    mcu: 'ATmega328P (8-bit AVR, 16 MHz)',
    operatingVoltage: '5.0 V (USB или Vin 7–12 V)',
    logicLevel: '5.0 V TTL/CMOS',
    maxPinCurrent: '20 mA рекомендуемый (40 mA абс. макс. на пин)',
    safetyRules: {
      ru: 'Не подключай напрямую моторы/реле к пинам D0–D13 и не подавай более 5.5 V на входы.',
      en: 'Never drive motors/relays directly from D0–D13; never apply >5.5 V to pins.',
    },
    pins: [
      { pin: '5V / GND', role: 'Power', notes: { ru: 'Стабилизированное питание 5 V (до ~450 mA от USB) и общая земля', en: 'Regulated 5 V rail (~450 mA USB limit) and common GND' } },
      { pin: 'D2, D4, D7, D8, D12, D13', role: 'GPIO', notes: { ru: 'Цифровые входы/выходы; D13 подключён ко встроенному LED L', en: 'Digital I/O; D13 connects to built-in LED L' } },
      { pin: 'D3, D5, D6, D9, D10, D11', role: 'PWM (~)', notes: { ru: 'Аппаратный 8-битный ШИМ (analogWrite 0..255)', en: 'Hardware 8-bit PWM (analogWrite 0..255)' } },
      { pin: 'A0–A5', role: 'ADC (10-bit)', notes: { ru: 'Аналоговые входы 0..5 V (0..1023); A4=SDA, A5=SCL для I2C', en: 'Analog inputs 0..5 V (0..1023); A4=SDA, A5=SCL for I2C' } },
      { pin: 'D10(SS), D11(MOSI), D12(MISO), D13(SCK)', role: 'SPI', notes: { ru: 'Аппаратная шина SPI', en: 'Hardware SPI bus' } },
      { pin: 'D0(RX), D1(TX)', role: 'UART', notes: { ru: 'Совмещены с USB-UART мостом — не занимай при отладке через Serial', en: 'Shared with USB-Serial bridge — avoid blocking during USB uploads' } },
    ],
    blinkCodeSnippet: `// Arduino UNO: безопасный LED на D9 через 330 Ω + плавный PWM
const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  for (int duty = 0; duty <= 255; duty += 5) {
    analogWrite(LED_PIN, duty);
    delay(20);
  }
}`,
  },
  {
    id: 'esp32_c3',
    name: 'ESP32-C3-DevKitM-1',
    mcu: 'ESP32-C3FN4 (32-bit RISC-V, 160 MHz, Wi-Fi / BLE 5)',
    operatingVoltage: '3.3 V (USB 5 V через встроенный LDO)',
    logicLevel: '3.3 V (ПИНЫ НЕ ТОЛЕРАНТНЫ К 5 V!)',
    maxPinCurrent: '20–40 mA (рекомендуется <= 12–20 mA на пин)',
    safetyRules: {
      ru: 'Все GPIO строго 3.3 V! GPIO12–17 заняты внутренней Flash и не выведены; избегай нагрузок на strapping-пины GPIO8/GPIO9 при загрузке.',
      en: 'Strictly 3.3 V GPIO (NOT 5 V tolerant)! GPIO12–17 are internal flash; keep strapping pins GPIO8/GPIO9 clear during boot.',
    },
    pins: [
      { pin: '3V3 / GND', role: 'Power', notes: { ru: 'Выход 3.3 V от бортового стабилизатора и общая земля', en: 'Onboard 3.3 V regulator output and GND' } },
      { pin: 'GPIO0–GPIO5', role: 'ADC1 (12-bit)', notes: { ru: 'Аналоговые входы 12 бит (предпочтительно при включённом Wi-Fi)', en: '12-bit ADC1 inputs (safe to use alongside Wi-Fi)' } },
      { pin: 'GPIO2, 3, 4, 5, 6, 7, 10', role: 'GPIO / PWM / I2C / SPI', notes: { ru: 'Матрица GPIO позволяет назначить LEDC PWM и I2C практически на любой свободный пин', en: 'Flexible GPIO matrix routes LEDC PWM & I2C to free GPIOs' } },
      { pin: 'GPIO8 / GPIO9', role: 'Boot Strapping', notes: { ru: 'На GPIO8 также висит встроенный RGB LED; GPIO9 — кнопка BOOT', en: 'GPIO8 connects onboard RGB LED; GPIO9 is BOOT strapping' } },
      { pin: 'GPIO18 / GPIO19', role: 'Native USB', notes: { ru: 'USB_D- / USB_D+ встроенного USB Serial/JTAG контроллера', en: 'Native USB_D- / USB_D+ Serial/JTAG controller' } },
    ],
    blinkCodeSnippet: `// ESP32-C3: безопасный LED на GPIO4 (3.3V -> 220 Ω -> LED -> GND)
const int LED_PIN = 4;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
}`,
  },
  {
    id: 'esp32_s3',
    name: 'ESP32-S3-DevKitC-1',
    mcu: 'ESP32-S3 (Dual-core Xtensa LX7, 240 MHz, Wi-Fi / BLE 5)',
    operatingVoltage: '3.3 V (USB 5 V через LDO)',
    logicLevel: '3.3 V (ПИНЫ НЕ ТОЛЕРАНТНЫ К 5 V!)',
    maxPinCurrent: '20–40 mA (рекомендуется <= 12–20 mA)',
    safetyRules: {
      ru: 'GPIO26–32 заняты встроенной Flash/PSRAM — не использовать! Встроенного ЦАП (DAC) на S3 нет. Избегай подтяжек на GPIO0, GPIO45, GPIO46.',
      en: 'GPIO26–32 are wired to Flash/PSRAM — do not use! S3 has no internal DAC. Keep strapping GPIO0/45/46 free on boot.',
    },
    pins: [
      { pin: '3V3 / GND', role: 'Power', notes: { ru: 'Логическое питание 3.3 V и общий возврат GND', en: '3.3 V logic rail and common GND' } },
      { pin: 'GPIO1–GPIO10', role: 'ADC1 (12-bit)', notes: { ru: '10 каналов ADC1 (не конфликтуют с Wi-Fi)', en: '10 ADC1 channels (unaffected by Wi-Fi)' } },
      { pin: 'GPIO4, 5, 6, 7, 15, 16, 17, 18', role: 'GPIO / PWM / I2C / SPI', notes: { ru: 'Любые свободные GPIO через гибкую матрицу (8 каналов LEDC PWM + MCPWM)', en: 'General GPIOs via GPIO matrix (8ch LEDC PWM + MCPWM)' } },
      { pin: 'GPIO19 / GPIO20', role: 'USB OTG', notes: { ru: 'Нативные USB_D- / USB_D+', en: 'Native USB OTG D- / D+' } },
      { pin: 'GPIO38 / GPIO48', role: 'Onboard RGB LED', notes: { ru: 'GPIO48 (v1.0) или GPIO38 (v1.1) управляет адресным RGB-светодиодом', en: 'GPIO48 (v1.0) or GPIO38 (v1.1) drives onboard addressable RGB LED' } },
    ],
    blinkCodeSnippet: `// ESP32-S3: ШИМ яркость через ledcAttach на GPIO5 (3.3V, 220 Ω + LED)
const int LED_PIN = 5;

void setup() {
  ledcAttach(LED_PIN, 5000, 8); // 5 kHz, 8-bit resolution
}

void loop() {
  ledcWrite(LED_PIN, 128); // 50% duty cycle
  delay(1000);
}`,
  },
];

export const HARDWARE_PROJECTS: HardwareProject[] = [
  {
    id: 'proj-nightlight',
    title: { ru: '1. Умный ночник с регулятором яркости', en: '1. Dimmer Nightlight on Breadboard' },
    summary: {
      ru: 'Твоё первое физическое устройство: плавная регулировка яркости светодиода потенциометром с защитным ограничивающим резистором.',
      en: 'Your first real breadboard build: smooth LED dimming using a potentiometer plus a safety limiting resistor.',
    },
    difficulty: 1,
    estimatedMinutes: 15,
    requiredSkills: ['closed_loop', 'resistor_sizing', 'series_divider'],
    componentsList: [
      { ru: 'Источник 5 V (USB-питание или Arduino 5V/GND)', en: '5 V supply (USB power rail or Arduino 5V/GND)' },
      { ru: 'Потенциометр 1 kΩ (подключён как реостат с защитным R)', en: '1 kΩ potentiometer (wired with safety limiting resistor)' },
      { ru: 'Резистор 220 Ω (0.25 W) — обязательная защита LED!', en: '220 Ω (0.25 W) safety resistor — mandatory!' },
      { ru: 'Светодиод (красный или янтарный, 5 мм)', en: 'Red or amber 5 mm LED' },
      { ru: 'Макетная плата 400 точек + перемычки', en: '400-point breadboard + jumper wires' },
    ],
    safetyNotes: {
      ru: 'Только низковольтное питание 5 V! Защитный резистор 220 Ω обязателен, чтобы в крайнем положении ручки ток не превысил ~13.6 mA.',
      en: 'Low-voltage 5 V only! Keep the 220 Ω resistor in series so turning the knob to minimum never exceeds ~13.6 mA.',
    },
    assemblySteps: [
      { ru: 'Подключи +5 V к верхней красной шине (+) макетной платы, а GND к синей (−).', en: 'Connect +5 V to top red rail (+) and GND to blue rail (-).' },
      { ru: 'Вставь защитный резистор 220 Ω от шины (+) в колонку 10a.', en: 'Insert 220 Ω resistor from (+) rail into column 10a.' },
      { ru: 'Вставь крайний вывод A потенциометра в 10c, а движок W — в 14c.', en: 'Insert potentiometer end A into 10c and wiper W into 14c.' },
      { ru: 'Вставь длинный вывод (Анод +) светодиода в 14e, а короткий (Катод −) — на шину (−) GND.', en: 'Insert LED long leg (Anode +) into 14e and short leg (Cathode -) to (-) GND rail.' },
    ],
    expectedMeasurements: [
      { ru: 'Макс. яркость (движок к A): ток ~13.6 mA, напряжение на LED ~2.0 V.', en: 'Max brightness: LED current ~13.6 mA, LED voltage ~2.0 V.' },
      { ru: 'Мин. яркость (движок к B): ток ~2.4 mA, тусклое мягкое свечение.', en: 'Min brightness: LED current ~2.4 mA, gentle glow.' },
    ],
    circuit: {
      schemaVersion: 1,
      id: 'proj-nightlight-circ',
      name: 'Dimmer Nightlight',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R_safe 220', params: { resistance: 220 }, position: { x: 9, y: 3 }, rotation: 0 },
        { id: 'pot1', type: 'potentiometer', label: 'POT 1k', params: { resistance: 1000, wiperPosition: 0.3 }, position: { x: 14, y: 3 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'LED1', params: { color: 'amber' }, position: { x: 17, y: 8 }, rotation: 90 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'pot1', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'pot1', terminalId: 'wiper' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w5', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    },
  },
  {
    id: 'proj-traffic-light',
    title: { ru: '2. Мини-светофор с независимыми каналами', en: '2. Dual-Mode LED Traffic Beacon' },
    summary: {
      ru: 'Трёхцветный светофор (Красный / Янтарный / Зелёный), где каждый светодиод имеет точно рассчитанный индивидуальный резистор.',
      en: 'Three-color signal indicator where every LED channel gets its own tuned limiting resistor.',
    },
    difficulty: 2,
    estimatedMinutes: 20,
    requiredSkills: ['parallel_kirchhoff', 'led_polarity', 'resistor_sizing'],
    boardHint: 'arduino_uno',
    componentsList: [
      { ru: 'Источник 5 V (или пины D9, D10, D11 Arduino UNO)', en: '5 V supply (or Arduino UNO pins D9, D10, D11)' },
      { ru: '3 резистора 330 Ω (0.25 W)', en: '3× 330 Ω resistors (0.25 W)' },
      { ru: '3 светодиода: Red, Amber, Green', en: '3× LEDs: Red, Amber, Green' },
      { ru: '2 тактовых кнопки / выключателя для ручного переключения', en: '2× switches for manual phase control' },
    ],
    safetyNotes: {
      ru: 'Не подключай все три LED к одному общему резистору: они будут светить неравномерно, а сумма токов через одну деталь увеличит нагрев.',
      en: 'Never tie all 3 LEDs to one shared resistor: brightness shifts unequally and heat doubles.',
    },
    assemblySteps: [
      { ru: 'Подготовь шину земли GND и соедини с ней катоды всех трёх светодиодов.', en: 'Establish common GND rail and wire all three LED cathodes to it.' },
      { ru: 'Через индивидуальные резисторы 330 Ω запитай аноды от выключателей / GPIO-пинов.', en: 'Feed each anode through its own 330 Ω resistor from switches / GPIO pins.' },
      { ru: 'Проверь вольтметром падение на каждом резисторе (~3.0 V) и на каждом LED (~2.0 V).', en: 'Measure ~3.0 V across each resistor and ~2.0 V across each LED.' },
    ],
    expectedMeasurements: [
      { ru: 'Ток одной ветви ≈ 9.1 mA; при двух включённых ветвях от источника идёт ~18.2 mA.', en: 'Each branch carries ~9.1 mA; with two active branches total supply draw is ~18.2 mA.' },
    ],
    circuit: {
      schemaVersion: 1,
      id: 'proj-traffic-circ',
      name: 'Three Channel Traffic Signal',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 3, y: 6 }, rotation: 0 },
        { id: 'sw_r', type: 'switch_spst', label: 'RED SW', params: { closed: true }, position: { x: 8, y: 2 }, rotation: 0 },
        { id: 'sw_g', type: 'switch_spst', label: 'GRN SW', params: { closed: false }, position: { x: 8, y: 8 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 13, y: 2 }, rotation: 0 },
        { id: 'r2', type: 'resistor', label: 'R2 (330)', params: { resistance: 330 }, position: { x: 13, y: 8 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'RED', params: { color: 'red' }, position: { x: 18, y: 2 }, rotation: 0 },
        { id: 'd2', type: 'led', label: 'GREEN', params: { color: 'green' }, position: { x: 18, y: 8 }, rotation: 0 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 3, y: 11 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw_r', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw_g', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'sw_r', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w4', from: { componentId: 'sw_g', terminalId: 'b' }, to: { componentId: 'r2', terminalId: 'a' } },
        { id: 'w5', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w6', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'd2', terminalId: 'anode' } },
        { id: 'w7', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w8', from: { componentId: 'd2', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w9', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    },
  },
  {
    id: 'proj-level-shifter',
    title: { ru: '3. Делитель 5V → 3.3V для входа ESP32', en: '3. 5V-to-3.3V Sensor Divider for ESP32' },
    summary: {
      ru: 'Незаменимая схема для подключения 5-вольтового датчика к 3.3-вольтовому входу ESP32-C3 или ESP32-S3 без риска сжечь GPIO.',
      en: 'Essential interface dropping a 5 V sensor output down to a safe ~3.3 V level for ESP32-C3/S3 GPIO inputs.',
    },
    difficulty: 2,
    estimatedMinutes: 15,
    requiredSkills: ['series_divider', 'voltmeter_probing'],
    boardHint: 'esp32_c3',
    componentsList: [
      { ru: 'Источник сигнала 5 V', en: '5 V signal source' },
      { ru: 'Резистор R1 = 1 kΩ (верхнее плечо)', en: 'R1 = 1 kΩ (top leg)' },
      { ru: 'Резистор R2 = 2 kΩ (или 2.2 kΩ — нижнее плечо к GND)', en: 'R2 = 2 kΩ (or 2.2 kΩ — bottom leg to GND)' },
      { ru: 'Плата ESP32-C3 / ESP32-S3 (или мультиметр для проверки)', en: 'ESP32-C3 / ESP32-S3 (or multimeter to verify output)' },
    ],
    safetyNotes: {
      ru: 'ОБЯЗАТЕЛЬНО измерь напряжение в средней точке мультиметром до подключения вывода к пину ESP32! Напряжение на GPIO ESP32 никогда не должно превышать 3.3–3.6 V.',
      en: 'ALWAYS verify the midpoint voltage with a multimeter BEFORE connecting to an ESP32 pin! ESP32 pins are NOT 5 V tolerant.',
    },
    assemblySteps: [
      { ru: 'Соедини GND 5-вольтового датчика и GND платы ESP32 вместе.', en: 'Tie the 5 V sensor GND and ESP32 GND together.' },
      { ru: 'Подключи выход датчика к R1 (1 kΩ), другой вывод R1 соедини с R2 (2 kΩ) на макетной плате.', en: 'Wire sensor signal to R1 (1 kΩ), tie the midpoint to R2 (2 kΩ).' },
      { ru: 'Второй вывод R2 подключи к общей шине GND.', en: 'Wire the bottom of R2 to common GND.' },
      { ru: 'Измерь среднюю точку: должно быть 3.33 V. Только после проверки подключай её к GPIO ESP32.', en: 'Probe midpoint: expect 3.33 V. Only then connect to ESP32 GPIO.' },
    ],
    expectedMeasurements: [
      { ru: 'На выходе делителя при 1 kΩ + 2 kΩ: 3.33 V; ток через делитель ~1.67 mA.', en: 'Divider midpoint with 1 kΩ + 2 kΩ: 3.33 V; quiescent current ~1.67 mA.' },
    ],
    circuit: {
      schemaVersion: 1,
      id: 'proj-level-div',
      name: '5V to 3.3V Level Divider',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5V SIG', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (1k)', params: { resistance: 1000 }, position: { x: 12, y: 4 }, rotation: 90 },
        { id: 'r2', type: 'resistor', label: 'R2 (2k)', params: { resistance: 2000 }, position: { x: 12, y: 9 }, rotation: 90 },
        { id: 'vm', type: 'voltmeter', label: 'TO ESP32', params: {}, position: { x: 17, y: 9 }, rotation: 90 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 12 }, rotation: 0 },
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
    id: 'proj-interlock',
    title: { ru: '4. Двухкнопочный замок безопасности', en: '4. Two-Hand Safety Interlock' },
    summary: {
      ru: 'Промышленный принцип защиты оператора: индикатор готовности запускается только при нажатии обеих кнопок одновременно.',
      en: 'Industrial two-hand safety interlock activating an indicator only when both buttons are held.',
    },
    difficulty: 2,
    estimatedMinutes: 15,
    requiredSkills: ['closed_loop', 'digital_logic'],
    componentsList: [
      { ru: 'Источник 5 V и макетная плата', en: '5 V supply and breadboard' },
      { ru: '2 тактовые кнопки BTN1, BTN2', en: '2× tactile pushbuttons' },
      { ru: 'Резистор 330 Ω и зелёный светодиод', en: '330 Ω resistor and green LED' },
    ],
    safetyNotes: {
      ru: 'Убедись, что корпус 4-выводных кнопок вставлен так, чтобы ножки, замыкаемые внутри постоянно, не обошли кнопку по макетной шине.',
      en: 'Orient 4-pin tactile switches across the center breadboard trench so internal shorted pin pairs do not bypass the switch.',
    },
    assemblySteps: [
      { ru: 'Расположи обе кнопки над центральным жёлобом макетной платы.', en: 'Straddle both 4-pin buttons across the breadboard center trench.' },
      { ru: 'Соедини +5 V → BTN1 → BTN2 → 330 Ω → Анод LED → GND.', en: 'Wire +5 V → BTN1 → BTN2 → 330 Ω → LED Anode → GND.' },
    ],
    expectedMeasurements: [
      { ru: 'При нажатии одной кнопки: 0 mA. При обеих нажатых: ~8.8 mA.', en: 'Single press: 0 mA. Both held: ~8.8 mA.' },
    ],
    circuit: {
      schemaVersion: 1,
      id: 'proj-interlock-circ',
      name: 'Two-Button Interlock',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 3, y: 6 }, rotation: 0 },
        { id: 'b1', type: 'pushbutton', label: 'BTN1', params: { pressed: true }, position: { x: 8, y: 3 }, rotation: 0 },
        { id: 'b2', type: 'pushbutton', label: 'BTN2', params: { pressed: true }, position: { x: 13, y: 3 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 18, y: 3 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'READY', params: { color: 'green' }, position: { x: 18, y: 9 }, rotation: 90 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 3, y: 11 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'b1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'b1', terminalId: 'b' }, to: { componentId: 'b2', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'b2', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w4', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w5', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w6', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    },
  },
  {
    id: 'proj-polarity-guard',
    title: { ru: '5. Защита устройства от переполюсовки батареи', en: '5. Reverse-Polarity Protected Indicator' },
    summary: {
      ru: 'Схема, в которой диод 1N4007 защищает полезную нагрузку от случайной ошибки подключения батареи 9 V наоборот.',
      en: 'Series protection diode safeguarding downstream loads against reversed 9 V battery terminals.',
    },
    difficulty: 2,
    estimatedMinutes: 15,
    requiredSkills: ['led_polarity', 'ohms_law'],
    componentsList: [
      { ru: 'Батарея 9 V, диод 1N4007 (Vf ≈ 0.7 V)', en: '9 V battery, 1N4007 diode (Vf ≈ 0.7 V)' },
      { ru: 'Резистор 680 Ω и красный LED', en: '680 Ω resistor and red LED' },
    ],
    safetyNotes: {
      ru: 'После защитного диода напряжение падает примерно на 0.7 V — всегда учитывай это в расчёте резистора.',
      en: 'Remember the ~0.7 V forward drop across the protection diode when sizing resistors.',
    },
    assemblySteps: [
      { ru: 'Поставь диод 1N4007 анодом к (+) батареи, а катодом (полоска на корпусе) к схеме.', en: 'Place 1N4007 anode to (+), striped cathode toward circuit.' },
      { ru: 'Далее собери 680 Ω и LED к GND.', en: 'Follow with 680 Ω and LED to GND.' },
    ],
    expectedMeasurements: [
      { ru: 'При прямой полярности: V_diode ≈ 0.7 V, V_led ≈ 2.0 V, ток ≈ 9.2 mA.', en: 'Normal polarity: V_diode ≈ 0.7 V, V_led ≈ 2.0 V, current ≈ 9.2 mA.' },
    ],
    circuit: {
      schemaVersion: 1,
      id: 'proj-polarity-circ',
      name: 'Diode Polarity Guard',
      viewMode: 'schematic',
      components: [
        { id: 'b1', type: 'battery', label: '9 V', params: { voltage: 9 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'd_prot', type: 'diode', label: '1N4007', params: { forwardVoltage: 0.7 }, position: { x: 9, y: 3 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (680)', params: { resistance: 680 }, position: { x: 14, y: 3 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'PWR', params: { color: 'red' }, position: { x: 18, y: 8 }, rotation: 90 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'b1', terminalId: 'pos' }, to: { componentId: 'd_prot', terminalId: 'anode' } },
        { id: 'w2', from: { componentId: 'd_prot', terminalId: 'cathode' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w4', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'b1', terminalId: 'neg' } },
        { id: 'w5', from: { componentId: 'b1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    },
  },
  {
    id: 'proj-esp32-pwm',
    title: { ru: '6. Плавный маяк PWM на ESP32-S3', en: '6. Smooth PWM Beacon on ESP32-S3' },
    summary: {
      ru: 'Подключение внешнего светодиода к 3.3 V GPIO ESP32-S3 с расчётным резистором 150–220 Ω и проверкой скважности на осциллографе.',
      en: 'Wiring an external LED to ESP32-S3 3.3 V GPIO with a 150–220 Ω resistor and verifying PWM duty cycle.',
    },
    difficulty: 3,
    estimatedMinutes: 25,
    requiredSkills: ['pwm_oscilloscope', 'resistor_sizing', 'ohms_law'],
    boardHint: 'esp32_s3',
    componentsList: [
      { ru: 'Плата ESP32-S3-DevKitC-1 (логика 3.3 V)', en: 'ESP32-S3-DevKitC-1 board (3.3 V logic)' },
      { ru: 'Резистор 220 Ω (для 3.3 V красный LED ~5.9 mA)', en: '220 Ω resistor (3.3 V red LED ~5.9 mA)' },
      { ru: 'Красный или зелёный LED + перемычки', en: 'Red or green LED + jumpers' },
    ],
    safetyNotes: {
      ru: 'Используй GPIO5 (безопасный свободный пин) и никогда не превышай ток 12–20 mA на один выход ESP32-S3. Избегай пинов Flash/PSRAM (GPIO26–32).',
      en: 'Use GPIO5 and stay under 12–20 mA per ESP32-S3 pin. Never wire external circuits to internal Flash/PSRAM GPIO26–32.',
    },
    assemblySteps: [
      { ru: 'Соедини GPIO5 через резистор 220 Ω с анодом светодиода.', en: 'Wire GPIO5 through 220 Ω to LED anode.' },
      { ru: 'Подключи катод светодиода к GND платы ESP32-S3.', en: 'Connect LED cathode to ESP32-S3 GND.' },
      { ru: 'Загрузи пример с ledcAttach(5, 5000, 8) из профиля платы ниже.', en: 'Flash the ledcAttach(5, 5000, 8) snippet from the board profile.' },
    ],
    expectedMeasurements: [
      { ru: 'При 100% заполнении: ток ≈ 5.9 mA; при 50% ШИМ средняя яркость вдвое ниже.', en: 'At 100% duty: current ≈ 5.9 mA; at 50% duty average brightness halves.' },
    ],
    circuit: {
      schemaVersion: 1,
      id: 'proj-esp32-circ',
      name: 'ESP32 3.3V GPIO LED',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: 'GPIO 3.3V', params: { voltage: 3.3 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (220)', params: { resistance: 220 }, position: { x: 10, y: 3 }, rotation: 0 },
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
];
