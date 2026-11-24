import { gql } from '@apollo/client';

export const SAVE_MENU = gql`
	mutation SaveMenu($input: MenuInput!) {
		saveMenu(input: $input) {
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

export const DELETE_MENU = gql`
	mutation DeleteMenu($id: ID!) {
		deleteMenu(id: $id)
	}
`;

export const CREATE_EXAM = gql`
	mutation CreateExam($input: CreateExamInput!) {
		createExam(input: $input) {
			id
			slug
			kind
			languageCode
			familyId
			currentVersionId
			archivedAt
			menuIds
			versions {
				id
				number
				title
				description
				durationSeconds
				coverId
				publishedAt
			}
		}
	}
`;

export const ARCHIVE_EXAM = gql`
	mutation ArchiveExam($id: ID!, $archived: Boolean!) {
		archiveExam(id: $id, archived: $archived) {
			id
			slug
			kind
			languageCode
			familyId
			currentVersionId
			archivedAt
			menuIds
			versions {
				id
				number
				title
				description
				durationSeconds
				coverId
				publishedAt
			}
		}
	}
`;

export const CREATE_EXAM_DRAFT = gql`
	mutation CreateExamDraft($id: ID!) {
		createExamDraft(examId: $id) {
			id
			number
			title
			description
			durationSeconds
			coverId
			publishedAt
			examId
			variants {
				id
				label
				sortOrder
				sections {
					id
					kind
					title
					instructions
					sortOrder
					durationSeconds
					audioMaxPlays
					groups {
						id
						passage
						imageId
						audioId
						audioStartMs
						audioEndMs
						audioMaxPlays
					}
					questions {
						id
						kind
						prompt
						groupId
						imageId
						sortOrder
						points
						explanation
						sampleAnswer
						choices {
							id
							text
							imageId
							sortOrder
							correct
						}
					}
				}
			}
		}
	}
`;

export const UPDATE_EXAM_DRAFT = gql`
	mutation UpdateExamDraft($id: ID!, $input: ExamDraftInput!) {
		updateExamDraft(id: $id, input: $input) {
			id
			number
			title
			description
			durationSeconds
			coverId
			publishedAt
			examId
			variants {
				id
				label
				sortOrder
				sections {
					id
					kind
					title
					instructions
					sortOrder
					durationSeconds
					audioMaxPlays
					groups {
						id
						passage
						imageId
						audioId
						audioStartMs
						audioEndMs
						audioMaxPlays
					}
					questions {
						id
						kind
						prompt
						groupId
						imageId
						sortOrder
						points
						explanation
						sampleAnswer
						choices {
							id
							text
							imageId
							sortOrder
							correct
						}
					}
				}
			}
		}
	}
`;

export const PUBLISH_EXAM_VERSION = gql`
	mutation PublishExamVersion($id: ID!) {
		publishExamVersion(id: $id) {
			id
			slug
			kind
			languageCode
			familyId
			currentVersionId
			archivedAt
			menuIds
			versions {
				id
				number
				title
				description
				durationSeconds
				coverId
				publishedAt
			}
		}
	}
`;

export const SET_EXAM_MENU = gql`
	mutation SetExamMenu($input: ExamMenuInput!) {
		setExamMenu(input: $input)
	}
`;

export const REMOVE_EXAM_MENU = gql`
	mutation RemoveExamMenu($exam: ID!, $menu: ID!) {
		removeExamMenu(examId: $exam, menuId: $menu)
	}
`;

export const SAVE_EXAM_VARIANT = gql`
	mutation SaveExamVariant($parent: ID!, $id: ID, $input: VariantInput!) {
		saveExamVariant(versionId: $parent, id: $id, input: $input)
	}
`;

export const DELETE_EXAM_VARIANT = gql`
	mutation DeleteExamVariant($parent: ID!, $id: ID!) {
		deleteExamVariant(versionId: $parent, id: $id)
	}
`;

export const SAVE_EXAM_SECTION = gql`
	mutation SaveExamSection($parent: ID!, $id: ID, $input: SectionInput!) {
		saveExamSection(variantId: $parent, id: $id, input: $input)
	}
`;

export const DELETE_EXAM_SECTION = gql`
	mutation DeleteExamSection($parent: ID!, $id: ID!) {
		deleteExamSection(variantId: $parent, id: $id)
	}
`;

export const SAVE_QUESTION_GROUP = gql`
	mutation SaveQuestionGroup($parent: ID!, $id: ID, $input: QuestionGroupInput!) {
		saveQuestionGroup(sectionId: $parent, id: $id, input: $input)
	}
`;

export const DELETE_QUESTION_GROUP = gql`
	mutation DeleteQuestionGroup($parent: ID!, $id: ID!) {
		deleteQuestionGroup(sectionId: $parent, id: $id)
	}
`;

export const SAVE_QUESTION = gql`
	mutation SaveQuestion($parent: ID!, $id: ID, $input: QuestionInput!) {
		saveQuestion(sectionId: $parent, id: $id, input: $input)
	}
`;

export const DELETE_QUESTION = gql`
	mutation DeleteQuestion($parent: ID!, $id: ID!) {
		deleteQuestion(sectionId: $parent, id: $id)
	}
`;
