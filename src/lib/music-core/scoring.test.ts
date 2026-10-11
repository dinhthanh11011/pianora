import { describe, expect, it } from "vitest";
import {
  toTimeline, groupChords, timelineLength, gradeOffset, toScoreTime,
  TimingMatcher, WaitCursor, summarize, starsFor, splitDuration, vexKey, layoutMeasures, type Score,
} from "./index";

// 120 bpm → 500ms per beat. C major arpeggio RH + C3 LH chord on beat 0.
const score: Score = {
  id: "t",
  bpm: 120,
  timeSignature: [4, 4],
  notes: [
    { midi: 60, start: 0, duration: 1, hand: "R", finger: 1 },
    { midi: 48, start: 0, duration: 4, hand: "L", finger: 5 },
    { midi: 64, start: 1, duration: 1, hand: "R", finger: 3 },
    { midi: 67, start: 2, duration: 1, hand: "R", finger: 5 },
    { midi: 72, start: 3, duration: 1, hand: "R", finger: 5 },
  ],
};

describe("score timeline", () => {
  it("converts beats to ms with tempo, sorted by onset then pitch", () => {
    const tl = toTimeline(score);
    expect(tl.map((n) => n.midi)).toEqual([48, 60, 64, 67, 72]);
    expect(tl[2].startMs).toBe(500);
    expect(timelineLength(tl)).toBe(2000);
    expect(toTimeline(score, { tempo: 0.5 })[2].startMs).toBe(1000);
  });
  it("filters hand and A–B range (re-zeroed)", () => {
    expect(toTimeline(score, { hand: "L" }).map((n) => n.midi)).toEqual([48]);
    const ab = toTimeline(score, { range: { from: 1, to: 3 } });
    expect(ab.map((n) => [n.midi, n.startMs])).toEqual([[64, 0], [67, 500]]);
  });
  it("groups chords within 80ms", () => {
    const tl = toTimeline(score);
    expect(groupChords(tl).map((e) => e.notes.length)).toEqual([2, 1, 1, 1]);
  });
});

describe("timing", () => {
  it("grades windows", () => {
    expect(gradeOffset(0)).toBe("perfect");
    expect(gradeOffset(-50)).toBe("perfect");
    expect(gradeOffset(100)).toBe("good");
    expect(gradeOffset(-200)).toBe("early");
    expect(gradeOffset(240)).toBe("late");
    expect(gradeOffset(300)).toBeNull();
  });
  it("compensates latency", () => {
    expect(toScoreTime(1530, 1000, 30)).toBe(500);
  });
});

describe("TimingMatcher", () => {
  it("scores a simulated performance", () => {
    const m = new TimingMatcher(toTimeline(score));
    expect(m.noteOn(48, 10, 0.8)).toMatchObject({ kind: "hit", grade: "perfect" });
    expect(m.noteOn(60, -30, 0.8)).toMatchObject({ kind: "hit", grade: "perfect", offsetMs: -30 });
    expect(m.noteOn(65, 500)).toMatchObject({ kind: "wrong", midi: 65 });
    expect(m.noteOn(64, 600, 0.7)).toMatchObject({ kind: "hit", grade: "good" });
    expect(m.advance(1300)).toHaveLength(1); // 67 at 1000 passed its window
    expect(m.noteOn(72, 1700, 0.9)).toMatchObject({ kind: "hit", grade: "late" });
    const s = summarize(m.finish());
    expect(s).toMatchObject({ total: 5, hits: 4, misses: 1, wrongs: 1 });
    expect(s.accuracy).toBeCloseTo(4 / 6);
    expect(s.timing).toBeCloseTo((1 + 1 + 0.75 + 0.4) / 5);
    expect(s.byNote[67]).toEqual({ hits: 0, misses: 1, wrongs: 0 });
    expect(s.byNote[65].wrongs).toBe(1);
    expect(s.offsets).toEqual([10, -30, 100, 200]);
    expect(s.stars).toBe(starsFor(s.score));
  });
  it("picks the nearest of repeated pitches", () => {
    const rep: Score = { ...score, notes: [0, 1, 2].map((b) => ({ midi: 60, start: b * 0.25, duration: 0.25, hand: "R" as const })) };
    const m = new TimingMatcher(toTimeline(rep)); // onsets 0,125,250
    expect(m.noteOn(60, 130)).toMatchObject({ kind: "hit", offsetMs: 5 });
    expect(m.noteOn(60, 10)).toMatchObject({ kind: "hit", offsetMs: 10 });
  });
  it("perfect run gets 3 stars", () => {
    const tl = toTimeline(score);
    const m = new TimingMatcher(tl);
    tl.forEach((n) => m.noteOn(n.midi, n.startMs, 0.8));
    const s = summarize(m.finish());
    expect(s.score).toBe(100);
    expect(s.stars).toBe(3);
    expect(s.velocityEvenness).toBe(1);
  });
});

describe("WaitCursor", () => {
  it("waits until the whole chord is pressed; wrong keys don't advance", () => {
    const c = new WaitCursor(groupChords(toTimeline(score)));
    expect(c.noteOn(60)).toEqual({ result: "correct", advanced: false });
    expect(c.noteOn(62)).toEqual({ result: "wrong", advanced: false });
    expect(c.noteOn(48)).toEqual({ result: "correct", advanced: true });
    expect(c.index).toBe(1);
    ["64", "67", "72"].forEach((m) => c.noteOn(Number(m)));
    expect(c.done).toBe(true);
    expect(c.wrong).toEqual([{ midi: 62, step: 0 }]);
  });
});

describe("notation layout", () => {
  it("splits durations and builds grand-staff measures with rests and ties", () => {
    expect(splitDuration(3).map((p) => p.duration + (p.dots ? "." : ""))).toEqual(["h."]);
    expect(splitDuration(2.5).map((p) => p.duration)).toEqual(["h", "8"]);
    expect(vexKey(61)).toBe("c#/4");
    const ms = layoutMeasures({
      ...score,
      notes: [...score.notes, { midi: 62, start: 4.5, duration: 5, hand: "R" }],
    });
    expect(ms).toHaveLength(2);
    expect(ms[0].treble.map((t) => t.duration)).toEqual(["q", "q", "q", "q"]);
    expect(ms[0].bass).toMatchObject([{ midis: [48], duration: "w", indices: [1] }]);
    // Bar 2: eighth rest, then D held 5 beats but clamped to bar end (3.5 = h. tied to 8).
    expect(ms[1].treble.map((t) => [t.rest, t.duration, t.tie])).toEqual([
      [true, "8", false], [false, "h", true], [false, "8", false],
    ]);
    expect(ms[1].bass).toMatchObject([{ rest: true, duration: "w" }]);
  });
  it("wait-mode summary ignores timing", () => {
    const tl = toTimeline(score);
    const s = summarize(
      [...tl.map((note) => ({ kind: "hit" as const, note, grade: "perfect" as const, offsetMs: 0, velocity: 90 })),
        { kind: "wrong" as const, midi: 61, timeMs: 0 }],
      { timed: false },
    );
    expect(s.offsets).toEqual([]);
    expect(s.timing).toBeCloseTo(5 / 6);
    expect(s.score).toBe(83);
  });
});
