'use client';
import { LoadError } from '@/libs/components/common/ui';
export default function ErrorPage({ reset }: { reset: () => void }) {
	return (
		<main className="container route-state">
			<LoadError onRetry={reset} />
		</main>
	);
}
