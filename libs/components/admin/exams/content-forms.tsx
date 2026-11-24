'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { SAVE_EXAM_SECTION, SAVE_EXAM_VARIANT, SAVE_QUESTION, SAVE_QUESTION_GROUP } from '@/apollo/admin/mutation';
import { useApi } from '@/libs/hooks/use-api';
import { sectionKeys } from '@/libs/i18n/config';
import type { MessageKey } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import type {
	AdminGroup,
	AdminQuestion,
	AdminSection,
	AdminVariant,
	QuestionKind,
	SectionKind,
} from '@/libs/types/api';
import { Feedback, Modal } from '@/libs/components/common/ui';
import {
	readInt,
	readOptionalInt,
	readOptionalText,
	readText,
	useAdminAction,
} from '@/libs/components/admin/admin-actions';
import { MediaField } from '@/libs/components/admin/media/media';

export type ContentEdit =
	| { kind: 'variant'; parent: string; order: number; item?: AdminVariant }
	| { kind: 'section'; parent: string; order: number; item?: AdminSection }
	| { kind: 'group'; parent: string; item?: AdminGroup }
	| { kind: 'question'; parent: string; order: number; section: AdminSection; item?: AdminQuestion };

const sections: SectionKind[] = ['LISTENING', 'READING', 'WRITING', 'VOCABULARY'];
const labels: Record<ContentEdit['kind'], MessageKey> = {
	variant: 'newVariant',
	section: 'newSection',
	group: 'newGroup',
	question: 'newQuestion',
};
const saves = {
	variant: SAVE_EXAM_VARIANT,
	section: SAVE_EXAM_SECTION,
	group: SAVE_QUESTION_GROUP,
	question: SAVE_QUESTION,
};

interface ChoiceDraft {
	key: string;
	text: string;
	imageId: string | null;
	correct: boolean;
}
const initialChoices = (): ChoiceDraft[] => [
	{ key: 'first', text: '', imageId: null, correct: true },
	{ key: 'second', text: '', imageId: null, correct: false },
];

export function describeGroup(group: AdminGroup, index: number, fallback: string) {
	return group.passage?.trim().slice(0, 65) || fallback + ' ' + (index + 1);
}

function OrderField({ value }: { value: number }) {
	const { t } = useLocale();
	return (
		<label className="field">
			{t('order')}
			<input name="order" type="number" required min={0} max={2147483647} defaultValue={value} />
		</label>
	);
}

function Form({
	edit,
	onChange,
	onClose,
}: {
	edit: ContentEdit;
	onChange: () => Promise<unknown>;
	onClose: () => void;
}) {
	const { t } = useLocale();
	const { mutate } = useApi();
	const action = useAdminAction();
	const question = edit.kind === 'question' ? edit.item : undefined;
	const group = edit.kind === 'group' ? edit.item : undefined;
	const [questionKind, setQuestionKind] = useState<QuestionKind>(
		question?.kind ?? (edit.kind === 'question' && edit.section.kind === 'WRITING' ? 'TEXT' : 'CHOICE'),
	);
	const [imageId, setImageId] = useState<string | null>(question?.imageId ?? group?.imageId ?? null);
	const [audioId, setAudioId] = useState<string | null>(group?.audioId ?? null);
	const [choices, setChoices] = useState<ChoiceDraft[]>(() =>
		question?.choices.length
			? question.choices.map((choice) => ({
					key: choice.id,
					text: choice.text ?? '',
					imageId: choice.imageId,
					correct: choice.correct,
				}))
			: initialChoices(),
	);

	function updateChoice(key: string, update: Partial<ChoiceDraft>) {
		setChoices((items) => items.map((item) => (item.key === key ? { ...item, ...update } : item)));
	}
	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const input =
			edit.kind === 'variant'
				? { label: readText(form, 'title'), sortOrder: readInt(form, 'order') }
				: edit.kind === 'section'
					? {
							kind: readText(form, 'kind'),
							title: readOptionalText(form, 'title'),
							instructions: readOptionalText(form, 'instructions'),
							sortOrder: readInt(form, 'order'),
							durationSeconds: readInt(form, 'duration'),
							audioMaxPlays: readOptionalInt(form, 'maxPlays'),
						}
					: edit.kind === 'group'
						? {
								passage: readOptionalText(form, 'passage'),
								imageId,
								audioId,
								audioStartMs: audioId ? readOptionalInt(form, 'audioStart') : null,
								audioEndMs: audioId ? readOptionalInt(form, 'audioEnd') : null,
								audioMaxPlays: audioId ? readOptionalInt(form, 'maxPlays') : null,
							}
						: {
								kind: questionKind,
								prompt: readText(form, 'prompt'),
								groupId: readOptionalText(form, 'group'),
								imageId,
								sortOrder: readInt(form, 'order'),
								points: readInt(form, 'points'),
								explanation: readOptionalText(form, 'explanation'),
								sampleAnswer: questionKind === 'TEXT' ? readOptionalText(form, 'sampleAnswer') : null,
								choices:
									questionKind === 'CHOICE'
										? choices.map((choice) => ({
												text: choice.text.trim() || null,
												imageId: choice.imageId,
												correct: choice.correct,
											}))
										: [],
							};
		if (
			await action.run(async () => {
				await mutate(saves[edit.kind], { parent: edit.parent, id: edit.item?.id, input });
				await onChange();
			})
		)
			onClose();
	}

	return (
		<>
			<Feedback message={action.message} />
			<form className="form-grid" onSubmit={(event) => void save(event)}>
				{edit.kind === 'variant' && (
					<>
						<label className="field">
							{t('title')}
							<input name="title" required maxLength={150} defaultValue={edit.item?.label} />
						</label>
						<OrderField value={edit.item?.sortOrder ?? edit.order} />
					</>
				)}
				{edit.kind === 'section' && (
					<>
						<label className="field">
							{t('kind')}
							<select name="kind" defaultValue={edit.item?.kind ?? 'READING'}>
								{sections.map((item) => (
									<option key={item} value={item}>
										{t(sectionKeys[item])}
									</option>
								))}
							</select>
						</label>
						<label className="field">
							{t('title')}
							<input name="title" defaultValue={edit.item?.title ?? ''} maxLength={200} />
						</label>
						<label className="field">
							{t('secondsLabel')}
							<input
								name="duration"
								type="number"
								min={1}
								max={86400}
								required
								defaultValue={edit.item?.durationSeconds ?? 600}
							/>
						</label>
						<OrderField value={edit.item?.sortOrder ?? edit.order} />
						<label className="field wide-field">
							{t('instructions')}
							<textarea name="instructions" rows={3} maxLength={15000} defaultValue={edit.item?.instructions ?? ''} />
						</label>
						<label className="field">
							{t('maxPlays')}
							<input name="maxPlays" type="number" min={1} max={20} defaultValue={edit.item?.audioMaxPlays ?? ''} />
						</label>
					</>
				)}
				{edit.kind === 'group' && (
					<>
						<label className="field wide-field">
							{t('passage')}
							<textarea name="passage" rows={4} maxLength={30000} defaultValue={edit.item?.passage ?? ''} />
						</label>
						<MediaField label={t('image')} type="image" value={imageId} onChange={setImageId} />
						<MediaField label={t('audio')} type="audio" value={audioId} onChange={setAudioId} />
						{audioId && (
							<>
								<label className="field">
									{t('audioStart')}
									<input
										name="audioStart"
										type="number"
										min={0}
										max={2147483647}
										defaultValue={edit.item?.audioStartMs ?? ''}
									/>
								</label>
								<label className="field">
									{t('audioEnd')}
									<input
										name="audioEnd"
										type="number"
										min={1}
										max={2147483647}
										defaultValue={edit.item?.audioEndMs ?? ''}
									/>
								</label>
								<label className="field">
									{t('maxPlays')}
									<input name="maxPlays" type="number" min={1} max={20} defaultValue={edit.item?.audioMaxPlays ?? ''} />
								</label>
							</>
						)}
					</>
				)}
				{edit.kind === 'question' && (
					<>
						<label className="field">
							{t('kind')}
							<select value={questionKind} onChange={(event) => setQuestionKind(event.target.value as QuestionKind)}>
								<option value="CHOICE">{t('choice')}</option>
								{edit.section.kind === 'WRITING' && <option value="TEXT">{t('textQuestion')}</option>}
							</select>
						</label>
						<label className="field">
							{t('groups')}
							<select name="group" defaultValue={question?.groupId ?? ''}>
								<option value="">{t('optional')}</option>
								{edit.section.groups.map((item, index) => (
									<option key={item.id} value={item.id}>
										{describeGroup(item, index, t('groups'))}
									</option>
								))}
							</select>
						</label>
						<label className="field wide-field">
							{t('prompt')}
							<textarea
								name="prompt"
								required={!imageId}
								rows={3}
								maxLength={30000}
								defaultValue={question?.prompt ?? ''}
							/>
						</label>
						<MediaField label={t('image')} type="image" value={imageId} onChange={setImageId} />
						<OrderField value={question?.sortOrder ?? edit.order} />
						<label className="field">
							{t('questionPoints')}
							<input
								name="points"
								type="number"
								min={0}
								max={999}
								required
								defaultValue={question?.points ?? (questionKind === 'TEXT' ? 0 : 2)}
							/>
						</label>
						<label className="field wide-field">
							{t('explanation')}
							<textarea
								name="explanation"
								rows={2}
								required={questionKind === 'TEXT'}
								maxLength={30000}
								defaultValue={question?.explanation ?? ''}
							/>
						</label>
						{questionKind === 'TEXT' ? (
							<label className="field wide-field">
								{t('sampleAnswer')}
								<textarea
									name="sampleAnswer"
									rows={4}
									required
									maxLength={30000}
									defaultValue={question?.sampleAnswer ?? ''}
								/>
							</label>
						) : (
							<section className="wide-field admin-choice-list">
								<h3>{t('answerOptions')}</h3>
								{choices.map((item, index) => (
									<div key={item.key} className="admin-choice">
										<label className="field">
											{t('choice')} {index + 1}
											<input
												value={item.text}
												required={!item.imageId}
												maxLength={15000}
												onChange={(event) => updateChoice(item.key, { text: event.target.value })}
											/>
										</label>
										<MediaField
											label={t('image')}
											value={item.imageId}
											type="image"
											onChange={(next) => updateChoice(item.key, { imageId: next })}
										/>
										<div className="inline-actions">
											<label className="check-field">
												<input
													type="radio"
													name="correct"
													required
													checked={item.correct}
													onChange={() =>
														setChoices((prior) =>
															prior.map((choice) => ({ ...choice, correct: choice.key === item.key })),
														)
													}
												/>
												<Check size={15} />
												{t('correct')}
											</label>
											<button
												className="icon-button"
												disabled={choices.length <= 2}
												type="button"
												onClick={() => setChoices((prior) => prior.filter((choice) => choice.key !== item.key))}
												aria-label={t('delete') + ' ' + (index + 1)}
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								))}
								<button
									className="button secondary small"
									type="button"
									disabled={choices.length >= 12}
									onClick={() =>
										setChoices((prior) => [
											...prior,
											{ key: crypto.randomUUID(), text: '', imageId: null, correct: false },
										])
									}
								>
									<Plus size={16} />
									{t('addOption')}
								</button>
							</section>
						)}
					</>
				)}
				<button className="button primary wide-field" disabled={action.busy}>
					{t(action.busy ? 'saving' : 'save')}
				</button>
			</form>
		</>
	);
}

export function ContentForm({
	edit,
	onClose,
	onChange,
}: {
	edit: ContentEdit | null;
	onClose: () => void;
	onChange: () => Promise<unknown>;
}) {
	const { t } = useLocale();
	return (
		<Modal open={Boolean(edit)} title={t(edit ? (edit.item ? 'edit' : labels[edit.kind]) : 'edit')} onClose={onClose}>
			{edit && (
				<Form key={edit.kind + (edit.item?.id ?? edit.parent)} edit={edit} onClose={onClose} onChange={onChange} />
			)}
		</Modal>
	);
}
