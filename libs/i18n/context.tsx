'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Dictionary, Locale, MessageKey } from './config';
import { localizedPath } from './config';

const LocaleContext = createContext<{
	locale: Locale;
	t: (key: MessageKey) => string;
	url: (path?: string) => string;
} | null>(null);

export function LocaleProvider({
	locale,
	dictionary,
	children,
}: {
	locale: Locale;
	dictionary: Dictionary;
	children: ReactNode;
}) {
	const value = useMemo(
		() => ({
			locale,
			t: (key: MessageKey) => dictionary[key],
			url: (path?: string) => localizedPath(locale, path),
		}),
		[dictionary, locale],
	);
	return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
	const value = useContext(LocaleContext);
	if (!value) throw new Error('LocaleProvider is required');
	return value;
}
