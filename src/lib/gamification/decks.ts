import { LESSONS } from "@/content/curriculum";
import type { ChordQuality } from "@/lib/music-core";
import { type Deck } from "./srs";

/** Diatonic triads of C major (root position, around middle C) for the chord deck. */
export const CHORD_DECK: { root: string; quality: ChordQuality }[] = [
  { root: "C4", quality: "maj" }, { root: "F4", quality: "maj" }, { root: "G4", quality: "maj" },
  { root: "A4", quality: "min" }, { root: "D4", quality: "min" }, { root: "E4", quality: "min" },
];
export const chordPrompt = (c: (typeof CHORD_DECK)[number]) => `${c.root}:${c.quality}`;

/** Level whose completion unlocks the chord deck (hands-together level). */
export const CHORD_DECK_LEVEL = 3;

/**
 * Cards the learner has earned so far: every note from note-reading drills of completed lessons,
 * plus the chord deck once a lesson of CHORD_DECK_LEVEL is complete.
 */
export function earnedCards(completed: (id: string) => boolean): { deck: Deck; prompt: string }[] {
  const out = new Map<string, { deck: Deck; prompt: string }>();
  for (const ref of LESSONS) {
    if (!completed(ref.lesson.id)) continue;
    for (const step of ref.lesson.steps) {
      if (step.type === "readNote") for (const n of step.pool) out.set(`note:${n}`, { deck: "note", prompt: n });
    }
    if (ref.level >= CHORD_DECK_LEVEL) for (const c of CHORD_DECK) out.set(`chord:${chordPrompt(c)}`, { deck: "chord", prompt: chordPrompt(c) });
  }
  return [...out.values()];
}
