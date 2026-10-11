import { emptySnapshot } from "@/lib/gamification/events";
import type { ChangeSet, ProgressRepository, ProgressSnapshot } from "./types";

const merge = <T extends { id: string }>(rows: T[], add: T[] = []) => {
  const m = new Map(rows.map((r) => [r.id, r]));
  for (const r of add) m.set(r.id, r);
  return [...m.values()];
};

/** In-memory repository: tests and browsers without IndexedDB (e.g. some private modes). */
export class MemoryProgressRepository implements ProgressRepository {
  constructor(private data: ProgressSnapshot = emptySnapshot()) {}

  async load() {
    return structuredClone(this.data);
  }

  async save(c: ChangeSet) {
    const d = this.data;
    this.data = {
      profile: c.profile ?? d.profile,
      lessons: merge(d.lessons, c.lessons),
      attempts: merge(d.attempts, c.attempts),
      days: merge(d.days, c.days),
      cards: merge(d.cards, c.cards),
      badges: merge(d.badges, c.badges),
    };
  }

  async replaceAll(s: ProgressSnapshot) {
    this.data = structuredClone(s);
  }
}
