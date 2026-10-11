import { emitInput } from "./bus";

/** Piano-style layout: home row = white keys, row above = black keys (like most DAWs). */
const KEY_OFFSETS: Record<string, number> = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9,
  KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16, Quote: 17,
};

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

/**
 * Enables computer-keyboard play. Z/X shift octave down/up, Space = sustain pedal.
 * Returns a cleanup function.
 */
export function enableComputerKeyboard(opts: { baseMidi?: number; onOctaveChange?: (base: number) => void } = {}): () => void {
  let base = opts.baseMidi ?? 60;
  const down = new Map<string, number>();

  const keydown = (e: KeyboardEvent) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
    if (e.code === "KeyZ" || e.code === "KeyX") {
      base = Math.min(96, Math.max(24, base + (e.code === "KeyZ" ? -12 : 12)));
      opts.onOctaveChange?.(base);
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      emitInput({ type: "sustain", on: true, time: performance.now(), source: "keyboard" });
      return;
    }
    const off = KEY_OFFSETS[e.code];
    if (off === undefined) return;
    const midi = base + off;
    down.set(e.code, midi);
    emitInput({ type: "noteon", midi, velocity: 90, time: e.timeStamp, source: "keyboard" });
  };

  const keyup = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      emitInput({ type: "sustain", on: false, time: performance.now(), source: "keyboard" });
      return;
    }
    const midi = down.get(e.code);
    if (midi === undefined) return;
    down.delete(e.code);
    emitInput({ type: "noteoff", midi, time: e.timeStamp, source: "keyboard" });
  };

  const blur = () => {
    for (const midi of down.values()) emitInput({ type: "noteoff", midi, time: performance.now(), source: "keyboard" });
    down.clear();
  };

  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    window.removeEventListener("blur", blur);
  };
}
