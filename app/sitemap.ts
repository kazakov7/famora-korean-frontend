import type { MetadataRoute } from 'next';
import { GET_EXAM_CATALOG } from '@/apollo/user/query';
import { publicQuery } from '@/apollo/server';
import { locales } from '@/libs/i18n/config';
import type { Exam, Page } from '@/libs/types/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const site = (process.env.QUIZ_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
	const runtime = await publicQuery<{ getExamCatalog: Page<Exam> }>(GET_EXAM_CATALOG, {
		page: { limit: 100, offset: 0 },
	});
	const paths = [
		'',
		'/topik',
		'/topik/topik-1',
		'/topik/topik-2',
		'/mock-exam',
		'/vocabulary',
		'/leaderboard',
		'/help',
		...(runtime?.getExamCatalog.list.map(({ slug }) => '/exam/' + encodeURIComponent(slug)) ?? []),
	];
	return locales.flatMap((locale) => paths.map((path) => ({ url: site + '/' + locale + path })));
}
