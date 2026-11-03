export const SITE = {
	url: 'https://gir8.it',
	name: 'Sebastiano Girotto',
	title: 'Sebastiano Girotto | Freelance Full-Stack Developer',
	description:
		'Sebastiano Girotto is a freelance full-stack developer building custom web software with TypeScript, SvelteKit and PostgreSQL. Open source contributor and music producer. Available for work.',
	locale: 'en_US',
	email: 'work@gir8.it',
	image: {
		path: '/og.png',
		width: 1200,
		height: 630,
		alt: 'Sebastiano Girotto, full-stack developer, next to an ASCII portrait'
	},
	social: {
		twitter: '@ssebastianoo'
	},
	profiles: [
		'https://github.com/ssebastianoo',
		'https://linkedin.com/in/sebastianogirotto',
		'https://twitter.com/ssebastianoo'
	],
	skills: [
		'TypeScript',
		'JavaScript',
		'Svelte',
		'SvelteKit',
		'PostgreSQL',
		'Drizzle ORM',
		'Tailwind CSS',
		'Cloudflare',
		'Web development'
	]
} as const;

export const absolute = (path: string) => new URL(path, SITE.url).href;
