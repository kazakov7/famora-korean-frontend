import { ExamResult } from '@/libs/components/attempt/exam-result';
export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
	return <ExamResult id={(await params).attemptId} />;
}
