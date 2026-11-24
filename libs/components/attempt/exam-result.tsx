'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { Check, CircleMinus, CircleX, RefreshCw, Timer, Trophy } from 'lucide-react';
import { GET_ATTEMPT_RESULT } from '@/apollo/user/query';
import { sectionKeys } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import type { AttemptResult, QuestionGroup, ReviewQuestion } from '@/libs/types/api';
import {
	BackLink,
	clock,
	ContentImage,
	humanDate,
	LoadError,
	Loading,
	SectionHeading,
} from '@/libs/components/common/ui';
import { ExamPassage } from './exam-passage';

function ReviewGroup({ group }: { group: QuestionGroup }) {
	const { t } = useLocale();
	const start = (group.audioStartMs ?? 0) / 1000;
	return (
		<div className="question-context">
			{group.passage && <ExamPassage text={group.passage} />}
			{group.imageUrl && <ContentImage url={group.imageUrl} alt={t('passage')} />}
			{group.audioUrl && (
				<audio
					controls
					src={group.audioUrl}
					preload="none"
					aria-label={t('audio')}
					onLoadedMetadata={(event) => {
						if (start > 0) event.currentTarget.currentTime = start;
					}}
					onTimeUpdate={(event) => {
						const player = event.currentTarget;
						if (group.audioEndMs !== null && player.currentTime * 1000 >= group.audioEndMs) {
							player.pause();
							player.currentTime = start;
						}
					}}
				/>
			)}
		</div>
	);
}

function ReviewItem({ row, number, group }: { row: ReviewQuestion; number: number; group?: QuestionGroup }) {
	const { t } = useLocale();
	const status =
		row.kind === 'TEXT'
			? row.answerText
				? 'ungraded'
				: 'unanswered'
			: !row.selectedChoiceId
				? 'unanswered'
				: row.selectedChoiceId === row.correctChoiceId
					? 'correct'
					: 'wrong';
	return (
		<article className="panel review-item" id={'question-' + row.id}>
			<div className="panel-heading">
				<span className="caption">
					{t(sectionKeys[row.section])} · {t('question')} {number}
				</span>
				<span className={'review-status ' + status}>
					{status === 'correct' ? (
						<Check size={16} />
					) : status === 'wrong' ? (
						<CircleX size={16} />
					) : (
						<CircleMinus size={15} />
					)}
					{t(status)}
				</span>
			</div>
			{group && <ReviewGroup group={group} />}
			<h3 className="exam-text" lang="ko">
				{row.prompt}
			</h3>
			{row.imageUrl && <ContentImage url={row.imageUrl} alt={t('question')} zoom />}
			{row.kind === 'CHOICE' ? (
				<div className="choice-list">
					{row.choices.map((choice, index) => (
						<div
							key={choice.id}
							className={
								'choice-row ' +
								(choice.id === row.correctChoiceId
									? 'is-correct'
									: choice.id === row.selectedChoiceId
										? 'is-wrong'
										: '')
							}
						>
							<span className="choice-letter">{index + 1}</span>
							<div className="choice-body">
								{choice.text && <span lang="ko">{choice.text}</span>}
								{choice.imageUrl && <ContentImage url={choice.imageUrl} alt={String(index + 1)} />}
							</div>
							{choice.id === row.selectedChoiceId && <span className="caption">{t('yourAnswer')}</span>}
							{choice.id === row.correctChoiceId && <Check size={19} />}
						</div>
					))}
				</div>
			) : (
				<>
					<div className="review-prose">
						<strong>{t('yourAnswer')}</strong>
						<p className="exam-text" lang="ko">
							{row.answerText || '—'}
						</p>
					</div>
					{(row.sampleAnswer || row.sampleAnswerImageUrl) && (
						<div className="review-prose">
							<strong>{t('sampleAnswer')}</strong>
							{row.sampleAnswer && (
								<p className="exam-text" lang="ko">
									{row.sampleAnswer}
								</p>
							)}
							{row.sampleAnswerImageUrl && <ContentImage url={row.sampleAnswerImageUrl} alt={t('sampleAnswer')} zoom />}
						</div>
					)}
				</>
			)}
			{row.explanation && (
				<div className="review-prose">
					<strong>{t('explanation')}</strong>
					<p className="exam-text" lang="ko">
						{row.explanation}
					</p>
				</div>
			)}
		</article>
	);
}

export function ExamResult({ id }: { id: string }) {
	const { t, locale, url } = useLocale();
	const { data, loading, error, refetch } = useQuery<{ getAttemptResult: AttemptResult }>(GET_ATTEMPT_RESULT, {
		variables: { id },
		fetchPolicy: 'cache-and-network',
	});
	const result = data?.getAttemptResult;
	if (loading && !result) return <Loading />;
	if (error || !result) return <LoadError onRetry={() => void refetch()} />;
	const groups = new Map(
		result.sections.flatMap((section) => section.groups.map((group) => [group.id, group] as const)),
	);
	return (
		<div className="result-page">
			<BackLink href={url('/my/attempts')} label={t('history')} />
			<SectionHeading
				title={result.title}
				description={t(sectionKeys[result.mode]) + ' · ' + humanDate(result.completedAt ?? result.createdAt, locale)}
				icon={<Trophy size={23} />}
			/>
			<div className="stats-grid">
				<div>
					<span>{t('score')}</span>
					<strong>
						{result.score} / {result.maxScore}
					</strong>
				</div>
				<div>
					<span>{t('points')}</span>
					<strong>+{result.points}</strong>
				</div>
				<div>
					<span>{t('timeUsed')}</span>
					<strong>{clock(result.elapsedMs)}</strong>
				</div>
			</div>
			{result.reason === 'TIMEOUT' && (
				<p className="timeout-note">
					<Timer size={16} />
					{t('timeUp')}
				</p>
			)}
			<section className="content-block">
				<div className="list-heading">
					<h2>{t('result')}</h2>
					<Link
						className="button primary small"
						href={url(result.dailyPractice ? '/daily-practice' : '/exam/' + result.examSlug + '?mode=' + result.mode)}
					>
						<RefreshCw size={15} />
						{t(result.dailyPractice ? 'dailyPractice' : 'retake')}
					</Link>
				</div>
				<div className="table-shell">
					<table>
						<thead>
							<tr>
								<th>{t('sections')}</th>
								<th>{t('correct')}</th>
								<th>{t('wrong')}</th>
								<th>{t('unanswered')}</th>
								<th>{t('ungraded')}</th>
							</tr>
						</thead>
						<tbody>
							{result.sectionResults.map((item) => (
								<tr key={item.section}>
									<td>{t(sectionKeys[item.section])}</td>
									<td>{item.correct}</td>
									<td>{item.wrong}</td>
									<td>{item.unanswered}</td>
									<td>{item.ungraded}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
			<section className="content-block">
				<h2>{t('review')}</h2>
				<div className="review-list">
					{result.review.map((item, position) => (
						<ReviewItem
							key={item.id}
							row={item}
							number={position + 1}
							group={item.groupId ? groups.get(item.groupId) : undefined}
						/>
					))}
				</div>
			</section>
		</div>
	);
}
