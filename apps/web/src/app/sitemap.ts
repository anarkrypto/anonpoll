import { MetadataRoute } from 'next';
import { SITE_URL } from './config';

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: `${SITE_URL}/`,
			lastModified: new Date(),
		},
		{
			url: `${SITE_URL}/new`,
			lastModified: new Date(),
		},
	];
}
