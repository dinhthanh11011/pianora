import type { Letter } from "./notes";

/** Key signatures: positive = sharps, negative = flats. */
export const KEY_SIGNATURES: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
};

const SHARP_ORDER: Letter[] = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER: Letter[] = ["B", "E", "A", "D", "G", "C", "F"];

/** Letters altered by a major key's signature, e.g. G → ["F"] sharps. */
export function keyAccidentals(key: string): { letters: Letter[]; type: "sharp" | "flat" | "none" } {
  const n = KEY_SIGNATURES[key];
  if (n === undefined) throw new Error(`Unknown key ${key}`);
  if (n === 0) return { letters: [], type: "none" };
  return n > 0 ? { letters: SHARP_ORDER.slice(0, n), type: "sharp" } : { letters: FLAT_ORDER.slice(0, -n), type: "flat" };
}

/** Circle of fifths, clockwise from C. */
export const CIRCLE_OF_FIFTHS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];

/** Relative minor of a major key. */
export function relativeMinor(majorKey: string): string {
  const idx = CIRCLE_OF_FIFTHS.indexOf(majorKey);
  const minors = ["A", "E", "B", "F#", "C#", "G#", "D#", "Bb", "F", "C", "G", "D"];
  return idx >= 0 ? minors[idx] + "m" : "";
}

