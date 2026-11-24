'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, BookOpenText, ChevronDown, Globe2, Menu as MenuIcon, Moon, Sun, Timer, X } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_NAVIGATION, GET_PENDING_ATTEMPTS } from '@/apollo/user/query';
import { useSession } from '@/libs/auth/session';
import { useThemePreference } from '@/libs/hooks/use-theme';
import { localeNames, locales, sectionKeys } from '@/libs/i18n/config';
import type { Locale, MessageKey } from '@/libs/i18n/config';
import { useLocale } from '@/libs/i18n/context';
import type { AttemptSummary, Menu } from '@/libs/types/api';
import { Avatar } from '@/libs/components/common/ui';

const primary: { key: MessageKey; path: string }[] = [
	{ key: 'home', path: '' },
	{ key: 'topik', path: '/topik' },
	{ key: 'mock', path: '/mock-exam' },
	{ key: 'vocabularyLibrary', path: '/vocabulary' },
	{ key: 'dailyPractice', path: '/daily-practice' },
	{ key: 'leaderboard', path: '/leaderboard' },
	{ key: 'help', path: '/help' },
];

export function Brand({ href }: { href: string }) {
	return (
		<Link className="brand" href={href} aria-label="Famora Korean">
			<Image
				className="brand-logo brand-logo-light"
				src="/img/famora-korean-logo-light.svg"
				alt=""
				width={580}
				height={192}
				unoptimized
				loading="eager"
			/>
			<Image
				className="brand-logo brand-logo-dark"
				src="/img/famora-korean-logo-dark.svg"
				alt=""
				width={580}
				height={192}
				unoptimized
				loading="eager"
			/>
		</Link>
	);
}

export function DisplayControls({ admin = false }: { admin?: boolean }) {
	const { t, locale } = useLocale();
	const path = usePathname();
	const router = useRouter();
	const { theme, setTheme } = useThemePreference();
	function switchLocale(next: Locale) {
		document.cookie = 'quiz-locale=' + next + '; Path=/; Max-Age=31536000; SameSite=Lax';
		if (admin) router.refresh();
		else router.push('/' + next + path.slice(locale.length + 1) + window.location.search);
	}
	return (
		<div className="display-controls">
			<label className="locale-control" title={t('language')}>
				<Globe2 size={17} aria-hidden="true" />
				<select
					aria-label={t('language')}
					value={locale}
					onChange={(event) => switchLocale(event.target.value as Locale)}
				>
					{locales.map((item) => (
						<option key={item} value={item}>
							{localeNames[item]}
						</option>
					))}
				</select>
				<span aria-hidden="true">{locale.toUpperCase()}</span>
				<ChevronDown size={10} aria-hidden="true" />
			</label>
			<button
				className="icon-button theme-button"
				type="button"
				aria-label={t(theme === 'dark' ? 'light' : 'dark')}
				title={t(theme === 'dark' ? 'light' : 'dark')}
				onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
			>
				{theme === 'dark' ? <Sun size={19} /> : <Moon size={18} />}
			</button>
		</div>
	);
}

export function Header() {
	const { t, url } = useLocale();
	const { member } = useSession();
	const path = usePathname();
	const [menuPath, setMenuPath] = useState<string | null>(null);
	const mobile = menuPath === path;
	const { data } = useQuery<{ getNavigation: Menu[] }>(GET_NAVIGATION);
	const { data: pending } = useQuery<{ getPendingAttempts: AttemptSummary[] }>(GET_PENDING_ATTEMPTS, {
		skip: !member,
		fetchPolicy: 'cache-and-network',
	});
	const tests = (member && pending?.getPendingAttempts) || [];
	const extra = data?.getNavigation.filter((menu) => !menu.parentId && !menu.systemKey) ?? [];
	function active(route: string) {
		const link = url(route);
		return route ? path === link || path.startsWith(link + '/') : path === link;
	}
	const profileLink = member ? (
		<Link className="account-link" href={url('/my')} aria-label={t('my')}>
			<Avatar url={member.memberImage} name={member.memberNick} />
			<span>{member.memberNick}</span>
		</Link>
	) : (
		<Link className="button primary nav-login" href={url('/account/login')}>
			{t('login')}
		</Link>
	);
	return (
		<>
			<header className="site-header">
				<div className="container header-inner">
					<Brand href={url()} />
					<nav className="desktop-nav" aria-label={t('categories')}>
						{primary.map((item) => (
							<Link key={item.key} href={url(item.path)} aria-current={active(item.path) ? 'page' : undefined}>
								{t(item.key)}
							</Link>
						))}
						{extra.length > 0 && (
							<details className="nav-dropdown">
								<summary>
									{t('categories')}
									<ChevronDown size={12} />
								</summary>
								<div className="nav-popover">
									{extra.map((item) => (
										<Link key={item.id} href={url('/catalog/' + item.slug)}>
											{item.name}
										</Link>
									))}
								</div>
							</details>
						)}
					</nav>
					<div className="header-actions">
						<DisplayControls />
						{tests.length > 0 && (
							<details className="nav-dropdown pending-dropdown">
								<summary className="icon-button" title={t('pausedTests')} aria-label={t('pausedTests')}>
									<Timer size={19} />
									<span className="pending-dot" />
								</summary>
								<div className="nav-popover pending-popover">
									<strong>{t('pausedTests')}</strong>
									{tests.map((test) => (
										<Link href={url('/attempt/' + test.id)} key={test.id}>
											<span>{test.title}</span>
											<small>{t(sectionKeys[test.mode])}</small>
										</Link>
									))}
								</div>
							</details>
						)}
						<div className="header-account">{profileLink}</div>
						<button
							className="icon-button mobile-toggle"
							aria-expanded={mobile}
							aria-label={t(mobile ? 'navClose' : 'navOpen')}
							onClick={() => setMenuPath(mobile ? null : path)}
						>
							{mobile ? <X size={21} /> : <MenuIcon size={22} />}
						</button>
					</div>
				</div>
				{mobile && (
					<nav className="mobile-nav container" aria-label={t('categories')}>
						{primary.map((item) => (
							<Link
								key={item.key}
								aria-current={active(item.path) ? 'page' : undefined}
								href={url(item.path)}
								onClick={() => setMenuPath(null)}
							>
								{t(item.key)}
							</Link>
						))}
						{extra.map((item) => (
							<Link key={item.id} href={url('/catalog/' + item.slug)} onClick={() => setMenuPath(null)}>
								{item.name}
							</Link>
						))}
						{profileLink}
					</nav>
				)}
			</header>
			{member?.showGmailNotice && !path.includes('/attempt/') && (
				<div className="container site-notice">
					<Bell size={16} />
					<span>
						{t('gmailTitle')}
						<span className="notice-copy">. {t('gmailBody')}</span>
					</span>
					<Link href={url('/my/settings')}>{t('settings')}</Link>
				</div>
			)}
		</>
	);
}

export function Footer() {
	const { t, url } = useLocale();
	return (
		<footer className="site-footer">
			<div className="container footer-inner">
				<div>
					<Brand href={url()} />
					<p>{t('legalLine')}</p>
				</div>
				<nav aria-label={t('categories')}>
					<Link href={url('/topik')}>{t('topik')}</Link>
					<Link href={url('/mock-exam')}>{t('mock')}</Link>
					<Link href={url('/vocabulary')}>{t('vocabularyLibrary')}</Link>
					<Link href={url('/help')}>
						<BookOpenText size={16} />
						{t('help')}
					</Link>
				</nav>
			</div>
		</footer>
	);
}
