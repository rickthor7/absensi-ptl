import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.absenptl.web.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/transparansi', '/login'],
        disallow: ['/musyrif/', '/santri/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
