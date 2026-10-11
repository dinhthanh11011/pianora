import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatsView } from "@/components/progress/StatsView";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">{t("profile.title")}</h1>
      <StatsView />
    </div>
  );
}
