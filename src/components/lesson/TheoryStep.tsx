"use client";

import { Lightbulb } from "lucide-react";
import type { StepOf } from "@/content/curriculum/schema";
import { KeyboardDemo } from "./KeyboardDemo";
import { useLText } from "./text";

export function TheoryStep({ step }: { step: StepOf<"theory"> }) {
  const tx = useLText();
  return (
    <article className="space-y-4">
      <h2 className="text-2xl font-bold text-balance">{tx(step.title)}</h2>
      <div className="max-w-prose space-y-3 text-lg leading-relaxed">
        {step.body.map((p, i) => <p key={i}>{tx(p)}</p>)}
      </div>
      {step.tips && (
        <ul className="max-w-prose space-y-2 rounded-xl bg-surface-2 p-4">
          {step.tips.map((tip, i) => (
            <li key={i} className="flex gap-3">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <span>{tx(tip)}</span>
            </li>
          ))}
        </ul>
      )}
      {step.keyboard && <KeyboardDemo kb={step.keyboard} />}
    </article>
  );
}
