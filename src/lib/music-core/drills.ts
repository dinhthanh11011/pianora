/** Pure helpers for lesson drills (note finding, note reading, rhythm tapping). */
import { nameToMidi, pitchClass } from "./notes";
import type { Score } from "./score";

/** "C" matches any C; "C4" matches only middle C. */
export function pitchMatches(midi: number, target: string): boolean {
  return /\d$/.test(target) ? nameToMidi(target) === midi : pitchClass(nameToMidi(`${target}4`)) === pitchClass(midi);
}

/** Every key in [from, to] matching the target. */
export function keysFor(target: string, from: number, to: number): number[] {
  const out: number[] = [];
  for (let m = from; m <= to; m++) if (pitchMatches(m, target)) out.push(m);
  return out;
}

/** `rounds` picks from `pool`, never the same item twice in a row (when the pool allows). */
export function pickRounds<T>(pool: readonly T[], rounds: number, rng: () => number = Math.random): T[] {
  const out: T[] = [];
  for (let i = 0; i < rounds; i++) {
    const choices = pool.length > 1 ? pool.filter((p) => p !== out[i - 1]) : pool;
    out.push(choices[Math.floor(rng() * choices.length)]);
  }
  return out;
}

/** First-try correctness penalised by extra wrong presses, 0–100. */
export function drillScore(correct: number, rounds: number, wrongs: number): number {
  if (!rounds) return 0;
  return Math.round((correct / (rounds + Math.max(0, wrongs - (rounds - correct)))) * 100);
}

/** Rhythm pattern (beats, negative = rest) as a one-pitch score for display and timing. */
export function rhythmScore(pattern: number[], bpm: number, timeSignature: [number, number], midi = 72): Score {
  let t = 0;
  const notes: Score["notes"] = [];
  for (const d of pattern) {
    if (d > 0) notes.push({ midi, start: t, duration: d, hand: "R" });
    t += Math.abs(d);
  }
  return { id: `rhythm-${pattern.join("_")}`, bpm, timeSignature, notes };
}
