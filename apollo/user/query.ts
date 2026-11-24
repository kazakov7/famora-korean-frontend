import { gql } from '@apollo/client';

export const GET_VOCABULARY_UNIT = gql`
	query GetVocabularyUnit($slug: String!) {
		getVocabularyUnit(slug: $slug) {
			collectionSlug
			collectionPath
			languageCode
			words {
				id
				term
				translation
			}
		}
	}
`;

export const GET_NAVIGATION = gql`
	query GetNavigation {
		getNavigation {
			id
			parentId
			slug
			systemKey
			name
			sortOrder
			published
		}
	}
`;

export const GET_EXAM_CATALOG = gql`
	query GetExamCatalog($page: PageInput!, $filter: ExamFilterInput) {
		getExamCatalog(page: $page, filter: $filter) {
			total
			list {
				id
				slug
				title
				description
				kind
				languageCode
				durationSeconds
				coverUrl
				sections {
					kind
					title
					durationSeconds
				}
			}
		}
	}
`;

const EXAM_OVERVIEW_FIELDS = gql`
	fragment ExamOverviewFields on ExamOverview {
		id
		slug
		title
		description
		kind
		languageCode
		durationSeconds
		coverUrl
		sections {
			kind
			title
			durationSeconds
		}
	}
`;

export const GET_EXAM_OVERVIEW = gql`
	query GetExamOverview($slug: String!) {
		getExamOverview(slug: $slug) {
			...ExamOverviewFields
		}
	}
	${EXAM_OVERVIEW_FIELDS}
`;

export const GET_DAILY_PRACTICE = gql`
	query GetDailyPractice {
		getDailyPractice {
			date
			questionCount
			exam {
				...ExamOverviewFields
			}
		}
	}
	${EXAM_OVERVIEW_FIELDS}
`;

export const GET_ME = gql`
	query GetMe {
		getMe {
			id
			memberNick
			memberFullName
			memberImage
			memberPhone
			memberAge
			memberAuthType
			authMethod
			role
			memberPoints
			recoveryEmail
			providers
			hasPassword
			showGmailNotice
		}
	}
`;

export const GET_PENDING_ATTEMPTS = gql`
	query GetPendingAttempts {
		getPendingAttempts {
			id
			examId
			examSlug
			title
			versionId
			variantId
			variantLabel
			mode
			status
			deadlineAt
			serverNow
			remainingMs
			elapsedMs
			createdAt
			completedAt
			reason
			score
			maxScore
			points
		}
	}
`;

export const GET_ATTEMPT = gql`
	query GetAttempt($id: ID!) {
		getAttempt(id: $id) {
			id
			examId
			examSlug
			title
			versionId
			variantId
			variantLabel
			mode
			status
			deadlineAt
			serverNow
			remainingMs
			elapsedMs
			createdAt
			completedAt
			reason
			score
			maxScore
			points
			currentQuestionId
			sections {
				kind
				title
				instructions
				groups {
					id
					passage
					imageUrl
					hasAudio
					audioMaxPlays
					audioUrl
					audioStartMs
					audioEndMs
					plays
					positionMs
				}
				questions {
					id
					kind
					prompt
					imageUrl
					groupId
					selectedChoiceId
					answerText
					choices {
						id
						text
						imageUrl
					}
				}
			}
		}
	}
`;

export const GET_ATTEMPT_RESULT = gql`
	query GetAttemptResult($id: ID!) {
		getAttemptResult(id: $id) {
			id
			examId
			examSlug
			dailyPractice
			title
			versionId
			variantId
			variantLabel
			mode
			status
			deadlineAt
			serverNow
			remainingMs
			elapsedMs
			createdAt
			completedAt
			reason
			score
			maxScore
			points
			currentQuestionId
			sections {
				kind
				title
				instructions
				groups {
					id
					passage
					imageUrl
					hasAudio
					audioMaxPlays
					audioUrl
					audioStartMs
					audioEndMs
					plays
					positionMs
				}
				questions {
					id
					kind
					prompt
					imageUrl
					groupId
					selectedChoiceId
					answerText
					choices {
						id
						text
						imageUrl
					}
				}
			}
			sectionResults {
				section
				correct
				wrong
				unanswered
				ungraded
				score
				maxScore
				points
			}
			review {
				id
				kind
				prompt
				imageUrl
				groupId
				selectedChoiceId
				answerText
				choices {
					id
					text
					imageUrl
				}
				section
				correctChoiceId
				explanation
				sampleAnswer
				sampleAnswerImageUrl
				earnedScore
			}
		}
	}
`;

export const GET_ATTEMPT_HISTORY = gql`
	query GetAttemptHistory($page: PageInput!) {
		getAttemptHistory(page: $page) {
			total
			distinctCompletedTests
			memberPoints
			list {
				id
				examId
				examSlug
				title
				versionId
				variantId
				variantLabel
				mode
				status
				deadlineAt
				serverNow
				remainingMs
				elapsedMs
				createdAt
				completedAt
				reason
				score
				maxScore
				points
			}
		}
	}
`;

export const GET_LEADERBOARD = gql`
	query GetLeaderboard($page: PageInput!) {
		getLeaderboard(page: $page) {
			total
			list {
				id
				memberNick
				memberImage
				memberPoints
				rank
			}
		}
	}
`;

export const GET_VOCABULARY = gql`
	query GetVocabulary($page: PageInput!) {
		getVocabulary(page: $page) {
			total
			list {
				id
				languageCode
				term
				translation
				note
				createdAt
				sources {
					attemptId
					questionId
					examId
					examSlug
					examTitle
					section
					createdAt
				}
			}
		}
	}
`;
