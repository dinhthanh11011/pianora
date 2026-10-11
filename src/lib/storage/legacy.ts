import { badgeContext, cardsToSeed } from "@/lib/gamification/events";
import { newBadges } from "@/lib/gamification/badges";
import type { ProgressSnapshot } from "./types";

/** localStorage key of the interim (pre-P5.1) progress store. */
export const LEGACY_KEY = "pianora-progress";

interface LegacyState {
  lessons?: Record<string, { score: number; stars: 0 | 1 | 2 | 3; attempts: number; completedAt: number }>;
  xp?: number;
}

/** Fold the interim zustand-persist payload into a snapshot (lessons, XP, earned SRS cards and badges). */
export function migrateLegacy(raw: string | null, s: ProgressSnapshot, now = Date.now()): ProgressSnapshot | null {
  if (!raw) return null;
  let state: LegacyState;
  try {
    state = (JSON.parse(raw) as { state?: LegacyState }).state ?? {};
  } catch {
    return null;
  }
  const have = new Set(s.lessons.map((l) => l.id));
  const lessons = Object.entries(state.lessons ?? {})
    .filter(([id]) => !have.has(id))
    .map(([id, l]) => ({ id, ...l, updatedAt: now }));
  const out: ProgressSnapshot = {
    ...s,
    profile: { ...s.profile, xp: s.profile.xp + (state.xp ?? 0), updatedAt: now },
    lessons: [...s.lessons, ...lessons],
  };
  const badges = newBadges(badgeContext(out), new Set(s.badges.map((b) => b.id))).map((id) => ({ id, earnedAt: now, updatedAt: now }));
  return { ...out, cards: [...out.cards, ...cardsToSeed(out, now)], badges: [...out.badges, ...badges] };
}
