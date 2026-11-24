'use client';

import { ChevronDown, CircleHelp } from 'lucide-react';
import { useLocale } from '@/libs/i18n/context';
import { SectionHeading } from './ui';

const faq = [
	['faq1', 'faq1a'],
	['faq2', 'faq2a'],
	['faq3', 'rankHelp'],
	['faq4', 'faq4a'],
] as const;
export function Help() {
	const { t } = useLocale();
	return (
		<main className="container page-space narrow">
			<SectionHeading title={t('faqTitle')} icon={<CircleHelp size={25} />} />
			<div className="faq-list">
				{faq.map(([question, answer]) => (
					<details key={question}>
						<summary>
							{t(question)}
							<ChevronDown size={18} />
						</summary>
						<p>{t(answer)}</p>
					</details>
				))}
			</div>
		</main>
	);
}
