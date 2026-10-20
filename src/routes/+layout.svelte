<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import HexWall from '#lib/HexWall.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<HexWall />
{@render children()}
