import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  /** Play app piano sound for MIDI input (turn off for digital pianos with speakers). */
  soundForMidi: boolean;
  /** Measured input latency compensation in ms (subtracted from input timestamps). */
  latencyMs: number;
  volume: number;
  setSoundForMidi: (v: boolean) => void;
  setLatencyMs: (v: number) => void;
  setVolume: (v: number) => void;
}

// Device-local preferences; progress data lives in ProgressRepository (Dexie), not here.
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      soundForMidi: true,
      latencyMs: 0,
      volume: 0.8,
      setSoundForMidi: (soundForMidi) => set({ soundForMidi }),
      setLatencyMs: (latencyMs) => set({ latencyMs }),
      setVolume: (volume) => set({ volume }),
    }),
    { name: "pianora-settings" },
  ),
);
