"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onInput, type InputEvent } from "@/lib/midi/bus";

/** Subscribes to the input bus while `enabled`; the latest handler is always used. */
export function useInputHandler(handler: (e: InputEvent) => void, enabled: boolean) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => (enabled ? onInput((e) => ref.current(e)) : undefined), [enabled]);
}

/** Countdown in whole seconds; calls `onExpire` once when it hits 0. Null limit = no timer. */
export function useCountdown(limitSec: number | undefined, running: boolean, onExpire: () => void) {
  const [left, setLeft] = useState(limitSec ?? 0);
  const expire = useRef(onExpire);
  useEffect(() => {
    expire.current = onExpire;
  });
  useEffect(() => {
    if (!running || !limitSec) return;
    const end = performance.now() + limitSec * 1000;
    const id = window.setInterval(() => {
      const s = Math.max(0, Math.ceil((end - performance.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        window.clearInterval(id);
        expire.current();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running, limitSec]);
  const reset = useCallback(() => setLeft(limitSec ?? 0), [limitSec]);
  return { left, reset };
}

/** Short-lived per-key feedback colours. */
export function useFlashes() {
  const [flashes, setFlashes] = useState<Record<number, "correct" | "wrong">>({});
  const flash = useCallback((midi: number, kind: "correct" | "wrong") => {
    setFlashes((f) => ({ ...f, [midi]: kind }));
    window.setTimeout(() => setFlashes((f) => {
      const rest = { ...f };
      delete rest[midi];
      return rest;
    }), 350);
  }, []);
  return { flashes, flash };
}
