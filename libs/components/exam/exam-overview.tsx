'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, AudioLines, BookOpenText, CalendarDays, Layers3, PencilLine, Timer } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_DAILY_PRACTICE, GET_EXAM_OVERVIEW } from '@/apollo/user/query';
import { RECORD_EXAM_OPEN, START_ATTEMPT } from '@/apollo/user/mutation';
import { useSession } from '@/libs/auth/session';
import { useApi } from '@/libs/hooks/use-api';
import { examKindKeys, sectionKeys } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import type { Attempt, AttemptMode, DailyPractice, Exam } from '@/libs/types/api';
import {
	BackLink,
	ContentImage,
	Empty,
	Feedback,
	LoadError,
	Loading,
	SectionHeading,
} from '@/libs/components/common/ui';
import { UnitWords } from '@/libs/components/vocabulary/unit-words';

const icons = { FULL: Layers3, LISTENING: AudioLines, READING: BookOpenText, WRITING: PencilLine };

export function ExamOverview({ slug, preferred }: { slug?: string; preferred?: string }) {
	const { locale, t, url } = useLocale();
	const { member, checking } = useSession();
	const { mutate } = useApi();
	const router = useRouter();
	const daily = slug === undefined;
	const { data, error, loading, refetch } = useQuery<{
		getExamOverview?: Exam;
		getDailyPractice?: DailyPractice | null;
	}>(
		daily ? GET_DAILY_PRACTICE : GET_EXAM_OVERVIEW,
		daily ? { fetchPolicy: 'network-only', pollInterval: 30_000 } : { variables: { slug } },
	);
	const practice = data?.getDailyPractice;
	const exam = daily ? practice?.exam : data?.getExamOverview;
	const recorded = useRef(new Set<string>());
	const [busy, setBusy] = useState<AttemptMode | null>(null);
	const [fault, setFault] = useState('');
	useEffect(() => {
		if (!exam || !member || recorded.current.has(exam.id + member.id)) return;
		const key = exam.id + member.id;
		recorded.current.add(key);
		void mutate(RECORD_EXAM_OPEN, { id: exam.id }).catch(() => recorded.current.delete(key));
	}, [exam, member, mutate]);
	async function start(mode: AttemptMode) {
		if (!exam || busy) return;
		setBusy(mode);
		setFault('');
		try {
			const { startAttempt } = await mutate<{ startAttempt: Attempt }>(START_ATTEMPT, {
				input: { examId: exam.id, mode },
			});
			router.push(url('/attempt/' + startAttempt.id));
		} catch {
			setFault(t('error'));
			setBusy(null);
			if (daily) void refetch().catch(() => undefined);
		}
	}
	const vocabulary = exam?.kind === 'VOCABULARY';
	const back = url(daily ? '' : vocabulary ? '/vocabulary' : exam?.kind === 'MOCK' ? '/mock-exam' : '/topik');
	return (
		<main className="container page-space exam-overview">
			<BackLink
				href={back}
				label={t(daily ? 'home' : vocabulary ? 'vocabularyLibrary' : exam?.kind === 'MOCK' ? 'mock' : 'topik')}
			/>
			{loading && (!daily || !exam) ? (
				<Loading />
			) : daily && !error && !exam ? (
				<>
					<SectionHeading title={t('dailyPractice')} icon={<CalendarDays size={23} />} />
					<Empty title={t('dailyPracticeUnavailable')} />
				</>
			) : error || !exam ? (
				<LoadError onRetry={() => void refetch()} />
			) : (
				<>
					<div className="exam-intro">
						<div>
							{practice ? (
								<time className="meta-pill" dateTime={practice.date}>
									{locale === 'uz'
										? practice.date.split('-').reverse().join('.')
										: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
												new Date(practice.date),
											)}
								</time>
							) : (
								<span className="meta-pill">{t(examKindKeys[exam.kind])}</span>
							)}
							<SectionHeading
								title={daily ? t('dailyPractice') : exam.title}
								description={daily ? t('dailyPracticeInfo') : exam.description || undefined}
								icon={daily ? <CalendarDays size={23} /> : undefined}
							/>
							<div className="exam-intro-meta">
								<Timer size={17} />
								{Math.ceil(exam.durationSeconds / 60)} {t('minute')}
								<span>·</span>
								<Layers3 size={17} />
								{practice
									? t('dailyPracticeQuestionCount').replace('{count}', String(practice.questionCount))
									: `${exam.sections.length} ${t('sections').toLocaleLowerCase()}`}
							</div>
						</div>
						{exam.coverUrl && (
							<div className="intro-cover">
								<ContentImage url={exam.coverUrl} />
							</div>
						)}
					</div>
					<section className="content-block">
						<div className="home-section-heading">
							<h2>{t(daily ? 'tests' : 'modeTitle')}</h2>
							{!member && !checking && <p>{t('signInForTest')}</p>}
						</div>
						<Feedback message={fault} />
						<div className="mode-grid">
							{[
								{
									kind: 'FULL' as const,
									title: t(vocabulary ? 'vocabularyQuiz' : 'full'),
									durationSeconds: exam.durationSeconds,
								},
								...exam.sections.flatMap((section) =>
									section.kind === 'VOCABULARY' ? [] : [{ ...section, kind: section.kind }],
								),
							].map((mode) => {
								const Icon = icons[mode.kind];
								const label = mode.title || t(sectionKeys[mode.kind]);
								return (
									<article
										key={mode.kind}
										className={
											'mode-card ' +
											(mode.kind === 'FULL' ? 'featured-mode ' : '') +
											(preferred === mode.kind ? 'preferred-mode' : '')
										}
									>
										<span className="lead-icon">
											<Icon size={22} />
										</span>
										<div>
											<h3>{label}</h3>
											<p>
												{Math.ceil(mode.durationSeconds / 60)} {t('minute')}
												{mode.kind === 'FULL' && !vocabulary && <> · {t('fullDescription')}</>}
											</p>
										</div>
										{member ? (
											<button
												className="button primary small"
												disabled={busy !== null}
												onClick={() => void start(mode.kind)}
											>
												{busy === mode.kind ? t('loading') : t('start')}
												<ArrowRight size={16} />
											</button>
										) : (
											<Link
												className="button primary small"
												href={url(
													'/account/login?returnTo=' +
														encodeURIComponent(
															url(
																daily
																	? '/daily-practice'
																	: '/exam/' + encodeURIComponent(exam.slug) + '?mode=' + mode.kind,
															),
														),
												)}
											>
												{t('start')}
												<ArrowRight size={16} />
											</Link>
										)}
									</article>
								);
							})}
						</div>
					</section>
					{vocabulary && slug && <UnitWords slug={slug} />}
				</>
			)}
		</main>
	);
}
