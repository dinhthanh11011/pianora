import { pitchClass } from "./notes";

export const CHORD_PATTERNS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  "7": [0, 4, 7, 10],
  min7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  "6": [0, 4, 7, 9],
  add9: [0, 4, 7, 14],
  "9": [0, 4, 7, 10, 14],
} as const;

export type ChordQuality = keyof typeof CHORD_PATTERNS;

const SYMBOL_SUFFIX: Record<ChordQuality, string> = {
  maj: "", min: "m", dim: "dim", aug: "aug", sus2: "sus2", sus4: "sus4", maj7: "maj7", "7": "7",
  min7: "m7", m7b5: "m7b5", dim7: "dim7", "6": "6", add9: "add9", "9": "9",
};

/** Build a chord. inversion 0 = root position, 1 = first inversion, … */
export function buildChord(root: number, quality: ChordQuality, inversion = 0): number[] {
  const notes: number[] = CHORD_PATTERNS[quality].map((i) => root + i);
  for (let i = 0; i < inversion % notes.length; i++) notes.push(notes.shift()! + 12);
  return notes;
}

export function chordSymbol(rootName: string, quality: ChordQuality): string {
  return rootName + SYMBOL_SUFFIX[quality];
}

/**
 * Identify a chord from played notes (any voicing/inversion/octave).
 * Returns root pitch class + quality, or null.
 */
export function identifyChord(midis: number[]): { root: number; quality: ChordQuality; inversion: number } | null {
  if (midis.length < 3) return null;
  const sorted = [...midis].sort((a, b) => a - b);
  const pcs = [...new Set(sorted.map(pitchClass))];
  const bassPc = pitchClass(sorted[0]);
  for (const root of pcs) {
    const set = new Set(pcs.map((pc) => (pc - root + 12) % 12));
    for (const [q, pattern] of Object.entries(CHORD_PATTERNS) as [ChordQuality, readonly number[]][]) {
      const reduced = pattern.map((i) => i % 12);
      if (reduced.length === set.size && reduced.every((i) => set.has(i))) {
        const bassInterval = (bassPc - root + 12) % 12;
        return { root, quality: q, inversion: reduced.indexOf(bassInterval) };
      }
    }
  }
  return null;
}

/** Diatonic triad qualities in a major key, by scale degree I..vii°. */
export const MAJOR_KEY_TRIADS: ChordQuality[] = ["maj", "min", "min", "maj", "maj", "min", "dim"];
export const ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

/**
 * Smallest-movement voicing of `target` chord relative to `from` (voice leading).
 * Tries every inversion near the previous chord's center and returns the one with minimal total motion.
 */
export function voiceLead(from: number[], targetRoot: number, quality: ChordQuality): number[] {
  const center = from.reduce((a, b) => a + b, 0) / from.length;
  let best: number[] = [];
  let bestCost = Infinity;
  const size = CHORD_PATTERNS[quality].length;
  for (let inv = 0; inv < size; inv++) {
    for (const shift of [-24, -12, 0, 12]) {
      const candidate = buildChord(targetRoot + shift, quality, inv);
      const cCenter = candidate.reduce((a, b) => a + b, 0) / candidate.length;
      const cost = Math.abs(cCenter - center) + candidate.reduce((s, n, i) => s + Math.abs(n - (from[i] ?? n)), 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = candidate;
      }
    }
  }
  return best;
}
