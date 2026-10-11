import type { DailyGoal, DayActivity } from "@/lib/gamification/goal";
import type { SrsCard } from "@/lib/gamification/srs";
import type { StreakState } from "@/lib/gamification/streak";

export interface Profile {
  id: "me";
  xp: number;
  streak: StreakState;
  goal: DailyGoal;
  updatedAt: number;
}

export interface LessonProgress {
  /** Lesson id. Best score/stars across attempts. */
  id: string;
  score: number;
  stars: 0 | 1 | 2 | 3;
  attempts: number;
  completedAt: number;
  updatedAt: number;
}

export interface Attempt {
  id: string;
  kind: "lesson" | "practice";
  /** Lesson id or practice piece id. */
  refId: string;
  score: number;
  stars: 0 | 1 | 2 | 3;
  accuracy?: number;
  timing?: number;
  durationMs: number;
  hand?: "both" | "R" | "L";
  mode?: string;
  tempo?: number;
  at: number;
  updatedAt: number;
}

export interface BadgeAward {
  id: string;
  earnedAt: number;
  updatedAt: number;
}

export type Day = DayActivity & { updatedAt: number };
export type Card = SrsCard & { updatedAt: number };

/** Everything the app keeps about the learner. Small enough to hold in memory. */
export interface ProgressSnapshot {
  profile: Profile;
  lessons: LessonProgress[];
  attempts: Attempt[];
  days: Day[];
  cards: Card[];
  badges: BadgeAward[];
}

/** Rows to upsert after an event (only what changed). */
export interface ChangeSet {
  profile?: Profile;
  lessons?: LessonProgress[];
  attempts?: Attempt[];
  days?: Day[];
  cards?: Card[];
  badges?: BadgeAward[];
}

/**
 * The only door to persisted progress. Today: IndexedDB (Dexie). Later: an API-backed
 * implementation for accounts/sync, without touching UI or engines.
 */
export interface ProgressRepository {
  load(): Promise<ProgressSnapshot>;
  save(changes: ChangeSet): Promise<void>;
  /** Replace all data (import / reset). */
  replaceAll(snapshot: ProgressSnapshot): Promise<void>;
}
