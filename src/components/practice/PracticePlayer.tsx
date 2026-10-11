"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Play, Square } from "lucide-react";
import clsx from "clsx";
import { PIANO_MAX, PIANO_MIN, type ScoreSummary } from "@/lib/music-core";
import { PRACTICE_PIECES, type PracticePiece } from "@/content/curriculum/songs";
import { usePianoInput, pointerHandlers } from "@/hooks/usePianoInput";
import { usePracticeSession, type PracticeConfig, type PracticeMode } from "@/hooks/usePracticeSession";
import { useInputStore } from "@/stores/input";
import { StaffView } from "@/components/notation/StaffView";
import { Keyboard88, type Hand as KeyHand, type KeyState } from "@/components/piano/Keyboard88";
import { MidiStatus } from "@/components/piano/MidiStatus";
import { keyLayout } from "@/components/piano/keyLayout";
import { FallingNotes } from "./FallingNotes";
import { ResultPanel } from "./ResultPanel";

const MODES: PracticeMode[] = ["wait", "playalong", "performance"];
const HANDS = ["both", "R", "L"] as const;

function Segmented<T extends string>({
  label, value, options, onChange, render, disabled,
}: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void; render: (v: T) => string; disabled?: boolean }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          disabled={disabled}
          onClick={() => onChange(o)}
          className={clsx(
            "min-h-11 rounded-lg px-3 text-sm font-medium transition-colors duration-200 disabled:opacity-50",
            value === o ? "bg-primary text-on-primary" : "hover:bg-border",
          )}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-foreground">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[var(--primary)]" />
      {label}
    </label>
  );
}

const field = "rounded-lg bg-surface-2 px-2 py-2 text-foreground disabled:opacity-50";

export interface PracticePlayerProps {
  pieces?: PracticePiece[];
  initial?: Partial<PracticeConfig>;
  /** Set false when a parent already wires piano input (e.g. the lesson player). */
  wireInput?: boolean;
  onFinish?: (summary: ScoreSummary, run: PracticeRun) => void;
}

/** What was practised, for progress records. */
export interface PracticeRun {
  pieceId: string;
  config: PracticeConfig;
  durationMs: number;
}

export function PracticePlayer({ pieces = PRACTICE_PIECES, initial, wireInput = true, onFinish }: PracticePlayerProps) {
  usePianoInput({ enabled: wireInput });
  const t = useTranslations("practice");
  const locale = useLocale() as "vi" | "en";
  const [pieceIdx, setPieceIdx] = useState(0);
  const piece = pieces[pieceIdx];
  const [config, setConfig] = useState<PracticeConfig>({
    mode: "wait", tempo: 1, hand: "both", bars: null, loop: false, metronome: true, ...initial,
  });
  const [showFalling, setShowFalling] = useState(true);
  const set = (patch: Partial<PracticeConfig>) => setConfig((c) => ({ ...c, ...patch }));

  const session = usePracticeSession(piece.score, config);
  const { phase, cursor, flashes, summary } = session;
  const running = phase === "countin" || phase === "playing";
  const perf = config.mode === "performance";
  const active = useInputStore((st) => st.active);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const startedAt = useRef(0);
  const runInfo = useRef({ pieceId: piece.score.id, config });
  runInfo.current = { pieceId: piece.score.id, config };
  useEffect(() => {
    if (phase === "countin" || (phase === "playing" && !startedAt.current)) startedAt.current = Date.now();
  }, [phase]);
  useEffect(() => {
    if (!summary) return;
    finish.current?.(summary, { ...runInfo.current, durationMs: startedAt.current ? Date.now() - startedAt.current : 0 });
    startedAt.current = 0;
  }, [summary]);

  const [from, to] = useMemo(() => {
    const ms = piece.score.notes.map((n) => n.midi);
    let lo = Math.min(...ms) - 4, hi = Math.max(...ms) + 4;
    if (hi - lo < 24) {
      const pad = Math.ceil((24 - (hi - lo)) / 2);
      lo -= pad;
      hi += pad;
    }
    return [Math.max(PIANO_MIN, lo), Math.min(PIANO_MAX, hi)];
  }, [piece]);

  const keys = useMemo(() => {
    const states: Partial<Record<number, KeyState>> = {};
    const hands: Partial<Record<number, KeyHand>> = {};
    const fingers: Partial<Record<number, number>> = {};
    if (running && !perf) {
      for (const idx of cursor) {
        const n = piece.score.notes[idx];
        states[n.midi] = "expected";
        hands[n.midi] = n.hand === "L" ? "left" : "right";
        if (n.finger) fingers[n.midi] = n.finger;
      }
    }
    active.forEach((m) => (states[m] ??= "active"));
    if (!perf) for (const [m, f] of Object.entries(flashes)) states[Number(m)] = f;
    return { states, hands, fingers };
  }, [running, perf, cursor, piece, active, flashes]);

  const barFrom = config.bars?.from ?? 1;
  const barTo = config.bars?.to ?? session.barCount;
  const setBars = (a: number, b: number) => {
    const fromBar = Math.max(1, Math.min(a, session.barCount));
    const toBar = Math.max(fromBar, Math.min(b, session.barCount));
    set({ bars: fromBar === 1 && toBar === session.barCount ? null : { from: fromBar, to: toBar } });
  };

  const showStatuses = !perf || phase === "done";
  const bpm = Math.round(piece.score.bpm * config.tempo);

  return (
    <section className="space-y-4">
      <MidiStatus />
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-2xl border border-border bg-surface p-4">
        {pieces.length > 1 && <label className="flex flex-col gap-1 text-sm text-muted">
          {t("piece")}
          <select value={pieceIdx} disabled={running} onChange={(e) => {
            setPieceIdx(Number(e.target.value));
            set({ bars: null });
          }} className={clsx(field, "min-h-11")}>
            {pieces.map((p, i) => <option key={p.score.id} value={i}>{p.title[locale]}</option>)}
          </select>
        </label>}
        <div className="flex flex-col gap-1 text-sm text-muted">
          {t("mode")}
          <Segmented label={t("mode")} value={config.mode} options={MODES} disabled={running} onChange={(mode) => set({ mode })} render={(m) => t(`modes.${m}`)} />
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted">
          {t("hand")}
          <Segmented label={t("hand")} value={config.hand} options={HANDS} disabled={running} onChange={(hand) => set({ hand })} render={(h) => t(`hands.${h}`)} />
        </div>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-muted">
          <span>
            {t("tempo")}: <strong className="tabular text-foreground">{Math.round(config.tempo * 100)}%</strong> · {bpm} BPM
          </span>
          <input
            type="range" min={40} max={120} step={5} value={config.tempo * 100} disabled={running}
            onChange={(e) => set({ tempo: Number(e.target.value) / 100 })}
            className="min-h-11 w-full accent-[var(--primary)]"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3 text-sm text-muted">
          <label className="flex flex-col gap-1">
            {t("barFrom")}
            <input type="number" min={1} max={session.barCount} value={barFrom} disabled={running}
              onChange={(e) => setBars(Number(e.target.value), barTo)} className={clsx(field, "min-h-11 w-20 tabular")} />
          </label>
          <label className="flex flex-col gap-1">
            {t("barTo")}
            <input type="number" min={1} max={session.barCount} value={barTo} disabled={running}
              onChange={(e) => setBars(barFrom, Number(e.target.value))} className={clsx(field, "min-h-11 w-20 tabular")} />
          </label>
          <Toggle label={t("loop")} checked={config.loop} disabled={running} onChange={(loop) => set({ loop })} />
          <Toggle label={t("metronome")} checked={config.metronome} disabled={running} onChange={(metronome) => set({ metronome })} />
          <Toggle label={t("fallingNotes")} checked={showFalling} onChange={setShowFalling} />
        </div>
        <button
          type="button"
          onClick={() => (running ? session.stop() : void session.start())}
          className={clsx(
            "ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-6 font-semibold",
            running ? "bg-surface-2 text-foreground hover:bg-border" : "bg-primary text-on-primary",
          )}
        >
          {running ? <Square className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
          {running ? t("stop") : t("start")}
        </button>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {t(`modeHelp.${config.mode}`)}
        {config.hand !== "both" && config.mode !== "wait" && ` ${t("otherHandAuto")}`}
        {session.loopSummary && ` · ${t("lastLoop", { score: session.loopSummary.score })}`}
      </p>

      {summary && (
        <ResultPanel
          summary={summary} from={from} to={to} timed={config.mode !== "wait"}
          onRetry={() => void session.start()} onClose={session.dismiss}
        />
      )}

      <div className="relative rounded-2xl border border-border bg-surface p-2 sm:p-4">
        <StaffView
          score={piece.score}
          statuses={showStatuses ? session.statuses : {}}
          cursor={running ? cursor : []}
          ariaLabel={t("staffLabel", { title: piece.title[locale] })}
        />
        {phase === "countin" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-live="assertive">
            <p className="rounded-2xl bg-surface/90 px-8 py-4 text-center shadow-lg">
              <span className="block text-sm text-muted">{t("countIn")}</span>
              <span className="text-6xl font-bold tabular text-primary">{session.countIn}</span>
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2">
        {/* Cap key width (~44px per white key) so a zoomed range doesn't balloon on wide screens. */}
        <div className="mx-auto min-w-[640px]" style={{ maxWidth: keyLayout(from, to).whites.length * 44 }}>
          {showFalling && !perf && (
            <FallingNotes
              timeline={session.timeline} from={from} to={to} clock={session.clock}
              statuses={session.statusRef} running={running} opacity={Math.max(0.3, 1 - piece.level * 0.15)}
            />
          )}
          <Keyboard88 from={from} to={to} {...keys} {...pointerHandlers} ariaLabel={t("keyboardLabel")} />
        </div>
      </div>
    </section>
  );
}
