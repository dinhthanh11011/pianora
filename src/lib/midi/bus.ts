/** Unified input bus: every source (MIDI, computer keyboard, on-screen keys) emits here. */

export type InputSource = "midi" | "keyboard" | "pointer";

export type InputEvent =
  | { type: "noteon"; midi: number; velocity: number; time: number; source: InputSource }
  | { type: "noteoff"; midi: number; time: number; source: InputSource }
  | { type: "sustain"; on: boolean; time: number; source: InputSource };

type Listener = (e: InputEvent) => void;
const listeners = new Set<Listener>();

export function onInput(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitInput(e: InputEvent): void {
  for (const fn of listeners) fn(e);
}
