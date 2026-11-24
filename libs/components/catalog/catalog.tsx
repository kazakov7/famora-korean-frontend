'use client';

import { useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpenText, Layers3, Search } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_EXAM_CATALOG, GET_NAVIGATION } from '@/apollo/user/query';
import { useLocale } from '@/libs/i18n/context';
import type { Exam, ExamKind, Menu, Page } from '@/libs/types/api';
import { BackLink, Empty, LoadError, Loading, Pagination, SectionHeading } from '@/libs/components/common/ui';
import { CategoryCards, ExamCard } from '@/libs/components/homepage/home';

const defaults: Record<string, string> = { 'topik-1': 'TOPIK I', 'topik-2': 'TOPIK II' };
const limit = 18;

function menuAncestors(menu: Menu, menus: Menu[]) {
	const lookup = new Map(menus.map((row) => [row.id, row]));
	const chain = [menu];
	const seen = new Set<string>([menu.id]);
	let parent = menu.parentId;
	while (parent && !seen.has(parent)) {
		seen.add(parent);
		const row = lookup.get(parent);
		if (!row) break;
		chain.unshift(row);
		parent = row.parentId;
	}
	return chain;
}

function navigationPath(chain: Menu[], vocabulary: boolean) {
	return (vocabulary ? '/' : '/catalog/') + chain.map(({ slug }) => encodeURIComponent(slug)).join('/');
}

export function Catalog({
	mode,
	slug,
	path = [],
}: {
	mode: 'topik' | 'level' | 'mock' | 'dynamic' | 'vocabulary' | 'vocabulary-collection';
	slug?: string;
	path?: string[];
}) {
	const { t, url } = useLocale();
	const {
		data: nav,
		loading: navLoading,
		error: navError,
		refetch: refetchNav,
	} = useQuery<{ getNavigation: Menu[] }>(GET_NAVIGATION);
	const menus = nav?.getNavigation ?? [];
	const library = mode === 'vocabulary';
	const collection = mode === 'vocabulary-collection';
	const requireMenu = mode === 'dynamic' || library || collection;
	const vocabulary = library || collection;
	const menuSlug = library
		? 'vocabulary'
		: collection
			? path.at(-1)
			: mode === 'topik'
				? 'topik'
				: mode === 'mock'
					? 'mock-exam'
					: slug;
	const current = menus.find((item) => item.slug === menuSlug);
	const chain = current && vocabulary ? menuAncestors(current, menus) : [];
	const collectionPath = chain
		.slice(1)
		.map((item) => item.slug)
		.join('/');
	// Single-slug collection links also resolve after a menu is moved.
	const validCollection =
		chain[0]?.systemKey === 'VOCABULARY' &&
		chain.length > 1 &&
		(path.length === 1 || collectionPath === path.join('/'));
	const menu = collection && !validCollection ? undefined : current;
	const children = menus.filter((item) => item.parentId === menu?.id && !item.systemKey);
	const parent = collection && menu ? chain.at(-2) : undefined;
	const [search, setSearch] = useState('');
	const [offset, setOffset] = useState(0);
	const deferred = useDeferredValue(search.trim());
	const kind: ExamKind | undefined = mode === 'mock' ? 'MOCK' : collection ? 'VOCABULARY' : undefined;
	const filter = { menuSlug, search: deferred || undefined, kind };
	const { data, loading, error, refetch } = useQuery<{ getExamCatalog: Page<Exam> }>(GET_EXAM_CATALOG, {
		variables: { page: { limit, offset }, filter },
		skip: library || (requireMenu && !menu),
	});
	const title = library
		? t('vocabularyLibrary')
		: mode === 'topik'
			? t('topik')
			: mode === 'mock'
				? t('mock')
				: mode === 'level'
					? defaults[slug!]
					: (menu?.name ?? t('catalog'));
	const exams = data?.getExamCatalog.list ?? [];
	const showExams =
		!library &&
		(!collection || children.length === 0 || Boolean(data?.getExamCatalog.total) || Boolean(error) || Boolean(search));
	return (
		<main className="container page-space">
			<BackLink
				href={url(
					parent
						? navigationPath(chain.slice(0, -1), true)
						: collection
							? '/vocabulary'
							: mode === 'level'
								? '/topik'
								: '',
				)}
				label={
					parent && !parent.systemKey
						? parent.name
						: t(collection ? 'vocabularyLibrary' : mode === 'level' ? 'topik' : 'home')
				}
			/>
			<SectionHeading
				title={title}
				description={vocabulary ? t('vocabularyLibraryInfo') : mode === 'mock' ? t('mockInfo') : t('catalogBody')}
				icon={mode === 'mock' ? <Layers3 size={23} /> : <BookOpenText size={23} />}
			/>
			{mode === 'topik' && <CategoryCards topikOnly />}
			{requireMenu && navLoading && <Loading />}
			{requireMenu && navError && <LoadError onRetry={() => void refetchNav()} />}
			{requireMenu && !menu ? (
				!navLoading && !navError && <Empty title={t(library ? 'noVocabularyCollections' : 'unavailablePage')} />
			) : (
				<>
					{children.length > 0 && (
						<section className="content-block">
							<h2>{t('children')}</h2>
							<div className="subcatalog-grid">
								{children.map((item) => (
									<Link
										key={item.id}
										href={url(navigationPath(vocabulary ? [...chain, item] : menuAncestors(item, menus), vocabulary))}
										className="subcatalog-card"
									>
										<Layers3 size={21} />
										<span>{item.name}</span>
										<ArrowUpRight size={17} />
									</Link>
								))}
							</div>
						</section>
					)}
					{library && children.length === 0 && <Empty title={t('noVocabularyCollections')} />}
					{showExams && (
						<section className="content-block">
							<div className="list-heading">
								<h2>{t('tests')}</h2>
								<label className="search-input">
									<Search size={19} />
									<input
										value={search}
										onChange={(event) => {
											setSearch(event.target.value);
											setOffset(0);
										}}
										placeholder={t('search')}
										aria-label={t('search')}
									/>
								</label>
							</div>
							{loading && !data ? (
								<Loading />
							) : error ? (
								<LoadError onRetry={() => void refetch()} />
							) : exams.length ? (
								<div className="exam-grid">
									{exams.map((exam) => (
										<ExamCard key={exam.id} exam={exam} />
									))}
								</div>
							) : (
								<Empty title={deferred ? t('noMatches') : t('noExams')} />
							)}
							<Pagination limit={limit} offset={offset} total={data?.getExamCatalog.total ?? 0} onChange={setOffset} />
						</section>
					)}
				</>
			)}
		</main>
	);
}
