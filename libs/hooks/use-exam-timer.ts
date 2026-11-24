'use client';

import { useEffect, useState } from 'react';
import type { Attempt } from '@/libs/types/api';

export function useExamTimer(attempt: Attempt) {
	const [ms, setMs] = useState(attempt.remainingMs);
	const { remainingMs, status } = attempt;
	useEffect(() => {
		if (status !== 'IN_PROGRESS') return;
		const started = performance.now();
		const id = window.setInterval(() => setMs(Math.max(0, remainingMs - (performance.now() - started))), 250);
		return () => window.clearInterval(id);
	}, [remainingMs, status]);
	return status === 'IN_PROGRESS' ? ms : remainingMs;
}
