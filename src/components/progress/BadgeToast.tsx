"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useProgress } from "@/stores/progress";
import { badgeIcon } from "./BadgeIcon";

/** Announces newly earned badges one at a time. */
export function BadgeToast() {
  const t = useTranslations("badges");
  const id = useProgress((s) => s.pendingBadges[0]);
  const dismiss = useProgress((s) => s.dismissBadge);
  useEffect(() => {
    if (!id) return;
    const timer = window.setTimeout(dismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [id, dismiss]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex justify-center lg:bottom-6">
      {id && (() => {
        const Icon = badgeIcon(id);
        return (
          <div role="status" className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border-2 border-accent bg-surface p-3 shadow-lg motion-safe:animate-[toast-in_200ms_ease-out]">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-accent">{t("toast")}</p>
              <p className="font-bold">{t(`${id}.title`)}</p>
              <p className="text-sm text-muted">{t(`${id}.desc`)}</p>
            </div>
            <button type="button" onClick={dismiss} aria-label={t("dismiss")} className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-surface-2">
              <X className="size-5" aria-hidden />
            </button>
          </div>
        );
      })()}
    </div>
  );
}
