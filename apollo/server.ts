import 'server-only';
import { print } from 'graphql';
import type { DocumentNode } from 'graphql';

export async function publicQuery<Data>(
	document: DocumentNode,
	variables?: Record<string, unknown>,
): Promise<Data | null> {
	const base = (process.env.QUIZ_API_URL || 'http://localhost:4000').replace(/\/$/, '');
	try {
		const response = await fetch(base + '/graphql', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ query: print(document), variables }),
			cache: 'no-store',
			signal: AbortSignal.timeout(3500),
		});
		if (!response.ok) return null;
		const result = (await response.json()) as { data?: Data; errors?: unknown[] };
		return result.errors?.length ? null : (result.data ?? null);
	} catch {
		return null;
	}
}
