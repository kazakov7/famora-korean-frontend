'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
const themeEvent = 'quiz-theme-change';

function read(): Theme {
	try {
		return localStorage.getItem('quiz-theme') === 'dark' ? 'dark' : 'light';
	} catch {
		return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
	}
}

function subscribe(callback: () => void) {
	window.addEventListener(themeEvent, callback);
	window.addEventListener('storage', callback);
	return () => {
		window.removeEventListener(themeEvent, callback);
		window.removeEventListener('storage', callback);
	};
}

const defaultTheme = (): Theme => 'light';

export function useThemePreference() {
	const theme = useSyncExternalStore(subscribe, read, defaultTheme);
	function setTheme(next: Theme) {
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem('quiz-theme', next);
		} catch {}
		window.dispatchEvent(new Event(themeEvent));
	}
	return { theme, setTheme };
}
