import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReviewSession } from "@/components/progress/ReviewSession";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("review");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mb-6 mt-2 text-muted">{t("subtitle")}</p>
      <ReviewSession />
    </div>
  );
}
