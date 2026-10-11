"use client";

import { memo, useCallback, useMemo, useRef, type PointerEvent } from "react";
import { PIANO_MAX, PIANO_MIN, isBlackKey, midiToName, pitchClass, whiteKeyIndex } from "@/lib/music-core";

export type KeyState = "expected" | "correct" | "wrong" | "active";
export type Hand = "left" | "right";

export interface Keyboard88Props {
  /** Lowest/highest MIDI note shown (defaults to full 88 keys). */
  from?: number;
  to?: number;
  states?: Partial<Record<number, KeyState>>;
  hands?: Partial<Record<number, Hand>>;
  fingers?: Partial<Record<number, number>>;
  /** "c" = label only C keys, "white" = all white keys, "none". */
  labels?: "c" | "white" | "none";
  onNoteOn?: (midi: number, velocity: number) => void;
  onNoteOff?: (midi: number) => void;
  className?: string;
  ariaLabel?: string;
}

const W = 24; // white key width (svg units)
const H = 140;
const BW = 14;
const BH = 88;

const fillFor = (midi: number, state: KeyState | undefined, hand: Hand | undefined): string => {
  const black = isBlackKey(midi);
  switch (state) {
    case "correct":
      return "var(--success)";
    case "wrong":
      return "var(--danger)";
    case "expected":
      return hand === "left" ? "var(--hand-left)" : "var(--hand-right)";
    case "active":
      return black ? "var(--key-black-pressed)" : "var(--key-white-pressed)";
    default:
      return black ? "var(--key-black)" : "var(--key-white)";
  }
};

function Keyboard88Impl({
  from = PIANO_MIN,
  to = PIANO_MAX,
  states = {},
  hands = {},
  fingers = {},
  labels = "c",
  onNoteOn,
  onNoteOff,
  className,
  ariaLabel = "Piano keyboard",
}: Keyboard88Props) {
  // Ranges must start and end on white keys so the layout stays aligned.
  const lo = isBlackKey(from) ? from - 1 : from;
  const hi = isBlackKey(to) ? to + 1 : to;

  const { whites, blacks, width } = useMemo(() => {
    const base = whiteKeyIndex(lo);
    const whites: { midi: number; x: number }[] = [];
    const blacks: { midi: number; x: number }[] = [];
    for (let m = lo; m <= hi; m++) {
      const wi = whiteKeyIndex(m) - base;
      if (isBlackKey(m)) blacks.push({ midi: m, x: (wi + 1) * W - BW / 2 });
      else whites.push({ midi: m, x: wi * W });
    }
    return { whites, blacks, width: whites.length * W };
  }, [lo, hi]);

  const down = useRef<number | null>(null);

  const midiFromEvent = (e: PointerEvent): number | null => {
    const el = (document.elementFromPoint(e.clientX, e.clientY) as Element | null)?.closest("[data-midi]");
    return el ? Number(el.getAttribute("data-midi")) : null;
  };

  // Velocity from vertical position on the key: nearer the front edge = louder, like a real key.
  const velocityFromEvent = (e: PointerEvent, midi: number): number => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const keyH = isBlackKey(midi) ? BH : H;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return Math.round(50 + Math.min(1, Math.max(0, y / keyH)) * 60);
  };

  const press = useCallback(
    (midi: number, velocity: number) => {
      down.current = midi;
      onNoteOn?.(midi, velocity);
    },
    [onNoteOn],
  );

  const release = useCallback(() => {
    if (down.current !== null) onNoteOff?.(down.current);
    down.current = null;
  }, [onNoteOff]);

  const handleDown = (e: PointerEvent<SVGSVGElement>) => {
    // Touch pointers are implicitly captured; release so glissando reaches neighbouring keys.
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    const midi = midiFromEvent(e);
    if (midi !== null) press(midi, velocityFromEvent(e, midi));
  };

  const handleMove = (e: PointerEvent<SVGSVGElement>) => {
    if (down.current === null) return;
    const midi = midiFromEvent(e);
    if (midi !== null && midi !== down.current) {
      release();
      press(midi, velocityFromEvent(e, midi));
    }
  };

  const showLabel = (midi: number) => labels === "white" || (labels === "c" && pitchClass(midi) === 0);

  return (
    <svg
      viewBox={`0 0 ${width} ${H}`}
      className={className}
      role="group"
      aria-label={ariaLabel}
      style={{ touchAction: "none", userSelect: "none", display: "block", width: "100%" }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      {whites.map(({ midi, x }) => {
        const state = states[midi];
        const finger = fingers[midi];
        return (
          <g key={midi} data-midi={midi}>
            <rect
              x={x + 0.5}
              y={0}
              width={W - 1}
              height={H}
              rx={3}
              fill={fillFor(midi, state, hands[midi])}
              stroke="var(--border)"
              strokeWidth={1}
            >
              <title>{midiToName(midi)}</title>
            </rect>
            {finger && (
              <text x={x + W / 2} y={H - 34} textAnchor="middle" fontSize={12} fontWeight={700} fill="#0f172a">
                {finger}
              </text>
            )}
            {state === "wrong" && (
              <text x={x + W / 2} y={H - 50} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
                ✕
              </text>
            )}
            {showLabel(midi) && (
              <text x={x + W / 2} y={H - 10} textAnchor="middle" fontSize={9} fill="#64748b">
                {midiToName(midi)}
              </text>
            )}
          </g>
        );
      })}
      {blacks.map(({ midi, x }) => {
        const state = states[midi];
        const finger = fingers[midi];
        return (
          <g key={midi} data-midi={midi}>
            <rect x={x} y={0} width={BW} height={BH} rx={2} fill={fillFor(midi, state, hands[midi])}>
              <title>{midiToName(midi)}</title>
            </rect>
            {finger && (
              <text x={x + BW / 2} y={BH - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const Keyboard88 = memo(Keyboard88Impl);
