import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LessonResult {
  /** Best score 0–100 and stars across attempts. */
  score: number;
  stars: 0 | 1 | 2 | 3;
  attempts: number;
  completedAt: number;
}

interface ProgressState {
  lessons: Record<string, LessonResult>;
  xp: number;
  /** True once localStorage has been read (avoid SSR/client mismatch). */
  hydrated: boolean;
  completeLesson: (id: string, score: number, stars: 0 | 1 | 2 | 3, xp: number) => void;
}

/**
 * Interim lesson progress in localStorage so the path can lock/unlock now.
 * P5.1 moves this behind ProgressRepository (Dexie) and migrates this key.
 */
export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      lessons: {},
      xp: 0,
      hydrated: false,
      completeLesson: (id, score, stars, xp) =>
        set((s) => {
          const prev = s.lessons[id];
          const best: LessonResult = {
            score: Math.max(prev?.score ?? 0, score),
            stars: Math.max(prev?.stars ?? 0, stars) as LessonResult["stars"],
            attempts: (prev?.attempts ?? 0) + 1,
            completedAt: Date.now(),
          };
          return { lessons: { ...s.lessons, [id]: best }, xp: s.xp + xp };
        }),
    }),
    {
      name: "pianora-progress",
      skipHydration: true,
      partialize: ({ lessons, xp }) => ({ lessons, xp }),
      onRehydrateStorage: () => () => useProgress.setState({ hydrated: true }),
    },
  ),
);

/** Call from client components that read progress; rehydrates once after mount. */
export function rehydrateProgress(): void {
  if (!useProgress.getState().hydrated) void useProgress.persist.rehydrate();
}
