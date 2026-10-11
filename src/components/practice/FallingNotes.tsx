"use client";

import { useEffect, useMemo, useRef } from "react";
import { pitchClass, type TimedNote } from "@/lib/music-core";
import { keyLayout, type KeyRect } from "@/components/piano/keyLayout";
import type { NoteStatus } from "@/components/notation/StaffView";

export interface FallingNotesProps {
  timeline: TimedNote[];
  /** Same range as the Keyboard88 below so lanes line up. */
  from: number;
  to: number;
  /** Current score time in ms (read every frame). */
  clock: () => number;
  /** Judgements by score note index (read every frame). */
  statuses: React.RefObject<Partial<Record<number, NoteStatus>>>;
  running: boolean;
  /** 0–1: upcoming-note opacity. Lowered at higher levels so students rely on the staff. */
  opacity?: number;
  lookaheadMs?: number;
  height?: number;
  className?: string;
}

const VARS = ["--hand-right", "--hand-left", "--success", "--accent", "--danger", "--border", "--primary"] as const;

/** Canvas "piano roll": notes fall toward the hit line at the bottom, aligned with the keys. */
export function FallingNotes({
  timeline, from, to, clock, statuses, running, opacity = 1, lookaheadMs = 3000, height = 260, className,
}: FallingNotesProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const layout = useMemo(() => {
    const l = keyLayout(from, to);
    const byMidi = new Map<number, KeyRect>();
    [...l.whites, ...l.blacks].forEach((k) => byMidi.set(k.midi, k));
    return { ...l, byMidi };
  }, [from, to]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    let raf = 0;
    let colors: Record<string, string> = {};
    let colorsAt = -Infinity;

    const draw = (ts: number) => {
      if (ts - colorsAt > 500) {
        const cs = getComputedStyle(document.documentElement);
        colors = Object.fromEntries(VARS.map((v) => [v, cs.getPropertyValue(v).trim()]));
        colorsAt = ts;
      }
      const dpr = window.devicePixelRatio || 1;
      const cssW = el.clientWidth;
      if (el.width !== Math.round(cssW * dpr) || el.height !== Math.round(height * dpr)) {
        el.width = Math.round(cssW * dpr);
        el.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, height);
      const sx = cssW / layout.width;
      const pxPerMs = height / lookaheadMs;

      // Octave guides on every C.
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors["--border"];
      for (const k of layout.whites) if (pitchClass(k.midi) === 0) ctx.fillRect(k.x * sx, 0, 1, height);

      const now = clock();
      const st = statuses.current ?? {};
      for (const n of timeline) {
        const bottom = height - (n.startMs - now) * pxPerMs;
        const top = bottom - Math.max(6, n.durationMs * pxPerMs - 2);
        if (top > height || bottom < 0) continue;
        const k = layout.byMidi.get(n.midi);
        if (!k) continue;
        const s = st[n.index];
        ctx.fillStyle =
          s === "miss" ? colors["--danger"]
          : s === "early" || s === "late" ? colors["--accent"]
          : s ? colors["--success"]
          : n.hand === "L" ? colors["--hand-left"] : colors["--hand-right"];
        ctx.globalAlpha = s ? 0.9 : opacity;
        ctx.beginPath();
        ctx.roundRect(k.x * sx + 1, top, k.w * sx - 2, bottom - top, 4);
        ctx.fill();
      }
      // Hit line.
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors["--primary"];
      ctx.fillRect(0, height - 2, cssW, 2);
      if (running) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [timeline, layout, clock, statuses, running, opacity, lookaheadMs, height]);

  return <canvas ref={canvas} aria-hidden className={className} style={{ display: "block", width: "100%", height }} />;
}
