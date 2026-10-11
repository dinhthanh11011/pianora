import { z } from "zod";
import type { ProgressSnapshot } from "./types";

const Stars = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ts = z.number().nonnegative();

const SnapshotSchema = z.object({
  profile: z.object({
    id: z.literal("me"),
    xp: z.number().nonnegative(),
    streak: z.object({
      current: z.number().int().nonnegative(), best: z.number().int().nonnegative(), lastDay: Day.nullable(),
      freezes: z.number().int().nonnegative(), frozenDays: z.array(Day),
    }),
    goal: z.object({ kind: z.enum(["minutes", "lessons"]), target: z.number().positive() }),
    updatedAt: ts,
  }),
  lessons: z.array(z.object({ id: z.string(), score: z.number(), stars: Stars, attempts: z.number().int(), completedAt: ts, updatedAt: ts })),
  attempts: z.array(z.object({
    id: z.string(), kind: z.enum(["lesson", "practice"]), refId: z.string(), score: z.number(), stars: Stars,
    accuracy: z.number().optional(), timing: z.number().optional(), durationMs: z.number().nonnegative(),
    hand: z.enum(["both", "R", "L"]).optional(), mode: z.string().optional(), tempo: z.number().optional(), at: ts, updatedAt: ts,
  })),
  days: z.array(z.object({
    id: Day, activeMs: z.number().nonnegative(), xp: z.number(), lessons: z.number().int(), practices: z.number().int(),
    reviews: z.number().int(), updatedAt: ts,
  })),
  cards: z.array(z.object({
    id: z.string(), deck: z.enum(["note", "chord"]), prompt: z.string(), ease: z.number().min(1.3), interval: z.number().nonnegative(),
    reps: z.number().int(), lapses: z.number().int(), due: Day.nullable(), createdAt: ts, updatedAt: ts,
  })),
  badges: z.array(z.object({ id: z.string(), earnedAt: ts, updatedAt: ts })),
});

export const BACKUP_APP = "pianora";
export const BACKUP_VERSION = 1;

const BackupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(BACKUP_VERSION),
  exportedAt: ts,
  data: SnapshotSchema,
});

export function toBackupJson(s: ProgressSnapshot, now = Date.now()): string {
  return JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now, data: s }, null, 2);
}

/** Parse and validate a backup file; throws on anything that isn't a Pianora v1 backup. */
export function parseBackup(json: string): ProgressSnapshot {
  return BackupSchema.parse(JSON.parse(json)).data;
}
