/** Intervals measured in semitones. */

export const INTERVALS = {
  P1: 0, m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, TT: 6, P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12,
  m9: 13, M9: 14, P11: 17, M13: 21,
} as const;

export type IntervalName = keyof typeof INTERVALS;

const SIMPLE_NAMES: IntervalName[] = ["P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7"];

/** Vietnamese and English labels for simple intervals. */
export const INTERVAL_LABELS: Record<string, { vi: string; en: string }> = {
  P1: { vi: "Đồng âm", en: "Unison" },
  m2: { vi: "Quãng 2 thứ", en: "Minor 2nd" },
  M2: { vi: "Quãng 2 trưởng", en: "Major 2nd" },
  m3: { vi: "Quãng 3 thứ", en: "Minor 3rd" },
  M3: { vi: "Quãng 3 trưởng", en: "Major 3rd" },
  P4: { vi: "Quãng 4 đúng", en: "Perfect 4th" },
  TT: { vi: "Quãng 4 tăng / 5 giảm", en: "Tritone" },
  P5: { vi: "Quãng 5 đúng", en: "Perfect 5th" },
  m6: { vi: "Quãng 6 thứ", en: "Minor 6th" },
  M6: { vi: "Quãng 6 trưởng", en: "Major 6th" },
  m7: { vi: "Quãng 7 thứ", en: "Minor 7th" },
  M7: { vi: "Quãng 7 trưởng", en: "Major 7th" },
  P8: { vi: "Quãng 8 đúng", en: "Octave" },
};

export const semitonesBetween = (a: number, b: number): number => Math.abs(b - a);

/** Name of the simple interval between two MIDI notes (compound intervals reduced, octave kept as P8). */
export function intervalName(a: number, b: number): IntervalName {
  const d = semitonesBetween(a, b);
  if (d !== 0 && d % 12 === 0) return "P8";
  return SIMPLE_NAMES[d % 12];
}

export const transpose = (midi: number, semitones: number): number => midi + semitones;
