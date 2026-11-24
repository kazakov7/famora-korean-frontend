import { Settings } from '@/libs/components/mypage/settings';
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ gmailChallenge?: string; error?: string }>;
}) {
	const { gmailChallenge, error } = await searchParams;
	return <Settings challenge={gmailChallenge} callbackError={error === 'oauth_failed'} />;
}
