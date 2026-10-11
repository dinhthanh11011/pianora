"use client";

import { useTranslations } from "next-intl";
import { Cable, CircleAlert, CircleCheck } from "lucide-react";
import { useInputStore } from "@/stores/input";

export function MidiStatus() {
  const t = useTranslations("midi");
  const { midiStatus, devices } = useInputStore();
  if (midiStatus === "idle") return null;

  const ok = midiStatus === "connected";
  const Icon = ok ? CircleCheck : midiStatus === "no-device" ? Cable : CircleAlert;
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        ok ? "border-success/40 bg-success/10" : "border-border bg-surface-2"
      }`}
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${ok ? "text-success" : "text-accent"}`} aria-hidden />
      <div>
        <p className="font-medium">{ok ? t("connected", { devices: devices.join(", ") }) : t(midiStatus)}</p>
        {!ok && <p className="text-muted">{t("fallback")}</p>}
      </div>
    </div>
  );
}
