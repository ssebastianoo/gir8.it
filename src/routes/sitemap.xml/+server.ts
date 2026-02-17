import type { RequestHandler } from './$types';
import { PUBLIC_URL } from '$env/static/public';

export const prerender = true;

export const GET: RequestHandler = async () => {

    const url = PUBLIC_URL.endsWith('/') ? PUBLIC_URL.slice(0, -1) : PUBLIC_URL;

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${url}/work</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${url}/online</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml'
        }
    });
};