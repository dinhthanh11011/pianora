import { create } from "zustand";
import type { MidiStatus } from "@/lib/midi/webmidi";

interface InputState {
  midiStatus: MidiStatus | "idle";
  devices: string[];
  /** Currently held notes (any source). */
  active: Set<number>;
  sustain: boolean;
  keyboardBase: number;
  setMidi: (status: MidiStatus, devices: string[]) => void;
  press: (midi: number) => void;
  release: (midi: number) => void;
  setSustain: (on: boolean) => void;
  setKeyboardBase: (base: number) => void;
}

export const useInputStore = create<InputState>((set) => ({
  midiStatus: "idle",
  devices: [],
  active: new Set(),
  sustain: false,
  keyboardBase: 60,
  setMidi: (midiStatus, devices) => set({ midiStatus, devices }),
  press: (midi) => set((s) => ({ active: new Set(s.active).add(midi) })),
  release: (midi) =>
    set((s) => {
      const active = new Set(s.active);
      active.delete(midi);
      return { active };
    }),
  setSustain: (sustain) => set({ sustain }),
  setKeyboardBase: (keyboardBase) => set({ keyboardBase }),
}));
