import { ExamEditor } from '@/libs/components/admin/exams/exam-editor';
export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
	return <ExamEditor id={(await params).examId} />;
}
