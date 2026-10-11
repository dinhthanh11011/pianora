import { describe, expect, it } from "vitest";
import { barBeats, keysFor, nameToMidi } from "@/lib/music-core";
import { CURRICULUM, LESSONS, findLesson, isUnlocked, nextLesson } from "./index";

describe("curriculum", () => {
  it("covers levels 0–3 with every lesson kind", () => {
    expect(CURRICULUM.map((l) => l.level)).toEqual([0, 1, 2, 3]);
    const kinds = new Set(LESSONS.map((r) => r.lesson.kind));
    expect([...kinds].sort()).toEqual(["checkpoint", "drill", "song", "technique", "theory"]);
    // Each level ends with its checkpoint.
    for (const lv of CURRICULUM) expect(lv.units.at(-1)!.lessons.at(-1)!.kind).toBe("checkpoint");
  });

  it("rhythm patterns fill whole bars", () => {
    for (const { lesson } of LESSONS)
      for (const s of lesson.steps)
        if (s.type === "rhythm") {
          const beats = s.pattern.reduce((a, d) => a + Math.abs(d), 0);
          expect(beats % barBeats(s.timeSignature), `${lesson.id}`).toBe(0);
        }
  });

  it("drill targets exist in their key range", () => {
    for (const { lesson } of LESSONS)
      for (const s of lesson.steps)
        if (s.type === "findNote")
          for (const t of s.targets) expect(keysFor(t, nameToMidi(s.from), nameToMidi(s.to)).length, `${lesson.id} ${t}`).toBeGreaterThan(0);
  });

  it("unlocks lessons in order", () => {
    const [a, b] = LESSONS;
    const done = new Set<string>();
    expect(isUnlocked(a.lesson.id, (id) => done.has(id))).toBe(true);
    expect(isUnlocked(b.lesson.id, (id) => done.has(id))).toBe(false);
    done.add(a.lesson.id);
    expect(isUnlocked(b.lesson.id, (id) => done.has(id))).toBe(true);
    expect(nextLesson(a.lesson.id)?.lesson.id).toBe(b.lesson.id);
    expect(findLesson("nope")).toBeUndefined();
  });
});
