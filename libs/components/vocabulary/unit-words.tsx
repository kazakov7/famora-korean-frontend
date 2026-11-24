'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { BookMarked, ChevronDown } from 'lucide-react';
import { SAVE_VOCABULARY_UNIT_WORD } from '@/apollo/user/mutation';
import { GET_VOCABULARY_UNIT } from '@/apollo/user/query';
import { useSession } from '@/libs/auth/session';
import { useApi } from '@/libs/hooks/use-api';
import { useLocale } from '@/libs/i18n/context';
import type { VocabularyUnit } from '@/libs/types/api';
import { Feedback, LoadError, Loading } from '@/libs/components/common/ui';

export function UnitWords({ slug }: { slug: string }) {
	const { t, url } = useLocale();
	const { member } = useSession();
	const { mutate } = useApi();
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState<string | null>(null);
	const [saved, setSaved] = useState(new Set<string>());
	const [failed, setFailed] = useState(false);
	const { data, loading, error, refetch } = useQuery<{ getVocabularyUnit: VocabularyUnit }>(GET_VOCABULARY_UNIT, {
		variables: { slug },
		skip: !open,
	});
	const unit = data?.getVocabularyUnit;

	async function save(id: string, memberId: string) {
		setPending(id);
		setFailed(false);
		try {
			await mutate(SAVE_VOCABULARY_UNIT_WORD, { id });
			setSaved((previous) => new Set([...previous, memberId + ':' + id]));
		} catch {
			setFailed(true);
		} finally {
			setPending(null);
		}
	}

	return (
		<details className="panel vocabulary-unit content-block" onToggle={(event) => setOpen(event.currentTarget.open)}>
			<summary>
				<BookMarked size={20} aria-hidden="true" />
				{t('vocabularyUnitWords')}
				<ChevronDown size={18} aria-hidden="true" />
			</summary>
			{open && (
				<>
					{loading && !unit && <Loading />}
					{error && <LoadError onRetry={() => void refetch()} />}
					{unit && (
						<>
							<Feedback message={failed ? t('error') : undefined} />
							<ul className="vocabulary-unit-words">
								{unit.words.map((word) => {
									const isSaved = member && saved.has(member.id + ':' + word.id);
									return (
										<li key={word.id}>
											<strong lang={unit.languageCode}>{word.term}</strong>
											<span>{word.translation}</span>
											{member && (
												<button
													type="button"
													className="button secondary small"
													disabled={pending !== null || isSaved}
													onClick={() => void save(word.id, member.id)}
												>
													{t(isSaved ? 'success' : 'saveWord')}
												</button>
											)}
										</li>
									);
								})}
							</ul>
							<Link
								className="text-link"
								href={url('/vocabulary/' + unit.collectionPath.map(encodeURIComponent).join('/'))}
							>
								{t('vocabularyCollection')}
							</Link>
						</>
					)}
				</>
			)}
		</details>
	);
}
