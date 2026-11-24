'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { createApollo } from '@/apollo/client';
import { SessionProvider } from '@/libs/auth/session';
import { useThemePreference } from '@/libs/hooks/use-theme';
import { LocaleProvider } from '@/libs/i18n/context';
import type { Dictionary, Locale } from '@/libs/i18n/config';

export function Providers({
	locale,
	dictionary,
	children,
}: {
	locale: Locale;
	dictionary: Dictionary;
	children: ReactNode;
}) {
	const [apollo] = useState(createApollo);
	const { theme } = useThemePreference();
	useEffect(() => {
		document.documentElement.dataset.theme = theme;
	}, [locale, theme]);
	const palette = useMemo(
		() =>
			createTheme({
				palette: {
					mode: theme,
					primary: { main: theme === 'dark' ? '#82d8ae' : '#146348' },
					background: { paper: theme === 'dark' ? '#17241f' : '#ffffff' },
				},
				shape: { borderRadius: 16 },
				typography: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans CJK KR", sans-serif' },
			}),
		[theme],
	);
	return (
		<AppRouterCacheProvider>
			<ThemeProvider theme={palette}>
				<ApolloProvider client={apollo}>
					<LocaleProvider locale={locale} dictionary={dictionary}>
						<SessionProvider>{children}</SessionProvider>
					</LocaleProvider>
				</ApolloProvider>
			</ThemeProvider>
		</AppRouterCacheProvider>
	);
}
