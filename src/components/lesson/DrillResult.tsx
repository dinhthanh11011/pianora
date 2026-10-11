"use client";

import { useTranslations } from "next-intl";
import { CircleCheck, RotateCcw, CircleAlert } from "lucide-react";
import clsx from "clsx";

/** Shared end-of-drill panel. */
export function DrillResult({ score, passed, passMark, onRetry, detail }: {
  score: number; passed: boolean; passMark: number; onRetry: () => void; detail?: string;
}) {
  const t = useTranslations("lesson");
  const Icon = passed ? CircleCheck : CircleAlert;
  return (
    <div role="status" className={clsx("flex flex-wrap items-center gap-4 rounded-2xl border-2 p-4", passed ? "border-success" : "border-accent")}>
      <Icon className={clsx("size-8 shrink-0", passed ? "text-success" : "text-accent")} aria-hidden />
      <div className="flex-1">
        <p className="text-xl font-bold tabular">{t("drillScore", { score })}</p>
        <p className="text-muted">{passed ? t("drillPassed") : t("drillFailed", { pass: passMark })}{detail && ` · ${detail}`}</p>
      </div>
      <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-4 font-medium hover:bg-border">
        <RotateCcw className="size-5" aria-hidden /> {t("retry")}
      </button>
    </div>
  );
}

export function StartButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:opacity-90">
      {label}
    </button>
  );
}
