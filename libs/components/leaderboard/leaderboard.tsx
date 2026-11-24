'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Crown, Medal, Trophy } from 'lucide-react';
import { GET_LEADERBOARD } from '@/apollo/user/query';
import { useLocale } from '@/libs/i18n/context';
import type { Page, RankedMember } from '@/libs/types/api';
import { Avatar, Empty, LoadError, Loading, Pagination, SectionHeading } from '@/libs/components/common/ui';

const limit = 25;

export function Leaderboard() {
	const { t, locale } = useLocale();
	const [offset, setOffset] = useState(0);
	const { data, loading, error, refetch } = useQuery<{ getLeaderboard: Page<RankedMember> }>(GET_LEADERBOARD, {
		variables: { page: { limit, offset } },
	});
	const result = data?.getLeaderboard;
	const format = new Intl.NumberFormat(locale);
	const podium = !offset ? (result?.list.filter((item) => item.memberPoints > 0).slice(0, 3) ?? []) : [];
	return (
		<main className="container page-space leaderboard-page">
			<SectionHeading title={t('leaderboard')} description={t('leaderboardInfo')} icon={<Trophy size={24} />} />
			{loading && !data ? (
				<Loading />
			) : error ? (
				<LoadError onRetry={() => void refetch()} />
			) : !result?.total ? (
				<Empty title={t('noRanking')} />
			) : (
				<>
					{podium.length > 0 && (
						<div className="podium">
							{podium.map((item) => (
								<article className={'podium-card rank-' + item.rank} key={item.id}>
									<span className="podium-rank">
										{item.rank === 1 ? <Crown size={20} /> : <Medal size={18} />}
										{item.rank}
									</span>
									<Avatar url={item.memberImage} name={item.memberNick} />
									<h2>{item.memberNick}</h2>
									<strong>
										{format.format(item.memberPoints)} <small>{t('points')}</small>
									</strong>
								</article>
							))}
						</div>
					)}
					<div className="table-shell">
						<table>
							<thead>
								<tr>
									<th>{t('rank')}</th>
									<th>{t('participant')}</th>
									<th className="align-end">{t('points')}</th>
								</tr>
							</thead>
							<tbody>
								{result.list.map((item) => (
									<tr key={item.id}>
										<td>
											<span className="rank-number">{item.rank}</span>
										</td>
										<td>
											<span className="table-member">
												<Avatar url={item.memberImage} name={item.memberNick} />
												{item.memberNick}
											</span>
										</td>
										<td className="align-end">{format.format(item.memberPoints)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<Pagination offset={offset} limit={limit} total={result.total} onChange={setOffset} />
				</>
			)}
			<p className="caption rank-note">{t('rankHelp')}</p>
		</main>
	);
}
