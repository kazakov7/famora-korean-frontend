import { ExamPlayer } from '@/libs/components/attempt/exam-player';
export const metadata = { robots: { index: false } };
export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
	return <ExamPlayer id={(await params).attemptId} />;
}
