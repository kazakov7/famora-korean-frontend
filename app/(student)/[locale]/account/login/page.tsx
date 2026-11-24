import { AuthScreen } from '@/libs/components/account/auth-screen';
export const metadata = { robots: { index: false } };
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ returnTo?: string; error?: string; reset?: string }>;
}) {
	const { returnTo, error, reset } = await searchParams;
	return <AuthScreen variant="login" returnTo={returnTo} oauthError={error === 'oauth_failed'} reset={reset === '1'} />;
}
