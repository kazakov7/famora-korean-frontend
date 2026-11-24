import type { NextConfig } from 'next';

const api = (process.env.QUIZ_API_URL || 'http://localhost:4000').replace(/\/$/, '');

const config: NextConfig = {
	poweredByHeader: false,
	devIndicators: false,
	async redirects() {
		return [{ source: '/', destination: '/uz', permanent: false }];
	},
	async rewrites() {
		return [
			{ source: '/api/graphql', destination: api + '/graphql' },
			{ source: '/api/exam-media/:filename', destination: api + '/api/exam-media/:filename' },
			{
				source: '/auth/:provider(google|telegram)/:action(start|callback)',
				destination: api + '/auth/:provider/:action',
			},
		];
	},
};

export default config;
