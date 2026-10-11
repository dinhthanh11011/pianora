/** Note & pitch utilities. MIDI: A0=21, C4 (middle C)=60, C8=108. */

export const PIANO_MIN = 21;
export const PIANO_MAX = 108;
export const MIDDLE_C = 60;

export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export const LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PC: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
/** Solfège used in Vietnamese teaching. */
export const SOLFEGE: Record<Letter, string> = { C: "Đô", D: "Rê", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

export interface SpelledNote {
  letter: Letter;
  /** -2..2 (bb, b, natural, #, x) */
  accidental: number;
  octave: number;
}

export const pitchClass = (midi: number): PitchClass => (((midi % 12) + 12) % 12) as PitchClass;
export const octaveOf = (midi: number): number => Math.floor(midi / 12) - 1;
export const isBlackKey = (midi: number): boolean => [1, 3, 6, 8, 10].includes(pitchClass(midi));
export const isOnPiano = (midi: number): boolean => midi >= PIANO_MIN && midi <= PIANO_MAX;

/** All 88 piano keys as MIDI numbers. */
export const PIANO_KEYS: number[] = Array.from({ length: PIANO_MAX - PIANO_MIN + 1 }, (_, i) => PIANO_MIN + i);

export function midiToName(midi: number, prefer: "sharp" | "flat" = "sharp"): string {
  const names = prefer === "sharp" ? SHARP_NAMES : FLAT_NAMES;
  return `${names[pitchClass(midi)]}${octaveOf(midi)}`;
}

const NAME_RE = /^([A-Ga-g])(##|bb|#|b|x)?(-?\d+)$/;

export function parseNote(name: string): SpelledNote {
  const m = NAME_RE.exec(name.trim());
  if (!m) throw new Error(`Invalid note name: ${name}`);
  const acc = m[2] ?? "";
  const accidental = acc === "#" ? 1 : acc === "##" || acc === "x" ? 2 : acc === "b" ? -1 : acc === "bb" ? -2 : 0;
  return { letter: m[1].toUpperCase() as Letter, accidental, octave: Number(m[3]) };
}

export function spelledToMidi(n: SpelledNote): number {
  return (n.octave + 1) * 12 + LETTER_PC[n.letter] + n.accidental;
}

export function nameToMidi(name: string): number {
  return spelledToMidi(parseNote(name));
}

export function letterPitchClass(letter: Letter): number {
  return LETTER_PC[letter];
}

export function accidentalSymbol(acc: number): string {
  return ["𝄫", "♭", "", "♯", "𝄪"][acc + 2] ?? "";
}

/** Frequency in Hz (A4 = 440). */
export const midiToFrequency = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** Index of a white key among the 52 white keys (A0 = 0), or of the white key left of a black key. */
export function whiteKeyIndex(midi: number): number {
  let count = 0;
  for (let m = PIANO_MIN; m < midi; m++) if (!isBlackKey(m)) count++;
  return isBlackKey(midi) ? count - 1 : count;
}
