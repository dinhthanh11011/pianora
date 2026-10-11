"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Pause, Play, Plus } from "lucide-react";
import clsx from "clsx";
import { setMetronomeBpm, startMetronome, stopMetronome } from "@/lib/audio/metronome";

const btn = "grid size-11 place-items-center rounded-xl bg-surface-2 hover:bg-border transition-colors duration-200";

export function Metronome() {
  const t = useTranslations("tools");
  const [bpm, setBpm] = useState(80);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);

  useEffect(() => () => stopMetronome(), []);
  useEffect(() => {
    if (running) void setMetronomeBpm(bpm);
  }, [bpm, running]);

  const toggle = async () => {
    if (running) {
      stopMetronome();
      setBeat(-1);
    } else await startMetronome({ bpm, beatsPerBar: beats, onBeat: setBeat });
    setRunning(!running);
  };

  const change = (d: number) => setBpm((b) => Math.min(240, Math.max(30, b + d)));

  return (
    <section className="rounded-2xl border border-border bg-surface p-6" aria-labelledby="metro-h">
      <h2 id="metro-h" className="text-xl font-semibold">{t("metronome")}</h2>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className={btn} onClick={() => change(-5)} aria-label={t("slower")}>
          <Minus className="size-5" aria-hidden />
        </button>
        <output className="w-28 text-center text-4xl font-bold tabular" aria-live="off">
          {bpm}
          <span className="ml-1 text-base font-medium text-muted">BPM</span>
        </output>
        <button type="button" className={btn} onClick={() => change(5)} aria-label={t("faster")}>
          <Plus className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={toggle}
          className="ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-on-primary"
        >
          {running ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
          {running ? t("stop") : t("start")}
        </button>
      </div>
      <input
        type="range" min={30} max={240} value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
        aria-label="BPM" className="mt-4 w-full accent-[var(--primary)]"
      />
      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm text-muted">
          {t("beatsPerBar")}{" "}
          <select
            value={beats} disabled={running} onChange={(e) => setBeats(Number(e.target.value))}
            className="ml-1 rounded-lg bg-surface-2 px-2 py-1 text-foreground"
          >
            {[2, 3, 4, 6].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <div className="flex gap-2" aria-hidden>
          {Array.from({ length: beats }, (_, i) => (
            <span
              key={i}
              className={clsx(
                "size-4 rounded-full transition-colors duration-100",
                beat === i ? (i === 0 ? "bg-accent" : "bg-primary") : "bg-surface-2",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
