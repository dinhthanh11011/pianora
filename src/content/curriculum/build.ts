import { nameToMidi, type Finger, type Hand, type ScoreNote } from "@/lib/music-core";

/** Sequential melody: [note, beats, finger?] — "-" is a rest. */
export function line(hand: Hand, items: [string, number, Finger?][], startBeat = 0): ScoreNote[] {
  let t = startBeat;
  const out: ScoreNote[] = [];
  for (const [name, duration, finger] of items) {
    if (name !== "-") out.push({ midi: nameToMidi(name), start: t, duration, hand, finger });
    t += duration;
  }
  return out;
}

/** Block chords: [["C4","E4","G4"], beats, fingers?]. */
export function chords(hand: Hand, items: [string[], number, Finger[]?][], startBeat = 0): ScoreNote[] {
  let t = startBeat;
  return items.flatMap(([names, duration, fingers]) => {
    const notes = names.map((n, i) => ({ midi: nameToMidi(n), start: t, duration, hand, finger: fingers?.[i] }));
    t += duration;
    return notes;
  });
}
