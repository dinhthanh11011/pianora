"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Volume2 } from "lucide-react";
import { nameToMidi } from "@/lib/music-core";
import { playNotes } from "@/lib/audio/piano";
import { pointerHandlers } from "@/hooks/usePianoInput";
import { useInputStore } from "@/stores/input";
import { Keyboard88, type KeyState } from "@/components/piano/Keyboard88";
import { keyLayout } from "@/components/piano/keyLayout";
import type { StepOf } from "@/content/curriculum/schema";

export type KeyboardDemoData = NonNullable<StepOf<"theory">["keyboard"]>;

const DEMO_GAP_MS = 650;

/** Playable keyboard with highlighted keys, finger numbers and an optional "Listen" demo. */
export function KeyboardDemo({ kb }: { kb: KeyboardDemoData }) {
  const t = useTranslations("lesson");
  const active = useInputStore((s) => s.active);
  const [playing, setPlaying] = useState<number[] | null>(null);
  const timers = useRef<number[]>([]);
  const from = nameToMidi(kb.from), to = nameToMidi(kb.to);

  const props = useMemo(() => {
    const hand = kb.hand === "L" ? "left" : "right";
    const states: Partial<Record<number, KeyState>> = {};
    const hands: Partial<Record<number, "left" | "right">> = {};
    const fingers: Partial<Record<number, number>> = {};
    for (const n of kb.highlight) {
      const m = nameToMidi(n);
      states[m] = "expected";
      hands[m] = hand;
    }
    for (const [n, f] of Object.entries(kb.fingers ?? {})) fingers[nameToMidi(n)] = f;
    playing?.forEach((m) => (states[m] = "correct"));
    active.forEach((m) => (states[m] = "active"));
    return { states, hands, fingers };
  }, [kb, active, playing]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const listen = () => {
    timers.current.forEach(clearTimeout);
    const seq = (kb.demo ?? []).map((x) => (Array.isArray(x) ? x : [x]).map(nameToMidi));
    timers.current = seq.map((midis, i) =>
      window.setTimeout(() => {
        setPlaying(midis);
        void playNotes(midis, 0.6);
      }, i * DEMO_GAP_MS),
    );
    timers.current.push(window.setTimeout(() => setPlaying(null), seq.length * DEMO_GAP_MS));
  };

  const whites = keyLayout(from, to).whites.length;
  return (
    <div className="space-y-2">
      {kb.demo && (
        <button type="button" onClick={listen} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-4 font-medium hover:bg-border">
          <Volume2 className="size-5" aria-hidden /> {t("listen")}
        </button>
      )}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2">
        <div className="mx-auto" style={{ minWidth: Math.min(900, whites * 26), maxWidth: whites * 48 }}>
          <Keyboard88 from={from} to={to} labels={kb.labels} {...props} {...pointerHandlers} ariaLabel={t("keyboardLabel")} />
        </div>
      </div>
    </div>
  );
}
