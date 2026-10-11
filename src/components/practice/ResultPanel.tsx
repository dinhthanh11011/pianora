"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw, Star, X } from "lucide-react";
import clsx from "clsx";
import { TIMING_WINDOWS, midiToName, type ScoreSummary } from "@/lib/music-core";
import { Keyboard88 } from "@/components/piano/Keyboard88";

const BIN = 25;
const BINS = (TIMING_WINDOWS.ok * 2) / BIN;

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="text-sm text-muted">{label}</p>
      <p className={clsx("text-2xl font-bold tabular", tone)}>{value}</p>
    </div>
  );
}

function Histogram({ offsets, label, earlier, later }: { offsets: number[]; label: string; earlier: string; later: string }) {
  const bins = useMemo(() => {
    const b = new Array<number>(BINS).fill(0);
    for (const o of offsets) b[Math.min(BINS - 1, Math.max(0, Math.floor((o + TIMING_WINDOWS.ok) / BIN)))]++;
    return b;
  }, [offsets]);
  const max = Math.max(1, ...bins);
  const W = 400, H = 100, bw = W / BINS;
  const fill = (i: number) => {
    const centre = Math.abs(i * BIN - TIMING_WINDOWS.ok + BIN / 2);
    return centre <= TIMING_WINDOWS.perfect ? "var(--success)" : centre <= TIMING_WINDOWS.good ? "var(--primary)" : "var(--accent)";
  };
  return (
    <figure className="w-full max-w-xl">
      <figcaption className="mb-2 text-sm text-muted">{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={label}>
        {bins.map((c, i) => (
          <rect key={i} x={i * bw + 1} y={H - (c / max) * H} width={bw - 2} height={(c / max) * H} rx={2} fill={fill(i)}>
            <title>{`${i * BIN - TIMING_WINDOWS.ok}…${(i + 1) * BIN - TIMING_WINDOWS.ok} ms: ${c}`}</title>
          </rect>
        ))}
        <rect x={W / 2 - 0.5} y={0} width={1} height={H} fill="var(--foreground)" opacity={0.4} />
        <text x={2} y={H + 14} fontSize={11} fill="var(--muted-foreground)">{`${earlier} −${TIMING_WINDOWS.ok}`}</text>
        <text x={W / 2} y={H + 14} fontSize={11} textAnchor="middle" fill="var(--muted-foreground)">0</text>
        <text x={W - 2} y={H + 14} fontSize={11} textAnchor="end" fill="var(--muted-foreground)">{`+${TIMING_WINDOWS.ok} ${later}`}</text>
      </svg>
    </figure>
  );
}

export function ResultPanel({
  summary, from, to, timed, onRetry, onClose,
}: { summary: ScoreSummary; from: number; to: number; timed: boolean; onRetry: () => void; onClose: () => void }) {
  const t = useTranslations("practice.result");
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  const weak = useMemo(
    () =>
      Object.entries(summary.byNote)
        .map(([m, s]) => ({ midi: Number(m), errors: s.misses + s.wrongs, rate: (s.misses + s.wrongs) / (s.hits + s.misses + s.wrongs) }))
        .filter((w) => w.errors > 0)
        .sort((a, b) => b.errors - a.errors || b.rate - a.rate),
    [summary],
  );
  const tints = useMemo(
    () => Object.fromEntries(weak.map((w) => [w.midi, `color-mix(in srgb, var(--danger) ${Math.round(25 + w.rate * 75)}%, var(--key-white))`])),
    [weak],
  );
  const mean = Math.round(summary.meanOffsetMs);
  const tendency = Math.abs(mean) < 15 ? t("onTime") : mean < 0 ? t("rushing", { ms: -mean }) : t("dragging", { ms: mean });

  return (
    <section aria-labelledby="result-h" className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <h2 id="result-h" className="text-2xl font-bold">{t("title")}</h2>
        <div className="flex gap-1" role="img" aria-label={t("stars", { count: summary.stars })}>
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              aria-hidden
              className={clsx("size-8", i <= summary.stars ? "fill-accent text-accent" : "text-border")}
            />
          ))}
        </div>
        <p className="ml-auto text-4xl font-bold tabular text-primary">
          {summary.score}
          <span className="ml-1 text-base font-medium text-muted">{t("score")}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("accuracy")} value={pct(summary.accuracy)} />
        {timed && <Stat label={t("timing")} value={pct(summary.timing)} />}
        <Stat label={t("miss")} value={String(summary.misses)} tone={summary.misses ? "text-danger" : undefined} />
        <Stat label={t("wrong")} value={String(summary.wrongs)} tone={summary.wrongs ? "text-danger" : undefined} />
        {summary.offsets.length > 1 && <Stat label={t("evenness")} value={pct(summary.velocityEvenness)} />}
      </div>

      {timed && summary.hits > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,36rem)_auto] lg:gap-x-10">
          <Histogram offsets={summary.offsets} label={t("histogram")} earlier={t("earlier")} later={t("later")} />
          <ul className="grid grid-cols-2 content-start gap-x-6 gap-y-1 text-sm lg:grid-cols-1">
            {(["perfect", "good", "early", "late"] as const).map((g) => (
              <li key={g} className="flex justify-between gap-4">
                <span className="text-muted">{t(g)}</span>
                <span className="font-semibold tabular">{summary.grades[g]}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm lg:col-span-2">{tendency}</p>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-semibold">{t("weakNotes")}</h3>
        {weak.length ? (
          <>
            <ul className="mb-3 flex flex-wrap gap-2">
              {weak.slice(0, 6).map((w) => (
                <li key={w.midi} className="rounded-lg bg-surface-2 px-3 py-1 text-sm">
                  <strong>{midiToName(w.midi)}</strong> <span className="text-muted">· {t("errors", { count: w.errors })}</span>
                </li>
              ))}
            </ul>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2">
              <div className="min-w-[480px]">
                <Keyboard88 from={from} to={to} tints={tints} labels="c" ariaLabel={t("heatmapLabel")} />
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-success">{t("noWeak")}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-on-primary">
          <RotateCcw className="size-5" aria-hidden />
          {t("retry")}
        </button>
        <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-5 font-semibold hover:bg-border transition-colors duration-200">
          <X className="size-5" aria-hidden />
          {t("close")}
        </button>
      </div>
    </section>
  );
}
