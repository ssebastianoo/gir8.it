<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import '@fontsource-variable/sometype-mono';
	import { ModeWatcher, toggleMode, mode } from 'mode-watcher';
	import ascii from '$lib/ascii';

	let { children } = $props();

	let asciiArt = $state(ascii[Math.floor(Math.random() * ascii.length)]);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#000000" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={favicon} />
	<meta property="twitter:image" content={favicon} />
</svelte:head>

<ModeWatcher />
<div class="relative">
	<p
		class="absolute right-0 bottom-0 -z-10 overflow-hidden whitespace-pre-line opacity-20 select-none"
	>
		{asciiArt}
	</p>
	<div class="flex min-h-svh flex-col gap-4 p-8">
		<nav class="flex w-full items-start justify-between">
			<a href="/">home</a>
			<button onclick={toggleMode}>{mode.current}</button>
		</nav>
		<div class="flex flex-1 items-center justify-center">
			<main class="w-full max-w-90 sm:max-w-lg">
				{@render children()}
			</main>
		</div>
	</div>
</div>
