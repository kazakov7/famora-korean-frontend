import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { Providers } from '@/app/providers';
import { AdminShell } from '@/libs/components/admin/admin-shell';
import { dictionaries, isLocale } from '@/libs/i18n/config';
import '@/scss/globals.scss';

const themeScript =
	"try{document.documentElement.dataset.theme=localStorage.getItem('quiz-theme')==='dark'?'dark':'light'}catch{}";
export const metadata: Metadata = { title: 'Quiz · Admin', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const setting = (await cookies()).get('quiz-locale')?.value;
	const locale = isLocale(setting) ? setting : 'uz';
	return (
		<html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body suppressHydrationWarning>
				<Providers locale={locale} dictionary={dictionaries[locale]}>
					<AdminShell>{children}</AdminShell>
				</Providers>
			</body>
		</html>
	);
}
