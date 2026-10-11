"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Timer } from "lucide-react";
import clsx from "clsx";
import { LETTERS, SOLFEGE, drillScore, nameToMidi, parseNote, pickRounds, pitchClass, letterPitchClass, type Letter, type Score } from "@/lib/music-core";
import { pointerHandlers } from "@/hooks/usePianoInput";
import { useInputStore } from "@/stores/input";
import { StaffView } from "@/components/notation/StaffView";
import { Keyboard88, type KeyState } from "@/components/piano/Keyboard88";
import { keyLayout } from "@/components/piano/keyLayout";
import type { StepOf } from "@/content/curriculum/schema";
import { DrillResult, StartButton } from "./DrillResult";
import { useLText, type Locale } from "./text";
import { useCountdown, useFlashes, useInputHandler } from "./useDrill";
import type { StepResultFn } from "./types";

type Phase = "idle" | "running" | "done";

const noteScore = (midi: number): Score => ({
  id: `read-${midi}`,
  bpm: 60,
  timeSignature: [4, 4],
  notes: [{ midi, start: 0, duration: 4, hand: midi >= 60 ? "R" : "L" }],
});

/** Name the note on the grand staff, by letter button or piano key. */
export function ReadNoteDrill({ step, onResult }: { step: StepOf<"readNote">; onResult: StepResultFn }) {
  const t = useTranslations("lesson");
  const tx = useLText();
  const locale = useLocale() as Locale;
  const [phase, setPhase] = useState<Phase>("idle");
  const [rounds, setRounds] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [clean, setClean] = useState(true);
  const [score, setScore] = useState(0);
  const [wrongLetter, setWrongLetter] = useState<Letter | null>(null);
  const { flashes, flash } = useFlashes();
  const active = useInputStore((s) => s.active);
  const midi = rounds[idx] ? nameToMidi(rounds[idx]) : null;
  const score1 = useMemo(() => (midi === null ? null : noteScore(midi)), [midi]);

  const pool = step.pool.map(nameToMidi);
  const lo = Math.min(...pool), hi = Math.max(...pool);
  const from = Math.max(21, Math.min(lo - 5, 60 - 12)), to = Math.min(108, Math.max(hi + 5, 60 + 12));

  const finish = (c: number, w: number) => {
    const s = drillScore(c, step.rounds, w);
    setScore(s);
    setPhase("done");
    onResult(s, s >= step.pass * 100);
  };
  const { left, reset } = useCountdown(step.timeLimitSec, phase === "running", () => finish(correct, wrongs));

  const start = () => {
    setRounds(pickRounds(step.pool, step.rounds));
    setIdx(0);
    setCorrect(0);
    setWrongs(0);
    setClean(true);
    setWrongLetter(null);
    reset();
    setPhase("running");
  };

  const answer = (ok: boolean) => {
    if (!ok) {
      setWrongs((w) => w + 1);
      setClean(false);
      return;
    }
    const c = correct + (clean ? 1 : 0);
    setCorrect(c);
    setClean(true);
    setWrongLetter(null);
    if (idx + 1 >= step.rounds) finish(c, wrongs);
    else setIdx(idx + 1);
  };

  const chooseLetter = (l: Letter) => {
    if (phase !== "running" || midi === null) return;
    const ok = letterPitchClass(l) === pitchClass(midi) && parseNote(rounds[idx]).accidental === 0;
    if (!ok) setWrongLetter(l);
    answer(ok);
  };

  useInputHandler((e) => {
    if (e.type !== "noteon" || midi === null) return;
    const ok = step.answer === "key" ? e.midi === midi : pitchClass(e.midi) === pitchClass(midi);
    flash(e.midi, ok ? "correct" : "wrong");
    answer(ok);
  }, phase === "running");

  const states = useMemo(() => {
    const s: Partial<Record<number, KeyState>> = {};
    active.forEach((m) => (s[m] = "active"));
    for (const [m, f] of Object.entries(flashes)) s[Number(m)] = f;
    return s;
  }, [active, flashes]);
  const whites = keyLayout(from, to).whites.length;

  return (
    <article className="space-y-4">
      <h2 className="text-2xl font-bold text-balance">{tx(step.prompt)}</h2>
      <div className="flex flex-wrap items-center gap-4" aria-live="polite">
        {phase === "idle" && <StartButton onClick={start} label={t("startDrill")} />}
        {phase === "running" && (
          <>
            <p className="tabular text-muted">{t("round", { n: idx + 1, total: step.rounds })}</p>
            {step.timeLimitSec && (
              <p className="inline-flex items-center gap-1 tabular font-semibold">
                <Timer className="size-5" aria-hidden /> {left}s
              </p>
            )}
          </>
        )}
      </div>
      {phase === "done" && <DrillResult score={score} passed={score >= step.pass * 100} passMark={Math.round(step.pass * 100)} onRetry={start} />}
      {phase === "running" && score1 && (
        <>
          <div className="max-w-sm rounded-2xl border border-border bg-surface p-2">
            <StaffView score={score1} ariaLabel={t("readStaffLabel")} />
          </div>
          {step.answer === "letter" && (
            <div role="group" aria-label={t("chooseNote")} className="grid max-w-2xl grid-cols-4 gap-2 sm:grid-cols-7">
              {LETTERS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => chooseLetter(l)}
                  className={clsx(
                    "flex min-h-14 flex-col items-center justify-center rounded-xl border-2 font-semibold transition-colors duration-200",
                    wrongLetter === l ? "border-danger bg-danger/10" : "border-border bg-surface hover:border-primary",
                  )}
                >
                  {locale === "vi" ? <>{SOLFEGE[l]}<span className="text-xs text-muted">{l}</span></> : l}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {(step.answer === "key" || phase === "running") && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2">
          <div className="mx-auto" style={{ minWidth: Math.min(900, whites * 26), maxWidth: whites * 48 }}>
            <Keyboard88 from={from} to={to} labels={step.answer === "key" ? "none" : "c"} titles={false} states={states} {...pointerHandlers} ariaLabel={t("keyboardLabel")} />
          </div>
        </div>
      )}
    </article>
  );
}
