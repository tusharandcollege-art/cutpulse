import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/my-videos'],
            },
        ],
        sitemap: 'https://cutpulse.com/sitemap.xml',
    }
}
