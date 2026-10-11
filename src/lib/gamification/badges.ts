import { CURRICULUM } from "@/content/curriculum";

/** Facts badges are judged on, derived from the progress snapshot. */
export interface BadgeContext {
  completedLessons: Set<string>;
  xp: number;
  bestStreak: number;
  practiceRuns: number;
  /** Practice runs with 3 stars, split by hand setting. */
  perfectRuns: { both: number; R: number; L: number };
  reviews: number;
  /** Total active minutes. */
  minutes: number;
}

export interface BadgeDef {
  id: string;
  icon: "footprints" | "flag" | "flame" | "zap" | "star" | "hand" | "brain" | "clock" | "music" | "trophy";
  earned: (c: BadgeContext) => boolean;
}

const levelDone = (lv: (typeof CURRICULUM)[number]) => (c: BadgeContext) =>
  lv.units.every((u) => u.lessons.every((l) => c.completedLessons.has(l.id)));

/** Titles/descriptions live in messages under `badges.<id>`. */
export const BADGES: BadgeDef[] = [
  { id: "firstLesson", icon: "footprints", earned: (c) => c.completedLessons.size >= 1 },
  ...CURRICULUM.map((lv): BadgeDef => ({ id: `level${lv.level}`, icon: "flag", earned: levelDone(lv) })),
  { id: "streak3", icon: "flame", earned: (c) => c.bestStreak >= 3 },
  { id: "streak7", icon: "flame", earned: (c) => c.bestStreak >= 7 },
  { id: "streak30", icon: "flame", earned: (c) => c.bestStreak >= 30 },
  { id: "xp500", icon: "zap", earned: (c) => c.xp >= 500 },
  { id: "xp2000", icon: "zap", earned: (c) => c.xp >= 2000 },
  { id: "practice10", icon: "music", earned: (c) => c.practiceRuns >= 10 },
  { id: "perfect", icon: "star", earned: (c) => c.perfectRuns.both + c.perfectRuns.R + c.perfectRuns.L >= 1 },
  { id: "leftHand", icon: "hand", earned: (c) => c.perfectRuns.L >= 3 },
  { id: "reviewer", icon: "brain", earned: (c) => c.reviews >= 50 },
  { id: "hour", icon: "clock", earned: (c) => c.minutes >= 60 },
];

/** Badge ids newly earned (not in `have`). */
export function newBadges(c: BadgeContext, have: Set<string>): string[] {
  return BADGES.filter((b) => !have.has(b.id) && b.earned(c)).map((b) => b.id);
}
