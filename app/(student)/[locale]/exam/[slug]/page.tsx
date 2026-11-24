import type { Metadata } from 'next';
import { GET_EXAM_OVERVIEW } from '@/apollo/user/query';
import { publicQuery } from '@/apollo/server';
import { ExamOverview } from '@/libs/components/exam/exam-overview';
import { isLocale, localizedPath, locales } from '@/libs/i18n/config';
import type { Exam } from '@/libs/types/api';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
	const { locale, slug } = await params;
	if (!isLocale(locale)) return {};
	const response = await publicQuery<{ getExamOverview: Exam }>(GET_EXAM_OVERVIEW, { slug });
	const exam = response?.getExamOverview;
	if (!exam) return { robots: { index: false } };
	const route = '/exam/' + encodeURIComponent(slug);
	return {
		title: exam.title,
		description: exam.description ?? undefined,
		alternates: {
			canonical: localizedPath(locale, route),
			languages: Object.fromEntries(locales.map((item) => [item, localizedPath(item, route)])),
		},
	};
}

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ mode?: string }>;
}) {
	const [{ slug }, { mode }] = await Promise.all([params, searchParams]);
	return <ExamOverview slug={slug} preferred={mode} />;
}
