"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Timer } from "lucide-react";
import { drillScore, keysFor, nameToMidi, pickRounds, pitchMatches } from "@/lib/music-core";
import { pointerHandlers } from "@/hooks/usePianoInput";
import { useInputStore } from "@/stores/input";
import { Keyboard88, type KeyState } from "@/components/piano/Keyboard88";
import { keyLayout } from "@/components/piano/keyLayout";
import type { StepOf } from "@/content/curriculum/schema";
import { DrillResult, StartButton } from "./DrillResult";
import { noteLabel, useLText, type Locale } from "./text";
import { useCountdown, useFlashes, useInputHandler } from "./useDrill";
import type { StepResultFn } from "./types";

type Phase = "idle" | "running" | "done";

/** Press the named key (or, with `all`, every matching key in range). */
export function FindNoteDrill({ step, onResult }: { step: StepOf<"findNote">; onResult: StepResultFn }) {
  const t = useTranslations("lesson");
  const tx = useLText();
  const locale = useLocale() as Locale;
  const from = nameToMidi(step.from), to = nameToMidi(step.to);
  const [phase, setPhase] = useState<Phase>("idle");
  const [rounds, setRounds] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [roundClean, setRoundClean] = useState(true);
  const [found, setFound] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const { flashes, flash } = useFlashes();
  const active = useInputStore((s) => s.active);
  const target = rounds[idx];

  const finish = (c: number, w: number) => {
    const s = drillScore(c, step.rounds, w);
    setScore(s);
    setPhase("done");
    onResult(s, s >= step.pass * 100);
  };
  const { left, reset } = useCountdown(step.timeLimitSec, phase === "running", () => finish(correct, wrongs));

  const start = () => {
    setRounds(pickRounds(step.targets, step.rounds));
    setIdx(0);
    setCorrect(0);
    setWrongs(0);
    setRoundClean(true);
    setFound([]);
    reset();
    setPhase("running");
  };

  const nextRound = (c: number) => {
    setFound([]);
    setRoundClean(true);
    if (idx + 1 >= step.rounds) finish(c, wrongs);
    else setIdx(idx + 1);
  };

  useInputHandler((e) => {
    if (e.type !== "noteon" || !target) return;
    if (e.midi < from || e.midi > to || !pitchMatches(e.midi, target)) {
      flash(e.midi, "wrong");
      setWrongs((w) => w + 1);
      setRoundClean(false);
      return;
    }
    flash(e.midi, "correct");
    const all = step.all ? keysFor(target, from, to) : [e.midi];
    const nowFound = found.includes(e.midi) ? found : [...found, e.midi];
    if (nowFound.length < all.length) return setFound(nowFound);
    const c = correct + (roundClean ? 1 : 0);
    setCorrect(c);
    nextRound(c);
  }, phase === "running");

  const states = useMemo(() => {
    const s: Partial<Record<number, KeyState>> = {};
    active.forEach((m) => (s[m] = "active"));
    found.forEach((m) => (s[m] = "correct"));
    for (const [m, f] of Object.entries(flashes)) s[Number(m)] = f;
    return s;
  }, [active, found, flashes]);

  const whites = keyLayout(from, to).whites.length;
  return (
    <article className="space-y-4">
      <h2 className="text-2xl font-bold text-balance">{tx(step.prompt)}</h2>
      <div className="flex flex-wrap items-center gap-4" aria-live="polite">
        {phase === "running" && target && (
          <>
            <p className="rounded-2xl bg-primary px-6 py-3 text-3xl font-bold text-on-primary">{noteLabel(target, locale)}</p>
            <p className="tabular text-muted">{t("round", { n: idx + 1, total: step.rounds })}</p>
            {step.all && <p className="tabular text-muted">{t("foundCount", { n: found.length, total: keysFor(target, from, to).length })}</p>}
            {step.timeLimitSec && (
              <p className="inline-flex items-center gap-1 tabular font-semibold">
                <Timer className="size-5" aria-hidden /> {left}s
              </p>
            )}
          </>
        )}
        {phase === "idle" && <StartButton onClick={start} label={t("startDrill")} />}
      </div>
      {phase === "done" && <DrillResult score={score} passed={score >= step.pass * 100} passMark={Math.round(step.pass * 100)} onRetry={start} />}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2">
        <div className="mx-auto" style={{ minWidth: Math.min(900, whites * 26), maxWidth: whites * 48 }}>
          <Keyboard88 from={from} to={to} labels="none" titles={false} states={states} {...pointerHandlers} ariaLabel={t("keyboardLabel")} />
        </div>
      </div>
    </article>
  );
}
