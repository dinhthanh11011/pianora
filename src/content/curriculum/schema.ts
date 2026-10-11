/**
 * Curriculum schema: Level → Unit → Lesson → Step. Content is plain data validated with zod,
 * so lessons can later move to JSON/MusicXML files without touching the player.
 */
import { z } from "zod";
import { PIANO_MAX, PIANO_MIN } from "@/lib/music-core";

export const LText = z.object({ vi: z.string().min(1), en: z.string().min(1) });
export type LText = z.infer<typeof LText>;

/** Scientific pitch, e.g. "C4", "F#3", "Bb2". */
const NoteName = z.string().regex(/^[A-G](#|b)?\d$/, "note name like C4");
/** Note name with optional octave: "C" means any C. */
const PitchName = z.string().regex(/^[A-G](#|b)?\d?$/, "pitch like C or C4");
const Fraction = z.number().min(0).max(1);

export const ScoreSchema = z.object({
  id: z.string().min(1),
  bpm: z.number().min(20).max(240),
  timeSignature: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
  notes: z
    .array(
      z.object({
        midi: z.number().int().min(PIANO_MIN).max(PIANO_MAX),
        start: z.number().min(0),
        duration: z.number().positive(),
        hand: z.enum(["L", "R"]),
        finger: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
      }),
    )
    .min(1),
});

/** Optional on-screen keyboard shown with a theory/quiz step. */
const KeyboardDemo = z.object({
  from: NoteName,
  to: NoteName,
  highlight: z.array(NoteName).default([]),
  hand: z.enum(["L", "R"]).optional(),
  /** Finger numbers keyed by note name. */
  fingers: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
  labels: z.enum(["c", "white", "none"]).default("c"),
  /** Notes played in sequence by the "Listen" button; inner arrays sound together. */
  demo: z.array(z.union([NoteName, z.array(NoteName)])).optional(),
});

const TheoryStep = z.object({
  type: z.literal("theory"),
  title: LText,
  body: z.array(LText).min(1),
  /** Short bullet tips (posture, counting…). */
  tips: z.array(LText).optional(),
  keyboard: KeyboardDemo.optional(),
});

const QuizStep = z.object({
  type: z.literal("quiz"),
  prompt: LText,
  options: z.array(LText).min(2).max(4),
  answer: z.number().int().min(0),
  explain: LText.optional(),
  keyboard: KeyboardDemo.optional(),
});

/** Press the named key(s) on the piano. */
const FindNoteStep = z.object({
  type: z.literal("findNote"),
  prompt: LText,
  /** "C" = any C; "C4" = exactly middle C. */
  targets: z.array(PitchName).min(1),
  rounds: z.number().int().min(1),
  /** Each round asks for every matching key in range (e.g. all Cs). */
  all: z.boolean().default(false),
  from: NoteName.default("A0"),
  to: NoteName.default("C8"),
  timeLimitSec: z.number().positive().optional(),
  pass: Fraction.default(0.8),
});

/** Name the note shown on the staff (letter buttons or piano key). */
const ReadNoteStep = z.object({
  type: z.literal("readNote"),
  prompt: LText,
  pool: z.array(NoteName).min(2),
  rounds: z.number().int().min(1),
  /** "letter" accepts the right letter in any octave; "key" needs the exact key. */
  answer: z.enum(["letter", "key"]).default("letter"),
  timeLimitSec: z.number().positive().optional(),
  pass: Fraction.default(0.8),
});

/** Tap a rhythm against a click track. Durations in beats; negative = rest. */
const RhythmStep = z.object({
  type: z.literal("rhythm"),
  prompt: LText,
  pattern: z.array(z.number().refine((n) => n !== 0, "non-zero")).min(1),
  bpm: z.number().min(30).max(200),
  timeSignature: z.tuple([z.number().int().min(1), z.number().int().min(1)]).default([4, 4]),
  pass: Fraction.default(0.8),
});

/** Play a score in the practice engine. */
const PlayStep = z.object({
  type: z.literal("play"),
  prompt: LText,
  score: ScoreSchema,
  mode: z.enum(["wait", "playalong", "performance"]).default("wait"),
  hand: z.enum(["both", "L", "R"]).default("both"),
  /** Minimum practice score (0–100) to pass. */
  pass: z.number().min(0).max(100).default(70),
});

export const StepSchema = z.discriminatedUnion("type", [TheoryStep, QuizStep, FindNoteStep, ReadNoteStep, RhythmStep, PlayStep]);
export type Step = z.infer<typeof StepSchema>;
export type StepOf<T extends Step["type"]> = Extract<Step, { type: T }>;

export const LESSON_KINDS = ["theory", "drill", "technique", "song", "checkpoint"] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];

export const LessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(LESSON_KINDS),
  title: LText,
  summary: LText,
  /** Typical minutes, shown on the path. */
  minutes: z.number().int().positive().default(5),
  steps: z.array(StepSchema).min(1),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const UnitSchema = z.object({ id: z.string().min(1), title: LText, lessons: z.array(LessonSchema).min(1) });
export type Unit = z.infer<typeof UnitSchema>;

export const LevelSchema = z.object({
  level: z.number().int().min(0).max(10),
  title: LText,
  /** Measurable goal that unlocks the next level. */
  goal: LText,
  units: z.array(UnitSchema).min(1),
});
export type Level = z.infer<typeof LevelSchema>;
/** What content files are written as (defaults not yet applied). */
export type LevelInput = z.input<typeof LevelSchema>;

/** Rules zod can't express per-field: quiz answer in range. */
export const CurriculumSchema = z.array(LevelSchema).superRefine((levels, ctx) => {
  const ids = new Set<string>();
  for (const lv of levels)
    for (const u of lv.units)
      for (const l of u.lessons) {
        if (ids.has(l.id)) ctx.addIssue({ code: "custom", message: `duplicate lesson id ${l.id}` });
        ids.add(l.id);
        l.steps.forEach((s, i) => {
          if (s.type === "quiz" && s.answer >= s.options.length)
            ctx.addIssue({ code: "custom", message: `${l.id} step ${i}: answer out of range` });
        });
      }
});
