<script lang="ts">
	import { onMount } from 'svelte';
	import { randomGlyph as glyph } from '#lib/glyphs.ts';

	interface Props {
		text: string;
		// ms to wait before the first character
		delay?: number;
		// ms between two characters starting to type
		speed?: number;
		// ms a character spends as random glyphs before settling
		scramble?: number;
		// keep the cursor blinking once the text is typed
		cursor?: boolean;
		// called once every character has settled
		ondone?: () => void;
	}

	let { text, delay = 0, speed = 55, scramble = 380, cursor = false, ondone }: Props = $props();

	const GLYPH_MS = 45;

	const chars = $derived([...text]);
	const total = $derived((chars.length - 1) * speed + scramble);

	// ms since the first character started typing, negative while waiting
	let elapsed = $state(-Infinity);
	let glyphs = $state<string[]>([]);

	const typed = $derived(elapsed < 0 ? 0 : Math.min(chars.length, Math.floor(elapsed / speed) + 1));
	const done = $derived(elapsed >= total);
	// hidden as soon as the last character starts, so a following TypeText can take it over
	const showCursor = $derived(elapsed >= 0 && (typed < chars.length || cursor));

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			elapsed = Infinity;
			ondone?.();
			return;
		}

		const start = performance.now() + delay;
		let lastGlyph = 0;
		let raf = requestAnimationFrame(function tick(now) {
			elapsed = now - start;
			if (now - lastGlyph > GLYPH_MS) {
				glyphs = chars.map(glyph);
				lastGlyph = now;
			}
			if (elapsed < total) raf = requestAnimationFrame(tick);
			else ondone?.();
		});

		return () => cancelAnimationFrame(raf);
	});
</script>

{#snippet caret()}
	<span class="relative inline-block h-[0.8em] w-0 align-[-0.05em]"
		><span
			class={['absolute inset-y-0 left-[0.04em] w-[0.5em] bg-current', done && 'animate-blink']}
		></span></span
	>
{/snippet}

<span class="sr-only">{text}</span><span aria-hidden="true"
	>{#each chars as char, i (i)}{#if showCursor && i === typed}{@render caret()}{/if}{#if char === '\n'}<br
			/>{:else if elapsed < i * speed}<span class="opacity-0">{char}</span
			>{:else if elapsed < i * speed + scramble && char !== ' '}<span class="opacity-60"
				>{glyphs[i] ?? glyph()}</span
			>{:else}{char}{/if}{/each}{#if showCursor && typed >= chars.length}{@render caret()}{/if}</span
>
