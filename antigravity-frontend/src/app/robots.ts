import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Google-Extended',
          'Applebot',
          'Applebot-Extended',
          'Bingbot'
        ],
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
    ],
    sitemap: 'https://phonekoi.com/sitemap.xml',
  };
}
