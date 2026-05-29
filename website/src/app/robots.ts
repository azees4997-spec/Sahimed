import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://sahimed.com';

  return {
    rules: [
      {
        userAgent: ['Googlebot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot'],
        allow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/admin/', 
          '/api/orders/', 
          '/api/user/',
          '/Sahi-admin/', 
          '/checkout/', 
          '/order-success/',
          '/orders/',
          '/profile/'
        ],
        allow: ['/api/feeds/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'Amazonbot', 'Claude-Web', 'CCBot'],
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
