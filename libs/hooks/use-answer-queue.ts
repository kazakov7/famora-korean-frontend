'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { print } from 'graphql';
import { SAVE_ATTEMPT_ANSWER } from '@/apollo/user/mutation';
import { useApi } from './use-api';

export interface SavedAnswer {
	choiceId: string | null;
	text: string | null;
}
type PendingAnswer = SavedAnswer & { attemptId: string; questionId: string };

export function useAnswerQueue(attemptId: string, initial: Record<string, SavedAnswer>) {
	const { mutate } = useApi();
	const [answers, setAnswers] = useState(initial);
	const [saving, setSaving] = useState(false);
	const [failed, setFailed] = useState(false);
	const queue = useRef(new Map<string, PendingAnswer>());
	const pending = useRef<Promise<boolean> | null>(null);
	const debounce = useRef<number | null>(null);

	const flush = useCallback(async (): Promise<boolean> => {
		if (debounce.current !== null) {
			window.clearTimeout(debounce.current);
			debounce.current = null;
		}
		if (pending.current) return pending.current;
		if (!queue.current.size) return true;
		setSaving(true);
		setFailed(false);
		const persist = async () => {
			while (queue.current.size) {
				const item = queue.current.values().next().value as PendingAnswer | undefined;
				if (!item) break;
				queue.current.delete(item.questionId);
				try {
					await mutate(SAVE_ATTEMPT_ANSWER, { input: item });
				} catch {
					if (!queue.current.has(item.questionId)) queue.current.set(item.questionId, item);
					setFailed(true);
					return false;
				}
			}
			return true;
		};
		pending.current = persist().finally(() => {
			pending.current = null;
			setSaving(false);
		});
		return pending.current;
	}, [mutate]);

	useEffect(() => {
		function onBackground() {
			if (document.visibilityState === 'hidden') void flush();
		}
		function sendQueued() {
			if (pending.current) return;
			for (const item of queue.current.values()) {
				const request = new Blob([JSON.stringify({ query: print(SAVE_ATTEMPT_ANSWER), variables: { input: item } })], {
					type: 'application/json',
				});
				if (request.size < 62000) navigator.sendBeacon('/api/graphql', request);
			}
		}
		document.addEventListener('visibilitychange', onBackground);
		window.addEventListener('pagehide', sendQueued);
		return () => {
			document.removeEventListener('visibilitychange', onBackground);
			window.removeEventListener('pagehide', sendQueued);
			if (debounce.current !== null) window.clearTimeout(debounce.current);
		};
	}, [flush]);

	function edit(questionId: string, answer: SavedAnswer, immediate = false) {
		setAnswers((previous) => ({ ...previous, [questionId]: answer }));
		queue.current.set(questionId, { attemptId, questionId, ...answer });
		if (debounce.current !== null) window.clearTimeout(debounce.current);
		if (immediate) void flush();
		else debounce.current = window.setTimeout(() => void flush(), 550);
	}
	return { answers, saving, failed, edit, flush };
}
