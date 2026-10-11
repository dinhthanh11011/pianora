"use client";

import { useEffect } from "react";
import { onInput, emitInput, type InputEvent } from "@/lib/midi/bus";
import { connectMidi } from "@/lib/midi/webmidi";
import { enableComputerKeyboard } from "@/lib/midi/computerKeyboard";
import { noteOff, noteOn, setSustain } from "@/lib/audio/piano";
import { useInputStore } from "@/stores/input";
import { useSettings } from "@/stores/settings";

/**
 * Mount once per page that needs live playing: wires MIDI + computer keyboard into the bus,
 * plays sound and mirrors held notes into the input store.
 */
export function usePianoInput({ computerKeyboard = true }: { computerKeyboard?: boolean } = {}) {
  useEffect(() => {
    const store = useInputStore.getState();
    const offBus = onInput((e: InputEvent) => {
      const playSound = e.source !== "midi" || useSettings.getState().soundForMidi;
      if (e.type === "noteon") {
        store.press(e.midi);
        if (playSound) void noteOn(e.midi, e.velocity);
      } else if (e.type === "noteoff") {
        store.release(e.midi);
        noteOff(e.midi);
      } else {
        store.setSustain(e.on);
        setSustain(e.on);
      }
    });

    let disconnect = () => {};
    void connectMidi(store.setMidi).then((d) => (disconnect = d));
    const offKeys = computerKeyboard
      ? enableComputerKeyboard({ baseMidi: store.keyboardBase, onOctaveChange: store.setKeyboardBase })
      : () => {};

    return () => {
      offBus();
      disconnect();
      offKeys();
    };
  }, [computerKeyboard]);
}

/** Handlers for the on-screen keyboard that feed the same bus. */
export const pointerHandlers = {
  onNoteOn: (midi: number, velocity: number) =>
    emitInput({ type: "noteon", midi, velocity, time: performance.now(), source: "pointer" }),
  onNoteOff: (midi: number) => emitInput({ type: "noteoff", midi, time: performance.now(), source: "pointer" }),
};
