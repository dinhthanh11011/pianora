"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onInput } from "@/lib/midi/bus";
import { loadPiano, playNotes, releaseAll } from "@/lib/audio/piano";
import { scheduleClicks, type ClickTrack } from "@/lib/audio/metronome";
import { useSettings } from "@/stores/settings";
import {
  TIMING_WINDOWS, TimingMatcher, WaitCursor, barBeats, beatMs, groupChords, layoutMeasures, summarize, timelineLength, toScoreTime,
  toTimeline, type Hand, type Judgement, type Score, type ScoreSummary,
} from "@/lib/music-core";
import type { NoteStatus } from "@/components/notation/StaffView";

export type PracticeMode = "wait" | "playalong" | "performance";
export type Phase = "idle" | "countin" | "playing" | "done";

export interface PracticeConfig {
  mode: PracticeMode;
  /** Tempo multiplier 0.4–1.2. */
  tempo: number;
  hand: Hand | "both";
  /** 1-based inclusive bar range (A–B), or null for the whole piece. */
  bars: { from: number; to: number } | null;
  loop: boolean;
  metronome: boolean;
}

type Flash = "correct" | "wrong";

interface Session {
  startedAt: number;
  matcher: TimingMatcher | null;
  cursor: WaitCursor | null;
  waitJudgements: Judgement[];
  velocities: Map<number, number>;
  clicks: ClickTrack | null;
  played: Set<number>;
  raf: number;
  cursorKey: string;
  countIn: number;
}

const newSession = (): Session => ({
  startedAt: 0, matcher: null, cursor: null, waitJudgements: [], velocities: new Map(), clicks: null,
  played: new Set(), raf: 0, cursorKey: "", countIn: 0,
});

/** Drives one practice run over `score`: clock, input matching, auto-played other hand, results. */
export function usePracticeSession(score: Score, config: PracticeConfig) {
  const { mode, tempo, hand, bars, loop, metronome } = config;
  const bar = barBeats(score.timeSignature);
  const range = bars ? { from: (bars.from - 1) * bar, to: bars.to * bar } : undefined;
  const rangeKey = range ? `${range.from}-${range.to}` : "";

  const timeline = useMemo(
    () => toTimeline(score, { tempo, hand: hand === "both" ? undefined : hand, range }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [score, tempo, hand, rangeKey],
  );
  const other = useMemo(
    () => (hand === "both" ? [] : toTimeline(score, { tempo, hand: hand === "R" ? "L" : "R", range })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [score, tempo, hand, rangeKey],
  );
  const events = useMemo(() => groupChords(timeline), [timeline]);
  const length = useMemo(() => Math.max(timelineLength(timeline), timelineLength(other)), [timeline, other]);
  const beat = beatMs(score.bpm * tempo);
  const barCount = useMemo(() => layoutMeasures(score).length, [score]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [statuses, setStatuses] = useState<Partial<Record<number, NoteStatus>>>({});
  const statusRef = useRef<Partial<Record<number, NoteStatus>>>({});
  const [cursor, setCursor] = useState<number[]>([]);
  const [countIn, setCountIn] = useState(0);
  const [flashes, setFlashes] = useState<Partial<Record<number, Flash>>>({});
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [loopSummary, setLoopSummary] = useState<ScoreSummary | null>(null);
  const s = useRef<Session>(newSession());
  const phaseRef = useRef<Phase>("idle");

  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const mark = (updates: [number, NoteStatus][]) => {
    if (!updates.length) return;
    statusRef.current = { ...statusRef.current, ...Object.fromEntries(updates) };
    setStatuses(statusRef.current);
  };
  const flash = (midi: number, f: Flash) => {
    setFlashes((x) => ({ ...x, [midi]: f }));
    setTimeout(() => setFlashes((x) => {
      const next = { ...x };
      delete next[midi];
      return next;
    }), 250);
  };
  const setCursorIfChanged = (indices: number[]) => {
    const key = indices.join(",");
    if (key === s.current.cursorKey) return;
    s.current.cursorKey = key;
    setCursor(indices);
  };

  const teardown = useCallback(() => {
    cancelAnimationFrame(s.current.raf);
    s.current.clicks?.stop();
    releaseAll();
  }, []);

  // `start` and `finish` reference each other (loop restarts), so keep the latest in a ref.
  const startRef = useRef<() => Promise<void>>(async () => {});

  const finish = (result: ScoreSummary) => {
    teardown();
    if (loop) {
      setLoopSummary(result);
      void startRef.current();
    } else {
      setSummary(result);
      setCursor([]);
      go("done");
    }
  };

  const tick = () => {
    const ses = s.current;
    const now = performance.now() - ses.startedAt;
    if (now < 0) {
      const left = Math.ceil(-now / beat);
      if (left !== ses.countIn) setCountIn((ses.countIn = left));
    } else if (phaseRef.current === "countin") {
      setCountIn((ses.countIn = 0));
      go("playing");
    }
    const latency = useSettings.getState().latencyMs;
    mark(ses.matcher!.advance(now - latency).map((j) => [j.note.index, "miss"]));
    for (const n of other) {
      if (!ses.played.has(n.index) && n.startMs <= now) {
        ses.played.add(n.index);
        void playNotes([n.midi], n.durationMs / 1000, 75);
      }
    }
    setCursorIfChanged(
      timeline.filter((n) => n.startMs - 120 <= now && now < n.startMs + Math.max(n.durationMs, 200)).map((n) => n.index),
    );
    if (now > length + TIMING_WINDOWS.ok + 150) return finish(summarize(ses.matcher!.finish()));
    ses.raf = requestAnimationFrame(tick);
  };

  const start = async () => {
    teardown();
    s.current = newSession();
    statusRef.current = {};
    setStatuses({});
    setSummary(null);
    setFlashes({});
    if (!timeline.length) return;
    await loadPiano();
    if (mode === "wait") {
      s.current.cursor = new WaitCursor(events);
      s.current.cursorKey = "";
      setCursorIfChanged(events[0].notes.map((n) => n.index));
      go("playing");
      return;
    }
    const pieceBeats = Math.ceil(length / beat);
    const clicks = await scheduleClicks({
      bpm: score.bpm * tempo, beatsPerBar: bar, beats: metronome ? bar + pieceBeats : bar,
    });
    s.current.clicks = clicks;
    s.current.startedAt = clicks.startAt + bar * beat;
    s.current.matcher = new TimingMatcher(timeline);
    setCountIn((s.current.countIn = bar));
    go("countin");
    s.current.raf = requestAnimationFrame(tick);
  };
  startRef.current = start;

  const stop = useCallback(() => {
    teardown();
    setCursor([]);
    setCountIn(0);
    setLoopSummary(null);
    go("idle");
  }, [teardown]);

  // Any config change aborts the current run.
  useEffect(() => stop, [stop, timeline, mode, loop, metronome]);

  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    return onInput((e) => {
      const ses = s.current;
      if (e.type === "noteoff") return ses.cursor?.noteOff(e.midi);
      if (e.type !== "noteon") return;

      if (ses.cursor) {
        const ev = ses.cursor.current;
        const { result, advanced } = ses.cursor.noteOn(e.midi);
        flash(e.midi, result);
        ses.velocities.set(e.midi, e.velocity);
        if (result === "wrong") ses.waitJudgements.push({ kind: "wrong", midi: e.midi, timeMs: 0 });
        if (advanced && ev) {
          ev.notes.forEach((note) =>
            ses.waitJudgements.push({ kind: "hit", note, grade: "perfect", offsetMs: 0, velocity: ses.velocities.get(note.midi) ?? 90 }),
          );
          mark(ev.notes.map((n) => [n.index, "perfect"]));
          if (ses.cursor.done) finish(summarize(ses.waitJudgements, { timed: false }));
          else setCursorIfChanged(ses.cursor.current!.notes.map((n) => n.index));
        }
        return;
      }
      if (!ses.matcher) return;
      const t = toScoreTime(e.time, ses.startedAt, useSettings.getState().latencyMs);
      if (t < -TIMING_WINDOWS.ok) return; // still counting in
      const j = ses.matcher.noteOn(e.midi, t, e.velocity);
      if (j.kind === "hit") {
        mark([[j.note.index, j.grade]]);
        flash(e.midi, "correct");
      } else flash(e.midi, "wrong");
    });
    // Handlers read live state through refs; resubscribe only when a run starts/ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "idle" || phase === "done"]);

  /** Score time for visuals: frozen on the current chord in Wait mode. */
  const clock = useCallback(() => {
    const ses = s.current;
    if (ses.cursor) return ses.cursor.current?.startMs ?? length;
    return phaseRef.current === "idle" ? -beat : performance.now() - ses.startedAt;
  }, [length, beat]);

  const dismiss = useCallback(() => {
    setSummary(null);
    go("idle");
  }, []);

  return {
    phase, start, stop, dismiss, summary, loopSummary, statuses, statusRef, cursor, countIn, flashes,
    timeline, clock, barCount,
  };
}
