import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="text-3xl font-bold">{t("path.title")}</h1>
      <p className="mt-2 text-muted">{t("common.comingSoon")}</p>
    </div>
  );
}
