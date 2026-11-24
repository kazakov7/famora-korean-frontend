import { InMemoryCache } from '@apollo/client';

export function createCache() {
	return new InMemoryCache({
		typePolicies: {
			AttemptView: { keyFields: false },
			AttemptResult: { keyFields: false },
			AttemptSummary: { keyFields: false },
			AttemptQuestion: { keyFields: false },
			AttemptGroup: { keyFields: false },
			SectionResult: { keyFields: false },
			VocabularyOrigin: { keyFields: false },
		},
	});
}
