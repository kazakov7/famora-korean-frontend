'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, AudioLines, BookOpen, ChevronRight, Layers3, PencilLine, Timer } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_EXAM_CATALOG } from '@/apollo/user/query';
import { useLocale } from '@/libs/i18n/context';
import { examKindKeys } from '@/libs/i18n/config';
import type { Exam, Page } from '@/libs/types/api';
import { ContentImage, Empty, LoadError, Loading } from '@/libs/components/common/ui';

const modes = [
	{ title: 'TOPIK I', level: 'beginner', copy: 'topikOneInfo', href: '/topik/topik-1', glyph: '읽', tone: 'sage' },
	{ title: 'TOPIK II', level: 'advanced', copy: 'topikTwoInfo', href: '/topik/topik-2', glyph: '쓰', tone: 'lavender' },
	{ title: 'Mock Exam', level: 'practice', copy: 'mockInfo', href: '/mock-exam', glyph: '모', tone: 'peach' },
] as const;

export function CategoryCards({ topikOnly = false }: { topikOnly?: boolean }) {
	const { t, url } = useLocale();
	return (
		<div className={'category-grid ' + (topikOnly ? 'two' : '')}>
			{modes.slice(0, topikOnly ? 2 : 3).map((mode) => (
				<Link key={mode.title} href={url(mode.href)} className={'category-card ' + mode.tone}>
					<span className="card-arrow">
						<ArrowUpRight size={20} strokeWidth={1.8} />
					</span>
					<span className="category-glyph" aria-hidden="true">
						{mode.glyph}
					</span>
					<div className="category-content">
						<span className="category-level">{t(mode.level)}</span>
						<h3>{mode.href === '/mock-exam' ? t('mock') : mode.title}</h3>
						<p>{t(mode.copy)}</p>
					</div>
				</Link>
			))}
		</div>
	);
}

export function ExamCard({ exam }: { exam: Exam }) {
	const { t, url } = useLocale();
	return (
		<Link className="exam-card" href={url('/exam/' + encodeURIComponent(exam.slug))}>
			{exam.coverUrl ? (
				<span className="exam-card-cover">
					<ContentImage url={exam.coverUrl} />
				</span>
			) : (
				<span className="exam-card-icon">
					<BookOpen size={22} />
				</span>
			)}
			<div className="exam-card-content">
				<span className="exam-card-kind">{t(examKindKeys[exam.kind])}</span>
				<h3 lang={exam.languageCode}>{exam.title}</h3>
				<div className="exam-card-meta">
					<Timer size={15} />
					{Math.ceil(exam.durationSeconds / 60)} {t('minute')}
					<span>·</span>
					{exam.sections.length} {t('sections').toLocaleLowerCase()}
				</div>
			</div>
			<ChevronRight className="exam-chevron" size={20} />
		</Link>
	);
}

export function Home() {
	const { t, url } = useLocale();
	const { data, loading, error, refetch } = useQuery<{ getExamCatalog: Page<Exam> }>(GET_EXAM_CATALOG, {
		variables: { page: { limit: 3, offset: 0 } },
		fetchPolicy: 'cache-and-network',
	});
	const exams = data?.getExamCatalog.list ?? [];
	return (
		<main className="container home-page">
			<section className="hero">
				<div className="hero-text">
					<span className="hero-tag">
						<span className="hero-tag-dot" />
						{t('heroTag')}
					</span>
					<h1>
						{t('heroFirst')}
						<br />
						<span>{t('heroSecond')}</span>
					</h1>
					<p>{t('heroBody')}</p>
					<div className="hero-actions">
						<Link className="button primary" href={url('/topik')}>
							{t('explore')}
							<ArrowRight size={18} />
						</Link>
						<Link className="button hero-secondary" href={url('/mock-exam')}>
							{t('mock')}
							<ArrowUpRight size={17} />
						</Link>
					</div>
				</div>
				<div className="hero-art" aria-hidden="true">
					<div className="hero-image" />
				</div>
			</section>
			<div className="home-tools" aria-label={t('sections')}>
				<span>
					<AudioLines size={18} />
					{t('listening')}
				</span>
				<span>
					<BookOpen size={18} />
					{t('reading')}
				</span>
				<span>
					<PencilLine size={18} />
					{t('writing')}
				</span>
				<span>
					<Layers3 size={18} />
					{t('full')}
				</span>
			</div>
			<section className="home-section">
				<div className="home-section-heading">
					<h2>{t('optionsTitle')}</h2>
					<p>{t('optionsBody')}</p>
				</div>
				<CategoryCards />
			</section>
			<section className="home-section featured-section">
				<div className="home-section-heading with-action">
					<div>
						<h2>{t('featured')}</h2>
					</div>
					<Link href={url('/topik')} className="text-link">
						{t('viewAll')}
						<ArrowRight size={16} />
					</Link>
				</div>
				{loading && !data ? (
					<Loading inline />
				) : error ? (
					<LoadError onRetry={() => void refetch()} />
				) : exams.length ? (
					<div className="exam-grid">
						{exams.map((exam) => (
							<ExamCard key={exam.id} exam={exam} />
						))}
					</div>
				) : (
					<Empty title={t('noExams')} icon={<BookOpen size={24} />} />
				)}
			</section>
		</main>
	);
}
