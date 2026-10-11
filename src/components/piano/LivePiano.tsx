"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Keyboard88, type KeyState } from "./Keyboard88";
import { MidiStatus } from "./MidiStatus";
import { usePianoInput, pointerHandlers } from "@/hooks/usePianoInput";
import { useInputStore } from "@/stores/input";
import { MIDDLE_C, chordSymbol, identifyChord, midiToName, SHARP_NAMES, whiteKeyIndex } from "@/lib/music-core";

/** Free-play piano: all inputs, live note/chord readout. */
export function LivePiano() {
  usePianoInput();
  const t = useTranslations("practice");
  const { active, sustain, keyboardBase } = useInputStore();

  const states = useMemo(() => {
    const s: Record<number, KeyState> = {};
    active.forEach((m) => (s[m] = "active"));
    return s;
  }, [active]);

  // Centre middle C when the keyboard is wider than the viewport.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (whiteKeyIndex(MIDDLE_C) / 52) * el.scrollWidth - el.clientWidth / 2;
  }, []);

  const notes = [...active].sort((a, b) => a - b);
  const chord = identifyChord(notes);

  return (
    <section className="space-y-4">
      <MidiStatus />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl bg-surface p-4">
        <p aria-live="polite" className="min-w-40 text-2xl font-semibold tabular">
          {notes.length ? notes.map((m) => midiToName(m)).join(" ") : "—"}
        </p>
        {chord && (
          <p className="text-lg text-primary">
            {t("chord")}: <strong>{chordSymbol(SHARP_NAMES[chord.root], chord.quality)}</strong>
          </p>
        )}
        <p className="ml-auto text-sm text-muted">
          {t("keyboardHint", { octave: midiToName(keyboardBase) })} · {t("sustain")}: {sustain ? "ON" : "OFF"}
        </p>
      </div>
      <div ref={scroller} className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2">
        <div className="min-w-[900px]">
          <Keyboard88 states={states} {...pointerHandlers} ariaLabel={t("keyboardLabel")} />
        </div>
      </div>
    </section>
  );
}
