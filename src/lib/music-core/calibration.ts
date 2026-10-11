/**
 * Latency estimate from a tap-along test: median of (tap − nearest click), in ms.
 * Taps further than half a beat from any click are ignored as misses.
 */
export function estimateLatency(clicks: number[], taps: number[], beatMs: number): number | null {
  const offsets = taps
    .map((tap) => {
      let best = Infinity;
      for (const c of clicks) if (Math.abs(tap - c) < Math.abs(best)) best = tap - c;
      return best;
    })
    .filter((d) => Math.abs(d) < beatMs / 2)
    .sort((a, b) => a - b);
  if (offsets.length < 3) return null;
  const mid = Math.floor(offsets.length / 2);
  return Math.round(offsets.length % 2 ? offsets[mid] : (offsets[mid - 1] + offsets[mid]) / 2);
}
