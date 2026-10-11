import { getTranslations, setRequestLocale } from "next-intl/server";
import { PathView } from "@/components/lesson/PathView";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="text-3xl font-bold">{t("path.title")}</h1>
      <p className="mb-6 mt-2 text-muted">{t("path.subtitle")}</p>
      <PathView />
    </div>
  );
}
