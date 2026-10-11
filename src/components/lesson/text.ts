"use client";

import { useLocale } from "next-intl";
import { SOLFEGE, parseNote, type Letter } from "@/lib/music-core";
import type { LText } from "@/content/curriculum/schema";

export type Locale = "vi" | "en";

/** Picks the current locale from `{ vi, en }` content text. */
export function useLText() {
  const locale = useLocale() as Locale;
  return (t: LText) => t[locale];
}

/** "C4" → vi "Đô (C4)", en "C4"; "F#" → vi "Fa thăng (F#)". */
export function noteLabel(name: string, locale: Locale): string {
  if (locale === "en") return name;
  const { letter, accidental } = parseNote(/\d$/.test(name) ? name : `${name}4`);
  const acc = accidental > 0 ? " thăng" : accidental < 0 ? " giáng" : "";
  return `${SOLFEGE[letter as Letter]}${acc} (${name})`;
}
