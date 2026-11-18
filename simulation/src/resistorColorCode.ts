export type ResistorBandColor =
  | 'black'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'grey'
  | 'white'
  | 'gold'
  | 'silver';

export interface BandColorSpec {
  id: ResistorBandColor;
  hex: string;
  digit?: number;
  multiplier?: number;
  tolerancePercent?: number;
  labelRu: string;
  labelEn: string;
}

export const BAND_SPECS: Record<ResistorBandColor, BandColorSpec> = {
  black: { id: 'black', hex: '#1A1E22', digit: 0, multiplier: 1, labelRu: 'Чёрный', labelEn: 'Black' },
  brown: { id: 'brown', hex: '#7A4726', digit: 1, multiplier: 10, tolerancePercent: 1, labelRu: 'Коричневый', labelEn: 'Brown' },
  red: { id: 'red', hex: '#C83E3B', digit: 2, multiplier: 100, tolerancePercent: 2, labelRu: 'Красный', labelEn: 'Red' },
  orange: { id: 'orange', hex: '#E67B35', digit: 3, multiplier: 1000, labelRu: 'Оранжевый', labelEn: 'Orange' },
  yellow: { id: 'yellow', hex: '#E7C241', digit: 4, multiplier: 10_000, labelRu: 'Жёлтый', labelEn: 'Yellow' },
  green: { id: 'green', hex: '#3D9A62', digit: 5, multiplier: 100_000, tolerancePercent: 0.5, labelRu: 'Зелёный', labelEn: 'Green' },
  blue: { id: 'blue', hex: '#3B74B8', digit: 6, multiplier: 1_000_000, tolerancePercent: 0.25, labelRu: 'Синий', labelEn: 'Blue' },
  violet: { id: 'violet', hex: '#7D54A3', digit: 7, multiplier: 10_000_000, tolerancePercent: 0.1, labelRu: 'Фиолетовый', labelEn: 'Violet' },
  grey: { id: 'grey', hex: '#7C8790', digit: 8, multiplier: 100_000_000, labelRu: 'Серый', labelEn: 'Grey' },
  white: { id: 'white', hex: '#E8E6DF', digit: 9, multiplier: 1_000_000_000, labelRu: 'Белый', labelEn: 'White' },
  gold: { id: 'gold', hex: '#CFA448', multiplier: 0.1, tolerancePercent: 5, labelRu: 'Золотой', labelEn: 'Gold' },
  silver: { id: 'silver', hex: '#B4BCC2', multiplier: 0.01, tolerancePercent: 10, labelRu: 'Серебряный', labelEn: 'Silver' },
};

const DIGIT_TO_COLOR: ResistorBandColor[] = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'grey',
  'white',
];

const MULTIPLIER_ENTRIES: Array<[number, ResistorBandColor]> = [
  [0.01, 'silver'],
  [0.1, 'gold'],
  [1, 'black'],
  [10, 'brown'],
  [100, 'red'],
  [1_000, 'orange'],
  [10_000, 'yellow'],
  [100_000, 'green'],
  [1_000_000, 'blue'],
  [10_000_000, 'violet'],
];

export const E12_BASES = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2] as const;

export const E24_BASES = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
] as const;

export function generateSeries(bases: readonly number[], minDecade = 1, maxDecade = 1_000_000): number[] {
  const result: number[] = [];
  for (let decade = minDecade; decade <= maxDecade; decade *= 10) {
    for (const base of bases) {
      const val = Math.round(base * decade * 100) / 100;
      result.push(val);
    }
  }
  return result;
}

export const E12_SERIES = generateSeries(E12_BASES, 1, 1_000_000);
export const E24_SERIES = generateSeries(E24_BASES, 1, 1_000_000);

export function nearestStandardValue(targetOhms: number, series: number[] = E12_SERIES, minOnly = false): number {
  if (targetOhms <= 0) return series[0] ?? 1;
  if (minOnly) {
    const candidate = series.find((v) => v >= targetOhms - 1e-9);
    return candidate ?? series[series.length - 1] ?? targetOhms;
  }
  let best = series[0] ?? targetOhms;
  let bestRelDiff = Infinity;
  for (const val of series) {
    const rel = Math.abs(Math.log10(val) - Math.log10(targetOhms));
    if (rel < bestRelDiff) {
      bestRelDiff = rel;
      best = val;
    }
  }
  return best;
}

export function ohmsToColorBands(
  ohms: number,
  bandCount: 4 | 5 = 4,
  tolerance: 1 | 2 | 5 | 10 = 5
): ResistorBandColor[] {
  const tolColor: ResistorBandColor =
    tolerance === 1 ? 'brown' : tolerance === 2 ? 'red' : tolerance === 10 ? 'silver' : 'gold';

  if (!Number.isFinite(ohms) || ohms <= 0) {
    return bandCount === 5 ? ['black', 'black', 'black', 'black', tolColor] : ['black', 'black', 'black', tolColor];
  }

  if (bandCount === 5) {
    const exp = Math.floor(Math.log10(ohms)) - 2;
    const multiplier = Math.pow(10, exp);
    const sig = Math.round(ohms / multiplier);
    const clamped = Math.max(100, Math.min(999, sig));
    const d1 = Math.floor(clamped / 100);
    const d2 = Math.floor((clamped % 100) / 10);
    const d3 = clamped % 10;
    const multEntry =
      MULTIPLIER_ENTRIES.find(([m]) => Math.abs(m - multiplier) / multiplier < 1e-6) ?? [1, 'black'];
    return [
      DIGIT_TO_COLOR[d1] ?? 'brown',
      DIGIT_TO_COLOR[d2] ?? 'black',
      DIGIT_TO_COLOR[d3] ?? 'black',
      multEntry[1],
      tolColor,
    ];
  }

  const exp = Math.floor(Math.log10(ohms)) - 1;
  let multiplier = Math.pow(10, exp);
  let sig = Math.round(ohms / multiplier);
  if (sig >= 100) {
    sig = Math.round(sig / 10);
    multiplier *= 10;
  }
  if (sig < 10) {
    sig *= 10;
    multiplier /= 10;
  }
  const d1 = Math.floor(sig / 10);
  const d2 = sig % 10;
  const multEntry =
    MULTIPLIER_ENTRIES.find(([m]) => Math.abs(m - multiplier) / multiplier < 1e-6) ?? [1, 'black'];

  return [DIGIT_TO_COLOR[d1] ?? 'brown', DIGIT_TO_COLOR[d2] ?? 'black', multEntry[1], tolColor];
}

export function colorBandsToOhms(bands: ResistorBandColor[]): { ohms: number; tolerancePercent: number } | null {
  if (bands.length === 4) {
    const [b1, b2, bm, bt] = bands;
    if (!b1 || !b2 || !bm || !bt) return null;
    const d1 = BAND_SPECS[b1].digit;
    const d2 = BAND_SPECS[b2].digit;
    const mult = BAND_SPECS[bm].multiplier;
    const tol = BAND_SPECS[bt].tolerancePercent ?? 5;
    if (d1 === undefined || d2 === undefined || mult === undefined) return null;
    return { ohms: Math.round((d1 * 10 + d2) * mult * 1000) / 1000, tolerancePercent: tol };
  }
  if (bands.length === 5) {
    const [b1, b2, b3, bm, bt] = bands;
    if (!b1 || !b2 || !b3 || !bm || !bt) return null;
    const d1 = BAND_SPECS[b1].digit;
    const d2 = BAND_SPECS[b2].digit;
    const d3 = BAND_SPECS[b3].digit;
    const mult = BAND_SPECS[bm].multiplier;
    const tol = BAND_SPECS[bt].tolerancePercent ?? 1;
    if (d1 === undefined || d2 === undefined || d3 === undefined || mult === undefined) return null;
    return { ohms: Math.round((d1 * 100 + d2 * 10 + d3) * mult * 1000) / 1000, tolerancePercent: tol };
  }
  return null;
}

export interface FormattedMetric {
  valueText: string;
  unitText: string;
  fullText: string;
}

export function formatMetric(value: number | null | undefined, baseUnit: 'V' | 'A' | 'Ω' | 'W' | 'Hz' | 's'): FormattedMetric {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { valueText: '—', unitText: baseUnit, fullText: `— ${baseUnit}` };
  }
  const abs = Math.abs(value);
  let scaled = value;
  let prefix = '';

  if (abs === 0) {
    return { valueText: '0.00', unitText: baseUnit, fullText: `0.00 ${baseUnit}` };
  }
  if (abs >= 1_000_000) {
    scaled = value / 1_000_000;
    prefix = 'M';
  } else if (abs >= 1_000) {
    scaled = value / 1_000;
    prefix = 'k';
  } else if (abs < 1 && abs >= 0.0005) {
    scaled = value * 1_000;
    prefix = 'm';
  } else if (abs < 0.0005) {
    scaled = value * 1_000_000;
    prefix = 'µ';
  }

  const absScaled = Math.abs(scaled);
  const decimals = absScaled >= 100 ? 0 : absScaled >= 10 ? 1 : 2;
  const valueText = scaled.toFixed(decimals);
  const unitText = `${prefix}${baseUnit}`;
  return {
    valueText,
    unitText,
    fullText: `${valueText} ${unitText}`,
  };
}
