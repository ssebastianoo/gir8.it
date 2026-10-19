<script lang="ts">
	import { onMount } from 'svelte';
	import { randomGlyph } from '#lib/glyphs.ts';

	interface Props {
		from: string;
		to: string;
		// 0 shows `from`, 1 shows `to`, in between characters scramble from left to right
		progress: number;
	}

	let { from, to, progress }: Props = $props();

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

	// one unbreakable group per word of `to`, so swapping characters never changes where lines wrap
	const words = $derived.by(() => {
		const groups: number[][] = [[]];
		for (let i = 0; i < length; i++) {
			groups.at(-1)!.push(i);
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

<span class="sr-only">{to}</span><span aria-hidden="true"
	>{#each words as word, w (w)}<span class="inline-block whitespace-pre"
			>{#each word as i (i)}<span class={[!slots[i].visible && 'opacity-0']}>{slots[i].char}</span
				>{/each}</span
		>{/each}</span
>
