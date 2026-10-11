import { pitchClass } from "./notes";

export const SCALE_PATTERNS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
} as const;

export type ScaleType = keyof typeof SCALE_PATTERNS;

/** Ascending scale from a root MIDI note over `octaves` octaves, including the top tonic. */
export function buildScale(root: number, type: ScaleType, octaves = 1): number[] {
  const pattern = SCALE_PATTERNS[type];
  const notes: number[] = [];
  for (let o = 0; o < octaves; o++) for (const step of pattern) notes.push(root + o * 12 + step);
  notes.push(root + octaves * 12);
  return notes;
}

export function isInScale(midi: number, root: number, type: ScaleType): boolean {
  const rel = (pitchClass(midi) - pitchClass(root) + 12) % 12;
  return (SCALE_PATTERNS[type] as readonly number[]).includes(rel);
}

/**
 * Standard one-octave fingerings for major scales (RH ascending, LH ascending).
 * Thumb = 1. Covers keys taught in levels 4–7.
 */
export const MAJOR_SCALE_FINGERING: Record<string, { rh: number[]; lh: number[] }> = {
  C: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
  G: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
  D: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
  A: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
  E: { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
  F: { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
};
