'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSession } from '@/libs/auth/session';
import { useLocale } from '@/libs/i18n/context';
import { Empty, LoadError, Loading } from './ui';

export function Protected({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
	const { member, checking, unavailable, reload } = useSession();
	const { url, t } = useLocale();
	const path = usePathname();
	if (checking)
		return (
			<main className="container route-state">
				<Loading />
			</main>
		);
	if (unavailable)
		return (
			<main className="container route-state">
				<LoadError onRetry={() => void reload().catch(() => {})} />
			</main>
		);
	if (!member)
		return (
			<main className="container route-state">
				<Empty title={t('signedOut')} icon={<LockKeyhole size={26} />}>
					<Link className="button primary" href={url('/account/login?returnTo=' + encodeURIComponent(path))}>
						{t('login')}
					</Link>
				</Empty>
			</main>
		);
	if (admin && member.role !== 'ADMIN')
		return (
			<main className="container route-state">
				<Empty title={t('forbidden')} icon={<LockKeyhole size={26} />}>
					<Link className="button secondary" href={url()}>
						{t('home')}
					</Link>
				</Empty>
			</main>
		);
	return children;
}
