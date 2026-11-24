import { RecoverPassword } from '@/libs/components/account/auth-screen';
export const metadata = { robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
	return <RecoverPassword returnTo={(await searchParams).returnTo} />;
}
