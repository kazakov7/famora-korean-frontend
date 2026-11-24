'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { ArrowLeft, ArrowRight, BookMarked, Check, Flag, Grid2X2, Pause, Play, Timer } from 'lucide-react';
import { GET_ATTEMPT, GET_ATTEMPT_HISTORY, GET_ME, GET_PENDING_ATTEMPTS } from '@/apollo/user/query';
import {
	MOVE_ATTEMPT,
	PAUSE_ATTEMPT,
	RESUME_ATTEMPT,
	SAVE_VOCABULARY_WORD,
	SUBMIT_ATTEMPT,
} from '@/apollo/user/mutation';
import { useApi } from '@/libs/hooks/use-api';
import { useAnswerQueue } from '@/libs/hooks/use-answer-queue';
import { useExamTimer } from '@/libs/hooks/use-exam-timer';
import { sectionKeys } from '@/libs/i18n/config';
import type { MessageKey } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import type { Attempt } from '@/libs/types/api';
import { Protected } from '@/libs/components/common/protected';
import { BackLink, clock, ContentImage, Feedback, LoadError, Loading, Modal } from '@/libs/components/common/ui';
import { AudioControl } from './audio-control';
import type { AudioHandle } from './audio-control';
import { ExamPassage } from './exam-passage';

export function ExamPlayer({ id }: { id: string }) {
	return (
		<Protected>
			<PlayerData id={id} />
		</Protected>
	);
}

function PlayerData({ id }: { id: string }) {
	const { t, url } = useLocale();
	const router = useRouter();
	const { client, mutate } = useApi();
	const { data, loading, error, refetch } = useQuery<{ getAttempt: Attempt }>(GET_ATTEMPT, {
		variables: { id },
		fetchPolicy: 'cache-and-network',
	});
	const attempt = data?.getAttempt;
	const [busy, setBusy] = useState(false);
	const [fault, setFault] = useState('');
	const completed = attempt?.status === 'COMPLETED';

	useEffect(() => {
		if (completed) router.replace(url('/my/attempts/' + id));
	}, [completed, id, router, url]);

	async function transition(action: 'pauseAttempt' | 'resumeAttempt') {
		setBusy(true);
		setFault('');
		try {
			const response = await mutate<Record<typeof action, Attempt>>(
				action === 'pauseAttempt' ? PAUSE_ATTEMPT : RESUME_ATTEMPT,
				{ id },
			);
			client.writeQuery({ query: GET_ATTEMPT, variables: { id }, data: { getAttempt: response[action] } });
			void client.refetchQueries({ include: [GET_PENDING_ATTEMPTS] }).catch(() => {});
		} catch {
			setFault(t('error'));
		} finally {
			setBusy(false);
		}
	}
	async function submit() {
		await mutate(SUBMIT_ATTEMPT, { id });
		void client.refetchQueries({ include: [GET_ME, GET_PENDING_ATTEMPTS, GET_ATTEMPT_HISTORY] }).catch(() => {});
		router.replace(url('/my/attempts/' + id));
	}

	if ((loading && !attempt) || completed)
		return (
			<main className="container route-state">
				<Loading />
			</main>
		);
	if (error || !attempt)
		return (
			<main className="container route-state">
				<LoadError onRetry={() => void refetch()} />
			</main>
		);
	if (attempt.status === 'PAUSED')
		return (
			<main className="container page-space narrow">
				<BackLink href={url('/my')} label={t('my')} />
				<div className="paused-card">
					<span className="lead-icon">
						<Pause size={26} />
					</span>
					<span className="meta-pill">{t('paused')}</span>
					<h1>{attempt.title}</h1>
					<strong>{clock(attempt.remainingMs)}</strong>
					<p>{t('pauseBody')}</p>
					<Feedback message={fault} />
					<div className="inline-actions">
						<button className="button primary" disabled={busy} onClick={() => void transition('resumeAttempt')}>
							<Play size={17} />
							{t('continue')}
						</button>
						<Link className="button secondary" href={url('/my')}>
							{t('my')}
						</Link>
					</div>
				</div>
			</main>
		);
	return (
		<PlayerWorkspace
			key={attempt.id + attempt.deadlineAt}
			attempt={attempt}
			externalFault={fault}
			busy={busy}
			pause={() => transition('pauseAttempt')}
			submit={submit}
			onExpire={() => void refetch().catch(() => {})}
		/>
	);
}

function PlayerWorkspace({
	attempt,
	pause,
	submit,
	onExpire,
	externalFault,
	busy,
}: {
	attempt: Attempt;
	pause: () => Promise<void>;
	submit: () => Promise<void>;
	onExpire: () => void;
	externalFault: string;
	busy: boolean;
}) {
	const { t } = useLocale();
	const { mutate } = useApi();
	const rows = attempt.sections.flatMap((section) => section.questions.map((question) => ({ section, question })));
	const [index, setIndex] = useState(() =>
		Math.max(
			0,
			rows.findIndex(({ question }) => question.id === attempt.currentQuestionId),
		),
	);
	const [working, setWorking] = useState(false);
	const [fault, setFault] = useState<MessageKey | null>(null);
	const [confirmed, setConfirmed] = useState(false);
	const [word, setWord] = useState<string | null>(null);
	const [wordBusy, setWordBusy] = useState(false);
	const [wordFault, setWordFault] = useState(false);
	const [wordSaved, setWordSaved] = useState(false);
	const audio = useRef<AudioHandle | null>(null);
	const expiryCheck = useRef(false);
	const ms = useExamTimer(attempt);
	const answerQueue = useAnswerQueue(
		attempt.id,
		Object.fromEntries(
			rows.map(({ question }) => [question.id, { choiceId: question.selectedChoiceId, text: question.answerText }]),
		),
	);
	const row = rows[index];
	const group = row?.section.groups.find((item) => item.id === row.question.groupId);
	const answered = Object.values(answerQueue.answers).filter((answer) => answer.choiceId || answer.text?.trim()).length;
	const blocked = working || busy || ms <= 0;

	useEffect(() => {
		if (ms > 0 || expiryCheck.current) return;
		expiryCheck.current = true;
		onExpire();
	}, [ms, onExpire]);

	async function move(next: number) {
		const target = rows[next];
		if (!target || next === index || blocked) return;
		setWorking(true);
		setFault(null);
		setWordSaved(false);
		try {
			if (!(await answerQueue.flush())) return;
			if (target.question.groupId !== row.question.groupId) await audio.current?.stop();
			await mutate(MOVE_ATTEMPT, { input: { attemptId: attempt.id, questionId: target.question.id } });
			setIndex(next);
		} catch {
			setFault('error');
		} finally {
			setWorking(false);
		}
	}
	async function finish(action: 'pause' | 'submit') {
		if (blocked) return;
		setWorking(true);
		setFault(null);
		try {
			if (!(await answerQueue.flush())) {
				setConfirmed(false);
				return;
			}
			await audio.current?.stop();
			await (action === 'pause' ? pause() : submit());
			setConfirmed(false);
		} catch {
			setFault('error');
			setConfirmed(false);
		} finally {
			setWorking(false);
		}
	}
	async function saveWord(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const term = String(new FormData(event.currentTarget).get('word') ?? '').trim();
		if (!term || !row) return;
		setWordBusy(true);
		setWordFault(false);
		try {
			await mutate(SAVE_VOCABULARY_WORD, { input: { attemptId: attempt.id, questionId: row.question.id, term } });
			setWord(null);
			setWordSaved(true);
		} catch {
			setWordFault(true);
		} finally {
			setWordBusy(false);
		}
	}

	if (!row)
		return (
			<main className="container route-state">
				<Feedback message={t('error')} />
			</main>
		);
	const { question, section } = row;
	const selected = answerQueue.answers[question.id];
	return (
		<main className="container player-page">
			<div className="player-heading">
				<div>
					<span className="meta-pill">
						{t(sectionKeys[section.kind === 'VOCABULARY' ? 'VOCABULARY' : attempt.mode])}
					</span>
					<h1>{attempt.title}</h1>
				</div>
				<div className="player-toolbar">
					<span className={'timer-badge' + (ms < 60000 ? ' low' : '')} aria-label={t('remaining')}>
						<Timer size={19} />
						{clock(ms)}
					</span>
					<button className="button secondary small" disabled={blocked} onClick={() => void finish('pause')}>
						<Pause size={16} />
						{t('pause')}
					</button>
					<button className="button primary small" disabled={blocked} onClick={() => setConfirmed(true)}>
						<Flag size={15} />
						{t('submit')}
					</button>
				</div>
			</div>
			<Feedback message={ms <= 0 ? t('timeUp') : externalFault || (fault ? t(fault) : undefined)} />
			<div className="player-grid">
				<article className="panel question-panel">
					<div className="panel-heading">
						<span className="meta-pill">{section.title || t(sectionKeys[section.kind])}</span>
						<span className="caption">
							{t('question')} {index + 1} / {rows.length}
						</span>
					</div>
					{section.instructions && (
						<p className="exam-text muted" lang="ko">
							{section.instructions}
						</p>
					)}
					{group && (group.passage || group.imageUrl || group.hasAudio) && (
						<div className="question-context">
							{group.hasAudio && <AudioControl key={group.id} ref={audio} attemptId={attempt.id} group={group} />}
							{group.passage && <ExamPassage text={group.passage} />}
							{group.imageUrl && <ContentImage url={group.imageUrl} alt={t('passage')} />}
						</div>
					)}
					{question.prompt && (
						<h2 className="question-prompt exam-text" lang="ko">
							{question.prompt}
						</h2>
					)}
					{question.imageUrl && <ContentImage url={question.imageUrl} alt={t('question')} zoom />}
					{question.kind === 'TEXT' ? (
						<label className="field answer-field">
							<span className="sr-only">{t('typeAnswer')}</span>
							<textarea
								rows={7}
								maxLength={30000}
								value={selected?.text ?? ''}
								disabled={blocked}
								placeholder={t('typeAnswer')}
								onChange={(event) => answerQueue.edit(question.id, { choiceId: null, text: event.target.value })}
							/>
						</label>
					) : (
						<div className="choice-list" role="radiogroup" aria-label={t('yourAnswer')}>
							{question.choices.map((choice, option) => (
								<label key={choice.id} className={'choice-row' + (selected?.choiceId === choice.id ? ' chosen' : '')}>
									<input
										type="radio"
										name={'choice-' + question.id}
										value={choice.id}
										checked={selected?.choiceId === choice.id}
										disabled={blocked}
										onChange={() => answerQueue.edit(question.id, { choiceId: choice.id, text: null }, true)}
									/>
									<span className="choice-letter">{option + 1}</span>
									<span className="choice-body">
										{choice.text && <span lang={section.kind === 'VOCABULARY' ? undefined : 'ko'}>{choice.text}</span>}
										{choice.imageUrl && <ContentImage url={choice.imageUrl} alt={String(option + 1)} />}
									</span>
									{selected?.choiceId === choice.id && <Check className="choice-check" size={18} />}
								</label>
							))}
						</div>
					)}
					<div className="question-tools">
						<button
							type="button"
							className="button quiet small"
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => {
								setWordFault(false);
								setWord(window.getSelection()?.toString().trim().slice(0, 250) ?? '');
							}}
						>
							<BookMarked size={16} />
							{t('saveWord')}
						</button>
						{(selected?.choiceId || selected?.text) && (
							<button
								className="button quiet small"
								disabled={blocked}
								onClick={() => answerQueue.edit(question.id, { choiceId: null, text: null }, true)}
							>
								{t('clearAnswer')}
							</button>
						)}
					</div>
					{wordSaved && <Feedback message={t('success')} success />}
					<div className="question-footer">
						<button
							className="button secondary small"
							disabled={blocked || index === 0}
							onClick={() => void move(index - 1)}
						>
							<ArrowLeft size={16} />
							{t('previous')}
						</button>
						{index < rows.length - 1 ? (
							<button className="button primary small" disabled={blocked} onClick={() => void move(index + 1)}>
								{t('next')}
								<ArrowRight size={16} />
							</button>
						) : (
							<button className="button primary small" disabled={blocked} onClick={() => setConfirmed(true)}>
								{t('submit')}
								<Flag size={15} />
							</button>
						)}
					</div>
				</article>
				<aside className="panel question-nav">
					<div className="panel-heading">
						<h2>
							<Grid2X2 size={17} />
							{t('questionMap')}
						</h2>
					</div>
					<div className="answer-progress">
						<span>
							{answered} / {rows.length} {t('answered').toLowerCase()}
						</span>
						<progress max={rows.length} value={answered} />
					</div>
					{attempt.sections.map((part) => (
						<div key={part.kind} className="question-nav-section">
							<strong>{part.title || t(sectionKeys[part.kind])}</strong>
							<div className="question-nav-buttons">
								{rows.map(({ question: item, section: owner }, position) => {
									if (owner.kind !== part.kind) return null;
									const answer = answerQueue.answers[item.id];
									return (
										<button
											key={item.id}
											disabled={blocked}
											className={'question-number' + (answer?.choiceId || answer?.text?.trim() ? ' answered' : '')}
											aria-current={position === index ? 'step' : undefined}
											aria-label={t('question') + ' ' + (position + 1)}
											onClick={() => void move(position)}
										>
											{position + 1}
										</button>
									);
								})}
							</div>
						</div>
					))}
					<p className="caption autosave-status" role="status">
						{t(answerQueue.failed ? 'unsaved' : answerQueue.saving ? 'saving' : 'saveState')}
					</p>
					{answerQueue.failed && (
						<button className="button secondary small" disabled={blocked} onClick={() => void answerQueue.flush()}>
							{t('retry')}
						</button>
					)}
				</aside>
			</div>
			<Modal
				open={confirmed}
				title={t('submitTitle')}
				onClose={() => {
					if (!working) setConfirmed(false);
				}}
				actions={
					<>
						<button className="button secondary" disabled={working} onClick={() => setConfirmed(false)}>
							{t('cancel')}
						</button>
						<button className="button primary" disabled={blocked} onClick={() => void finish('submit')}>
							{t('submit')}
						</button>
					</>
				}
			>
				<p>{t('submitBody')}</p>
			</Modal>
			<Modal
				open={word !== null}
				title={t('saveWord')}
				onClose={() => {
					if (!wordBusy) setWord(null);
				}}
			>
				<Feedback message={wordFault ? t('error') : undefined} />
				<form className="form-stack" onSubmit={(event) => void saveWord(event)}>
					<label className="field">
						{t('word')}
						<input
							name="word"
							required
							autoFocus
							maxLength={250}
							placeholder={t('wordPlaceholder')}
							value={word ?? ''}
							onChange={(event) => setWord(event.target.value)}
						/>
					</label>
					<button className="button primary" disabled={wordBusy}>
						{t(wordBusy ? 'saving' : 'save')}
					</button>
				</form>
			</Modal>
		</main>
	);
}
