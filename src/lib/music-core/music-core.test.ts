import { describe, expect, it } from "vitest";
import {
  PIANO_KEYS, midiToName, nameToMidi, isBlackKey, whiteKeyIndex, midiToFrequency,
  intervalName, buildScale, isInScale, buildChord, identifyChord, voiceLead,
  keyAccidentals, relativeMinor,
} from "./index";

describe("notes", () => {
  it("covers 88 keys with 52 white keys", () => {
    expect(PIANO_KEYS).toHaveLength(88);
    expect(PIANO_KEYS.filter((m) => !isBlackKey(m))).toHaveLength(52);
    expect(whiteKeyIndex(108)).toBe(51);
  });
  it("converts names", () => {
    expect(midiToName(60)).toBe("C4");
    expect(midiToName(21)).toBe("A0");
    expect(midiToName(61, "flat")).toBe("Db4");
    expect(nameToMidi("C4")).toBe(60);
    expect(nameToMidi("Bb3")).toBe(58);
    expect(nameToMidi("C8")).toBe(108);
    expect(nameToMidi("E#4")).toBe(65);
  });
  it("frequency", () => {
    expect(midiToFrequency(69)).toBe(440);
  });
});

describe("intervals & scales", () => {
  it("names intervals", () => {
    expect(intervalName(60, 67)).toBe("P5");
    expect(intervalName(60, 72)).toBe("P8");
    expect(intervalName(60, 64)).toBe("M3");
  });
  it("builds scales", () => {
    expect(buildScale(60, "major")).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(buildScale(57, "naturalMinor")).toEqual([57, 59, 60, 62, 64, 65, 67, 69]);
    expect(isInScale(66, 67, "major")).toBe(true); // F# in G major
  });
});

describe("chords", () => {
  it("builds inversions", () => {
    expect(buildChord(60, "maj")).toEqual([60, 64, 67]);
    expect(buildChord(60, "maj", 1)).toEqual([64, 67, 72]);
    expect(buildChord(60, "maj", 2)).toEqual([67, 72, 76]);
  });
  it("identifies chords in any voicing", () => {
    expect(identifyChord([64, 67, 72])).toEqual({ root: 0, quality: "maj", inversion: 1 });
    expect(identifyChord([57, 60, 64])).toMatchObject({ root: 9, quality: "min", inversion: 0 });
    expect(identifyChord([55, 59, 62, 65])).toMatchObject({ root: 7, quality: "7" });
    expect(identifyChord([60, 62])).toBeNull();
  });
  it("voice-leads C → F with minimal movement (F/C)", () => {
    expect(voiceLead([60, 64, 67], 65, "maj")).toEqual([60, 65, 69]);
  });
});

describe("keys", () => {
  it("returns key signature accidentals", () => {
    expect(keyAccidentals("G")).toEqual({ letters: ["F"], type: "sharp" });
    expect(keyAccidentals("Bb")).toEqual({ letters: ["B", "E"], type: "flat" });
    expect(relativeMinor("C")).toBe("Am");
  });
});

import { estimateLatency } from "./calibration";
describe("calibration", () => {
  it("median offset, ignores misses", () => {
    const clicks = [0, 600, 1200, 1800, 2400];
    expect(estimateLatency(clicks, [40, 650, 1230, 1850, 2100], 600)).toBe(45);
    expect(estimateLatency(clicks, [40], 600)).toBeNull();
  });
});
