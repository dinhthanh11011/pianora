"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Hand, Volume2 } from "lucide-react";
import {
  TimingMatcher, barBeats, beatMs, rhythmScore, summarize, timelineLength, toScoreTime, toTimeline, type ScoreSummary,
} from "@/lib/music-core";
import { scheduleClicks, type ClickTrack } from "@/lib/audio/metronome";
import { playNotes } from "@/lib/audio/piano";
import { useSettings } from "@/stores/settings";
import { StaffView, type NoteStatus } from "@/components/notation/StaffView";
import type { StepOf } from "@/content/curriculum/schema";
import { DrillResult, StartButton } from "./DrillResult";
import { useLText } from "./text";
import { useInputHandler } from "./useDrill";
import type { StepResultFn } from "./types";

type Phase = "idle" | "countin" | "running" | "done";
const TAP_MIDI = 72;

/** Tap the pattern (any key, Space/pedal or the Tap button) in time with a click track. */
export function RhythmDrill({ step, onResult }: { step: StepOf<"rhythm">; onResult: StepResultFn }) {
  const t = useTranslations("lesson");
  const tx = useLText();
  const score = useMemo(() => rhythmScore(step.pattern, step.bpm, step.timeSignature, TAP_MIDI), [step]);
  const timeline = useMemo(() => toTimeline(score), [score]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statuses, setStatuses] = useState<Partial<Record<number, NoteStatus>>>({});
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [countIn, setCountIn] = useState(0);
  const run = useRef<{ matcher: TimingMatcher; startedAt: number; clicks: ClickTrack; raf: number } | null>(null);

  const bar = barBeats(step.timeSignature);
  const beat = beatMs(step.bpm);
  const patternBeats = step.pattern.reduce((a, d) => a + Math.abs(d), 0);

  const stop = () => {
    if (!run.current) return;
    cancelAnimationFrame(run.current.raf);
    run.current.clicks.stop();
    run.current = null;
  };
  useEffect(() => stop, []);

  const finish = () => {
    const r = run.current;
    if (!r) return;
    const s = summarize(r.matcher.finish(), { timed: true });
    stop();
    setSummary(s);
    setPhase("done");
    onResult(s.score, s.score >= step.pass * 100);
  };

  const start = async () => {
    stop();
    setStatuses({});
    setSummary(null);
    const beats = bar + Math.ceil(patternBeats / bar) * bar;
    const clicks = await scheduleClicks({ bpm: step.bpm, beatsPerBar: step.timeSignature[0], beats });
    const startedAt = clicks.startAt + bar * beat;
    const matcher = new TimingMatcher(timeline);
    const end = timelineLength(timeline);
    run.current = { matcher, startedAt, clicks, raf: 0 };
    setPhase("countin");
    const loop = () => {
      const r = run.current;
      if (!r) return;
      const now = performance.now() - startedAt;
      if (now < 0) setCountIn(Math.ceil(-now / beat));
      else setPhase("running");
      const missed = r.matcher.advance(now - useSettings.getState().latencyMs);
      if (missed.length) setStatuses((s) => ({ ...s, ...Object.fromEntries(missed.map((m) => [m.note.index, "miss"])) }));
      if (now > end + 400) return finish();
      r.raf = requestAnimationFrame(loop);
    };
    run.current.raf = requestAnimationFrame(loop);
  };

  const tap = (time: number) => {
    const r = run.current;
    if (!r) return;
    const j = r.matcher.noteOn(TAP_MIDI, toScoreTime(time, r.startedAt, useSettings.getState().latencyMs));
    if (j.kind === "hit") setStatuses((s) => ({ ...s, [j.note.index]: j.grade }));
  };

  useInputHandler((e) => {
    if (e.type === "noteon" || (e.type === "sustain" && e.on)) tap(e.time);
  }, phase === "countin" || phase === "running");

  const listen = () => {
    let t0 = 0;
    for (const d of step.pattern) {
      if (d > 0) window.setTimeout(() => void playNotes([TAP_MIDI], Math.min(0.5, (d * beat) / 1000)), t0);
      t0 += Math.abs(d) * beat;
    }
  };

  const busy = phase === "countin" || phase === "running";
  return (
    <article className="space-y-4">
      <h2 className="text-2xl font-bold text-balance">{tx(step.prompt)}</h2>
      <p className="text-muted">{t("rhythmHelp", { bpm: step.bpm })}</p>
      <div className="relative rounded-2xl border border-border bg-surface p-2">
        <StaffView score={score} statuses={statuses} ariaLabel={t("rhythmStaffLabel")} />
        {phase === "countin" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-live="assertive">
            <p className="rounded-2xl bg-surface/90 px-8 py-4 text-6xl font-bold tabular text-primary shadow-lg">{countIn}</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {!busy && (
          <>
            {phase === "idle" && <StartButton onClick={() => void start()} label={t("startDrill")} />}
            <button type="button" onClick={listen} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-4 font-medium hover:bg-border">
              <Volume2 className="size-5" aria-hidden /> {t("listen")}
            </button>
          </>
        )}
        {busy && (
          <button
            type="button"
            onPointerDown={(e) => tap(e.timeStamp)}
            className="inline-flex min-h-24 min-w-48 items-center justify-center gap-2 rounded-2xl bg-primary text-2xl font-bold text-on-primary active:scale-95 motion-reduce:transform-none"
          >
            <Hand className="size-7" aria-hidden /> {t("tap")}
          </button>
        )}
      </div>
      {summary && (
        <DrillResult
          score={summary.score} passed={summary.score >= step.pass * 100} passMark={Math.round(step.pass * 100)}
          onRetry={() => void start()}
          detail={t("rhythmDetail", { hits: summary.hits, total: summary.total, extra: summary.wrongs })}
        />
      )}
    </article>
  );
}
