"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const t = useTranslations("common");
  const [light, setLight] = useState(false);

  useEffect(() => setLight(document.documentElement.dataset.theme === "light"), []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("pianora-theme", next ? "light" : "dark");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("themeToggle")}
      aria-pressed={light}
      className="grid size-11 place-items-center rounded-xl text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
    >
      {light ? <Moon className="size-5" aria-hidden /> : <Sun className="size-5" aria-hidden />}
    </button>
  );
}
