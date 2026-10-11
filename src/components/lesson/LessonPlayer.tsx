"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Lock, RotateCcw, Star, X } from "lucide-react";
import clsx from "clsx";
import { starsFor } from "@/lib/music-core";
import { findLesson, isUnlocked, nextLesson, type Step } from "@/content/curriculum";
import { Link } from "@/i18n/navigation";
import { usePianoInput } from "@/hooks/usePianoInput";
import { rehydrateProgress, useProgress } from "@/stores/progress";
import { PracticePlayer } from "@/components/practice/PracticePlayer";
import { MidiStatus } from "@/components/piano/MidiStatus";
import { TheoryStep } from "./TheoryStep";
import { QuizStep } from "./QuizStep";
import { FindNoteDrill } from "./FindNoteDrill";
import { ReadNoteDrill } from "./ReadNoteDrill";
import { RhythmDrill } from "./RhythmDrill";
import { useLText } from "./text";
import type { StepResultFn } from "./types";

const graded = (s: Step) => s.type !== "theory";

/** XP for a finished lesson: base by kind + 5 per star. */
export function lessonXp(kind: string, stars: number): number {
  return (kind === "checkpoint" ? 30 : 10) + stars * 5;
}

function StepView({ step, level, onResult }: { step: Step; level: number; onResult: StepResultFn }) {
  const tx = useLText();
  switch (step.type) {
    case "theory":
      return <TheoryStep step={step} />;
    case "quiz":
      return <QuizStep step={step} onResult={onResult} />;
    case "findNote":
      return <FindNoteDrill step={step} onResult={onResult} />;
    case "readNote":
      return <ReadNoteDrill step={step} onResult={onResult} />;
    case "rhythm":
      return <RhythmDrill step={step} onResult={onResult} />;
    case "play":
      return (
        <article className="space-y-2">
          <h2 className="text-2xl font-bold text-balance">{tx(step.prompt)}</h2>
          <PracticePlayer
            pieces={[{ score: step.score, title: step.prompt, level }]}
            initial={{ mode: step.mode, hand: step.hand }}
            wireInput={false}
            onFinish={(s) => onResult(s.score, s.score >= step.pass)}
          />
        </article>
      );
  }
}

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  usePianoInput();
  const t = useTranslations("lesson");
  const tx = useLText();
  const ref = findLesson(lessonId)!;
  const { lesson } = ref;
  const [stepIdx, setStepIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<(number | null)[]>(() => lesson.steps.map(() => null));
  const [done, setDone] = useState<{ score: number; stars: 0 | 1 | 2 | 3; xp: number } | null>(null);
  const { hydrated, lessons, completeLesson } = useProgress();
  useEffect(rehydrateProgress, []);

  const step = lesson.steps[stepIdx];
  const canContinue = !graded(step) || results[stepIdx] !== null;
  const last = stepIdx === lesson.steps.length - 1;
  const next = nextLesson(lessonId);

  const onResult: StepResultFn = (score, passed) => {
    if (passed) setResults((r) => r.map((v, i) => (i === stepIdx ? Math.max(v ?? 0, score) : v)));
  };

  const finish = () => {
    const scores = lesson.steps.flatMap((s, i) => (graded(s) ? [results[i] ?? 0] : []));
    const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
    const stars = Math.max(1, starsFor(score)) as 1 | 2 | 3;
    const xp = lessonXp(lesson.kind, stars);
    completeLesson(lesson.id, score, stars, xp);
    setDone({ score, stars, xp });
  };

  const restart = () => {
    setResults(lesson.steps.map(() => null));
    setStepIdx(0);
    setAttempt((a) => a + 1);
    setDone(null);
  };

  if (hydrated && !isUnlocked(lessonId, (id) => !!lessons[id])) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
        <Lock className="mx-auto size-10 text-muted" aria-hidden />
        <p className="mt-4 text-lg">{t("locked")}</p>
        <Link href="/path" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 font-semibold text-on-primary">
          {t("backToPath")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/path" aria-label={t("exit")} className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-surface-2">
          <X className="size-6" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            {t(`kinds.${lesson.kind}`)} · {t("levelN", { n: ref.level })}
          </p>
          <h1 className="truncate text-xl font-bold lg:text-2xl">{tx(lesson.title)}</h1>
        </div>
      </header>
      {!done && (
        <div className="flex items-center gap-3">
          <div
            role="progressbar" aria-label={t("progress")} aria-valuemin={1} aria-valuemax={lesson.steps.length} aria-valuenow={stepIdx + 1}
            className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((stepIdx + (canContinue ? 1 : 0)) / lesson.steps.length) * 100}%` }} />
          </div>
          <span className="text-sm tabular text-muted">{t("stepOf", { n: stepIdx + 1, total: lesson.steps.length })}</span>
        </div>
      )}

      {done ? (
        <section aria-labelledby="lesson-done" className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
          <h2 id="lesson-done" className="text-2xl font-bold">{t("complete")}</h2>
          <div className="mt-4 flex justify-center gap-2" role="img" aria-label={t("stars", { count: done.stars })}>
            {[1, 2, 3].map((i) => (
              <Star key={i} className={clsx("size-10", i <= done.stars ? "fill-accent text-accent" : "text-border")} aria-hidden />
            ))}
          </div>
          <p className="mt-4 text-lg tabular">{t("lessonScore", { score: done.score })} · <strong className="text-accent">+{done.xp} XP</strong></p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-4 font-medium hover:bg-border">
              <RotateCcw className="size-5" aria-hidden /> {t("retry")}
            </button>
            <Link href="/path" className="inline-flex min-h-11 items-center rounded-xl bg-surface-2 px-4 font-medium hover:bg-border">{t("backToPath")}</Link>
            {next && (
              <Link href={`/lesson/${next.lesson.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-on-primary">
                {t("nextLesson")} <ChevronRight className="size-5" aria-hidden />
              </Link>
            )}
          </div>
        </section>
      ) : (
        <>
          {(step.type === "findNote" || step.type === "readNote" || step.type === "rhythm") && <MidiStatus />}
          <div key={`${stepIdx}-${attempt}`}>
            <StepView step={step} level={ref.level} onResult={onResult} />
          </div>
          <nav className="flex items-center justify-between gap-3 border-t border-border pt-4" aria-label={t("stepNav")}>
            <button
              type="button" disabled={stepIdx === 0} onClick={() => setStepIdx(stepIdx - 1)}
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-4 font-medium hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronLeft className="size-5" aria-hidden /> {t("back")}
            </button>
            {!canContinue && <p className="text-sm text-muted">{t("passToContinue")}</p>}
            <button
              type="button" disabled={!canContinue} onClick={() => (last ? finish() : setStepIdx(stepIdx + 1))}
              className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-primary px-6 font-semibold text-on-primary disabled:opacity-40"
            >
              {last ? t("finish") : t("continue")} <ChevronRight className="size-5" aria-hidden />
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
