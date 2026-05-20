export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tcg-tournament.vercel.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/create', '/privacy', '/terms'],
        disallow: ['/room/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
