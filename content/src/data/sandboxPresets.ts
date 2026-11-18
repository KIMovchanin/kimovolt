import type { CircuitDocument } from '@kimovolt/simulation';
import type { LocalizedText } from '../schema';

export interface SandboxPreset {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  circuit: CircuitDocument;
}

export const SANDBOX_PRESETS: SandboxPreset[] = [
  {
    id: 'preset-empty',
    title: { ru: 'Пустое рабочее поле', en: 'Blank Workbench' },
    description: { ru: 'Свободный старт: источник 5 V и GND готовы к сборке.', en: 'Clean start with a 5 V supply and GND ready for wiring.' },
    circuit: {
      schemaVersion: 1,
      id: 'sandbox-blank',
      name: 'Blank Lab',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    },
  },
  {
    id: 'preset-led-switch',
    title: { ru: 'LED + резистор 330 Ω + выключатель', en: 'LED + 330 Ω Resistor + Switch' },
    description: { ru: 'Классическая первая цепь (ток ~9.1 mA при 5 V).', en: 'Classic first loop (~9.1 mA at 5 V).' },
    circuit: {
      schemaVersion: 1,
      id: 'preset-led-switch',
      name: 'LED & Switch',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: true }, position: { x: 10, y: 3 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 15, y: 3 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'LED1', params: { color: 'red' }, position: { x: 17, y: 8 }, rotation: 90 },
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
    id: 'preset-breadboard-led',
    title: { ru: 'Макетная плата: LED и кнопка', en: 'Breadboard: LED & Pushbutton' },
    description: { ru: 'Готовая физическая сборка на реальных шинах макетной платы.', en: 'Ready-to-probe physical breadboard wiring using internal tie strips.' },
    circuit: {
      schemaVersion: 1,
      id: 'preset-bb-led',
      name: 'Breadboard LED',
      viewMode: 'breadboard',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 2, y: 3 }, rotation: 0, breadboardPins: { pos: 'tp_2', neg: 'tn_2' } },
        { id: 'sw1', type: 'switch_spst', label: 'SW1', params: { closed: true }, position: { x: 6, y: 3 }, rotation: 0, breadboardPins: { a: '6a', b: '10a' } },
        { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 10, y: 4 }, rotation: 0, breadboardPins: { a: '10e', b: '16e' } },
        { id: 'd1', type: 'led', label: 'LED1', params: { color: 'green' }, position: { x: 16, y: 4 }, rotation: 0, breadboardPins: { anode: '16b', cathode: '20b' } },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'sw1', terminalId: 'a' }, color: 'red' },
        { id: 'w2', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' }, color: 'black' },
      ],
    },
  },
  {
    id: 'preset-series-two',
    title: { ru: 'Два резистора последовательно', en: 'Two Resistors in Series' },
    description: { ru: 'Проверка закона Кирхгофа: общий ток, сумма падений = 9 V.', en: 'Verify KVL: shared current, voltage drops sum to 9 V.' },
    circuit: {
      schemaVersion: 1,
      id: 'preset-series',
      name: 'Series Resistors',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'battery', label: '9 V', params: { voltage: 9 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (1k)', params: { resistance: 1000 }, position: { x: 10, y: 3 }, rotation: 0 },
        { id: 'r2', type: 'resistor', label: 'R2 (2k)', params: { resistance: 2000 }, position: { x: 16, y: 7 }, rotation: 90 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'r2', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w4', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    },
  },
  {
    id: 'preset-divider',
    title: { ru: 'Делитель напряжения 5 V → 3.33 V', en: 'Voltage Divider 5 V → 3.33 V' },
    description: { ru: 'Согласование 5 V датчика и 3.3 V логики с вольтметром.', en: 'Level divider for 5 V to 3.3 V interfacing with live voltmeter.' },
    circuit: {
      schemaVersion: 1,
      id: 'preset-divider',
      name: 'Voltage Divider',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (1k)', params: { resistance: 1000 }, position: { x: 11, y: 4 }, rotation: 90 },
        { id: 'r2', type: 'resistor', label: 'R2 (2k)', params: { resistance: 2000 }, position: { x: 11, y: 9 }, rotation: 90 },
        { id: 'vm', type: 'voltmeter', label: 'Vout', params: {}, position: { x: 16, y: 9 }, rotation: 90 },
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
    id: 'preset-parallel',
    title: { ru: 'Параллельные ветви с амперметром', en: 'Parallel Branches with Ammeter' },
    description: { ru: 'Сравнение общего тока и тока отдельной ветви (Кирхгоф).', en: 'Compare total source current against branch current via KCL.' },
    circuit: {
      schemaVersion: 1,
      id: 'preset-parallel',
      name: 'Parallel Branches',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '10 V', params: { voltage: 10 }, position: { x: 4, y: 6 }, rotation: 0 },
        { id: 'a1', type: 'ammeter', label: 'I_tot', params: {}, position: { x: 8, y: 2 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (1k)', params: { resistance: 1000 }, position: { x: 13, y: 6 }, rotation: 90 },
        { id: 'r2', type: 'resistor', label: 'R2 (500)', params: { resistance: 500 }, position: { x: 18, y: 6 }, rotation: 90 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 4, y: 11 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'a1', terminalId: 'pos' } },
        { id: 'w2', from: { componentId: 'a1', terminalId: 'neg' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'a1', terminalId: 'neg' }, to: { componentId: 'r2', terminalId: 'a' } },
        { id: 'w4', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w5', from: { componentId: 'r2', terminalId: 'b' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w6', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    },
  },
  {
    id: 'preset-button-led',
    title: { ru: 'Кнопка + светодиод + предохранитель', en: 'Pushbutton + LED + Fuse' },
    description: { ru: 'Безопасный стенд с предохранителем 50 mA и тактовой кнопкой.', en: 'Protected circuit with a 50 mA fuse and tactile pushbutton.' },
    circuit: {
      schemaVersion: 1,
      id: 'preset-btn-led',
      name: 'Button LED Fuse',
      viewMode: 'schematic',
      components: [
        { id: 'v1', type: 'voltage_source', label: '5 V', params: { voltage: 5 }, position: { x: 3, y: 6 }, rotation: 0 },
        { id: 'f1', type: 'fuse', label: 'F1 50mA', params: { ratedCurrent: 0.05 }, position: { x: 8, y: 3 }, rotation: 0 },
        { id: 'btn1', type: 'pushbutton', label: 'BTN1', params: { pressed: true }, position: { x: 13, y: 3 }, rotation: 0 },
        { id: 'r1', type: 'resistor', label: 'R1 (330)', params: { resistance: 330 }, position: { x: 18, y: 3 }, rotation: 0 },
        { id: 'd1', type: 'led', label: 'LED1', params: { color: 'blue' }, position: { x: 18, y: 9 }, rotation: 90 },
        { id: 'gnd', type: 'ground', label: 'GND', params: {}, position: { x: 3, y: 11 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'v1', terminalId: 'pos' }, to: { componentId: 'f1', terminalId: 'a' } },
        { id: 'w2', from: { componentId: 'f1', terminalId: 'b' }, to: { componentId: 'btn1', terminalId: 'a' } },
        { id: 'w3', from: { componentId: 'btn1', terminalId: 'b' }, to: { componentId: 'r1', terminalId: 'a' } },
        { id: 'w4', from: { componentId: 'r1', terminalId: 'b' }, to: { componentId: 'd1', terminalId: 'anode' } },
        { id: 'w5', from: { componentId: 'd1', terminalId: 'cathode' }, to: { componentId: 'v1', terminalId: 'neg' } },
        { id: 'w6', from: { componentId: 'v1', terminalId: 'neg' }, to: { componentId: 'gnd', terminalId: 'gnd' } },
      ],
    },
  },
  {
    id: 'preset-logic-xor',
    title: { ru: 'Цифровой элемент XOR', en: 'Digital Logic XOR Gate' },
    description: { ru: 'Переключай входы A и B, чтобы исследовать таблицу истинности.', en: 'Toggle inputs A and B to explore the XOR truth table.' },
    circuit: {
      schemaVersion: 1,
      id: 'preset-xor',
      name: 'Logic XOR',
      viewMode: 'schematic',
      components: [
        { id: 'inA', type: 'logic_input', label: 'A', params: { logicLevel: true }, position: { x: 4, y: 4 }, rotation: 0 },
        { id: 'inB', type: 'logic_input', label: 'B', params: { logicLevel: false }, position: { x: 4, y: 8 }, rotation: 0 },
        { id: 'g1', type: 'logic_gate', label: 'XOR1', params: { gateKind: 'XOR' }, position: { x: 11, y: 6 }, rotation: 0 },
        { id: 'out1', type: 'logic_output', label: 'OUT', params: {}, position: { x: 17, y: 6 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'inA', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inA' } },
        { id: 'w2', from: { componentId: 'inB', terminalId: 'out' }, to: { componentId: 'g1', terminalId: 'inB' } },
        { id: 'w3', from: { componentId: 'g1', terminalId: 'out' }, to: { componentId: 'out1', terminalId: 'in' } },
      ],
    },
  },
];
