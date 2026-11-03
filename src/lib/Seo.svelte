<script lang="ts">
	import { SITE, absolute } from '#lib/site.ts';

	interface Props {
		// path of the page, relative to the site root
		path?: string;
	}

	let { path = '/' }: Props = $props();

	const url = $derived(absolute(path));
	const image = absolute(SITE.image.path);

	const person = $derived({
		'@type': 'Person',
		'@id': `${SITE.url}/#person`,
		name: SITE.name,
		givenName: 'Sebastiano',
		familyName: 'Girotto',
		url: SITE.url,
		image,
		email: SITE.email,
		jobTitle: 'Freelance Full-Stack Developer',
		description: SITE.description,
		knowsAbout: SITE.skills,
		sameAs: SITE.profiles,
		memberOf: { '@type': 'MusicGroup', name: 'nomorecho', url: 'https://nomorecho.com' }
	});

	const graph = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			person,
			{
				'@type': 'WebSite',
				'@id': `${SITE.url}/#website`,
				url: SITE.url,
				name: SITE.name,
				description: SITE.description,
				inLanguage: 'en',
				publisher: { '@id': `${SITE.url}/#person` }
			},
			{
				'@type': 'ProfilePage',
				'@id': `${url}#profile`,
				url,
				name: SITE.title,
				description: SITE.description,
				inLanguage: 'en',
				isPartOf: { '@id': `${SITE.url}/#website` },
				about: { '@id': `${SITE.url}/#person` },
				mainEntity: { '@id': `${SITE.url}/#person` },
				primaryImageOfPage: { '@type': 'ImageObject', url: image }
			}
		]
	});

	// `<` is escaped so the data can never close the script tag
	const jsonLd = $derived(JSON.stringify(graph).replace(/</g, '\\u003c'));
</script>

<svelte:head>
	<title>{SITE.title}</title>
	<meta name="description" content={SITE.description} />
	<link rel="canonical" href={url} />
	<meta name="author" content={SITE.name} />
	<meta
		name="robots"
		content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	/>

	<meta property="og:type" content="profile" />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:locale" content={SITE.locale} />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={SITE.title} />
	<meta property="og:description" content={SITE.description} />
	<meta property="og:image" content={image} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(SITE.image.width)} />
	<meta property="og:image:height" content={String(SITE.image.height)} />
	<meta property="og:image:alt" content={SITE.image.alt} />
	<meta property="profile:first_name" content="Sebastiano" />
	<meta property="profile:last_name" content="Girotto" />
	<meta property="profile:username" content="ssebastianoo" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={SITE.social.twitter} />
	<meta name="twitter:creator" content={SITE.social.twitter} />
	<meta name="twitter:title" content={SITE.title} />
	<meta name="twitter:description" content={SITE.description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={SITE.image.alt} />

	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>
