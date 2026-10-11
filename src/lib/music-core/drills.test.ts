import { describe, expect, it } from "vitest";
import { drillScore, keysFor, pickRounds, pitchMatches, rhythmScore } from "./drills";

describe("drills", () => {
  it("matches pitch with or without octave", () => {
    expect(pitchMatches(60, "C")).toBe(true);
    expect(pitchMatches(72, "C")).toBe(true);
    expect(pitchMatches(72, "C4")).toBe(false);
    expect(pitchMatches(66, "F#")).toBe(true);
    expect(pitchMatches(70, "Bb")).toBe(true);
  });

  it("finds every C on 88 keys", () => {
    expect(keysFor("C", 21, 108)).toEqual([24, 36, 48, 60, 72, 84, 96, 108]);
    expect(keysFor("F", 21, 108)).toHaveLength(7);
  });

  it("never repeats a round back to back", () => {
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const r = pickRounds(["C", "D", "E"], 50, rng);
    expect(r).toHaveLength(50);
    r.slice(1).forEach((x, i) => expect(x).not.toBe(r[i]));
    expect(pickRounds(["C"], 3)).toEqual(["C", "C", "C"]);
  });

  it("scores drills", () => {
    expect(drillScore(10, 10, 0)).toBe(100);
    expect(drillScore(8, 10, 2)).toBe(80); // the 2 misses were the wrong presses
    expect(drillScore(8, 10, 4)).toBe(67);
    expect(drillScore(0, 0, 0)).toBe(0);
  });

  it("builds a rhythm score skipping rests", () => {
    const s = rhythmScore([1, 1, -1, 1, 2, 2], 80, [4, 4]);
    expect(s.notes.map((n) => n.start)).toEqual([0, 1, 3, 4, 6]);
    expect(s.notes.every((n) => n.midi === 72)).toBe(true);
  });
});
