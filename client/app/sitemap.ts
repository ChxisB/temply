import type { MetadataRoute } from 'next';
import { SITE_URL } from '~/lib/site';

/** The public pages. Served at /sitemap.xml by Next, built from the
 *  configured site URL so it cannot name a domain the site is not on. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ['/', '/playground', '/docs', '/terms', '/privacy'].map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified,
  }));
}
