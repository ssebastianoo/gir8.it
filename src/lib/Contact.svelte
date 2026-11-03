<script lang="ts">
	import { onMount } from 'svelte';
	import MorphText from '#lib/MorphText.svelte';
	import Pyramid, { CHAR_WIDTH, COLS, LINE_HEIGHT, ROWS } from '#lib/Pyramid.svelte';

	const LINKS = [
		{ name: 'linkedin', href: 'https://linkedin.com/in/sebastianogirotto' },
		{ name: 'github', href: 'https://github.com/ssebastianoo' },
		{ name: 'twitter', href: 'https://twitter.com/ssebastianoo' }
	];

	interface Props {
		// how far everything else has gone away, 0 to 1, driven by the scroll
		dock?: number;
	}

	let { dock = $bindable(0) }: Props = $props();

	const MIN_PYRAMID = 7;
	// viewport heights of scrolling, once the section has the screen to itself, that it takes the
	// text to show up and then move up to make room for the pyramid
	const RUNWAY = 0.9;

	let contentHeight = $state(0);
	let innerHeight = $state(1);
	let innerWidth = $state(1);
	let section = $state<HTMLElement>();
	// px scrolled since the section started to come up from the bottom of the screen
	let scrolled = $state(0);

	// the text moves to the middle of the top half of the screen (as far down as it needs to fit),
	// and the pyramid takes the room under it
	const layout = $derived.by(() => {
		const gap = innerHeight * 0.04;
		const center = Math.max(innerHeight / 4, contentHeight / 2 + gap);
		const top = center + contentHeight / 2 + gap;
		const height = innerHeight - gap - top;
		const size = Math.min(
			height / (ROWS * LINE_HEIGHT),
			(innerWidth * 0.92) / (COLS * CHAR_WIDTH),
			20
		);
		return {
			center,
			pyramid: size >= MIN_PYRAMID ? { top, height, size } : undefined
		};
	});

	// in viewport heights: 0 is the section's top edge reaching the bottom of the screen, 1 is it
	// reaching the top, where it stays pinned for the runway
	const place = $derived(scrolled / innerHeight);
	const remap = (value: number, from: number, to: number) =>
		Math.min(1, Math.max(0, (value - from) / (to - from)));
	const ease = (t: number) => t * t * (3 - 2 * t);

	// the text types itself out while it comes up and the runway starts
	const progress = $derived(remap(place, 0.4, 1 + RUNWAY * 0.4));
	const moved = $derived(ease(remap(place, 1 + RUNWAY * 0.45, 1 + RUNWAY)));

	$effect(() => {
		dock = moved;
	});

	// reads the window directly, this runs before bind:innerHeight has caught up with the same event
	const measure = () => {
		if (section) scrolled = window.innerHeight - section.getBoundingClientRect().top;
	};

	// progress remapped to [from, to], clamped
	const range = (from: number, to: number) => remap(progress, from, to);

	onMount(measure);
</script>

<svelte:window bind:innerHeight bind:innerWidth onscroll={measure} onresize={measure} />

<!-- the screen stays pinned while the runway is scrolled through -->
<section
	bind:this={section}
	class="-mt-[35vh] px-[calc(var(--gutter)+8*var(--u))] text-center max-md:px-6"
	style:height="{(1 + RUNWAY) * 100}vh"
>
	<div class="sticky top-0 flex h-screen items-center justify-center">
		<div
			bind:clientHeight={contentHeight}
			class="flex flex-col items-center gap-[calc(3*var(--u))] max-md:gap-8"
			style:transform="translateY({(layout.center - innerHeight / 2) * moved}px)"
		>
			<div class="flex flex-col items-center gap-[calc(1.5*var(--u))] max-md:gap-3">
				<h2 class="text-[calc(5.1*var(--u))] leading-none font-bold max-md:text-[7vw]">
					<MorphText from="" to="let's work together" progress={range(0, 0.35)} />
				</h2>
				<p class="text-[calc(2.6*var(--u))] max-md:text-[4.6vw]">
					<span class="text-primary/60"
						><MorphText from="" to="email:" progress={range(0.2, 0.4)} /></span
					>
					<MorphText from="" to="work(at)gir8.it" progress={range(0.25, 0.55)} />
				</p>
			</div>

			<div class="flex flex-col items-center gap-[calc(1.2*var(--u))] max-md:gap-3">
				<p class="text-[calc(1.7*var(--u))] text-primary/60 max-md:text-[4vw]">
					<MorphText from="" to="or find me on" progress={range(0.45, 0.7)} />
				</p>
				<ul
					class="flex flex-wrap justify-center gap-x-[calc(2.4*var(--u))] gap-y-2 text-[calc(1.7*var(--u))] max-md:gap-x-6 max-md:text-[4vw]"
				>
					{#each LINKS as { name, href }, i (name)}
						<li>
							<MorphText
								from=""
								to={name}
								progress={range(0.6 + i * 0.1, 0.8 + i * 0.1)}
								links={{ [name]: href }}
							/>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- fills the bottom half once the text has moved up -->
		{#if layout.pyramid}
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0 flex items-center justify-center"
				style:top="{layout.pyramid.top}px"
				style:height="{layout.pyramid.height}px"
				style:opacity={ease(remap(moved, 0.3, 1))}
			>
				<Pyramid active={moved > 0.3} style="font-size: {layout.pyramid.size}px" />
			</div>
		{/if}
	</div>
</section>
