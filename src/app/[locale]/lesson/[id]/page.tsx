import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { LESSONS, findLesson } from "@/content/curriculum";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

type Params = { params: Promise<{ locale: string; id: string }> };

export function generateStaticParams() {
  return LESSONS.map((r) => ({ id: r.lesson.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, id } = await params;
  const ref = findLesson(id);
  return ref ? { title: `${ref.lesson.title[locale as "vi" | "en"]} · Pianora` } : {};
}

export default async function LessonPage({ params }: Params) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!findLesson(id)) notFound();
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <LessonPlayer lessonId={id} />
    </div>
  );
}
