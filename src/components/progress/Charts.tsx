"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export interface Point {
  /** Axis/tooltip label, e.g. a date. */
  label: string;
  value: number;
}

const W = 400, H = 170, PAD = { l: 30, r: 6, t: 10, b: 22 };
const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;

function niceMax(v: number) {
  if (v <= 0) return 10;
  const step = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / step) * step;
}

function Frame({ title, points, format, children, max }: {
  title: string; points: Point[]; format: (v: number) => string; max: number;
  children: (hover: number | null, setHover: (i: number | null) => void) => React.ReactNode;
}) {
  const t = useTranslations("stats");
  const [hover, setHover] = useState<number | null>(null);
  const ticks = [0, max / 2, max];
  const shown = hover !== null ? points[hover] : null;
  return (
    <figure className="rounded-2xl border border-border bg-surface p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{title}</span>
        <span className="min-h-6 text-sm tabular text-muted" aria-live="polite">{shown && `${shown.label}: ${format(shown.value)}`}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => {
          const y = PAD.t + ih - (v / max) * ih;
          return (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} className="stroke-border" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" className="fill-muted text-[12px] tabular">{Math.round(v)}</text>
            </g>
          );
        })}
        {children(hover, setHover)}
        {points.length > 0 && (
          <>
            <text x={PAD.l} y={H - 6} className="fill-muted text-[12px]">{points[0].label}</text>
            <text x={W - PAD.r} y={H - 6} textAnchor="end" className="fill-muted text-[12px]">{points[points.length - 1].label}</text>
          </>
        )}
      </svg>
      <details className="mt-2 text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-primary">{t("tableView")}</summary>
        <table className="mt-2 w-full max-w-sm tabular">
          <thead><tr className="text-left text-muted"><th className="py-1 font-medium">{t("date")}</th><th className="py-1 font-medium">{t("value")}</th></tr></thead>
          <tbody>
            {points.map((p, i) => <tr key={i} className="border-t border-border"><td className="py-1">{p.label}</td><td className="py-1">{format(p.value)}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Single-series bar chart (e.g. minutes per day). */
export function BarChart({ title, points, format }: { title: string; points: Point[]; format: (v: number) => string }) {
  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const slot = iw / Math.max(1, points.length);
  const bw = Math.max(4, slot - 6);
  return (
    <Frame title={title} points={points} format={format} max={max}>
      {(hover, setHover) => points.map((p, i) => {
        const h = (p.value / max) * ih;
        const x = PAD.l + i * slot + (slot - bw) / 2;
        const y = PAD.t + ih - h;
        const r = Math.min(4, bw / 2, h);
        return (
          <g key={i} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
            <rect x={PAD.l + i * slot} y={PAD.t} width={slot} height={ih} fill="transparent" />
            {h > 0 && (
              <path
                d={`M${x},${PAD.t + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${PAD.t + ih} Z`}
                className={hover === i ? "fill-primary" : "fill-primary/75"}
              />
            )}
          </g>
        );
      })}
    </Frame>
  );
}

/** Single-series line chart with point markers (e.g. scores of recent runs). */
export function LineChart({ title, points, format, max = 100 }: { title: string; points: Point[]; format: (v: number) => string; max?: number }) {
  const step = points.length > 1 ? iw / (points.length - 1) : 0;
  const xy = points.map((p, i) => [PAD.l + (points.length > 1 ? i * step : iw / 2), PAD.t + ih - (p.value / max) * ih] as const);
  return (
    <Frame title={title} points={points} format={format} max={max}>
      {(hover, setHover) => (
        <>
          <polyline points={xy.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-primary" />
          {hover !== null && <line x1={xy[hover][0]} x2={xy[hover][0]} y1={PAD.t} y2={PAD.t + ih} strokeWidth={1} className="stroke-muted" strokeDasharray="3 3" />}
          {xy.map(([x, y], i) => (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={x - Math.max(step, 16) / 2} y={PAD.t} width={Math.max(step, 16)} height={ih} fill="transparent" />
              <circle cx={x} cy={y} r={hover === i ? 6 : 4} strokeWidth={2} className="fill-primary stroke-surface" />
            </g>
          ))}
        </>
      )}
    </Frame>
  );
}
