import { emitInput } from "./bus";

export type MidiStatus = "unsupported" | "denied" | "no-device" | "connected";

export const isWebMidiSupported = (): boolean => typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;

/** Parses a raw MIDI message and emits it on the bus. `time` is a performance.now()-clock timestamp. */
export function handleMidiMessage(data: Uint8Array, time: number): void {
  const [status, d1, d2] = data;
  const cmd = status & 0xf0;
  if (cmd === 0x90 && d2 > 0) emitInput({ type: "noteon", midi: d1, velocity: d2, time, source: "midi" });
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) emitInput({ type: "noteoff", midi: d1, time, source: "midi" });
  else if (cmd === 0xb0 && d1 === 64) emitInput({ type: "sustain", on: d2 >= 64, time, source: "midi" });
}

/**
 * Requests MIDI access and listens on all inputs (hot-plug aware).
 * Calls `onChange` with status + device names whenever devices change.
 */
export async function connectMidi(onChange: (status: MidiStatus, devices: string[]) => void): Promise<() => void> {
  if (!isWebMidiSupported()) {
    onChange("unsupported", []);
    return () => {};
  }
  let access: MIDIAccess;
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
  } catch {
    onChange("denied", []);
    return () => {};
  }

  const handler = (e: MIDIMessageEvent) => e.data && handleMidiMessage(e.data, e.timeStamp);

  const bind = () => {
    const names: string[] = [];
    access.inputs.forEach((input) => {
      input.onmidimessage = handler;
      names.push(input.name ?? "MIDI device");
    });
    onChange(names.length ? "connected" : "no-device", names);
  };

  bind();
  access.onstatechange = bind;
  return () => {
    access.onstatechange = null;
    access.inputs.forEach((input) => (input.onmidimessage = null));
  };
}
