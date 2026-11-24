import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
	const site = process.env.QUIZ_SITE_URL || 'http://localhost:3000';
	return {
		rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/*/account', '/*/my', '/*/attempt'] },
		sitemap: site + '/sitemap.xml',
	};
}
