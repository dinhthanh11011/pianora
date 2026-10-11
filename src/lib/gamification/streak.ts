import { addDays, daysBetween } from "./dates";

export interface StreakState {
  current: number;
  best: number;
  /** Last day with practice, `YYYY-MM-DD`. */
  lastDay: string | null;
  /** Banked freezes; each covers one missed day automatically. */
  freezes: number;
  /** Days covered by a freeze (shown on the calendar). */
  frozenDays: string[];
}

export const MAX_FREEZES = 2;
/** A freeze is earned every this many streak days. */
export const FREEZE_EVERY = 7;

export const emptyStreak = (): StreakState => ({ current: 0, best: 0, lastDay: null, freezes: 0, frozenDays: [] });

/** Practice happened on `day`: extend, freeze-bridge or restart the streak. */
export function registerActivity(s: StreakState, day: string): StreakState {
  if (s.lastDay === day) return s;
  const gap = s.lastDay ? daysBetween(s.lastDay, day) : Infinity;
  if (gap < 0) return s; // clock went backwards; ignore
  const missed = gap - 1;
  let { freezes } = s;
  let frozenDays = s.frozenDays;
  let current: number;
  if (gap === 1) current = s.current + 1;
  else if (Number.isFinite(gap) && s.current > 0 && missed <= freezes) {
    freezes -= missed;
    frozenDays = [...frozenDays, ...Array.from({ length: missed }, (_, i) => addDays(s.lastDay!, i + 1))].slice(-30);
    current = s.current + 1;
  } else current = 1;
  if (current % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
  return { current, best: Math.max(s.best, current), lastDay: day, freezes, frozenDays };
}

/** Streak as seen on `today`: still alive if yesterday counts or the gap fits the freezes. */
export function liveStreak(s: StreakState, today: string): number {
  if (!s.lastDay) return 0;
  const missed = daysBetween(s.lastDay, today) - 1;
  return missed <= s.freezes ? s.current : 0;
}
