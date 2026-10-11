import { getTranslations, setRequestLocale } from "next-intl/server";
import { PracticeRoom } from "@/components/practice/PracticeRoom";

export default async function PracticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("practice");

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <PracticeRoom />
    </div>
  );
}
