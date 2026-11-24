import { gql } from '@apollo/client';

export const SAVE_VOCABULARY_UNIT_WORD = gql`
	mutation SaveVocabularyUnitWord($id: ID!) {
		saveVocabularyUnitWord(id: $id) {
			id
			term
			translation
		}
	}
`;

export const LOGIN = gql`
	mutation Login($input: NicknameLoginInput!) {
		login(input: $input)
	}
`;

export const SIGNUP = gql`
	mutation Signup($input: SignupInput!) {
		signup(input: $input)
	}
`;

export const LOGOUT = gql`
	mutation Logout {
		logout
	}
`;

export const REQUEST_PASSWORD_RESET = gql`
	mutation RequestPasswordReset($input: NicknameInput!) {
		requestPasswordReset(input: $input)
	}
`;

export const VERIFY_RESET_OTP = gql`
	mutation VerifyPasswordResetOtp($input: VerifyOtpInput!) {
		verifyPasswordResetOtp(input: $input)
	}
`;

export const RESET_PASSWORD = gql`
	mutation ResetPassword($input: ResetPasswordInput!) {
		resetPassword(input: $input)
	}
`;

export const VERIFY_GMAIL_OTP = gql`
	mutation VerifyGmailOtp($input: VerifyOtpInput!) {
		verifyGmailOtp(input: $input)
	}
`;

export const CHANGE_PASSWORD = gql`
	mutation ChangePassword($input: ChangePasswordInput!) {
		changePassword(input: $input)
	}
`;

export const SET_FIRST_PASSWORD = gql`
	mutation SetFirstPassword($input: NewPasswordInput!) {
		setFirstPassword(input: $input)
	}
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: UpdateMemberInput!) {
		updateMember(input: $input) {
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

export const RECORD_EXAM_OPEN = gql`
	mutation RecordExamOpen($id: ID!) {
		recordExamOpen(examId: $id)
	}
`;

export const START_ATTEMPT = gql`
	mutation StartAttempt($input: StartAttemptInput!) {
		startAttempt(input: $input) {
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

export const MOVE_ATTEMPT = gql`
	mutation MoveAttempt($input: MoveAttemptInput!) {
		moveAttempt(input: $input)
	}
`;

export const SAVE_ATTEMPT_ANSWER = gql`
	mutation SaveAttemptAnswer($input: AnswerInput!) {
		saveAttemptAnswer(input: $input)
	}
`;

export const PAUSE_ATTEMPT = gql`
	mutation PauseAttempt($id: ID!) {
		pauseAttempt(id: $id) {
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

export const RESUME_ATTEMPT = gql`
	mutation ResumeAttempt($id: ID!) {
		resumeAttempt(id: $id) {
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

export const SUBMIT_ATTEMPT = gql`
	mutation SubmitAttempt($id: ID!) {
		submitAttempt(id: $id) {
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

export const PLAY_ATTEMPT_AUDIO = gql`
	mutation PlayAttemptAudio($input: StartAudioInput!) {
		playAttemptAudio(input: $input) {
			url
			playbackId
			startMs
			endMs
			positionMs
			plays
			maxPlays
		}
	}
`;

export const SAVE_ATTEMPT_AUDIO = gql`
	mutation SaveAttemptAudio($input: SaveAudioInput!) {
		saveAttemptAudio(input: $input)
	}
`;

export const SAVE_VOCABULARY_WORD = gql`
	mutation SaveVocabularyWord($input: SaveVocabularyInput!) {
		saveVocabularyWord(input: $input) {
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
`;

export const UPDATE_VOCABULARY_WORD = gql`
	mutation UpdateVocabularyWord($input: UpdateVocabularyInput!) {
		updateVocabularyWord(input: $input) {
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
`;

export const CREATE_MEDIA_UPLOAD = gql`
	mutation CreateMediaUpload($input: MediaUploadInput!) {
		createMediaUpload(input: $input) {
			id
			uploadUrl
			contentType
		}
	}
`;

export const COMPLETE_MEDIA_UPLOAD = gql`
	mutation CompleteMediaUpload($id: String!) {
		completeMediaUpload(id: $id) {
			id
			contentType
			sizeBytes
			durationMs
			url
		}
	}
`;
