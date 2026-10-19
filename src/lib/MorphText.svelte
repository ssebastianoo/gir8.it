<script lang="ts">
	import { onMount } from 'svelte';
	import { randomGlyph } from '#lib/glyphs.ts';

	interface Props {
		from: string;
		to: string;
		// 0 shows `from`, 1 shows `to`, in between characters scramble from left to right
		progress: number;
		// parts of `to` that link somewhere, by the text they cover
		links?: Record<string, string>;
	}

	let { from, to, progress, links = {} }: Props = $props();

	// share of the progress a single character spends as random glyphs
	const WINDOW = 0.2;
	const GLYPH_MS = 60;

	const source = $derived([...from]);
	const target = $derived([...to]);
	const length = $derived(Math.max(source.length, target.length));

	// bumped while something is scrambling, so glyphs keep changing when the scroll stops
	let noise = $state(0);

	const slots = $derived.by(() => {
		void noise;
		return Array.from({ length }, (_, i) => {
			const start = (i / Math.max(1, length - 1)) * (1 - WINDOW);
			const t = (progress - start) / WINDOW;
			// characters that are not there yet still take their final space, so the layout never moves
			if (t <= 0) return { char: source[i] ?? target[i], visible: i < source.length };
			// progress 1 is checked on its own since floating point can leave the last t a hair under 1
			if (t >= 1 || progress >= 1) return { char: target[i] ?? '', visible: true };
			return { char: randomGlyph(), visible: true, scrambling: true };
		});
	});

	// `to` split into plain text and links, for screen readers
	const parts = $derived.by(() => {
		const found = Object.entries(links)
			.map(([text, href]) => ({ text, href, start: to.indexOf(text) }))
			.filter(({ start }) => start >= 0)
			.sort((a, b) => a.start - b.start);
		const parts: { text: string; href?: string; start: number }[] = [];
		let at = 0;
		for (const link of found) {
			if (link.start < at) continue;
			if (link.start > at) parts.push({ text: to.slice(at, link.start), start: at });
			parts.push(link);
			at = link.start + link.text.length;
		}
		if (at < to.length) parts.push({ text: to.slice(at), start: at });
		return parts;
	});

	// index into `to` (as characters, not code units) where each link starts and ends
	const hrefs = $derived.by(() => {
		const hrefs: (string | undefined)[] = [];
		for (const { text, href, start } of parts) {
			const from = [...to.slice(0, start)].length;
			for (let i = 0; i < [...text].length; i++) hrefs[from + i] = href;
		}
		return hrefs;
	});

	// one unbreakable group per word of `to`, so swapping characters never changes where lines wrap,
	// made of runs of characters that link to the same place
	const words = $derived.by(() => {
		const groups: { href?: string; chars: number[] }[][] = [[]];
		for (let i = 0; i < length; i++) {
			const word = groups.at(-1)!;
			const run = word.at(-1);
			if (run && run.href === hrefs[i]) run.chars.push(i);
			else word.push({ href: hrefs[i], chars: [i] });
			if (target[i] === ' ' && i < target.length - 1) groups.push([]);
		}
		return groups;
	});

	onMount(() => {
		const id = setInterval(() => {
			if (slots.some((slot) => slot.scrambling)) noise++;
		}, GLYPH_MS);
		return () => clearInterval(id);
	});
</script>

{#snippet chars(indices: number[])}{#each indices as i (i)}<span
			class={[!slots[i].visible && 'opacity-0']}>{slots[i].char}</span
		>{/each}{/snippet}

<span class="sr-only"
	>{#each parts as { text, href }, p (p)}{#if href}<a {href}>{text}</a
			>{:else}{text}{/if}{/each}</span
><span aria-hidden="true"
	>{#each words as word, w (w)}<span class="inline-block whitespace-pre"
			>{#each word as run, r (r)}{#if run.href}<a
						href={run.href}
						tabindex="-1"
						class={[
							'underline decoration-1 underline-offset-[0.2em]',
							// can't be clicked before it has fully shown up
							run.chars.some((i) => !slots[i].visible || slots[i].char !== target[i]) &&
								'pointer-events-none'
						]}>{@render chars(run.chars)}</a
					>{:else}{@render chars(run.chars)}{/if}{/each}</span
		>{/each}</span
>
