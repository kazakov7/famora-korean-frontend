'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ArrowUpRight, Files, FolderTree, Images, LayoutDashboard } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_ADMIN_EXAMS, GET_ADMIN_MEDIA, GET_ADMIN_MENUS } from '@/apollo/admin/query';
import { useSession } from '@/libs/auth/session';
import { useLocale } from '@/libs/i18n/context';
import type { AdminExam, MediaAsset, Menu, Page } from '@/libs/types/api';
import { Protected } from '@/libs/components/common/protected';
import { Avatar, SectionHeading } from '@/libs/components/common/ui';
import { Brand, DisplayControls } from '@/libs/components/layout/header';

const pages = [
	{ href: '/admin', label: 'adminHome', icon: LayoutDashboard },
	{ href: '/admin/menus', label: 'menus', icon: FolderTree },
	{ href: '/admin/exams', label: 'tests', icon: Files },
	{ href: '/admin/media', label: 'media', icon: Images },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
	const { t, url } = useLocale();
	const { member } = useSession();
	const path = usePathname();
	return (
		<div className="admin-shell">
			<header className="site-header">
				<div className="container header-inner">
					<div className="admin-brand">
						<Brand href="/admin" />
						<span className="meta-pill">{t('admin')}</span>
					</div>
					<div className="header-actions">
						<DisplayControls admin />
						<Link href={url()} className="button secondary small">
							{t('home')}
							<ArrowUpRight size={15} />
						</Link>
						{member && <Avatar name={member.memberNick} url={member.memberImage} />}
					</div>
				</div>
			</header>
			<Protected admin>
				<div className="container admin-layout">
					<aside className="my-sidebar admin-sidebar">
						<strong>{t('admin')}</strong>
						<nav>
							{pages.map(({ href, label, icon: Icon }) => {
								const active = href === path || (href !== '/admin' && path.startsWith(href + '/'));
								return (
									<Link key={href} href={href} aria-current={active ? 'page' : undefined}>
										<Icon size={17} />
										{t(label)}
									</Link>
								);
							})}
						</nav>
					</aside>
					<main id="admin-content" className="admin-main">
						{children}
					</main>
				</div>
			</Protected>
		</div>
	);
}

export function AdminHome() {
	const { t } = useLocale();
	const { data: menus } = useQuery<{ getAdminMenus: Menu[] }>(GET_ADMIN_MENUS);
	const { data: exams } = useQuery<{ getAdminExams: Page<AdminExam> }>(GET_ADMIN_EXAMS, {
		variables: { page: { offset: 0, limit: 1 } },
	});
	const { data: media } = useQuery<{ getAdminMedia: Page<MediaAsset> }>(GET_ADMIN_MEDIA, {
		variables: { page: { offset: 0, limit: 1 } },
	});
	const counts = [menus?.getAdminMenus.length, exams?.getAdminExams.total, media?.getAdminMedia.total];
	return (
		<>
			<SectionHeading title={t('adminHome')} description={t('adminBody')} icon={<LayoutDashboard size={23} />} />
			<div className="admin-home-grid">
				{pages.slice(1).map(({ href, label, icon: Icon }, index) => (
					<Link className="panel admin-home-card" key={href} href={href}>
						<span className="lead-icon">
							<Icon size={21} />
						</span>
						<div>
							<h2>{t(label)}</h2>
							<strong>{counts[index] ?? '—'}</strong>
						</div>
						<ArrowUpRight size={19} />
					</Link>
				))}
			</div>
		</>
	);
}
