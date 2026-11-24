'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ME } from '@/apollo/user/query';
import { needsLogin } from '@/apollo/client';
import type { Member } from '@/libs/types/api';

const SessionContext = createContext<{
	member?: Member;
	checking: boolean;
	unavailable: boolean;
	reload: () => Promise<unknown>;
} | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
	const { data, loading, error, refetch } = useQuery<{ getMe: Member }>(GET_ME, { fetchPolicy: 'network-only' });
	const value = useMemo(
		() => ({
			member: error ? undefined : data?.getMe,
			checking: loading && !data,
			unavailable: Boolean(error && !needsLogin(error)),
			reload: refetch,
		}),
		[data, error, loading, refetch],
	);
	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
	const session = useContext(SessionContext);
	if (!session) throw new Error('SessionProvider is required');
	return session;
}
