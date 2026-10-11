/** Score model: notes positioned in beats, converted to ms for playback/scoring. */

export type Hand = "L" | "R";
export type Finger = 1 | 2 | 3 | 4 | 5;

export interface ScoreNote {
  midi: number;
  /** Onset in beats from the start (quarter note = 1 beat). */
  start: number;
  /** Duration in beats. */
  duration: number;
  hand: Hand;
  finger?: Finger;
}

export interface Score {
  id: string;
  bpm: number;
  /** [beats per bar, beat unit], e.g. [3, 4]. */
  timeSignature: [number, number];
  notes: ScoreNote[];
}

/** A note placed on the absolute timeline (ms from score start). */
export interface TimedNote extends ScoreNote {
  /** Index in the source score's notes array — stable id for feedback. */
  index: number;
  startMs: number;
  durationMs: number;
}

export interface TimelineOptions {
  /** Tempo multiplier, e.g. 0.6 for 60%. Default 1. */
  tempo?: number;
  /** Only keep notes for this hand (hand-split practice). */
  hand?: Hand;
  /** Keep notes with start in [from, to) beats (A–B loop). */
  range?: { from: number; to: number };
}

export const beatMs = (bpm: number) => 60000 / bpm;

/** Lay the score out in ms, sorted by onset then pitch. Range-limited notes are re-zeroed to `from`. */
export function toTimeline(score: Score, opts: TimelineOptions = {}): TimedNote[] {
  const ms = beatMs(score.bpm * (opts.tempo ?? 1));
  const offset = opts.range?.from ?? 0;
  return score.notes
    .map((n, index) => ({ ...n, index }))
    .filter((n) => !opts.hand || n.hand === opts.hand)
    .filter((n) => !opts.range || (n.start >= opts.range.from && n.start < opts.range.to))
    .map((n) => ({ ...n, startMs: (n.start - offset) * ms, durationMs: n.duration * ms }))
    .sort((a, b) => a.startMs - b.startMs || a.midi - b.midi);
}

export interface ChordEvent {
  startMs: number;
  notes: TimedNote[];
}

/** Notes whose onsets fall within `windowMs` of a group's first onset form one chord event. */
export function groupChords(timeline: TimedNote[], windowMs = 80): ChordEvent[] {
  const events: ChordEvent[] = [];
  for (const n of timeline) {
    const last = events[events.length - 1];
    if (last && n.startMs - last.startMs <= windowMs) last.notes.push(n);
    else events.push({ startMs: n.startMs, notes: [n] });
  }
  return events;
}

/** Total length in ms (end of the last sounding note). */
export function timelineLength(timeline: TimedNote[]): number {
  return timeline.reduce((m, n) => Math.max(m, n.startMs + n.durationMs), 0);
}
