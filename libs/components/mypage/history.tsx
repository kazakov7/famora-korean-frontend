'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ClipboardList, Timer } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_ATTEMPT_HISTORY, GET_PENDING_ATTEMPTS } from '@/apollo/user/query';
import { useSession } from '@/libs/auth/session';
import { sectionKeys } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import type { AttemptHistory, AttemptSummary } from '@/libs/types/api';
import {
	Avatar,
	clock,
	Empty,
	humanDate,
	LoadError,
	Loading,
	Pagination,
	SectionHeading,
} from '@/libs/components/common/ui';

export function AttemptList({ rows, pending = false }: { rows: AttemptSummary[]; pending?: boolean }) {
	const { t, url, locale } = useLocale();
	if (!rows.length)
		return (
			<Empty
				title={t(pending ? 'pendingNone' : 'historyEmpty')}
				icon={pending ? <Timer size={23} /> : <ClipboardList size={23} />}
			/>
		);
	return (
		<div className="history-list">
			{rows.map((row) => (
				<Link key={row.id} href={url((pending ? '/attempt/' : '/my/attempts/') + row.id)} className="history-row">
					<span className="lead-icon">{pending ? <Timer size={20} /> : <ClipboardList size={20} />}</span>
					<span className="history-row-name">
						<strong>{row.title}</strong>
						<small>
							{t(sectionKeys[row.mode])} · {humanDate(row.completedAt ?? row.createdAt, locale)}
						</small>
					</span>
					<span className="history-row-detail">
						{pending ? clock(row.remainingMs) : row.score + ' / ' + row.maxScore}
					</span>
					<ArrowUpRight size={17} />
				</Link>
			))}
		</div>
	);
}

export function MyOverview() {
	const { t, url } = useLocale();
	const { member } = useSession();
	const { data, loading, error, refetch } = useQuery<{ getAttemptHistory: AttemptHistory }>(GET_ATTEMPT_HISTORY, {
		variables: { page: { offset: 0, limit: 5 } },
		fetchPolicy: 'cache-and-network',
	});
	const { data: pending } = useQuery<{ getPendingAttempts: AttemptSummary[] }>(GET_PENDING_ATTEMPTS, {
		fetchPolicy: 'cache-and-network',
	});
	const history = data?.getAttemptHistory;
	const tests = pending?.getPendingAttempts ?? [];
	return (
		<div className="my-overview">
			<div className="member-banner">
				<Avatar name={member?.memberNick} url={member?.memberImage} />
				<div>
					<h1>{member?.memberFullName || member?.memberNick}</h1>
					<p>@{member?.memberNick}</p>
				</div>
				<div className="inline-actions member-actions">
					{member?.role === 'ADMIN' && (
						<Link className="button secondary small" href="/admin">
							{t('adminHome')}
						</Link>
					)}
					<Link className="button secondary small" href={url('/my/settings')}>
						{t('settings')}
					</Link>
				</div>
			</div>
			<div className="stats-grid">
				<div>
					<span>{t('points')}</span>
					<strong>{history?.memberPoints ?? member?.memberPoints ?? 0}</strong>
				</div>
				<div>
					<span>{t('testsCompleted')}</span>
					<strong>{history?.distinctCompletedTests ?? '—'}</strong>
				</div>
				<div>
					<span>{t('attemptCount')}</span>
					<strong>{history?.total ?? '—'}</strong>
				</div>
			</div>
			{tests.length > 0 && (
				<section className="content-block">
					<h2>{t('pausedTests')}</h2>
					<AttemptList pending rows={tests} />
				</section>
			)}
			<section className="content-block">
				<div className="list-heading">
					<h2>{t('history')}</h2>
					<Link className="text-link" href={url('/my/attempts')}>
						{t('viewAll')}
						<ArrowUpRight size={16} />
					</Link>
				</div>
				{loading && !data ? (
					<Loading />
				) : error ? (
					<LoadError onRetry={() => void refetch()} />
				) : (
					<AttemptList rows={history?.list ?? []} />
				)}
			</section>
		</div>
	);
}

export function History() {
	const { t } = useLocale();
	const [offset, setOffset] = useState(0);
	const limit = 18;
	const { data, loading, error, refetch } = useQuery<{ getAttemptHistory: AttemptHistory }>(GET_ATTEMPT_HISTORY, {
		variables: { page: { offset, limit } },
		fetchPolicy: 'cache-and-network',
	});
	const item = data?.getAttemptHistory;
	return (
		<>
			<SectionHeading title={t('history')} icon={<ClipboardList size={23} />} />
			{loading && !data ? (
				<Loading />
			) : error ? (
				<LoadError onRetry={() => void refetch()} />
			) : (
				<AttemptList rows={item?.list ?? []} />
			)}
			<Pagination offset={offset} limit={limit} total={item?.total ?? 0} onChange={setOffset} />
		</>
	);
}
