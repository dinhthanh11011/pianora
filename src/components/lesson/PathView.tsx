"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Check, Flag, Hand, Lock, Music, Star, Target, Zap, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { CURRICULUM, isUnlocked, type LessonKind } from "@/content/curriculum";
import { Link } from "@/i18n/navigation";
import { rehydrateProgress, useProgress } from "@/stores/progress";
import { useLText } from "./text";

const KIND_ICON: Record<LessonKind, LucideIcon> = {
  theory: BookOpen, drill: Target, technique: Hand, song: Music, checkpoint: Flag,
};

/** Skill-tree path: levels → units → lessons, unlocked one after another. */
export function PathView() {
  const t = useTranslations("lesson");
  const tx = useLText();
  const { hydrated, lessons, xp } = useProgress();
  useEffect(rehydrateProgress, []);
  const completed = (id: string) => !!lessons[id];

  return (
    <div className="space-y-10">
      <p className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2 font-semibold tabular">
        <Zap className="size-5 text-accent" aria-hidden /> {t("totalXp", { xp: hydrated ? xp : 0 })}
      </p>
      {CURRICULUM.map((lv) => {
        const all = lv.units.flatMap((u) => u.lessons);
        const doneCount = all.filter((l) => completed(l.id)).length;
        return (
          <section key={lv.level} aria-labelledby={`level-${lv.level}`} className="space-y-4">
            <header>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("levelN", { n: lv.level })}</p>
              <h2 id={`level-${lv.level}`} className="text-2xl font-bold">{tx(lv.title)}</h2>
              <p className="mt-1 max-w-prose text-muted">{t("goal")}: {tx(lv.goal)}</p>
              <p className="mt-1 text-sm tabular text-muted">{t("lessonsDone", { n: doneCount, total: all.length })}</p>
            </header>
            {lv.units.map((u) => (
              <div key={u.id} className="rounded-2xl border border-border bg-surface p-4">
                <h3 className="mb-3 font-semibold">{tx(u.title)}</h3>
                <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {u.lessons.map((l) => {
                    const done = lessons[l.id];
                    const open = hydrated && isUnlocked(l.id, completed);
                    const current = open && !done;
                    const Icon = !open ? Lock : done ? Check : KIND_ICON[l.kind];
                    const body = (
                      <>
                        <span className={clsx(
                          "grid size-11 shrink-0 place-items-center rounded-full",
                          done ? "bg-success text-white" : current ? "bg-primary text-on-primary" : "bg-surface-2 text-muted",
                        )}>
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{tx(l.title)}</span>
                          <span className="block text-sm text-muted">
                            {t(`kinds.${l.kind}`)} · {t("minutes", { n: l.minutes })}
                            {!open && <span className="sr-only"> · {t("lockedShort")}</span>}
                          </span>
                        </span>
                        {done && (
                          <span className="flex" role="img" aria-label={t("stars", { count: done.stars })}>
                            {[1, 2, 3].map((i) => (
                              <Star key={i} className={clsx("size-4", i <= done.stars ? "fill-accent text-accent" : "text-border")} aria-hidden />
                            ))}
                          </span>
                        )}
                      </>
                    );
                    const cls = clsx(
                      "flex min-h-16 items-center gap-3 rounded-xl border-2 p-3 transition-colors duration-200",
                      current ? "border-primary" : "border-transparent",
                      open ? "bg-surface-2 hover:border-primary" : "bg-surface-2/50 opacity-60",
                    );
                    return (
                      <li key={l.id}>
                        {open ? (
                          <Link href={`/lesson/${l.id}`} className={cls} aria-current={current ? "step" : undefined}>{body}</Link>
                        ) : (
                          <div className={cls} aria-disabled>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
