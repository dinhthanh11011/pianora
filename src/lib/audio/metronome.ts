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
