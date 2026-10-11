import type { Sampler } from "tone";
import { midiToName } from "@/lib/music-core";
import { startAudio } from "./tone";

const SAMPLE_BASE = "/samples/salamander/";

function sampleMap(): Record<string, string> {
  const urls: Record<string, string> = { A0: "A0.mp3", C8: "C8.mp3" };
  for (let o = 1; o <= 7; o++) {
    for (const [note, file] of [["C", "C"], ["D#", "Ds"], ["F#", "Fs"], ["A", "A"]]) {
      urls[`${note}${o}`] = `${file}${o}.mp3`;
    }
  }
  return urls;
}

let sampler: Sampler | null = null;
let loading: Promise<Sampler> | null = null;
let sustain = false;
const held = new Set<number>(); // keys physically down
const sustained = new Set<number>(); // released keys still ringing due to pedal

/** Loads the piano samples (once). Safe to call repeatedly. */
export function loadPiano(): Promise<Sampler> {
  loading ??= startAudio().then(
    (Tone) =>
      new Promise<Sampler>((resolve, reject) => {
        const s = new Tone.Sampler({
          urls: sampleMap(),
          baseUrl: SAMPLE_BASE,
          release: 1.2,
          onload: () => resolve(s),
          onerror: reject,
        }).toDestination();
        sampler = s;
      }),
  );
  return loading;
}

export const isPianoReady = () => sampler?.loaded ?? false;

export async function noteOn(midi: number, velocity = 90): Promise<void> {
  const s = sampler?.loaded ? sampler : await loadPiano();
  if (sustained.has(midi)) {
    s.triggerRelease(midiToName(midi));
    sustained.delete(midi);
  }
  held.add(midi);
  s.triggerAttack(midiToName(midi), undefined, Math.max(0.05, Math.min(1, velocity / 127)));
}

export function noteOff(midi: number): void {
  held.delete(midi);
  if (!sampler?.loaded) return;
  if (sustain) sustained.add(midi);
  else sampler.triggerRelease(midiToName(midi));
}

export function setSustain(on: boolean): void {
  sustain = on;
  if (!on && sampler?.loaded) {
    for (const m of sustained) if (!held.has(m)) sampler.triggerRelease(midiToName(m));
    sustained.clear();
  }
}

/** Plays a note (or chord) for a fixed duration — used for demos and ear training. */
export async function playNotes(midis: number[], durationSec = 0.8, velocity = 90): Promise<void> {
  const s = sampler?.loaded ? sampler : await loadPiano();
  s.triggerAttackRelease(midis.map((m) => midiToName(m)), durationSec, undefined, velocity / 127);
}

export function releaseAll(): void {
  sampler?.releaseAll();
  held.clear();
  sustained.clear();
}
