import { describe, expect, it } from "vitest";
import { LESSONS } from "@/content/curriculum";
import { MemoryProgressRepository } from "@/lib/storage/memory";
import { parseBackup, toBackupJson } from "@/lib/storage/backup";
import { migrateLegacy } from "@/lib/storage/legacy";
import { addDays, dayKey, daysBetween, lastDays } from "./dates";
import { applyEvent, emptySnapshot, MAX_EVENT_MS } from "./events";
import { goalProgress, emptyDay } from "./goal";
import { dueQueue, newCard, qualityFrom, review } from "./srs";
import { emptyStreak, liveStreak, registerActivity } from "./streak";
import { playerLevel } from "./xp";

const at = (day: string, h = 12) => new Date(`${day}T${String(h).padStart(2, "0")}:00:00`).getTime();
let n = 0;
const uuid = () => `id-${n++}`;

describe("dates", () => {
  it("counts days across month ends", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(lastDays("2026-03-02", 3)).toEqual(["2026-02-28", "2026-03-01", "2026-03-02"]);
    expect(dayKey(at("2026-05-04", 23))).toBe("2026-05-04");
  });
});

describe("streak", () => {
  it("extends on consecutive days, ignores same day, restarts after a gap", () => {
    let s = registerActivity(emptyStreak(), "2026-01-01");
    s = registerActivity(s, "2026-01-01");
    s = registerActivity(s, "2026-01-02");
    expect(s.current).toBe(2);
    s = registerActivity(s, "2026-01-05");
    expect(s).toMatchObject({ current: 1, best: 2 });
  });

  it("earns a freeze every 7 days and spends it on a missed day", () => {
    let s = emptyStreak();
    for (let i = 0; i < 7; i++) s = registerActivity(s, addDays("2026-01-01", i));
    expect(s).toMatchObject({ current: 7, freezes: 1 });
    expect(liveStreak(s, "2026-01-09")).toBe(7); // one missed day, covered
    s = registerActivity(s, "2026-01-09");
    expect(s).toMatchObject({ current: 8, freezes: 0, frozenDays: ["2026-01-08"] });
    expect(liveStreak(s, "2026-01-11")).toBe(0);
  });
});

describe("xp & goal", () => {
  it("levels up with growing thresholds", () => {
    expect(playerLevel(0)).toEqual({ level: 1, into: 0, needed: 100 });
    expect(playerLevel(260)).toEqual({ level: 3, into: 10, needed: 200 });
  });
  it("reports goal progress", () => {
    expect(goalProgress({ kind: "minutes", target: 10 }, { ...emptyDay("d"), activeMs: 5 * 60_000 })).toBe(0.5);
    expect(goalProgress({ kind: "lessons", target: 2 }, { ...emptyDay("d"), lessons: 3 })).toBe(1);
  });
});

describe("SM-2", () => {
  const today = "2026-02-01";
  it("grows intervals 1 → 6 → ×ease and resets on a lapse", () => {
    let c = review(newCard("note", "C4"), 5, today);
    expect(c).toMatchObject({ interval: 1, due: "2026-02-02", reps: 1 });
    c = review(c, 4, "2026-02-02");
    expect(c.interval).toBe(6);
    c = review(c, 4, "2026-02-08");
    expect(c.interval).toBe(Math.round(6 * c.ease));
    const lapsed = review(c, 1, "2026-02-25");
    expect(lapsed).toMatchObject({ interval: 1, reps: 0, lapses: 1, due: "2026-02-26" });
    expect(lapsed.ease).toBeGreaterThanOrEqual(1.3);
  });
  it("queues due cards before a limited number of new ones", () => {
    const due = { ...newCard("note", "D4"), due: "2026-01-30" };
    const later = { ...newCard("note", "E4"), due: "2026-02-05" };
    const fresh = [1, 2, 3].map((i) => newCard("note", `F${i}`, i));
    expect(dueQueue([later, ...fresh, due], today, 2).map((c) => c.prompt)).toEqual(["D4", "F1", "F2"]);
  });
  it("maps answers to quality", () => {
    expect([qualityFrom(false, 100), qualityFrom(true, 1000), qualityFrom(true, 5000), qualityFrom(true, 1000, false)]).toEqual([1, 5, 4, 3]);
  });
});

describe("applyEvent", () => {
  const first = LESSONS[0].lesson.id;
  it("records a lesson: best score, XP, day, streak, badge", () => {
    let s = emptySnapshot(0);
    const r1 = applyEvent(s, { type: "lesson", lessonId: first, score: 70, stars: 1, xp: 15, durationMs: 60_000 }, at("2026-03-01"), uuid);
    expect(r1.badges).toContain("firstLesson");
    expect(r1.changes.lessons?.[0]).toMatchObject({ score: 70, attempts: 1 });
    s = applyEvent(r1.snapshot, { type: "lesson", lessonId: first, score: 50, stars: 1, xp: 15, durationMs: 99 * MAX_EVENT_MS }, at("2026-03-02"), uuid).snapshot;
    expect(s.lessons[0]).toMatchObject({ score: 70, attempts: 2 });
    expect(s.profile).toMatchObject({ xp: 30, streak: { current: 2 } });
    expect(s.days.find((d) => d.id === "2026-03-02")?.activeMs).toBe(MAX_EVENT_MS);
    expect(s.attempts).toHaveLength(2);
  });

  it("seeds note cards from completed reading drills and reviews them", () => {
    const reading = LESSONS.find((r) => r.lesson.steps.some((st) => st.type === "readNote"))!;
    let s = emptySnapshot(0);
    for (const r of LESSONS.slice(0, reading.order + 1)) {
      s = applyEvent(s, { type: "lesson", lessonId: r.lesson.id, score: 100, stars: 3, xp: 25, durationMs: 0 }, at("2026-03-01"), uuid).snapshot;
    }
    expect(s.cards.length).toBeGreaterThan(0);
    const card = s.cards[0];
    const r = applyEvent(s, { type: "review", cardId: card.id, quality: 5, durationMs: 2000 }, at("2026-03-01"), uuid);
    expect(r.xp).toBe(2);
    expect(r.snapshot.cards.find((c) => c.id === card.id)?.due).toBe("2026-03-02");
  });

  it("counts left-hand perfect runs for the badge", () => {
    let s = emptySnapshot(0);
    const run = { type: "practice", pieceId: "p", score: 98, stars: 3, accuracy: 1, timing: 0.95, durationMs: 1000, hand: "L", mode: "wait", tempo: 1 } as const;
    const got: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = applyEvent(s, run, at("2026-03-01"), uuid);
      got.push(...r.badges);
      s = r.snapshot;
    }
    expect(got).toEqual(expect.arrayContaining(["perfect", "leftHand"]));
  });
});

describe("storage", () => {
  it("round-trips through the memory repo and backup JSON", async () => {
    const repo = new MemoryProgressRepository();
    const r = applyEvent(await repo.load(), { type: "lesson", lessonId: LESSONS[0].lesson.id, score: 90, stars: 2, xp: 20, durationMs: 1000 }, at("2026-03-01"), uuid);
    await repo.save(r.changes);
    const loaded = await repo.load();
    expect(loaded).toEqual(r.snapshot);
    expect(parseBackup(toBackupJson(loaded))).toEqual(loaded);
    expect(() => parseBackup(JSON.stringify({ app: "other", version: 1, data: {} }))).toThrow();
  });

  it("migrates the interim localStorage payload", () => {
    const raw = JSON.stringify({ state: { xp: 40, lessons: { [LESSONS[0].lesson.id]: { score: 80, stars: 2, attempts: 1, completedAt: 5 } } }, version: 0 });
    const s = migrateLegacy(raw, emptySnapshot(0), 10)!;
    expect(s.profile.xp).toBe(40);
    expect(s.lessons[0]).toMatchObject({ id: LESSONS[0].lesson.id, stars: 2 });
    expect(s.badges.map((b) => b.id)).toContain("firstLesson");
    expect(migrateLegacy("not json", emptySnapshot(0))).toBeNull();
  });
});
