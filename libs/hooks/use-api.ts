'use client';

import { useApolloClient } from '@apollo/client/react';
import type { DocumentNode } from 'graphql';
import { useCallback } from 'react';

export function useApi() {
	const client = useApolloClient();
	const mutate = useCallback(
		async <Data>(mutation: DocumentNode, variables?: Record<string, unknown>, skipRefresh = false): Promise<Data> => {
			const result = await client.mutate<Data>({ mutation, variables, context: { skipRefresh } });
			if (!result.data) throw new Error('The API returned no data');
			return result.data;
		},
		[client],
	);
	return { client, mutate };
}
