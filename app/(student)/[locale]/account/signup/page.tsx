import { AuthScreen } from '@/libs/components/account/auth-screen';
export const metadata = { robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
	const { returnTo, error } = await searchParams;
	return <AuthScreen variant="signup" returnTo={returnTo} oauthError={error === 'oauth_failed'} />;
}
