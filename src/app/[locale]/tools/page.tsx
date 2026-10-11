import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metronome } from "@/components/tools/Metronome";
import { LatencyCalibration } from "@/components/tools/LatencyCalibration";

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tools");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Metronome />
        <LatencyCalibration />
      </div>
    </div>
  );
}
