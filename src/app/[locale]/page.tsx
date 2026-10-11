import { getTranslations, setRequestLocale } from "next-intl/server";
import { Dashboard } from "@/components/progress/Dashboard";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="text-3xl font-bold text-balance lg:text-4xl">{t("greeting")}</h1>
      <p className="mb-6 mt-2 text-lg text-muted">{t("subtitle")}</p>
      <Dashboard />
    </div>
  );
}
