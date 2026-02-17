<script lang="ts">
	import { PUBLIC_URL } from '$env/static/public';

	let url = $derived(PUBLIC_URL.endsWith('/') ? PUBLIC_URL.slice(0, -1) : PUBLIC_URL);

	let {
		title,
		description,
		path
	}: {
		title: string;
		description: string;
		path: string;
	} = $props();
</script>

<title>{title}</title>

<meta name="title" content={title} />
<meta name="description" content={description} />

<meta property="og:url" content={`${url}${path}`} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />

<meta property="twitter:url" content={`${url}${path}`} />
<meta property="twitter:title" content={title} />
<meta property="twitter:description" content={description} />
