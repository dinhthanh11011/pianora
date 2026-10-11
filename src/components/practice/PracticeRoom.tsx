"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { LivePiano } from "@/components/piano/LivePiano";
import { rehydrateProgress, useProgress } from "@/stores/progress";
import { PracticePlayer } from "./PracticePlayer";

const TABS = ["pieces", "free"] as const;

/** Tabs mount one input consumer at a time (both wire the piano input bus). */
export function PracticeRoom() {
  const t = useTranslations("practice");
  const [tab, setTab] = useState<(typeof TABS)[number]>("pieces");
  const record = useProgress((s) => s.record);
  useEffect(rehydrateProgress, []);
  return (
    <>
      <div role="tablist" aria-label={t("title")} className="mb-6 mt-4 inline-flex rounded-xl bg-surface p-1">
        {TABS.map((k) => (
          <button
            key={k}
            id={`tab-${k}`}
            role="tab"
            type="button"
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            onClick={() => setTab(k)}
            className={clsx(
              "min-h-11 rounded-lg px-4 font-medium transition-colors duration-200",
              tab === k ? "bg-primary text-on-primary" : "hover:bg-surface-2",
            )}
          >
            {t(k === "pieces" ? "tabPieces" : "tabFree")}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "pieces" ? (
          <PracticePlayer
            onFinish={(s, run) =>
              record({
                type: "practice", pieceId: run.pieceId, score: s.score, stars: s.stars, accuracy: s.accuracy, timing: s.timing,
                durationMs: run.durationMs, hand: run.config.hand, mode: run.config.mode, tempo: run.config.tempo,
              })
            }
          />
        ) : <LivePiano />}
      </div>
    </>
  );
}
