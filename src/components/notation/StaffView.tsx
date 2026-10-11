"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isBlackKey, layoutMeasures, vexKey, type Score } from "@/lib/music-core";

/** Per-note feedback, keyed by score note index. */
export type NoteStatus = "perfect" | "good" | "early" | "late" | "miss";

export interface StaffViewProps {
  score: Score;
  statuses?: Partial<Record<number, NoteStatus>>;
  /** Score note indices under the cursor (highlighted + cursor bar). */
  cursor?: number[];
  ariaLabel?: string;
  className?: string;
}

const STATUS_COLOR: Record<NoteStatus, string> = {
  perfect: "var(--success)",
  good: "var(--success)",
  early: "var(--accent)",
  late: "var(--accent)",
  miss: "var(--danger)",
};
const CURSOR_COLOR = "var(--primary)";
const MEASURE_W = 230;
const HEAD_W = 80; // clef + time signature on the first bar of a row
const ROW_H = 230;
const BASS_DY = 100;
const LEFT = 22; // room for the brace

type VF = typeof import("vexflow/bravura");
let vexflow: Promise<VF> | null = null;
const loadVexFlow = () =>
  (vexflow ??= import("vexflow/bravura").then(async (m) => {
    await document.fonts.load("30px Bravura").catch(() => undefined);
    return m;
  }));

/** Grand staff (treble = right hand, bass = left hand) rendered with VexFlow into SVG. */
export function StaffView({ score, statuses = {}, cursor = [], ariaLabel, className }: StaffViewProps) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const measures = useMemo(() => layoutMeasures(score), [score]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cursorKey = cursor.join(",");
  const statusKey = JSON.stringify(statuses);

  useEffect(() => {
    const el = host.current;
    if (!el || width < 200) return;
    let cancelled = false;

    void loadVexFlow().then((VF) => {
      if (cancelled) return;
      const { Renderer, Stave, StaveNote, StaveConnector, Voice, Formatter, Accidental, Dot, Beam, StaveTie, BarlineType } = VF;
      el.innerHTML = "";
      // Narrow screens: engrave on a wider logical canvas and scale down (≥2 bars per row).
      const scale = width < 640 ? Math.max(0.55, width / (HEAD_W + LEFT + 6 + 2 * MEASURE_W)) : 1;
            const lw = width / scale;
      const perRow = Math.max(1, Math.floor((lw - HEAD_W - LEFT - 6) / MEASURE_W));
      const rows = Math.ceil(measures.length / perRow);
      const renderer = new Renderer(el, Renderer.Backends.SVG);
      renderer.resize(width, (rows * ROW_H - 30) * scale);
      const ctx = renderer.getContext();
      ctx.scale(scale, scale);
      ctx.setFillStyle("var(--foreground)");
      ctx.setStrokeStyle("var(--foreground)");

      const inCursor = new Set(cursor);
      const [num, den] = score.timeSignature;
      const cursorXs: { x: number; y: number }[] = [];

      measures.forEach((m, i) => {
        const col = i % perRow;
        const row = Math.floor(i / perRow);
        const rowCount = Math.min(perRow, measures.length - row * perRow);
        const mw = (lw - HEAD_W - LEFT - 6) / rowCount;
        const x = col === 0 ? LEFT : LEFT + HEAD_W + col * mw;
        const w = col === 0 ? HEAD_W + mw : mw;
        const y = row * ROW_H;
        const treble = new Stave(x, y, w);
        const bass = new Stave(x, y + BASS_DY, w);
        if (col === 0) {
          treble.addClef("treble");
          bass.addClef("bass");
          if (i === 0) {
            treble.addTimeSignature(`${num}/${den}`);
            bass.addTimeSignature(`${num}/${den}`);
          }
        }
        if (i === measures.length - 1) {
          treble.setEndBarType(BarlineType.END);
          bass.setEndBarType(BarlineType.END);
        }
        // Align note start on both staves (time signature only on the very first bar).
        const startX = Math.max(treble.getNoteStartX(), bass.getNoteStartX());
        treble.setNoteStartX(startX);
        bass.setNoteStartX(startX);
        treble.setContext(ctx).draw();
        bass.setContext(ctx).draw();
        if (col === 0) {
          new StaveConnector(treble, bass).setType("brace").setContext(ctx).draw();
          new StaveConnector(treble, bass).setType("singleLeft").setContext(ctx).draw();
        }
        new StaveConnector(treble, bass)
          .setType(i === measures.length - 1 ? "boldDoubleRight" : "singleRight")
          .setContext(ctx)
          .draw();

        const build = (tokens: typeof m.treble, clef: "treble" | "bass") => {
          const ties: [InstanceType<typeof StaveNote>, InstanceType<typeof StaveNote>, number[]][] = [];
          let prevTied: InstanceType<typeof StaveNote> | null = null;
          const notes = tokens.map((t) => {
            const keys = t.rest ? [clef === "treble" ? "b/4" : "d/3"] : t.midis.map(vexKey);
            const wholeBarRest = t.rest && tokens.length === 1;
            const n = new StaveNote({ keys, duration: t.duration + (t.rest ? "r" : ""), dots: t.dots, clef, autoStem: true, alignCenter: wholeBarRest });
            if (t.dots) Dot.buildAndAttach([n], { all: true });
            t.midis.forEach((midi, k) => {
              if (isBlackKey(midi) && !prevTied) n.addModifier(new Accidental("#"), k);
            });
            t.indices.forEach((idx, k) => {
              const st = statuses[idx];
              const color = inCursor.has(idx) ? CURSOR_COLOR : st ? STATUS_COLOR[st] : null;
              if (color) n.setKeyStyle(k, { fillStyle: color, strokeStyle: color });
            });
            if (prevTied) ties.push([prevTied, n, t.midis.map((_, k) => k)]);
            prevTied = t.tie ? n : null;
            return n;
          });
          const voice = new Voice({ numBeats: num, beatValue: den }).setMode(Voice.Mode.SOFT).addTickables(notes);
          return { voice, notes, ties };
        };

        const tv = build(m.treble, "treble");
        const bv = build(m.bass, "bass");
        new Formatter().joinVoices([tv.voice]).joinVoices([bv.voice]).format([tv.voice, bv.voice], treble.getNoteEndX() - startX - 12);
        const beams = [...Beam.generateBeams(tv.notes), ...Beam.generateBeams(bv.notes)];
        tv.voice.draw(ctx, treble);
        bv.voice.draw(ctx, bass);
        beams.forEach((b) => b.setContext(ctx).draw());
        [...tv.ties, ...bv.ties].forEach(([a, b, idx]) =>
          new StaveTie({ firstNote: a, lastNote: b, firstIndexes: idx, lastIndexes: idx }).setContext(ctx).draw(),
        );
        // Cursor x: first note under the cursor in this measure (either staff).
        const hit = [...tv.notes, ...bv.notes].find((_, k) => {
          const tok = k < m.treble.length ? m.treble[k] : m.bass[k - m.treble.length];
          return tok.indices.some((idx) => inCursor.has(idx));
        });
        if (hit) cursorXs.push({ x: hit.getAbsoluteX(), y });
      });

      const svg = el.querySelector("svg");
      if (!svg) return;
      svg.setAttribute("role", "img");
      if (ariaLabel) svg.setAttribute("aria-label", ariaLabel);
      // VexFlow hardcodes black in places; map it to the theme foreground.
      svg.querySelectorAll('[fill="black"],[fill="#000"]').forEach((n) => n.setAttribute("fill", "var(--foreground)"));
      svg.querySelectorAll('[stroke="black"],[stroke="#000"]').forEach((n) => n.setAttribute("stroke", "var(--foreground)"));
      const c = cursorXs[0];
      if (c) {
        const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        Object.entries({ x: c.x - 8, y: c.y + 20, width: 28, height: BASS_DY + 80, rx: 6, fill: CURSOR_COLOR, opacity: 0.18 }).forEach(
          ([k, v]) => r.setAttribute(k, String(v)),
        );
        svg.insertBefore(r, svg.firstChild);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const box = el.getBoundingClientRect();
        if (c.y * scale + box.top < 0 || (c.y + ROW_H) * scale + box.top > window.innerHeight)
          r.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
      }
    });
    return () => {
      cancelled = true;
    };
    // statusKey/cursorKey stand in for the object/array identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measures, width, statusKey, cursorKey, score.timeSignature, ariaLabel]);

  return <div ref={host} className={className} style={{ minHeight: ROW_H - 30 }} />;
}
