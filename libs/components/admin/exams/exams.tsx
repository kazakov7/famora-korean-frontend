'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, Files, Plus } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { CREATE_EXAM } from '@/apollo/admin/mutation';
import { GET_ADMIN_EXAMS, GET_EXAM_FAMILIES, GET_EXAM_LANGUAGES } from '@/apollo/admin/query';
import { useApi } from '@/libs/hooks/use-api';
import { useLocale } from '@/libs/i18n/context';
import { examKindKeys } from '@/libs/i18n/config';
import type { AdminExam, ExamFamily, ExamLanguage, Page, VersionHeader } from '@/libs/types/api';
import { Empty, Feedback, LoadError, Loading, Modal, Pagination, SectionHeading } from '@/libs/components/common/ui';
import { readInt, readOptionalText, readText, useAdminAction } from '@/libs/components/admin/admin-actions';
import { MediaField } from '@/libs/components/admin/media/media';

const limit = 20;

export function HeaderFields({
	value,
	cover,
	setCover,
}: {
	value?: VersionHeader;
	cover: string | null;
	setCover: (id: string | null) => void;
}) {
	const { t } = useLocale();
	return (
		<>
			<label className="field">
				{t('title')}
				<input name="title" required maxLength={250} defaultValue={value?.title} />
			</label>
			<label className="field">
				{t('secondsLabel')}
				<input
					name="durationSeconds"
					type="number"
					required
					min={1}
					max={86400}
					defaultValue={value?.durationSeconds ?? 1800}
				/>
			</label>
			<label className="field wide-field">
				{t('description')}
				<textarea name="description" rows={3} defaultValue={value?.description ?? ''} maxLength={10000} />
			</label>
			<MediaField label={t('cover')} type="image" value={cover} onChange={setCover} />
		</>
	);
}

export function headerInput(form: FormData, coverId: string | null) {
	return {
		title: readText(form, 'title'),
		description: readOptionalText(form, 'description'),
		durationSeconds: readInt(form, 'durationSeconds'),
		coverId,
	};
}

function NewExamForm({ onClose }: { onClose: () => void }) {
	const { t } = useLocale();
	const { mutate } = useApi();
	const router = useRouter();
	const action = useAdminAction();
	const [cover, setCover] = useState<string | null>(null);
	const [code, setCode] = useState('');
	const { data } = useQuery<{ getExamLanguages: ExamLanguage[] }>(GET_EXAM_LANGUAGES);
	const active = data?.getExamLanguages ?? [];
	const language = code || active[0]?.code || '';
	const { data: families } = useQuery<{ getExamFamilies: ExamFamily[] }>(GET_EXAM_FAMILIES, {
		variables: { code: language },
		skip: !language,
	});

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		await action.run(async () => {
			const { createExam } = await mutate<{ createExam: AdminExam }>(CREATE_EXAM, {
				input: {
					...headerInput(form, cover),
					slug: readText(form, 'slug'),
					kind: readText(form, 'kind'),
					languageCode: language,
					familyId: readOptionalText(form, 'family'),
				},
			});
			onClose();
			router.push('/admin/exams/' + createExam.id);
		});
	}
	return (
		<>
			<Feedback message={action.message} />
			<form className="form-grid" onSubmit={(event) => void submit(event)}>
				<HeaderFields cover={cover} setCover={setCover} />
				<label className="field">
					{t('slug')}
					<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={140} />
				</label>
				<label className="field">
					{t('kind')}
					<select name="kind">
						<option value="OFFICIAL">{t('official')}</option>
						<option value="MOCK">{t('mock')}</option>
						<option value="VOCABULARY">{t('vocabularyQuiz')}</option>
					</select>
				</label>
				<label className="field">
					{t('examLanguage')}
					<select required value={language} onChange={(event) => setCode(event.target.value)}>
						{active.map((item) => (
							<option key={item.code} value={item.code}>
								{item.name}
							</option>
						))}
					</select>
				</label>
				<label className="field">
					{t('family')}
					<select name="family" key={language}>
						<option value="">{t('optional')}</option>
						{families?.getExamFamilies.map((item) => (
							<option key={item.id} value={item.id}>
								{item.name}
							</option>
						))}
					</select>
				</label>
				<button className="button primary wide-field" disabled={action.busy || !language}>
					{t(action.busy ? 'saving' : 'save')}
				</button>
			</form>
		</>
	);
}

export function ExamStatus({ exam }: { exam: AdminExam }) {
	const { t } = useLocale();
	return (
		<span className={'status-pill' + (!exam.archivedAt && exam.currentVersionId ? ' positive' : '')}>
			{t(exam.archivedAt ? 'archived' : exam.currentVersionId ? 'published' : 'draft')}
		</span>
	);
}

export function AdminExams() {
	const { t } = useLocale();
	const [offset, setOffset] = useState(0);
	const [creating, setCreating] = useState(false);
	const { data, loading, error, refetch } = useQuery<{ getAdminExams: Page<AdminExam> }>(GET_ADMIN_EXAMS, {
		variables: { page: { limit, offset } },
		fetchPolicy: 'cache-and-network',
	});
	const rows = data?.getAdminExams;
	return (
		<>
			<SectionHeading title={t('tests')} icon={<Files size={23} />}>
				<button className="button primary" onClick={() => setCreating(true)}>
					<Plus size={18} />
					{t('newExam')}
				</button>
			</SectionHeading>
			{loading && !data ? (
				<Loading />
			) : error ? (
				<LoadError onRetry={() => void refetch()} />
			) : !rows?.list.length ? (
				<Empty title={t('noExams')} />
			) : (
				<div className="table-shell">
					<table>
						<thead>
							<tr>
								<th>{t('title')}</th>
								<th>{t('kind')}</th>
								<th>{t('versions')}</th>
								<th>{t('visible')}</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{rows.list.map((exam) => (
								<tr key={exam.id}>
									<td>
										<Link className="admin-table-title" href={'/admin/exams/' + exam.id}>
											{exam.versions[0]?.title || exam.slug}
											<small>{exam.slug}</small>
										</Link>
									</td>
									<td>{t(examKindKeys[exam.kind])}</td>
									<td>{exam.versions.length}</td>
									<td>
										<ExamStatus exam={exam} />
									</td>
									<td>
										<Link
											className="icon-button"
											aria-label={t('edit') + ' ' + exam.slug}
											href={'/admin/exams/' + exam.id}
										>
											<ArrowUpRight size={18} />
										</Link>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<Pagination offset={offset} limit={limit} total={rows?.total ?? 0} onChange={setOffset} />
			<Modal open={creating} title={t('newExam')} onClose={() => setCreating(false)}>
				{creating && <NewExamForm onClose={() => setCreating(false)} />}
			</Modal>
		</>
	);
}
