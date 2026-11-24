import uz from '@/public/locales/uz/common.json';
import en from '@/public/locales/en/common.json';
import ko from '@/public/locales/ko/common.json';

export const locales = ['uz', 'en', 'ko'] as const;
export type Locale = (typeof locales)[number];
export type Dictionary = typeof uz;
export type MessageKey = keyof Dictionary;
export const dictionaries: Record<Locale, Dictionary> = { uz, en, ko };
export const localeNames: Record<Locale, string> = { uz: 'O‘zbekcha', en: 'English', ko: '한국어' };

export function isLocale(value: string | undefined): value is Locale {
	return locales.some((locale) => locale === value);
}

export function localizedPath(locale: Locale, path: string = '') {
	return '/' + locale + (path && !path.startsWith('/') ? '/' : '') + path;
}

export function safeReturnTo(value: string | null, locale: Locale, fallback = '/my') {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
		return localizedPath(locale, fallback);
	const target = new URL(value, 'https://quiz.local');
	return target.origin === 'https://quiz.local' ? target.pathname + target.search : localizedPath(locale, fallback);
}

export const sectionKeys = {
	FULL: 'full',
	LISTENING: 'listening',
	READING: 'reading',
	WRITING: 'writing',
	VOCABULARY: 'vocabularyQuiz',
} as const;

export const examKindKeys = { OFFICIAL: 'official', MOCK: 'mock', VOCABULARY: 'vocabularyQuiz' } as const;
