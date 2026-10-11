import type { Score } from "@/lib/music-core";
import { chords, line } from "./build";

export interface PracticePiece {
  score: Score;
  title: { vi: string; en: string };
  /** 0 = beginner. Drives falling-note opacity and default tempo later. */
  level: number;
}

export const cMajorScale: PracticePiece = {
  title: { vi: "Gam Đô trưởng (tay phải)", en: "C major scale (right hand)" },
  level: 0,
  score: {
    id: "c-major-scale-rh",
    bpm: 80,
    timeSignature: [4, 4],
    notes: line("R", [
      ["C4", 1, 1], ["D4", 1, 2], ["E4", 1, 3], ["F4", 1, 1],
      ["G4", 1, 2], ["A4", 1, 3], ["B4", 1, 4], ["C5", 1, 5],
      ["B4", 1, 4], ["A4", 1, 3], ["G4", 1, 2], ["F4", 1, 1],
      ["E4", 1, 3], ["D4", 1, 2], ["C4", 2, 1],
    ]),
  },
};

export const odeToJoy: PracticePiece = {
  title: { vi: "Ode to Joy (Beethoven) — hai tay", en: "Ode to Joy (Beethoven) — hands together" },
  level: 1,
  score: {
    id: "ode-to-joy",
    bpm: 90,
    timeSignature: [4, 4],
    notes: [
      ...line("R", [
        ["E4", 1, 3], ["E4", 1, 3], ["F4", 1, 4], ["G4", 1, 5],
        ["G4", 1, 5], ["F4", 1, 4], ["E4", 1, 3], ["D4", 1, 2],
        ["C4", 1, 1], ["C4", 1, 1], ["D4", 1, 2], ["E4", 1, 3],
        ["E4", 1.5, 3], ["D4", 0.5, 2], ["D4", 2, 2],
        ["E4", 1, 3], ["E4", 1, 3], ["F4", 1, 4], ["G4", 1, 5],
        ["G4", 1, 5], ["F4", 1, 4], ["E4", 1, 3], ["D4", 1, 2],
        ["C4", 1, 1], ["C4", 1, 1], ["D4", 1, 2], ["E4", 1, 3],
        ["D4", 1.5, 2], ["C4", 0.5, 1], ["C4", 2, 1],
      ]),
      ...line("L", [
        ["C3", 4, 5], ["G2", 4, 5], ["C3", 4, 5], ["G2", 4, 5],
        ["C3", 4, 5], ["G2", 4, 5], ["C3", 4, 5], ["G2", 2, 5], ["C3", 2, 5],
      ]),
    ],
  },
};

export const chordProgression: PracticePiece = {
  title: { vi: "Hợp âm I–IV–V–I (Đô trưởng)", en: "Chords I–IV–V–I (C major)" },
  level: 1,
  score: {
    id: "i-iv-v-i-c",
    bpm: 72,
    timeSignature: [4, 4],
    notes: [
      ...chords("R", [
        [["C4", "E4", "G4"], 2, [1, 3, 5]], [["C4", "E4", "G4"], 2, [1, 3, 5]],
        [["C4", "F4", "A4"], 2, [1, 2, 5]], [["C4", "F4", "A4"], 2, [1, 2, 5]],
        [["B3", "D4", "G4"], 2, [1, 2, 5]], [["B3", "D4", "G4"], 2, [1, 2, 5]],
        [["C4", "E4", "G4"], 4, [1, 3, 5]],
      ]),
      ...line("L", [["C3", 4, 5], ["F2", 4, 5], ["G2", 4, 5], ["C3", 4, 5]]),
    ],
  },
};

export const PRACTICE_PIECES: PracticePiece[] = [cMajorScale, odeToJoy, chordProgression];
