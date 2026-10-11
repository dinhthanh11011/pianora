"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Brain, ChevronRight, Flame, Snowflake, Target, Zap } from "lucide-react";
import clsx from "clsx";
import { LESSONS } from "@/content/curriculum";
import { dayKey } from "@/lib/gamification/dates";
import { goalProgress } from "@/lib/gamification/goal";
import { dueQueue } from "@/lib/gamification/srs";
import { liveStreak } from "@/lib/gamification/streak";
import { playerLevel } from "@/lib/gamification/xp";
import { Link } from "@/i18n/navigation";
import { rehydrateProgress, useProgress } from "@/stores/progress";
import { useLText } from "@/components/lesson/text";
import { badgeIcon } from "./BadgeIcon";

const card = "rounded-2xl border border-border bg-surface p-5";
const cta = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-on-primary transition-opacity duration-200 hover:opacity-90";

/** Goal ring: progress 0–1, label inside. */
function Ring({ value, children }: { value: number; children: React.ReactNode }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-24 shrink-0 place-items-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-surface-2" />
        <circle
          cx="40" cy="40" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value)}
          className={clsx("transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none", value >= 1 ? "stroke-success" : "stroke-primary")}
        />
      </svg>
      {children}
    </div>
  );
}

/** Home: streak, today's goal, level, continue lesson, review and recent badges. */
export function Dashboard() {
  const t = useTranslations("home");
  const tb = useTranslations("badges");
  const tl = useTranslations("lesson");
  const tx = useLText();
  const { hydrated, snapshot, lessons } = useProgress();
  useEffect(rehydrateProgress, []);

  const today = dayKey();
  const { profile } = snapshot;
  const streak = liveStreak(profile.streak, today);
  const todayAct = snapshot.days.find((d) => d.id === today);
  const goal = goalProgress(profile.goal, todayAct);
  const goalDone = profile.goal.kind === "minutes" ? Math.floor((todayAct?.activeMs ?? 0) / 60_000) : (todayAct?.lessons ?? 0);
  const lvl = playerLevel(profile.xp);
  const next = LESSONS.find((r) => !lessons[r.lesson.id]);
  const due = useMemo(() => dueQueue(snapshot.cards, today).length, [snapshot.cards, today]);
  const recent = [...snapshot.badges].sort((a, b) => b.earnedAt - a.earnedAt).slice(0, 4);

  return (
    <div className={clsx("grid gap-4 md:grid-cols-2", !hydrated && "opacity-60")} aria-busy={!hydrated}>
      <section className={clsx(card, "md:col-span-2 flex flex-wrap items-center justify-between gap-4")}>
        <div className="min-w-0">
          {next ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">{tl("levelN", { n: next.level })} · {tl(`kinds.${next.lesson.kind}`)}</p>
              <p className="mt-1 text-xl font-bold">{tx(next.lesson.title)}</p>
            </>
          ) : (
            <p className="text-xl font-bold">{t("allLessonsDone")}</p>
          )}
        </div>
        <Link href={next ? `/lesson/${next.lesson.id}` : "/path"} className={cta}>
          {next ? t("continueLesson") : t("continue")} <ChevronRight className="size-5" aria-hidden />
        </Link>
      </section>

      <section className={card} aria-labelledby="streak-h">
        <h2 id="streak-h" className="text-sm font-semibold text-muted">{t("streak")}</h2>
        <p className="mt-2 flex items-center gap-2 text-3xl font-bold tabular">
          <Flame className={clsx("size-8", streak > 0 ? "text-accent" : "text-muted")} aria-hidden />
          {t("days", { n: streak })}
        </p>
        <p className="mt-2 text-sm text-muted tabular">{t("bestStreak", { n: profile.streak.best })}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm">
          <Snowflake className="size-4 text-hand-right" aria-hidden /> {t("freezes", { n: profile.streak.freezes })}
        </p>
        <p className="mt-1 text-xs text-muted">{t("freezeHelp")}</p>
      </section>

      <section className={clsx(card, "flex items-center gap-4")} aria-labelledby="goal-h">
        <Ring value={goal}>
          <Target className={clsx("size-7", goal >= 1 ? "text-success" : "text-primary")} aria-hidden />
        </Ring>
        <div>
          <h2 id="goal-h" className="text-sm font-semibold text-muted">{t("todayGoal")}</h2>
          <p className="mt-1 text-2xl font-bold tabular">
            {t(profile.goal.kind === "minutes" ? "goalMinutes" : "goalLessons", { done: goalDone, target: profile.goal.target })}
          </p>
          {goal >= 1 && <p className="text-sm font-medium text-success">{t("goalMet")}</p>}
        </div>
      </section>

      <section className={card} aria-labelledby="level-h">
        <h2 id="level-h" className="flex items-center gap-2 text-xl font-bold">
          <Zap className="size-6 text-accent" aria-hidden /> {t("playerLevel", { n: lvl.level })}
        </h2>
        <div
          role="progressbar" aria-label={t("xpProgress", { into: lvl.into, needed: lvl.needed })}
          aria-valuemin={0} aria-valuemax={lvl.needed} aria-valuenow={lvl.into}
          className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${(lvl.into / lvl.needed) * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted tabular">{t("xpProgress", { into: lvl.into, needed: lvl.needed })}</p>
      </section>

      <section className={card} aria-labelledby="review-h">
        <h2 id="review-h" className="flex items-center gap-2 text-xl font-bold">
          <Brain className="size-6 text-primary" aria-hidden /> {t("review")}
        </h2>
        <p className="mt-2 text-muted">{snapshot.cards.length ? t("reviewDue", { n: due }) : t("reviewEmpty")}</p>
        {due > 0 && <Link href="/review" className={clsx(cta, "mt-3")}>{t("reviewStart")}</Link>}
      </section>

      <section className={clsx(card, "md:col-span-2")} aria-labelledby="badges-h">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="badges-h" className="text-xl font-bold">{t("recentBadges")}</h2>
          <Link href="/profile" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary hover:underline">
            {t("seeStats")} <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        {recent.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((b) => {
              const Icon = badgeIcon(b.id);
              return (
                <li key={b.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"><Icon className="size-5" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{tb(`${b.id}.title`)}</span>
                    <span className="block truncate text-sm text-muted">{tb(`${b.id}.desc`)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-muted">{tb("firstLesson.desc")}</p>
        )}
      </section>
    </div>
  );
}
