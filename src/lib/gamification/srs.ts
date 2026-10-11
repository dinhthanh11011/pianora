import { addDays, daysBetween } from "./dates";

export type Deck = "note" | "chord";

/** A spaced-repetition card scheduled with SM-2. `prompt` is a note name ("E4") or chord ("F:maj"). */
export interface SrsCard {
  id: string;
  deck: Deck;
  prompt: string;
  ease: number;
  /** Days until the next review. */
  interval: number;
  reps: number;
  lapses: number;
  /** Next review day `YYYY-MM-DD`; null = new card never reviewed. */
  due: string | null;
  createdAt: number;
}

export const cardId = (deck: Deck, prompt: string) => `${deck}:${prompt}`;

export function newCard(deck: Deck, prompt: string, now = Date.now()): SrsCard {
  return { id: cardId(deck, prompt), deck, prompt, ease: 2.5, interval: 0, reps: 0, lapses: 0, due: null, createdAt: now };
}

/** SM-2 update for a review graded 0–5 (≥3 = recalled). */
export function review(card: SrsCard, quality: number, today: string): SrsCard {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const ease = Math.max(1.3, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (q < 3) return { ...card, ease, reps: 0, interval: 1, lapses: card.lapses + 1, due: addDays(today, 1) };
  const reps = card.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(card.interval * ease);
  return { ...card, ease, reps, interval, due: addDays(today, interval) };
}

/** Map a review answer to SM-2 quality: wrong → 1, otherwise by response time. */
export function qualityFrom(correct: boolean, ms: number, firstTry = true): number {
  if (!correct) return 1;
  if (!firstTry) return 3;
  return ms < 3000 ? 5 : ms < 7000 ? 4 : 3;
}

/** Today's queue: overdue/due cards first (most overdue first), then up to `newLimit` new cards. */
export function dueQueue(cards: SrsCard[], today: string, newLimit = 5, max = 20): SrsCard[] {
  const due = cards
    .filter((c) => c.due !== null && daysBetween(c.due, today) >= 0)
    .sort((a, b) => a.due!.localeCompare(b.due!));
  const fresh = cards.filter((c) => c.due === null).sort((a, b) => a.createdAt - b.createdAt).slice(0, newLimit);
  return [...due, ...fresh].slice(0, max);
}
