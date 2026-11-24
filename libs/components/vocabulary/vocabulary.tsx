'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { BookMarked, PencilLine } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_VOCABULARY } from '@/apollo/user/query';
import { UPDATE_VOCABULARY_WORD } from '@/apollo/user/mutation';
import { useApi } from '@/libs/hooks/use-api';
import { sectionKeys } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import type { Page, Word } from '@/libs/types/api';
import {
	Empty,
	Feedback,
	humanDate,
	LoadError,
	Loading,
	Modal,
	Pagination,
	SectionHeading,
} from '@/libs/components/common/ui';

const limit = 18;

export function Vocabulary() {
	const { t, url, locale } = useLocale();
	const { mutate } = useApi();
	const [offset, setOffset] = useState(0);
	const [editing, setEditing] = useState<Word | null>(null);
	const [busy, setBusy] = useState(false);
	const [fault, setFault] = useState(false);
	const { data, loading, error, refetch } = useQuery<{ getVocabulary: Page<Word> }>(GET_VOCABULARY, {
		variables: { page: { offset, limit } },
		fetchPolicy: 'cache-and-network',
	});
	const rows = data?.getVocabulary;
	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editing) return;
		const form = new FormData(event.currentTarget);
		setBusy(true);
		setFault(false);
		try {
			await mutate(UPDATE_VOCABULARY_WORD, {
				input: {
					id: editing.id,
					translation: String(form.get('translation') ?? '').trim() || null,
					note: String(form.get('note') ?? '').trim() || null,
				},
			});
			await refetch();
			setEditing(null);
		} catch {
			setFault(true);
		} finally {
			setBusy(false);
		}
	}
	return (
		<>
			<SectionHeading title={t('words')} icon={<BookMarked size={23} />} />
			{loading && !data ? (
				<Loading />
			) : error ? (
				<LoadError onRetry={() => void refetch()} />
			) : !rows?.list.length ? (
				<Empty title={t('wordsEmpty')} icon={<BookMarked size={25} />} />
			) : (
				<div className="word-list">
					{rows.list.map((word) => (
						<article key={word.id} className="panel">
							<div className="panel-heading">
								<div>
									<h2 lang={word.languageCode}>{word.term}</h2>
									<span className="caption">{humanDate(word.createdAt, locale)}</span>
								</div>
								<button
									className="icon-button"
									title={t('edit')}
									aria-label={t('edit') + ' ' + word.term}
									onClick={() => {
										setFault(false);
										setEditing(word);
									}}
								>
									<PencilLine size={20} />
								</button>
							</div>
							{word.translation && <p className="word-translation">{word.translation}</p>}
							{word.note && <p className="word-note">{word.note}</p>}
							{word.sources.length > 0 && (
								<div className="word-sources">
									<small>{t('sources')}</small>
									{word.sources.map((source) => (
										<Link key={source.questionId} href={url('/attempt/' + source.attemptId)} className="text-link">
											{source.examTitle} · {t(sectionKeys[source.section])}
										</Link>
									))}
								</div>
							)}
						</article>
					))}
				</div>
			)}
			<Pagination offset={offset} total={rows?.total ?? 0} limit={limit} onChange={setOffset} />
			<Modal
				open={Boolean(editing)}
				title={editing?.term ?? t('edit')}
				onClose={() => {
					if (!busy) setEditing(null);
				}}
			>
				<Feedback message={fault ? t('error') : undefined} />
				<form key={editing?.id} className="form-stack" onSubmit={(event) => void save(event)}>
					<label className="field">
						{t('translation')}
						<input name="translation" defaultValue={editing?.translation ?? ''} maxLength={1500} />
					</label>
					<label className="field">
						{t('note')}
						<textarea name="note" rows={4} maxLength={5000} defaultValue={editing?.note ?? ''} />
					</label>
					<button className="button primary" disabled={busy}>
						{t(busy ? 'saving' : 'save')}
					</button>
				</form>
			</Modal>
		</>
	);
}
