"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Gauge } from "lucide-react";
import { startAudio } from "@/lib/audio/tone";
import { onInput } from "@/lib/midi/bus";
import { estimateLatency } from "@/lib/music-core";
import { useSettings } from "@/stores/settings";
import { usePianoInput } from "@/hooks/usePianoInput";

const CLICKS = 8;
const BEAT_MS = 600;

/** Tap along with 8 clicks; the median offset becomes the input latency compensation. */
export function LatencyCalibration() {
  const t = useTranslations("tools");
  usePianoInput();
  const { latencyMs, setLatencyMs } = useSettings();
  const [phase, setPhase] = useState<"idle" | "running" | "failed">("idle");
  const taps = useRef<number[]>([]);

  useEffect(
    () =>
      onInput((e) => {
        if (e.type === "noteon") taps.current.push(e.time);
      }),
    [],
  );

  const run = async () => {
    const Tone = await startAudio();
    const synth = new Tone.Synth({ envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 } }).toDestination();
    const ctx = Tone.getContext().rawContext as AudioContext;
    const startAudioTime = ctx.currentTime + 0.5;
    // Map audio clock → performance.now() clock, including the device output latency.
    const outMs = ((ctx.outputLatency || 0) + (ctx.baseLatency || 0)) * 1000;
    const perfStart = performance.now() + 500 + outMs;
    const clicks: number[] = [];
    for (let i = 0; i < CLICKS; i++) {
      synth.triggerAttackRelease("C6", "32n", startAudioTime + (i * BEAT_MS) / 1000);
      clicks.push(perfStart + i * BEAT_MS);
    }
    taps.current = [];
    setPhase("running");
    setTimeout(() => {
      synth.dispose();
      const est = estimateLatency(clicks, taps.current, BEAT_MS);
      if (est === null) setPhase("failed");
      else {
        setLatencyMs(est);
        setPhase("idle");
      }
    }, 500 + CLICKS * BEAT_MS + 400);
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-6" aria-labelledby="lat-h">
      <h2 id="lat-h" className="flex items-center gap-2 text-xl font-semibold">
        <Gauge className="size-5 text-primary" aria-hidden />
        {t("latency")}
      </h2>
      <p className="mt-2 text-muted">{t("latencyHelp")}</p>
      <p className="mt-3 text-lg tabular" aria-live="polite">
        {phase === "running" ? t("latencyRunning") : phase === "failed" ? t("latencyFailed") : t("latencyValue", { ms: latencyMs })}
      </p>
      <button
        type="button" onClick={run} disabled={phase === "running"}
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-on-primary disabled:opacity-50"
      >
        {t("latencyStart")}
      </button>
    </section>
  );
}
