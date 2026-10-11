import type { Attempt, Card, ChangeSet, Day, LessonProgress, ProgressSnapshot } from "@/lib/storage/types";
import { newBadges, type BadgeContext } from "./badges";
import { dayKey } from "./dates";
import { earnedCards } from "./decks";
import { DEFAULT_GOAL, emptyDay } from "./goal";
import { newCard, review } from "./srs";
import { emptyStreak, registerActivity } from "./streak";
import { practiceXp, reviewXp } from "./xp";

type Stars = 0 | 1 | 2 | 3;

export type ProgressEvent =
  | { type: "lesson"; lessonId: string; score: number; stars: Stars; xp: number; durationMs: number }
  | {
      type: "practice"; pieceId: string; score: number; stars: Stars; accuracy: number; timing: number;
      durationMs: number; hand: "both" | "R" | "L"; mode: string; tempo: number;
    }
  | { type: "review"; cardId: string; quality: number; durationMs: number };

export interface EventResult {
  snapshot: ProgressSnapshot;
  changes: ChangeSet;
  xp: number;
  /** Badge ids earned by this event. */
  badges: string[];
}

/** Longest stretch one event may add to "active time" (guards against tabs left open). */
export const MAX_EVENT_MS = 30 * 60_000;

export function emptySnapshot(now = Date.now()): ProgressSnapshot {
  return {
    profile: { id: "me", xp: 0, streak: emptyStreak(), goal: DEFAULT_GOAL, updatedAt: now },
    lessons: [], attempts: [], days: [], cards: [], badges: [],
  };
}

export function badgeContext(s: ProgressSnapshot): BadgeContext {
  const perfectRuns = { both: 0, R: 0, L: 0 };
  let practiceRuns = 0;
  for (const a of s.attempts) {
    if (a.kind !== "practice") continue;
    practiceRuns++;
    if (a.stars === 3) perfectRuns[a.hand ?? "both"]++;
  }
  return {
    completedLessons: new Set(s.lessons.map((l) => l.id)),
    xp: s.profile.xp,
    bestStreak: s.profile.streak.best,
    practiceRuns,
    perfectRuns,
    reviews: s.days.reduce((n, d) => n + d.reviews, 0),
    minutes: s.days.reduce((n, d) => n + d.activeMs, 0) / 60_000,
  };
}

/** New SRS cards earned by the completed lessons that aren't in the deck yet. */
export function cardsToSeed(s: ProgressSnapshot, now: number): Card[] {
  const done = new Set(s.lessons.map((l) => l.id));
  const have = new Set(s.cards.map((c) => c.id));
  return earnedCards((id) => done.has(id))
    .map((c, i) => ({ ...newCard(c.deck, c.prompt, now + i), updatedAt: now }))
    .filter((c) => !have.has(c.id));
}

const upsert = <T extends { id: string }>(rows: T[], row: T) => {
  const i = rows.findIndex((r) => r.id === row.id);
  return i < 0 ? [...rows, row] : rows.map((r, j) => (j === i ? row : r));
};

/** Apply one learner event: XP, day activity, streak, lesson best, attempts, SRS, badges. Pure. */
export function applyEvent(
  s: ProgressSnapshot, e: ProgressEvent, now = Date.now(), uuid: () => string = () => crypto.randomUUID(),
): EventResult {
  const today = dayKey(now);
  const ms = Math.max(0, Math.min(MAX_EVENT_MS, e.durationMs));
  const changes: ChangeSet = {};
  let { lessons, attempts, cards } = s;
  let xp = 0;

  const dayPrev = s.days.find((d) => d.id === today) ?? emptyDay(today);
  const day: Day = { ...dayPrev, activeMs: dayPrev.activeMs + ms, updatedAt: now };

  if (e.type === "lesson") {
    xp = e.xp;
    day.lessons++;
    const prev = lessons.find((l) => l.id === e.lessonId);
    const row: LessonProgress = {
      id: e.lessonId,
      score: Math.max(prev?.score ?? 0, e.score),
      stars: Math.max(prev?.stars ?? 0, e.stars) as Stars,
      attempts: (prev?.attempts ?? 0) + 1,
      completedAt: prev?.completedAt ?? now,
      updatedAt: now,
    };
    lessons = upsert(lessons, row);
    const attempt: Attempt = { id: uuid(), kind: "lesson", refId: e.lessonId, score: e.score, stars: e.stars, durationMs: ms, at: now, updatedAt: now };
    attempts = [...attempts, attempt];
    changes.lessons = [row];
    changes.attempts = [attempt];
  } else if (e.type === "practice") {
    xp = practiceXp(e.stars);
    day.practices++;
    const attempt: Attempt = {
      id: uuid(), kind: "practice", refId: e.pieceId, score: e.score, stars: e.stars, accuracy: e.accuracy, timing: e.timing,
      durationMs: ms, hand: e.hand, mode: e.mode, tempo: e.tempo, at: now, updatedAt: now,
    };
    attempts = [...attempts, attempt];
    changes.attempts = [attempt];
  } else {
    const card = cards.find((c) => c.id === e.cardId);
    if (card) {
      const next: Card = { ...review(card, e.quality, today), updatedAt: now };
      cards = upsert(cards, next);
      changes.cards = [next];
    }
    xp = reviewXp(e.quality);
    day.reviews++;
  }
  day.xp += xp;

  const profile = { ...s.profile, xp: s.profile.xp + xp, streak: registerActivity(s.profile.streak, today), updatedAt: now };
  let snapshot: ProgressSnapshot = { ...s, profile, lessons, attempts, cards, days: upsert(s.days, day) };
  changes.profile = profile;
  changes.days = [day];

  if (e.type === "lesson") {
    const seeded = cardsToSeed(snapshot, now);
    if (seeded.length) {
      snapshot = { ...snapshot, cards: [...snapshot.cards, ...seeded] };
      changes.cards = [...(changes.cards ?? []), ...seeded];
    }
  }

  const earned = newBadges(badgeContext(snapshot), new Set(s.badges.map((b) => b.id)));
  if (earned.length) {
    const rows = earned.map((id) => ({ id, earnedAt: now, updatedAt: now }));
    snapshot = { ...snapshot, badges: [...snapshot.badges, ...rows] };
    changes.badges = rows;
  }
  return { snapshot, changes, xp, badges: earned };
}
