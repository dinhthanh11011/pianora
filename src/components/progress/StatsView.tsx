"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Download, Lock, Upload } from "lucide-react";
import clsx from "clsx";
import { BADGES } from "@/lib/gamification/badges";
import { dayKey, lastDays } from "@/lib/gamification/dates";
import { GOAL_PRESETS, type DailyGoal } from "@/lib/gamification/goal";
import { playerLevel } from "@/lib/gamification/xp";
import { parseBackup, toBackupJson } from "@/lib/storage/backup";
import { rehydrateProgress, useProgress } from "@/stores/progress";
import { BarChart, LineChart } from "./Charts";
import { badgeIcon } from "./BadgeIcon";

const card = "rounded-2xl border border-border bg-surface p-5";
const btn = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-2 px-4 font-medium transition-colors duration-200 hover:bg-border";

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular">{value}</p>
    </div>
  );
}

/** Profile: totals, charts, daily goal, badges and JSON backup. */
export function StatsView() {
  const t = useTranslations("stats");
  const tb = useTranslations("badges");
  const format = useFormatter();
  const { hydrated, snapshot, setGoal, replaceAll } = useProgress();
  useEffect(rehydrateProgress, []);
  const file = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const { profile, days, attempts } = snapshot;
  const totalMin = Math.round(days.reduce((n, d) => n + d.activeMs, 0) / 60_000);
  const runs = attempts.filter((a) => a.kind === "practice");
  const last10 = runs.slice(-10);
  const avg = last10.length ? Math.round(last10.reduce((n, a) => n + a.score, 0) / last10.length) : null;

  const byDay = new Map(days.map((d) => [d.id, d]));
  const dayLabel = (k: string) => format.dateTime(new Date(`${k}T12:00:00`), { day: "numeric", month: "numeric" });
  const minutesPts = lastDays(dayKey(), 14).map((k) => ({ label: dayLabel(k), value: Math.round((byDay.get(k)?.activeMs ?? 0) / 60_000) }));
  const scorePts = runs.slice(-20).map((a) => ({ label: dayLabel(dayKey(a.at)), value: a.score }));

  const have = new Map(snapshot.badges.map((b) => [b.id, b]));

  const pickGoal = (g: DailyGoal) => setGoal(g);

  const exportJson = () => {
    const blob = new Blob([toBackupJson(snapshot)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pianora-backup-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = parseBackup(await f.text());
      if (!window.confirm(t("importConfirm"))) return;
      await replaceAll(data);
      setNotice({ ok: true, text: t("importOk") });
    } catch {
      setNotice({ ok: false, text: t("importFail") });
    } finally {
      if (file.current) file.current.value = "";
    }
  };

  return (
    <div className={clsx("space-y-8", !hydrated && "opacity-60")} aria-busy={!hydrated}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile label={t("level")} value={playerLevel(profile.xp).level} />
        <Tile label={t("totalXp")} value={profile.xp} />
        <Tile label={t("minutes")} value={t("minutesValue", { n: totalMin })} />
        <Tile label={t("lessons")} value={snapshot.lessons.length} />
        <Tile label={t("avgScore")} value={avg ?? "–"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title={t("chartMinutes")} points={minutesPts} format={(v) => t("minutesValue", { n: v })} />
        {scorePts.length ? (
          <LineChart title={t("chartScore")} points={scorePts} format={(v) => String(v)} />
        ) : (
          <div className={clsx(card, "grid place-items-center text-muted")}>
            <p><span className="block font-semibold text-foreground">{t("chartScore")}</span>{t("noData")}</p>
          </div>
        )}
      </div>

      <section className={card} aria-labelledby="goal-h">
        <h2 id="goal-h" className="text-xl font-bold">{t("goalTitle")}</h2>
        <div className="mt-3 space-y-3">
          {(["minutes", "lessons"] as const).map((kind) => (
            <div key={kind} role="group" aria-label={t(`goalKind.${kind}`)} className="flex flex-wrap items-center gap-2">
              <span className="w-28 text-sm text-muted">{t(`goalKind.${kind}`)}</span>
              {GOAL_PRESETS[kind].map((n) => {
                const on = profile.goal.kind === kind && profile.goal.target === n;
                return (
                  <button
                    key={n} type="button" aria-pressed={on} onClick={() => pickGoal({ kind, target: n })}
                    className={clsx("min-h-11 rounded-lg px-3 text-sm font-medium transition-colors duration-200", on ? "bg-primary text-on-primary" : "bg-surface-2 hover:bg-border")}
                  >
                    {t(`goalUnit.${kind}`, { n })}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="badges-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="badges-h" className="text-xl font-bold">{t("badgesTitle")}</h2>
          <p className="text-sm tabular text-muted">{t("badgeCount", { n: have.size, total: BADGES.length })}</p>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b) => {
            const got = have.get(b.id);
            const Icon = got ? badgeIcon(b.id) : Lock;
            return (
              <li key={b.id} className={clsx("flex items-center gap-3 rounded-xl border border-border bg-surface p-3", !got && "opacity-60")}>
                <span className={clsx("grid size-11 shrink-0 place-items-center rounded-full", got ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{tb(`${b.id}.title`)}</span>
                  <span className="block text-sm text-muted">
                    {tb(`${b.id}.desc`)}
                    {got ? ` · ${format.dateTime(got.earnedAt, { dateStyle: "short" })}` : <span className="sr-only"> · {t("locked")}</span>}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={card} aria-labelledby="data-h">
        <h2 id="data-h" className="text-xl font-bold">{t("data")}</h2>
        <p className="mt-1 max-w-prose text-muted">{t("dataHelp")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={exportJson} className={btn} disabled={!hydrated}>
            <Download className="size-5" aria-hidden /> {t("export")}
          </button>
          <button type="button" onClick={() => file.current?.click()} className={btn} disabled={!hydrated}>
            <Upload className="size-5" aria-hidden /> {t("import")}
          </button>
          <input ref={file} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void importJson(e.target.files?.[0])} />
        </div>
        {notice && <p role="status" className={clsx("mt-3 font-medium", notice.ok ? "text-success" : "text-danger")}>{notice.text}</p>}
      </section>
    </div>
  );
}
