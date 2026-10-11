/** XP for a finished lesson: base by kind + 5 per star. */
export function lessonXp(kind: string, stars: number): number {
  return (kind === "checkpoint" ? 30 : 10) + stars * 5;
}

/** XP for a free practice run: 5 per star, nothing for a failed run. */
export const practiceXp = (stars: number): number => stars * 5;

/** XP for one SRS review: 2 for a recalled card, 0 otherwise. */
export const reviewXp = (quality: number): number => (quality >= 3 ? 2 : 0);

/** XP needed to go from player level `n` to `n + 1`. */
export const xpToNext = (n: number): number => 100 + 50 * (n - 1);

/** Player level (1-based) from total XP, with progress into the current level. */
export function playerLevel(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let rest = Math.max(0, xp);
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, needed: xpToNext(level) };
}
