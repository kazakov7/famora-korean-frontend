import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Providers } from '@/app/providers';
import { Footer, Header } from '@/libs/components/layout/header';
import { dictionaries, isLocale, localizedPath, locales } from '@/libs/i18n/config';
import '@/scss/globals.scss';

const themeScript =
	"try{document.documentElement.dataset.theme=localStorage.getItem('quiz-theme')==='dark'?'dark':'light'}catch{}";

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params;
	if (!isLocale(locale)) return {};
	return {
		title: { default: 'Quiz · TOPIK', template: '%s · Quiz' },
		description: dictionaries[locale].heroBody,
		metadataBase: new URL(process.env.QUIZ_SITE_URL || 'http://localhost:3000'),
		alternates: { languages: Object.fromEntries(locales.map((item) => [item, localizedPath(item)])) },
	};
}

export default async function StudentLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();
	const dictionary = dictionaries[locale];
	return (
		<html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body suppressHydrationWarning>
				<Providers locale={locale} dictionary={dictionary}>
					<a className="skip-link" href="#content">
						{dictionary.skip}
					</a>
					<Header />
					<div id="content" className="site-content">
						{children}
					</div>
					<Footer />
				</Providers>
			</body>
		</html>
	);
}
