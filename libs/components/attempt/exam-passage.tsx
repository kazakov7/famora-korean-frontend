export function ExamPassage({ text }: { text: string }) {
	return (
		<p className="exam-text" lang="ko">
			{text.split(/(<u>[^<>]+<\/u>)/g).map((part, index) =>
				index % 2 === 1 ? <u key={index}>{part.slice(3, -4)}</u> : part,
			)}
		</p>
	);
}
