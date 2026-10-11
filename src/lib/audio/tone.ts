/** Lazily loads Tone.js (heavy, and AudioContext must start from a user gesture). */
type ToneModule = typeof import("tone");

let tonePromise: Promise<ToneModule> | null = null;

export function loadTone(): Promise<ToneModule> {
  tonePromise ??= import("tone");
  return tonePromise;
}

/** Call from a user gesture (click/keydown/MIDI) before producing sound. */
export async function startAudio(): Promise<ToneModule> {
  const Tone = await loadTone();
  if (Tone.getContext().state !== "running") await Tone.start();
  return Tone;
}
