import { CurriculumSchema, type Lesson, type Level } from "./schema";
import { level0 } from "./level0";
import { level1 } from "./level1";
import { level2 } from "./level2";
import { level3 } from "./level3";

export * from "./schema";
export { PRACTICE_PIECES, type PracticePiece } from "./songs";

/** Validated at load: a content mistake fails the build/tests instead of a lesson at runtime. */
export const CURRICULUM: Level[] = CurriculumSchema.parse([level0, level1, level2, level3]);

export interface LessonRef {
  lesson: Lesson;
  level: number;
  unitId: string;
  /** Position in the whole path (unlock order). */
  order: number;
}

export const LESSONS: LessonRef[] = CURRICULUM.flatMap((lv) =>
  lv.units.flatMap((u) => u.lessons.map((lesson) => ({ lesson, level: lv.level, unitId: u.id }))),
).map((r, order) => ({ ...r, order }));

const byId = new Map(LESSONS.map((r) => [r.lesson.id, r]));

export const findLesson = (id: string): LessonRef | undefined => byId.get(id);
export const nextLesson = (id: string): LessonRef | undefined => {
  const r = byId.get(id);
  return r ? LESSONS[r.order + 1] : undefined;
};

/** Linear path: a lesson opens once the one before it is completed. */
export function isUnlocked(id: string, completed: (id: string) => boolean): boolean {
  const r = byId.get(id);
  return !!r && (r.order === 0 || completed(LESSONS[r.order - 1].lesson.id));
}
