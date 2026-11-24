import { ApolloClient, ApolloLink, HttpLink, Observable } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { createCache } from './store';

export function needsLogin(error: unknown) {
	return (
		CombinedGraphQLErrors.is(error) &&
		error.errors.some((item) => item.extensions?.code === 'UNAUTHENTICATED' || item.message === 'Sign in to continue')
	);
}

let refreshRequest: Promise<boolean> | null = null;

function refresh() {
	refreshRequest ??= fetch('/api/graphql', {
		method: 'POST',
		credentials: 'include',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ query: 'mutation RefreshSession { refreshSession }' }),
	})
		.then(async (response) => {
			if (!response.ok) return false;
			const body = await response.json();
			return body.data?.refreshSession === true;
		})
		.catch(() => false)
		.finally(() => {
			refreshRequest = null;
		});
	return refreshRequest;
}

export function createApollo() {
	const refreshLink = new ErrorLink(({ error, forward, operation }) => {
		if (!needsLogin(error) || operation.getContext().skipRefresh || typeof window === 'undefined') return;
		return new Observable((observer) => {
			let stopped = false;
			let subscription: { unsubscribe: () => void } | undefined;
			void refresh().then((valid) => {
				if (stopped) return;
				if (!valid) observer.error(error);
				else subscription = forward(operation).subscribe(observer);
			});
			return () => {
				stopped = true;
				subscription?.unsubscribe();
			};
		});
	});
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		cache: createCache(),
		link: ApolloLink.from([refreshLink, new HttpLink({ uri: '/api/graphql', credentials: 'include' })]),
		defaultOptions: { watchQuery: { notifyOnNetworkStatusChange: true } },
	});
}
