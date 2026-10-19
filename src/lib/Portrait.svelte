<script lang="ts">
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import art from '#lib/assets/propic.txt?raw';
	import { randomGlyph } from '#lib/glyphs.ts';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		// ms to wait before the first character
		delay?: number;
		// 0 shows the portrait, 1 hides it, in between characters scramble away from the bottom right
		progress?: number;
	}

	let { delay = 0, progress = 0, ...rest }: Props = $props();

	// ms the intro takes to sweep from the top left corner to the bottom right one
	const SWEEP = 1100;
	// ms a character spends as random glyphs while typing in
	const SCRAMBLE = 380;
	// share of the progress a single character spends as random glyphs while going away
	const WINDOW = 0.2;
	const GLYPH_MS = 45;
	// a row is about twice as tall as a column is wide, so the sweep moves diagonally on screen
	const ROW_WEIGHT = 2;

	// the art is drawn dark on light, so the ramp is flipped for light characters on a dark page
	const RAMP = '.:-=+*#%@';
	const invert = (char: string) => {
		const i = RAMP.indexOf(char);
		return i < 0 ? char : RAMP[RAMP.length - 1 - i];
	};

	// leading spaces become an indent instead of text, so each row only takes up room where it is
	// drawn and the hex wall flows around the silhouette rather than a rectangle
	const lines = art
		.replace(/^\s*\n/, '')
		.trimEnd()
		.split('\n')
		.map((line) => line.trimEnd());
	const sweep = Math.max(...lines.map((line, r) => r * ROW_WEIGHT + line.length));
	let count = 0;
	const rows = lines.map((line, r) => {
		const indent = line.length - line.trimStart().length;
		const chars = [...line.trimStart()];
		// where along the sweep each character sits, from 0 at the top left to 1 at the bottom right
		const order = chars.map((_, c) => (r * ROW_WEIGHT + indent + c) / sweep);
		const first = count;
		count += chars.length;
		return { indent, chars: chars.map(invert), order, first };
	});

	// ms since the first character started typing, negative while waiting
	let elapsed = $state(-Infinity);
	// bumped whenever the glyphs are rerolled, so they keep changing when the scroll stops
	let noise = $state(0);
	let glyphs = Array.from({ length: count }, randomGlyph);

	type State = 'hidden' | 'typing' | 'morphing' | 'shown';

	const stateAt = (order: number): State => {
		// goes away in the opposite direction, clearing the way for the text coming up from below
		const t = (progress - (1 - order) * (1 - WINDOW)) / WINDOW;
		// progress 1 is checked on its own since floating point can leave the last t a hair under 1
		if (t >= 1 || progress >= 1) return 'hidden';
		const typed = elapsed - order * SWEEP;
		if (typed < 0) return 'hidden';
		if (t > 0) return 'morphing';
		return typed < SCRAMBLE ? 'typing' : 'shown';
	};

	// each row split into runs of characters in the same state, hidden ones still take their space
	const runs = $derived.by(() => {
		void noise;
		return rows.map(({ chars, order, first }) => {
			const row: { state: State; text: string }[] = [];
			chars.forEach((char, c) => {
				const state = stateAt(order[c]);
				const scrambled = (state === 'typing' || state === 'morphing') && char !== ' ';
				const text = scrambled ? glyphs[first + c] : char;
				const last = row.at(-1);
				if (last?.state === state) last.text += text;
				else row.push({ state, text });
			});
			return row;
		});
	});

	const scrambling = $derived(
		runs.some((row) => row.some(({ state }) => state === 'typing' || state === 'morphing'))
	);

	onMount(() => {
		const id = setInterval(() => {
			if (!scrambling) return;
			glyphs = Array.from({ length: count }, randomGlyph);
			noise++;
		}, GLYPH_MS);

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			elapsed = Infinity;
			return () => clearInterval(id);
		}

		const start = performance.now() + delay;
		let raf = requestAnimationFrame(function tick(now) {
			elapsed = now - start;
			if (elapsed < SWEEP + SCRAMBLE) raf = requestAnimationFrame(tick);
		});

		return () => {
			cancelAnimationFrame(raf);
			clearInterval(id);
		};
	});
</script>

<div aria-hidden="true" {...rest}>
	{#each runs as row, r (r)}
		<div class="whitespace-pre" style:padding-left="{rows[r].indent}ch">
			{#each row as { state, text }, i (i)}<span
					class={[state === 'hidden' && 'opacity-0', state === 'typing' && 'opacity-60']}
					>{text}</span
				>{/each}
		</div>
	{/each}
</div>
