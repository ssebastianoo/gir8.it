import { absolute } from '#lib/site.ts';

export const prerender = true;

// single page site, add a <url> per page if more routes show up
const PAGES = ['/'];

export const GET = () => {
	const urls = PAGES.map(
		(path) => `\t<url>\n\t\t<loc>${absolute(path)}</loc>\n\t\t<priority>1.0</priority>\n\t</url>`
	).join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
};
