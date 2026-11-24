'use client';
import Link from 'next/link';
import { useLocale } from '@/libs/i18n/context';
import { Empty } from '@/libs/components/common/ui';
export default function NotFound() {
	const { t, url } = useLocale();
	return (
		<main className="container route-state">
			<Empty title={t('notFound')}>
				<Link href={url()} className="button primary">
					{t('home')}
				</Link>
			</Empty>
		</main>
	);
}
