'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { Archive, ArrowUpRight, ChevronDown, FolderTree, PencilLine, Plus, Trash2, X } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import {
	ARCHIVE_EXAM,
	CREATE_EXAM_DRAFT,
	DELETE_EXAM_SECTION,
	DELETE_EXAM_VARIANT,
	DELETE_QUESTION,
	DELETE_QUESTION_GROUP,
	PUBLISH_EXAM_VERSION,
	REMOVE_EXAM_MENU,
	SET_EXAM_MENU,
	UPDATE_EXAM_DRAFT,
} from '@/apollo/admin/mutation';
import { GET_ADMIN_EXAM, GET_ADMIN_EXAM_VERSION, GET_ADMIN_MENUS } from '@/apollo/admin/query';
import { useApi } from '@/libs/hooks/use-api';
import { sectionKeys } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import type { AdminExam, AdminSection, AdminVariant, AdminVersion, Menu } from '@/libs/types/api';
import { BackLink, Empty, Feedback, LoadError, Loading, SectionHeading } from '@/libs/components/common/ui';
import { ConfirmAction, readInt, readText, useAdminAction } from '@/libs/components/admin/admin-actions';
import { ContentForm, describeGroup } from './content-forms';
import type { ContentEdit } from './content-forms';
import { ExamStatus, HeaderFields, headerInput } from './exams';

const deletes = {
	variant: DELETE_EXAM_VARIANT,
	section: DELETE_EXAM_SECTION,
	group: DELETE_QUESTION_GROUP,
	question: DELETE_QUESTION,
};
const nextOrder = (items: { sortOrder: number }[]) =>
	items.length ? Math.max(...items.map(({ sortOrder }) => sortOrder)) + 1 : 0;
type Ask = { type: 'publish' } | { type: 'delete'; item: ContentEdit };

function Placements({ exam, refreshed }: { exam: AdminExam; refreshed: () => Promise<unknown> }) {
	const { t } = useLocale();
	const { mutate } = useApi();
	const action = useAdminAction();
	const { data } = useQuery<{ getAdminMenus: Menu[] }>(GET_ADMIN_MENUS);
	const menus = data?.getAdminMenus ?? [];
	async function attach(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		await action.run(async () => {
			await mutate(SET_EXAM_MENU, {
				input: { examId: exam.id, menuId: readText(form, 'menuId'), sortOrder: readInt(form, 'sortOrder') },
			});
			await refreshed();
		});
	}
	return (
		<section className="panel">
			<div className="panel-heading">
				<h2>{t('examMenus')}</h2>
				<FolderTree size={20} />
			</div>
			<Feedback message={action.message} />
			<div className="placement-pills">
				{exam.menuIds.map((id) => {
					const menu = menus.find((item) => item.id === id);
					return (
						<span className="status-pill positive" key={id}>
							{menu?.name ?? id.slice(0, 8)}
							<button
								type="button"
								className="icon-button"
								disabled={action.busy}
								aria-label={t('removePlacement') + ' ' + (menu?.name ?? '')}
								onClick={() =>
									void action.run(async () => {
										await mutate(REMOVE_EXAM_MENU, { exam: exam.id, menu: id });
										await refreshed();
									})
								}
							>
								<X size={14} />
							</button>
						</span>
					);
				})}
			</div>
			<form className="placement-form" onSubmit={(event) => void attach(event)}>
				<label className="field">
					{t('menus')}
					<select name="menuId" required>
						<option value="">{t('choose')}</option>
						{menus.map((menu) => (
							<option key={menu.id} value={menu.id}>
								{menu.name}
							</option>
						))}
					</select>
				</label>
				<label className="field">
					{t('order')}
					<input name="sortOrder" type="number" min={0} max={2147483647} required defaultValue={0} />
				</label>
				<button className="button secondary small" disabled={action.busy || !menus.length}>
					<Plus size={16} />
					{t('addPlacement')}
				</button>
			</form>
		</section>
	);
}

function VersionSettings({ version, refreshed }: { version: AdminVersion; refreshed: () => Promise<unknown> }) {
	const { t } = useLocale();
	const { mutate } = useApi();
	const action = useAdminAction();
	const [cover, setCover] = useState(version.coverId);
	const [saved, setSaved] = useState(false);
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setSaved(false);
		setSaved(
			await action.run(async () => {
				await mutate(UPDATE_EXAM_DRAFT, { id: version.id, input: headerInput(form, cover) });
				await refreshed();
			}),
		);
	}
	return (
		<section className="panel">
			<div className="panel-heading">
				<h2>{t('settings')}</h2>
			</div>
			<Feedback message={action.message || (saved ? t('success') : undefined)} success={saved && !action.message} />
			{version.publishedAt ? (
				<>
					<strong>{version.title}</strong>
					<p className="muted">{version.description}</p>
					<small className="caption">
						{version.durationSeconds} {t('second')}
					</small>
				</>
			) : (
				<form className="form-grid" onSubmit={(event) => void submit(event)}>
					<HeaderFields value={version} cover={cover} setCover={setCover} />
					<div className="wide-field">
						<button className="button primary small" disabled={action.busy}>
							{t(action.busy ? 'saving' : 'save')}
						</button>
					</div>
				</form>
			)}
		</section>
	);
}

function RowActions({
	edit,
	select,
	remove,
}: {
	edit: ContentEdit;
	select: (edit: ContentEdit) => void;
	remove: (edit: ContentEdit) => void;
}) {
	const { t } = useLocale();
	return (
		<div className="inline-actions">
			<button type="button" className="icon-button" onClick={() => select(edit)} aria-label={t('edit')}>
				<PencilLine size={16} />
			</button>
			<button type="button" className="icon-button" onClick={() => remove(edit)} aria-label={t('delete')}>
				<Trash2 size={16} />
			</button>
		</div>
	);
}

function SectionEditor({
	item,
	parent,
	editable,
	select,
	remove,
}: {
	item: AdminSection;
	parent: string;
	editable: boolean;
	select: (edit: ContentEdit) => void;
	remove: (edit: ContentEdit) => void;
}) {
	const { t } = useLocale();
	return (
		<div className="editor-section">
			<div className="editor-heading">
				<div>
					<h4>{item.title || t(sectionKeys[item.kind])}</h4>
					<small>
						{item.durationSeconds} {t('second')} · {item.questions.length} {t('questions').toLowerCase()}
					</small>
				</div>
				{editable && (
					<RowActions edit={{ kind: 'section', item, parent, order: item.sortOrder }} select={select} remove={remove} />
				)}
			</div>
			<details className="editor-resource">
				<summary>
					{t('groups')} ({item.groups.length}) <ChevronDown size={16} />
				</summary>
				<div className="editor-items">
					{editable && (
						<button className="button secondary small" onClick={() => select({ kind: 'group', parent: item.id })}>
							<Plus size={16} />
							{t('newGroup')}
						</button>
					)}
					{item.groups.map((group, index) => (
						<div className="editor-item" key={group.id}>
							<span>
								{describeGroup(group, index, t('groups'))}
								{group.audioId && <small> · {t('audio')}</small>}
								{group.imageId && <small> · {t('image')}</small>}
							</span>
							{editable && (
								<RowActions edit={{ kind: 'group', item: group, parent: item.id }} select={select} remove={remove} />
							)}
						</div>
					))}
				</div>
			</details>
			<details className="editor-resource" open>
				<summary>
					{t('questions')} ({item.questions.length}) <ChevronDown size={16} />
				</summary>
				<div className="editor-items">
					{editable && (
						<button
							className="button secondary small"
							onClick={() =>
								select({ kind: 'question', parent: item.id, section: item, order: nextOrder(item.questions) })
							}
						>
							<Plus size={16} />
							{t('newQuestion')}
						</button>
					)}
					{item.questions.map((question, index) => (
						<div className="editor-item" key={question.id}>
							<span>
								<small>{index + 1}.</small> {question.prompt || t('image')}
								<small className="editor-item-meta">
									{t(question.kind === 'CHOICE' ? 'choice' : 'textQuestion')} · {question.points} {t('questionPoints')}
								</small>
							</span>
							{editable && (
								<RowActions
									edit={{ kind: 'question', item: question, parent: item.id, section: item, order: question.sortOrder }}
									select={select}
									remove={remove}
								/>
							)}
						</div>
					))}
				</div>
			</details>
		</div>
	);
}

function VariantEditor({
	item,
	versionId,
	editable,
	select,
	remove,
}: {
	item: AdminVariant;
	versionId: string;
	editable: boolean;
	select: (edit: ContentEdit) => void;
	remove: (edit: ContentEdit) => void;
}) {
	const { t } = useLocale();
	return (
		<article className="panel variant-panel">
			<div className="panel-heading">
				<h3>{item.label}</h3>
				{editable && (
					<RowActions
						edit={{ kind: 'variant', item, parent: versionId, order: item.sortOrder }}
						select={select}
						remove={remove}
					/>
				)}
			</div>
			{item.sections.map((section) => (
				<SectionEditor
					key={section.id}
					item={section}
					parent={item.id}
					editable={editable}
					select={select}
					remove={remove}
				/>
			))}
			{editable && (
				<button
					className="button secondary small"
					onClick={() => select({ kind: 'section', parent: item.id, order: nextOrder(item.sections) })}
				>
					<Plus size={16} />
					{t('newSection')}
				</button>
			)}
		</article>
	);
}

export function ExamEditor({ id }: { id: string }) {
	const { t, url } = useLocale();
	const { mutate } = useApi();
	const action = useAdminAction();
	const [selected, setSelected] = useState<string | null>(null);
	const [editing, setEditing] = useState<ContentEdit | null>(null);
	const [asking, setAsking] = useState<Ask | null>(null);
	const examQuery = useQuery<{ getAdminExam: AdminExam }>(GET_ADMIN_EXAM, {
		variables: { id },
		fetchPolicy: 'cache-and-network',
	});
	const exam = examQuery.data?.getAdminExam;
	const fallback =
		exam?.versions.find((version) => !version.publishedAt)?.id ?? exam?.currentVersionId ?? exam?.versions[0]?.id;
	const selectedId = selected || fallback;
	const versionQuery = useQuery<{ getAdminExamVersion: AdminVersion }>(GET_ADMIN_EXAM_VERSION, {
		variables: { id: selectedId },
		skip: !selectedId,
		fetchPolicy: 'cache-and-network',
	});
	const version = versionQuery.data?.getAdminExamVersion;
	const editable = Boolean(version && !version.publishedAt);

	function refreshed() {
		return Promise.all([examQuery.refetch(), versionQuery.refetch()]);
	}
	async function newDraft() {
		await action.run(async () => {
			const data = await mutate<{ createExamDraft: AdminVersion }>(CREATE_EXAM_DRAFT, { id });
			await examQuery.refetch();
			setSelected(data.createExamDraft.id);
		});
	}
	async function confirm() {
		if (!asking || !version) return;
		await action.run(async () => {
			if (asking.type === 'publish') await mutate(PUBLISH_EXAM_VERSION, { id: version.id });
			else await mutate(deletes[asking.item.kind], { parent: asking.item.parent, id: asking.item.item?.id });
			await refreshed();
		});
		setAsking(null);
	}

	if (examQuery.loading && !exam) return <Loading />;
	if (examQuery.error || !exam) return <LoadError onRetry={() => void examQuery.refetch()} />;
	return (
		<>
			<BackLink href="/admin/exams" label={t('tests')} />
			<SectionHeading title={version?.title || exam.versions[0]?.title || exam.slug} description={exam.slug}>
				<ExamStatus exam={exam} />
			</SectionHeading>
			<Feedback message={action.message} />
			<div className="admin-editor-grid">
				<section className="panel">
					<div className="panel-heading">
						<h2>{t('versions')}</h2>
					</div>
					<div className="version-toolbar">
						<label className="field">
							<span className="sr-only">{t('versions')}</span>
							<select
								value={selectedId ?? ''}
								onChange={(event) => {
									setSelected(event.target.value);
									action.clear();
								}}
							>
								{exam.versions.map((item) => (
									<option key={item.id} value={item.id}>
										v{item.number} · {t(item.publishedAt ? 'published' : 'draft')}
									</option>
								))}
							</select>
						</label>
						<div className="inline-actions">
							{editable ? (
								<button
									className="button primary small"
									disabled={action.busy}
									onClick={() => setAsking({ type: 'publish' })}
								>
									{t('publish')}
								</button>
							) : (
								<button className="button secondary small" disabled={action.busy} onClick={() => void newDraft()}>
									<Plus size={16} />
									{t('newDraft')}
								</button>
							)}
							<button
								className="button quiet small"
								disabled={action.busy}
								onClick={() =>
									void action.run(async () => {
										await mutate(ARCHIVE_EXAM, { id, archived: !exam.archivedAt });
										await examQuery.refetch();
									})
								}
							>
								<Archive size={16} />
								{t(exam.archivedAt ? 'unarchive' : 'archive')}
							</button>
							{exam.currentVersionId && !exam.archivedAt && (
								<Link className="text-link" href={url('/exam/' + exam.slug)}>
									{t('openExam')}
									<ArrowUpRight size={15} />
								</Link>
							)}
						</div>
					</div>
				</section>
				<Placements exam={exam} refreshed={examQuery.refetch} />
				{versionQuery.loading && !version ? (
					<Loading />
				) : versionQuery.error ? (
					<LoadError onRetry={() => void versionQuery.refetch()} />
				) : !version ? (
					<Empty title={t('noVersions')} />
				) : (
					<>
						<VersionSettings key={version.id} version={version} refreshed={refreshed} />
						<section className="editor-variants">
							<div className="list-heading">
								<h2>{t('variants')}</h2>
								{editable && (
									<button
										className="button primary small"
										onClick={() =>
											setEditing({ kind: 'variant', parent: version.id, order: nextOrder(version.variants) })
										}
									>
										<Plus size={17} />
										{t('newVariant')}
									</button>
								)}
							</div>
							{version.variants.map((variant) => (
								<VariantEditor
									key={variant.id}
									item={variant}
									versionId={version.id}
									editable={editable}
									select={setEditing}
									remove={(item) => setAsking({ type: 'delete', item })}
								/>
							))}
						</section>
					</>
				)}
			</div>
			<ContentForm edit={editing} onClose={() => setEditing(null)} onChange={refreshed} />
			<ConfirmAction
				open={Boolean(asking)}
				destructive={asking?.type === 'delete'}
				title={t(asking?.type === 'publish' ? 'publishConfirm' : 'removeConfirm')}
				busy={action.busy}
				onClose={() => setAsking(null)}
				onConfirm={() => void confirm()}
			/>
		</>
	);
}
