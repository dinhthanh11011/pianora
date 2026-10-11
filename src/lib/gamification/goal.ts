export interface DailyGoal {
  kind: "minutes" | "lessons";
  target: number;
}

export const DEFAULT_GOAL: DailyGoal = { kind: "minutes", target: 10 };
export const GOAL_PRESETS: Record<DailyGoal["kind"], number[]> = { minutes: [5, 10, 15, 30], lessons: [1, 2, 3, 5] };

/** One day of activity (also the unit of stats charts). */
export interface DayActivity {
  id: string; // YYYY-MM-DD
  activeMs: number;
  xp: number;
  lessons: number;
  practices: number;
  reviews: number;
}

export const emptyDay = (id: string): DayActivity => ({ id, activeMs: 0, xp: 0, lessons: 0, practices: 0, reviews: 0 });

/** Goal progress 0–1 for a day. */
export function goalProgress(goal: DailyGoal, day: DayActivity | undefined): number {
  if (!day) return 0;
  const done = goal.kind === "minutes" ? day.activeMs / 60_000 : day.lessons;
  return Math.min(1, done / goal.target);
}
