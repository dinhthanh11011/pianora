import type { Loop, Synth } from "tone";
import { startAudio } from "./tone";

export interface MetronomeOptions {
  bpm: number;
  beatsPerBar: number;
  onBeat?: (beat: number) => void;
}

let loop: Loop | null = null;
let click: Synth | null = null;
let beat = 0;

export async function startMetronome({ bpm, beatsPerBar, onBeat }: MetronomeOptions): Promise<void> {
  const Tone = await startAudio();
  stopMetronome();
  click ??= new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    volume: -10,
  }).toDestination();
  const transport = Tone.getTransport();
  transport.bpm.value = bpm;
  beat = 0;
  loop = new Tone.Loop((time) => {
    const b = beat % beatsPerBar;
    click!.triggerAttackRelease(b === 0 ? "C6" : "G5", "32n", time);
    Tone.getDraw().schedule(() => onBeat?.(b), time);
    beat++;
  }, "4n").start(0);
  transport.start();
}

export async function setMetronomeBpm(bpm: number): Promise<void> {
  const Tone = await startAudio();
  Tone.getTransport().bpm.rampTo(bpm, 0.1);
}

export function stopMetronome(): void {
  if (!loop) return;
  loop.dispose();
  loop = null;
  void import("tone").then((Tone) => {
    const t = Tone.getTransport();
    t.stop();
    t.position = 0;
  });
}

export interface ClickTrack {
  /** performance.now() time of the first click. */
  startAt: number;
  stop: () => void;
}

/**
 * Sample-accurate clicks for practice sessions (count-in + optional beat track).
 * Scheduled on the audio clock, so the returned `startAt` maps beat 0 onto performance.now().
 */
export async function scheduleClicks(
  { bpm, beatsPerBar, beats, leadSec = 0.15 }: { bpm: number; beatsPerBar: number; beats: number; leadSec?: number },
): Promise<ClickTrack> {
  const Tone = await startAudio();
  const synth = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    volume: -10,
  }).toDestination();
  const ctx = Tone.getContext().rawContext as AudioContext;
  const base = ctx.currentTime + leadSec;
  const startAt = performance.now() + leadSec * 1000;
  const beatSec = 60 / bpm;
  for (let i = 0; i < beats; i++) {
    synth.triggerAttackRelease(i % beatsPerBar === 0 ? "C6" : "G5", "32n", base + i * beatSec);
  }
  return { startAt, stop: () => synth.dispose() };
}
