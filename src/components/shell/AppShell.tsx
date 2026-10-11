"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { House, Map, Piano, Wrench, User } from "lucide-react";
import clsx from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";

const NAV = [
  { href: "/", key: "home", icon: House },
  { href: "/path", key: "path", icon: Map },
  { href: "/practice", key: "practice", icon: Piano },
  { href: "/tools", key: "tools", icon: Wrench },
  { href: "/profile", key: "profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        {t("common.skipToContent")}
      </a>

      {/* Sidebar ≥1024px */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface p-4 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-xl font-bold">
          <Piano className="size-7 text-primary" aria-hidden />
          Pianora
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, key, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={clsx(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors duration-200",
                isActive(href) ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar <1024px */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 lg:hidden">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Piano className="size-6 text-primary" aria-hidden />
            Pianora
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
        </header>

        <main id="main" className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>

        {/* Bottom nav <1024px */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {NAV.map(({ href, key, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={clsx(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                isActive(href) ? "text-primary" : "text-muted",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
