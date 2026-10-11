import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="text-3xl font-bold text-balance lg:text-4xl">{t("greeting")}</h1>
      <p className="mt-2 text-lg text-muted">{t("subtitle")}</p>
      <Link
        href="/path"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 font-semibold text-on-primary transition-opacity duration-200 hover:opacity-90"
      >
        {t("continue")}
      </Link>
    </div>
  );
}
