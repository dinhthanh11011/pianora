"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-muted hover:bg-surface-2">
      <Languages className="size-5" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
        className="cursor-pointer bg-transparent text-sm font-medium uppercase text-foreground outline-none"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="bg-surface">
            {l.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
