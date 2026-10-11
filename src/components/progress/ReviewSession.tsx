"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, CircleAlert, Eye } from "lucide-react";
import clsx from "clsx";
import {
  CHORD_PATTERNS, LETTERS, SOLFEGE, chordSymbol, letterPitchClass, nameToMidi, parseNote, pitchClass,
  type ChordQuality, type Letter, type Score,
} from "@/lib/music-core";
import { dayKey } from "@/lib/gamification/dates";
import { dueQueue, qualityFrom, type SrsCard } from "@/lib/gamification/srs";
import { Link } from "@/i18n/navigation";
import { pointerHandlers, usePianoInput } from "@/hooks/usePianoInput";
import { useInputStore } from "@/stores/input";
import { rehydrateProgress, useProgress } from "@/stores/progress";
import { StaffView } from "@/components/notation/StaffView";
import { Keyboard88, type KeyState } from "@/components/piano/Keyboard88";
import { keyLayout } from "@/components/piano/keyLayout";
import { useFlashes, useInputHandler } from "@/components/lesson/useDrill";

type Status = "asking" | "correct" | "revealed";

/** Target notes of a card: one note, or a root-position triad. */
function target(card: SrsCard): { midis: number[]; label: string } {
  if (card.deck === "note") return { midis: [nameToMidi(card.prompt)], label: card.prompt };
  const [root, quality] = card.prompt.split(":") as [string, ChordQuality];
  const r = nameToMidi(root);
  const n = parseNote(root);
  return { midis: CHORD_PATTERNS[quality].map((i) => r + i), label: chordSymbol(n.letter + (n.accidental > 0 ? "#" : n.accidental < 0 ? "b" : ""), quality) };
}

const noteScore = (midi: number): Score => ({
  id: `review-${midi}`, bpm: 60, timeSignature: [4, 4],
  notes: [{ midi, start: 0, duration: 4, hand: midi >= 60 ? "R" : "L" }],
});

/** Daily SRS review: due cards, then a few new ones. Grades feed SM-2 via the progress store. */
export function ReviewSession() {
  usePianoInput();
  const t = useTranslations("review");
  const tl = useTranslations("lesson");
  const locale = useLocale();
  const { hydrated, snapshot, record } = useProgress();
  useEffect(rehydrateProgress, []);

  // Freeze the queue once loaded so reviewing a card doesn't reshuffle the session.
  const [queue, setQueue] = useState<SrsCard[] | null>(null);
  useEffect(() => {
    if (hydrated && queue === null) setQueue(dueQueue(snapshot.cards, dayKey()));
  }, [hydrated, queue, snapshot.cards]);

  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<Status>("asking");
  const [firstTry, setFirstTry] = useState(true);
  const [wrong, setWrong] = useState(false);
  const [tally, setTally] = useState({ correct: 0, xp: 0 });
  const shownAt = useRef(0);
  const armed = useRef(true);
  const { flashes, flash } = useFlashes();
  const active = useInputStore((s) => s.active);

  const card = queue?.[idx];
  const goal = useMemo(() => (card ? target(card) : null), [card]);
  const score1 = useMemo(() => (card?.deck === "note" && goal ? noteScore(goal.midis[0]) : null), [card, goal]);

  useEffect(() => {
    shownAt.current = Date.now();
    armed.current = true;
    setStatus("asking");
    setFirstTry(true);
    setWrong(false);
  }, [idx]);

  const grade = (correct: boolean) => {
    if (!card) return;
    const ms = Date.now() - shownAt.current;
    const r = record({ type: "review", cardId: card.id, quality: qualityFrom(correct, ms, firstTry), durationMs: ms });
    setTally((s) => ({ correct: s.correct + (correct && firstTry ? 1 : 0), xp: s.xp + r.xp }));
  };

  const next = () => setIdx((i) => i + 1);

  const answer = (ok: boolean) => {
    if (status !== "asking") return;
    if (!ok) {
      setFirstTry(false);
      setWrong(true);
      return;
    }
    grade(true);
    setStatus("correct");
    window.setTimeout(next, 700);
  };

  const reveal = () => {
    grade(false);
    setStatus("revealed");
  };

  // Note cards: any octave of the right pitch class counts.
  useInputHandler((e) => {
    if (e.type !== "noteon" || !goal || card?.deck !== "note") return;
    const ok = pitchClass(e.midi) === pitchClass(goal.midis[0]);
    flash(e.midi, ok ? "correct" : "wrong");
    answer(ok);
  }, status === "asking" && card?.deck === "note");

  // Chord cards: judge once the learner holds as many notes as the chord; re-arm on release.
  useEffect(() => {
    if (status !== "asking" || card?.deck !== "chord" || !goal) return;
    if (active.size === 0) {
      armed.current = true;
      return;
    }
    if (!armed.current || active.size < goal.midis.length) return;
    const want = new Set(goal.midis.map(pitchClass));
    const got = new Set([...active].map(pitchClass));
    armed.current = false;
    answer(got.size === want.size && [...want].every((p) => got.has(p)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const chooseLetter = (l: Letter) => {
    if (!goal) return;
    answer(letterPitchClass(l) === pitchClass(goal.midis[0]) && parseNote(card!.prompt).accidental === 0);
  };

  const [from, to] = useMemo(() => {
    if (!goal) return [48, 72];
    const lo = Math.min(...goal.midis), hi = Math.max(...goal.midis);
    return [Math.max(21, Math.min(lo - 5, 48)), Math.min(108, Math.max(hi + 5, 72))];
  }, [goal]);

  const states = useMemo(() => {
    const s: Partial<Record<number, KeyState>> = {};
    active.forEach((m) => (s[m] = "active"));
    for (const [m, f] of Object.entries(flashes)) s[Number(m)] = f;
    if (status !== "asking" && goal) for (const m of goal.midis) s[m] = status === "correct" ? "correct" : "expected";
    return s;
  }, [active, flashes, status, goal]);

  if (!queue) return <p className="text-muted" aria-busy>…</p>;

  if (!queue.length || !card || !goal) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <CircleCheck className="mx-auto size-10 text-success" aria-hidden />
        <p className="mt-4 text-xl font-bold">{queue.length ? t("done") : t("empty")}</p>
        {queue.length > 0 && <p className="mt-2 tabular text-muted">{t("doneDetail", { correct: tally.correct, total: queue.length, xp: tally.xp })}</p>}
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:opacity-90">
          {t("backHome")}
        </Link>
      </div>
    );
  }

  const whites = keyLayout(from, to).whites.length;
  return (
    <article className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          role="progressbar" aria-label={t("cardOf", { n: idx + 1, total: queue.length })}
          aria-valuemin={1} aria-valuemax={queue.length} aria-valuenow={idx + 1}
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${(idx / queue.length) * 100}%` }} />
        </div>
        <span className="text-sm tabular text-muted">{t("cardOf", { n: idx + 1, total: queue.length })}</span>
      </div>

      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t(`deck.${card.deck}`)}</p>
      <h2 className="text-2xl font-bold text-balance">
        {card.deck === "note" ? t("notePrompt") : t("chordPrompt", { chord: goal.label })}
      </h2>
      {card.deck === "chord" && <p className="text-muted">{t("chordHint")}</p>}

      {score1 && (
        <div className="max-w-sm rounded-2xl border border-border bg-surface p-2">
          <StaffView score={score1} ariaLabel={t("staffLabel")} />
        </div>
      )}

      {card.deck === "note" && status === "asking" && (
        <div role="group" aria-label={tl("chooseNote")} className="grid max-w-2xl grid-cols-4 gap-2 sm:grid-cols-7">
          {LETTERS.map((l) => (
            <button
              key={l} type="button" onClick={() => chooseLetter(l)}
              className="flex min-h-14 flex-col items-center justify-center rounded-xl border-2 border-border bg-surface font-semibold transition-colors duration-200 hover:border-primary"
            >
              {locale === "vi" ? <>{SOLFEGE[l]}<span className="text-xs text-muted">{l}</span></> : l}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite" className="flex min-h-11 flex-wrap items-center gap-3">
        {status === "correct" && (
          <p className="flex items-center gap-2 font-semibold text-success"><CircleCheck className="size-6" aria-hidden /> {t("correct")}</p>
        )}
        {status === "asking" && wrong && (
          <p className="flex items-center gap-2 font-semibold text-danger"><CircleAlert className="size-6" aria-hidden /> {t("wrong")}</p>
        )}
        {status === "asking" && (
          <button type="button" onClick={reveal} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-4 font-medium hover:bg-border">
            <Eye className="size-5" aria-hidden /> {t("showAnswer")}
          </button>
        )}
        {status === "revealed" && (
          <>
            <p className="font-semibold">{t("answer", { answer: goal.label })}</p>
            <button type="button" onClick={next} className={clsx("inline-flex min-h-11 items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:opacity-90")}>
              {t("next")}
            </button>
          </>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2">
        <div className="mx-auto" style={{ minWidth: Math.min(900, whites * 26), maxWidth: whites * 48 }}>
          <Keyboard88 from={from} to={to} labels="c" titles={false} states={states} {...pointerHandlers} ariaLabel={tl("keyboardLabel")} />
        </div>
      </div>
    </article>
  );
}
