import { isBlackKey, whiteKeyIndex } from "@/lib/music-core";

/** Key geometry in SVG units, shared by Keyboard88 and FallingNotes so lanes line up. */
export const KEY_W = 24;
export const KEY_H = 140;
export const BLACK_W = 14;
export const BLACK_H = 88;

export interface KeyRect {
  midi: number;
  x: number;
  w: number;
}

/** Ranges start and end on white keys so the layout stays aligned. */
export function keyLayout(from: number, to: number) {
  const lo = isBlackKey(from) ? from - 1 : from;
  const hi = isBlackKey(to) ? to + 1 : to;
  const base = whiteKeyIndex(lo);
  const whites: KeyRect[] = [];
  const blacks: KeyRect[] = [];
  for (let m = lo; m <= hi; m++) {
    const wi = whiteKeyIndex(m) - base;
    if (isBlackKey(m)) blacks.push({ midi: m, x: (wi + 1) * KEY_W - BLACK_W / 2, w: BLACK_W });
    else whites.push({ midi: m, x: wi * KEY_W, w: KEY_W });
  }
  return { lo, hi, whites, blacks, width: whites.length * KEY_W };
}
