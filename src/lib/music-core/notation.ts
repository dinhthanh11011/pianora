/**
 * Score → engraving tokens (measures × staves) for the staff renderer.
 * Right hand goes on the treble staff, left hand on the bass staff.
 */
import type { Score, ScoreNote } from "./score";
import { SHARP_NAMES } from "./notes";

export interface NotationToken {
  rest: boolean;
  midis: number[];
  /** Score note indices (empty for rests and tied continuations). */
  indices: number[];
  /** VexFlow duration code: "w" | "h" | "q" | "8" | "16". */
  duration: string;
  dots: 0 | 1;
  /** Tie this token to the next token on the same staff. */
  tie: boolean;
  start: number;
}

export interface NotationMeasure {
  index: number;
  start: number;
  treble: NotationToken[];
  bass: NotationToken[];
}

const DURATIONS: [number, string, 0 | 1][] = [
  [4, "w", 0], [3, "h", 1], [2, "h", 0], [1.5, "q", 1], [1, "q", 0], [0.75, "8", 1], [0.5, "8", 0], [0.25, "16", 0],
];
const EPS = 1e-6;

/** Greedy split of a beat length into notatable values; remainders below a 16th are dropped. */
export function splitDuration(beats: number): { duration: string; dots: 0 | 1; beats: number }[] {
  const out: { duration: string; dots: 0 | 1; beats: number }[] = [];
  let left = beats;
  for (const [b, duration, dots] of DURATIONS) {
    while (left >= b - EPS) {
      out.push({ duration, dots, beats: b });
      left -= b;
    }
  }
  return out;
}

/** Quarter-note beats per bar, e.g. 3/4 → 3, 6/8 → 3. */
export const barBeats = (ts: [number, number]) => (ts[0] * 4) / ts[1];

/** VexFlow key for a MIDI note (sharps), e.g. 61 → "c#/4". */
export function vexKey(midi: number): string {
  return `${SHARP_NAMES[midi % 12].toLowerCase()}/${Math.floor(midi / 12) - 1}`;
}

function staffTokens(notes: (ScoreNote & { index: number })[], from: number, to: number): NotationToken[] {
  const groups = new Map<number, (ScoreNote & { index: number })[]>();
  for (const n of notes) {
    if (n.start < from - EPS || n.start >= to - EPS) continue;
    const g = groups.get(n.start) ?? [];
    g.push(n);
    groups.set(n.start, g);
  }
  const starts = [...groups.keys()].sort((a, b) => a - b);
  const tokens: NotationToken[] = [];
  const rest = (start: number, len: number) => {
    let t = start;
    for (const p of splitDuration(len)) {
      tokens.push({ rest: true, midis: [], indices: [], duration: p.duration, dots: p.dots, tie: false, start: t });
      t += p.beats;
    }
  };
  if (!starts.length) {
    tokens.push({ rest: true, midis: [], indices: [], duration: "w", dots: 0, tie: false, start: from });
    return tokens;
  }
  let cursor = from;
  starts.forEach((s, i) => {
    if (s > cursor + EPS) rest(cursor, s - cursor);
    const g = groups.get(s)!.sort((a, b) => a.midi - b.midi);
    const next = starts[i + 1] ?? to;
    const len = Math.min(Math.max(...g.map((n) => n.duration)), next - s, to - s);
    const parts = splitDuration(len);
    let t = s;
    parts.forEach((p, k) => {
      tokens.push({
        rest: false,
        midis: g.map((n) => n.midi),
        indices: k === 0 ? g.map((n) => n.index) : [],
        duration: p.duration,
        dots: p.dots,
        tie: k < parts.length - 1,
        start: t,
      });
      t += p.beats;
    });
    cursor = s + len;
  });
  if (to - cursor > EPS) rest(cursor, to - cursor);
  return tokens;
}

export function layoutMeasures(score: Score): NotationMeasure[] {
  const bar = barBeats(score.timeSignature);
  const indexed = score.notes.map((n, index) => ({ ...n, index }));
  // Notes are clamped at their bar line (no cross-bar ties yet), so they never add a bar.
  const end = indexed.reduce(
    (m, n) => Math.max(m, Math.min(n.start + n.duration, (Math.floor(n.start / bar + EPS) + 1) * bar)),
    0,
  );
  const count = Math.max(1, Math.ceil(end / bar - EPS));
  const right = indexed.filter((n) => n.hand === "R");
  const left = indexed.filter((n) => n.hand === "L");
  return Array.from({ length: count }, (_, i) => {
    const from = i * bar;
    return { index: i, start: from, treble: staffTokens(right, from, from + bar), bass: staffTokens(left, from, from + bar) };
  });
}
