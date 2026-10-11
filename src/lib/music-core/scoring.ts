/**
 * Scoring engine. Times are ms on the score timeline (0 = first beat).
 * Callers convert raw input timestamps with `toScoreTime` (subtracts start + latency).
 */
import type { ChordEvent, TimedNote } from "./score";

export const TIMING_WINDOWS = { perfect: 50, good: 120, ok: 250 } as const;

export type Grade = "perfect" | "good" | "early" | "late";
export type Judgement =
  | { kind: "hit"; note: TimedNote; grade: Grade; offsetMs: number; velocity: number }
  | { kind: "miss"; note: TimedNote }
  | { kind: "wrong"; midi: number; timeMs: number };

/** Weight of each grade toward the timing score. */
const GRADE_WEIGHT: Record<Grade, number> = { perfect: 1, good: 0.75, early: 0.4, late: 0.4 };

export function toScoreTime(inputTime: number, startedAt: number, latencyMs: number): number {
  return inputTime - startedAt - latencyMs;
}

/** Grade a signed offset (played − expected); null when outside every window. */
export function gradeOffset(offsetMs: number): Grade | null {
  const a = Math.abs(offsetMs);
  if (a <= TIMING_WINDOWS.perfect) return "perfect";
  if (a <= TIMING_WINDOWS.good) return "good";
  if (a <= TIMING_WINDOWS.ok) return offsetMs < 0 ? "early" : "late";
  return null;
}

/**
 * Real-time matcher for Play-along / Performance modes.
 * `noteOn` matches the nearest unmatched expected note of the same pitch within ±250ms;
 * `advance(now)` turns notes whose window has passed into misses.
 */
export class TimingMatcher {
  private readonly pending: TimedNote[];
  readonly judgements: Judgement[] = [];

  constructor(timeline: TimedNote[]) {
    this.pending = [...timeline];
  }

  noteOn(midi: number, timeMs: number, velocity = 90): Judgement {
    let bestIdx = -1;
    let bestAbs = Infinity;
    for (let i = 0; i < this.pending.length; i++) {
      const n = this.pending[i];
      if (n.startMs - timeMs > TIMING_WINDOWS.ok) break; // sorted by onset: rest are later
      const d = Math.abs(timeMs - n.startMs);
      if (n.midi === midi && d <= TIMING_WINDOWS.ok && d < bestAbs) {
        bestIdx = i;
        bestAbs = d;
      }
    }
    let j: Judgement;
    if (bestIdx < 0) j = { kind: "wrong", midi, timeMs };
    else {
      const [note] = this.pending.splice(bestIdx, 1);
      const offsetMs = timeMs - note.startMs;
      j = { kind: "hit", note, grade: gradeOffset(offsetMs)!, offsetMs, velocity };
    }
    this.judgements.push(j);
    return j;
  }

  /** Flush notes that can no longer be hit at `nowMs`; returns the new misses. */
  advance(nowMs: number): Extract<Judgement, { kind: "miss" }>[] {
    const missed: Extract<Judgement, { kind: "miss" }>[] = [];
    while (this.pending.length && this.pending[0].startMs + TIMING_WINDOWS.ok < nowMs) {
      missed.push({ kind: "miss", note: this.pending.shift()! });
    }
    this.judgements.push(...missed);
    return missed;
  }

  get done(): boolean {
    return this.pending.length === 0;
  }

  finish(): Judgement[] {
    this.advance(Infinity);
    return this.judgements;
  }
}

/**
 * Wait mode: the cursor stops on each chord event until all its notes are held/pressed.
 * Wrong keys are reported but never advance the cursor.
 */
export class WaitCursor {
  private step = 0;
  private pressed = new Set<number>();
  readonly wrong: { midi: number; step: number }[] = [];

  constructor(private readonly events: ChordEvent[]) {}

  get index(): number {
    return this.step;
  }
  get current(): ChordEvent | undefined {
    return this.events[this.step];
  }
  get done(): boolean {
    return this.step >= this.events.length;
  }

  /** Returns "correct" | "wrong" for the key, and whether the step advanced. */
  noteOn(midi: number): { result: "correct" | "wrong"; advanced: boolean } {
    const ev = this.current;
    if (!ev) return { result: "wrong", advanced: false };
    if (!ev.notes.some((n) => n.midi === midi)) {
      this.wrong.push({ midi, step: this.step });
      return { result: "wrong", advanced: false };
    }
    this.pressed.add(midi);
    if (ev.notes.every((n) => this.pressed.has(n.midi))) {
      this.step++;
      this.pressed = new Set();
      return { result: "correct", advanced: true };
    }
    return { result: "correct", advanced: false };
  }

  noteOff(midi: number): void {
    this.pressed.delete(midi);
  }
}

export interface NoteStat {
  hits: number;
  misses: number;
  wrongs: number;
}

export interface ScoreSummary {
  total: number;
  hits: number;
  misses: number;
  wrongs: number;
  grades: Record<Grade, number>;
  /** Hits / (expected + wrong notes), 0–1. */
  accuracy: number;
  /** Mean grade weight over expected notes, 0–1 (misses count 0). */
  timing: number;
  /** Combined 0–100 score. */
  score: number;
  stars: 0 | 1 | 2 | 3;
  meanOffsetMs: number;
  offsetStdDevMs: number;
  /** Signed offsets of all hits (for a histogram). */
  offsets: number[];
  /** 1 − coefficient of variation of hit velocities, clamped to 0–1. */
  velocityEvenness: number;
  /** Per-pitch stats; wrong notes are attributed to the pitch actually played. */
  byNote: Record<number, NoteStat>;
}

export function starsFor(score: number): 0 | 1 | 2 | 3 {
  return score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const stdDev = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

/** `timed: false` (Wait mode) ignores offsets: timing mirrors accuracy. */
export function summarize(judgements: Judgement[], { timed = true }: { timed?: boolean } = {}): ScoreSummary {
  const grades: Record<Grade, number> = { perfect: 0, good: 0, early: 0, late: 0 };
  const byNote: Record<number, NoteStat> = {};
  const stat = (midi: number) => (byNote[midi] ??= { hits: 0, misses: 0, wrongs: 0 });
  const offsets: number[] = [];
  const velocities: number[] = [];
  let hits = 0, misses = 0, wrongs = 0, weight = 0;

  for (const j of judgements) {
    if (j.kind === "hit") {
      hits++;
      grades[j.grade]++;
      weight += GRADE_WEIGHT[j.grade];
      if (timed) offsets.push(j.offsetMs);
      velocities.push(j.velocity);
      stat(j.note.midi).hits++;
    } else if (j.kind === "miss") {
      misses++;
      stat(j.note.midi).misses++;
    } else {
      wrongs++;
      stat(j.midi).wrongs++;
    }
  }

  const total = hits + misses;
  const accuracy = total + wrongs ? hits / (total + wrongs) : 0;
  const timing = !timed ? accuracy : total ? weight / total : 0;
  const score = Math.round((accuracy * 0.6 + timing * 0.4) * 100);
  const vMean = mean(velocities);
  const velocityEvenness = vMean ? Math.max(0, Math.min(1, 1 - stdDev(velocities) / vMean)) : 0;

  return {
    total, hits, misses, wrongs, grades, accuracy, timing, score,
    stars: starsFor(score),
    meanOffsetMs: mean(offsets),
    offsetStdDevMs: stdDev(offsets),
    offsets,
    velocityEvenness,
    byNote,
  };
}
