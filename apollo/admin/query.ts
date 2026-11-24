import { gql } from '@apollo/client';

export const GET_ADMIN_MENUS = gql`
	query GetAdminMenus {
		getAdminMenus {
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

export const GET_ADMIN_EXAMS = gql`
	query GetAdminExams($page: PageInput!) {
		getAdminExams(page: $page) {
			total
			list {
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
	}
`;

export const GET_ADMIN_EXAM = gql`
	query GetAdminExam($id: ID!) {
		getAdminExam(id: $id) {
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

export const GET_ADMIN_EXAM_VERSION = gql`
	query GetAdminExamVersion($id: ID!) {
		getAdminExamVersion(id: $id) {
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

export const GET_ADMIN_MEDIA = gql`
	query GetAdminMedia($page: PageInput!) {
		getAdminMedia(page: $page) {
			total
			list {
				id
				contentType
				sizeBytes
				durationMs
				url
			}
		}
	}
`;

export const GET_EXAM_LANGUAGES = gql`
	query GetExamLanguages {
		getExamLanguages {
			code
			name
			active
		}
	}
`;

export const GET_EXAM_FAMILIES = gql`
	query GetExamFamilies($code: String!) {
		getExamFamilies(languageCode: $code) {
			id
			languageCode
			key
			name
		}
	}
`;
