"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import clsx from "clsx";
import type { StepOf } from "@/content/curriculum/schema";
import { KeyboardDemo } from "./KeyboardDemo";
import { useLText } from "./text";
import type { StepResultFn } from "./types";

export function QuizStep({ step, onResult }: { step: StepOf<"quiz">; onResult: StepResultFn }) {
  const t = useTranslations("lesson");
  const tx = useLText();
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);

  const choose = (i: number) => {
    if (solved || wrong.includes(i)) return;
    if (i === step.answer) {
      setSolved(true);
      onResult(wrong.length ? 50 : 100, true);
    } else setWrong((w) => [...w, i]);
  };

  return (
    <article className="space-y-4">
      <h2 className="text-2xl font-bold text-balance">{tx(step.prompt)}</h2>
      {step.keyboard && <KeyboardDemo kb={step.keyboard} />}
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        {step.options.map((o, i) => {
          const isWrong = wrong.includes(i);
          const isRight = solved && i === step.answer;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={isRight || isWrong}
              disabled={solved && !isRight}
              onClick={() => choose(i)}
              className={clsx(
                "flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 px-4 text-left text-lg font-medium transition-colors duration-200",
                isRight ? "border-success bg-success/15" : isWrong ? "border-danger bg-danger/10 text-muted" : "border-border bg-surface hover:border-primary",
              )}
            >
              {tx(o)}
              {isRight && <Check className="size-5 text-success" aria-label={t("correct")} />}
              {isWrong && <X className="size-5 text-danger" aria-label={t("wrong")} />}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="max-w-prose">
        {solved ? <>{t("quizCorrect")} {step.explain && tx(step.explain)}</> : wrong.length > 0 && t("quizTryAgain")}
      </p>
    </article>
  );
}
