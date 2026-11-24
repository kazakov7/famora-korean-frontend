import type { ReactNode } from 'react';
import { MyLayout } from '@/libs/components/mypage/my-layout';
export const metadata = { robots: { index: false } };
export default function Layout({ children }: { children: ReactNode }) {
	return <MyLayout>{children}</MyLayout>;
}
