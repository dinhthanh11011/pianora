/** Local calendar day as `YYYY-MM-DD` (streaks and goals follow the learner's own midnight). */
export function dayKey(t: number | Date = Date.now()): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Whole days from `a` to `b` (both `YYYY-MM-DD`), DST-safe. */
export function daysBetween(a: string, b: string): number {
  const utc = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

/** The last `n` days ending at `today`, oldest first. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}
