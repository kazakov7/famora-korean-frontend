export type ExamKind = 'OFFICIAL' | 'MOCK' | 'VOCABULARY';
export type SectionKind = 'LISTENING' | 'READING' | 'WRITING' | 'VOCABULARY';
export type AttemptMode = Exclude<SectionKind, 'VOCABULARY'> | 'FULL';
export type AuthMethod = 'NICKNAME' | 'GOOGLE' | 'TELEGRAM';
export type QuestionKind = 'CHOICE' | 'TEXT';
export type MemberRole = 'MEMBER' | 'ADMIN';
export type AttemptStatus = 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
export interface Page<T> {
	total: number;
	list: T[];
}

export interface VocabularyUnit {
	collectionSlug: string;
	collectionPath: string[];
	languageCode: string;
	words: { id: string; term: string; translation: string }[];
}
export interface Menu {
	id: string;
	parentId: string | null;
	slug: string;
	systemKey: string | null;
	name: string;
	sortOrder: number;
	published: boolean;
}
export interface ExamSection {
	kind: SectionKind;
	title: string | null;
	durationSeconds: number;
}
export interface Exam {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	kind: ExamKind;
	languageCode: string;
	durationSeconds: number;
	coverUrl: string | null;
	sections: ExamSection[];
}

export interface DailyPractice {
	date: string;
	questionCount: number;
	exam: Exam;
}
export interface Member {
	id: string;
	memberNick: string;
	memberFullName: string;
	memberImage: string | null;
	memberPhone: string | null;
	memberAge: number | null;
	memberAuthType: AuthMethod;
	authMethod: AuthMethod;
	role: MemberRole;
	memberPoints: number;
	recoveryEmail: string | null;
	providers: AuthMethod[];
	hasPassword: boolean;
	showGmailNotice: boolean;
}
export interface RankedMember {
	id: string;
	memberNick: string;
	memberImage: string | null;
	memberPoints: number;
	rank: number;
}
export interface AttemptSummary {
	id: string;
	examId: string;
	examSlug: string;
	title: string;
	versionId: string;
	variantId: string;
	variantLabel: string;
	mode: AttemptMode;
	status: AttemptStatus;
	deadlineAt: string | null;
	serverNow: string;
	remainingMs: number;
	elapsedMs: number;
	createdAt: string;
	completedAt: string | null;
	reason: 'MANUAL' | 'TIMEOUT' | null;
	score: number;
	maxScore: number;
	points: number;
}
export interface Choice {
	id: string;
	text: string | null;
	imageUrl: string | null;
}
export interface Question {
	id: string;
	kind: QuestionKind;
	prompt: string;
	imageUrl: string | null;
	groupId: string | null;
	selectedChoiceId: string | null;
	answerText: string | null;
	choices: Choice[];
}
export interface QuestionGroup {
	id: string;
	passage: string | null;
	imageUrl: string | null;
	hasAudio: boolean;
	audioMaxPlays: number | null;
	audioUrl: string | null;
	audioStartMs: number | null;
	audioEndMs: number | null;
	plays: number;
	positionMs: number;
}
export interface PlayerSection {
	kind: SectionKind;
	title: string | null;
	instructions: string | null;
	groups: QuestionGroup[];
	questions: Question[];
}
export interface Attempt extends AttemptSummary {
	currentQuestionId: string | null;
	sections: PlayerSection[];
}
export interface SectionResult {
	section: SectionKind;
	correct: number;
	wrong: number;
	unanswered: number;
	ungraded: number;
	score: number;
	maxScore: number;
	points: number;
}
export interface ReviewQuestion extends Question {
	section: SectionKind;
	correctChoiceId: string | null;
	explanation: string | null;
	sampleAnswer: string | null;
	sampleAnswerImageUrl: string | null;
	earnedScore: number | null;
}
export interface AttemptResult extends Attempt {
	dailyPractice: boolean;
	sectionResults: SectionResult[];
	review: ReviewQuestion[];
}
export interface AttemptHistory extends Page<AttemptSummary> {
	distinctCompletedTests: number;
	memberPoints: number;
}
export interface AudioPlay {
	url: string;
	playbackId: string;
	startMs: number;
	endMs: number | null;
	positionMs: number;
	plays: number;
	maxPlays: number | null;
}
export interface WordSource {
	attemptId: string;
	questionId: string;
	examId: string;
	examSlug: string;
	examTitle: string;
	section: SectionKind;
	createdAt: string;
}
export interface Word {
	id: string;
	languageCode: string;
	term: string;
	translation: string | null;
	note: string | null;
	createdAt: string;
	sources: WordSource[];
}
export interface MediaAsset {
	id: string;
	contentType: string;
	sizeBytes: number;
	durationMs: number | null;
	url: string | null;
}
export interface VersionHeader {
	id: string;
	number: number;
	title: string;
	description: string | null;
	durationSeconds: number;
	coverId: string | null;
	publishedAt: string | null;
}
export interface AdminExam {
	id: string;
	slug: string;
	kind: ExamKind;
	languageCode: string;
	familyId: string | null;
	currentVersionId: string | null;
	archivedAt: string | null;
	menuIds: string[];
	versions: VersionHeader[];
}
export interface AdminChoice {
	id: string;
	text: string | null;
	imageId: string | null;
	sortOrder: number;
	correct: boolean;
}
export interface AdminQuestion {
	id: string;
	kind: QuestionKind;
	prompt: string;
	groupId: string | null;
	imageId: string | null;
	sortOrder: number;
	points: number;
	explanation: string | null;
	sampleAnswer: string | null;
	choices: AdminChoice[];
}
export interface AdminGroup {
	id: string;
	passage: string | null;
	imageId: string | null;
	audioId: string | null;
	audioStartMs: number | null;
	audioEndMs: number | null;
	audioMaxPlays: number | null;
}
export interface AdminSection extends ExamSection {
	id: string;
	instructions: string | null;
	sortOrder: number;
	audioMaxPlays: number | null;
	groups: AdminGroup[];
	questions: AdminQuestion[];
}
export interface AdminVariant {
	id: string;
	label: string;
	sortOrder: number;
	sections: AdminSection[];
}
export interface AdminVersion extends VersionHeader {
	examId: string;
	variants: AdminVariant[];
}
export interface ExamLanguage {
	code: string;
	name: string;
	active: boolean;
}
export interface ExamFamily {
	id: string;
	languageCode: string;
	key: string;
	name: string;
}
