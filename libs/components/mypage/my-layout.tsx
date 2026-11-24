'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookMarked, ClipboardList, LayoutGrid, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { Protected } from '@/libs/components/common/protected';
import { useLocale } from '@/libs/i18n/context';

const pages = [
	{ path: '/my', label: 'profile', icon: LayoutGrid },
	{ path: '/my/attempts', label: 'history', icon: ClipboardList },
	{ path: '/my/vocabulary', label: 'words', icon: BookMarked },
	{ path: '/my/settings', label: 'settings', icon: Settings },
] as const;

export function MyLayout({ children }: { children: ReactNode }) {
	const { t, url } = useLocale();
	const pathname = usePathname();
	return (
		<Protected>
			<main className="container page-space my-layout">
				<aside className="my-sidebar">
					<strong>{t('my')}</strong>
					<nav>
						{pages.map(({ path, label, icon: Icon }) => {
							const href = url(path);
							const active = pathname === href || (path !== '/my' && pathname.startsWith(href + '/'));
							return (
								<Link href={href} key={path} aria-current={active ? 'page' : undefined}>
									<Icon size={18} />
									{t(label)}
								</Link>
							);
						})}
					</nav>
				</aside>
				<div className="my-content">{children}</div>
			</main>
		</Protected>
	);
}
