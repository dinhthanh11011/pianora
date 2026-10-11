import { create } from "zustand";
import { applyEvent, emptySnapshot, type EventResult, type ProgressEvent } from "@/lib/gamification/events";
import type { DailyGoal } from "@/lib/gamification/goal";
import { MemoryProgressRepository } from "@/lib/storage/memory";
import { LEGACY_KEY, migrateLegacy } from "@/lib/storage/legacy";
import type { ChangeSet, LessonProgress, ProgressRepository, ProgressSnapshot } from "@/lib/storage/types";

interface ProgressState {
  /** True once the repository has been read (avoid SSR/client mismatch). */
  hydrated: boolean;
  snapshot: ProgressSnapshot;
  /** Derived: lesson id → best result. */
  lessons: Record<string, LessonProgress>;
  xp: number;
  /** Newly earned badge ids waiting to be announced. */
  pendingBadges: string[];
  record: (e: ProgressEvent) => EventResult;
  setGoal: (goal: DailyGoal) => void;
  replaceAll: (s: ProgressSnapshot) => Promise<void>;
  dismissBadge: () => void;
}

let repo: ProgressRepository | null = null;
let queue: Promise<void> = Promise.resolve();

/** Writes run in order; a failed write is logged, the in-memory state stays authoritative. */
function persist(task: (r: ProgressRepository) => Promise<void>) {
  const r = repo;
  if (!r) return queue;
  queue = queue.then(() => task(r)).catch((err) => console.error("[progress] save failed", err));
  return queue;
}

const derive = (snapshot: ProgressSnapshot) => ({
  snapshot,
  lessons: Object.fromEntries(snapshot.lessons.map((l) => [l.id, l])),
  xp: snapshot.profile.xp,
});

export const useProgress = create<ProgressState>()((set, get) => ({
  hydrated: false,
  ...derive(emptySnapshot(0)),
  pendingBadges: [],
  record: (e) => {
    const result = applyEvent(get().snapshot, e);
    set({ ...derive(result.snapshot), pendingBadges: [...get().pendingBadges, ...result.badges] });
    void persist((r) => r.save(result.changes));
    return result;
  },
  setGoal: (goal) => {
    const profile = { ...get().snapshot.profile, goal, updatedAt: Date.now() };
    set(derive({ ...get().snapshot, profile }));
    void persist((r) => r.save({ profile } satisfies ChangeSet));
  },
  replaceAll: async (s) => {
    set({ ...derive(s), pendingBadges: [] });
    await persist((r) => r.replaceAll(s));
  },
  dismissBadge: () => set({ pendingBadges: get().pendingBadges.slice(1) }),
}));

async function openRepository(): Promise<{ repo: ProgressRepository; snapshot: ProgressSnapshot }> {
  if (typeof indexedDB !== "undefined") {
    try {
      const { IndexedDbProgressRepository } = await import("@/lib/storage/dexie");
      const db = new IndexedDbProgressRepository();
      return { repo: db, snapshot: await db.load() };
    } catch (err) {
      console.warn("[progress] IndexedDB unavailable, progress kept in memory only", err);
    }
  }
  const mem = new MemoryProgressRepository();
  return { repo: mem, snapshot: await mem.load() };
}

let loading: Promise<void> | null = null;

/** Call from client components that read progress; loads once after mount (and migrates the interim store). */
export function rehydrateProgress(): void {
  loading ??= (async () => {
    const opened = await openRepository();
    repo = opened.repo;
    let snapshot = opened.snapshot;
    let legacy: string | null = null;
    try {
      legacy = localStorage.getItem(LEGACY_KEY);
    } catch {}
    const migrated = migrateLegacy(legacy, snapshot);
    if (migrated) {
      snapshot = migrated;
      await repo.replaceAll(snapshot);
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {}
    }
    useProgress.setState({ ...derive(snapshot), hydrated: true });
  })();
}
