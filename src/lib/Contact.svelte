<script lang="ts">
	import { onMount, tick } from 'svelte';
	import MorphText from '#lib/MorphText.svelte';
	import Pyramid, { CHAR_WIDTH, COLS, LINE_HEIGHT, ROWS } from '#lib/Pyramid.svelte';

	const LINKS = [
		{ name: 'linkedin', href: 'https://linkedin.com/in/sebastianogirotto' },
		{ name: 'github', href: 'https://github.com/ssebastianoo' },
		{ name: 'twitter', href: 'https://twitter.com/ssebastianoo' }
	];

	interface Props {
		// everything else has gone away, and the text is left alone in the center
		docked?: boolean;
	}

	let { docked = $bindable(false) }: Props = $props();

	const MIN_PYRAMID = 7;
	// px of scrolling past the point where the text has fully shown up before everything else goes
	// away, scrolling back up over them doesn't bring it back, so the scroll bouncing can't flicker it
	const DOCK_AFTER = 60;

	let content = $state<HTMLElement>();
	let contentHeight = $state(0);
	let innerHeight = $state(1);
	let innerWidth = $state(1);
	let progress = $state(0);
	// where the middle of the text was on screen when it docked, which is where it moves from
	let anchor = $state(0);
	// room taken off the end of the page when it docked, so the page ends right there
	let trim = $state(0);

	// once docked the text moves to the middle of the top half of the screen (as far down as it
	// needs to fit), and the pyramid takes the room under it
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

	// the text is done once it has come up from the bottom of the screen
	// reads the window directly, this runs before bind:innerHeight has caught up with the same event
	const measure = () => {
		if (!content) return;
		const box = content.getBoundingClientRect();
		const shown = (window.innerHeight - box.top) / box.height;
		progress = Math.min(1, Math.max(0, (shown - 0.1) / 0.8));

		const left = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
		// the bottom of the page counts too, a short screen might never get past DOCK_AFTER
		const arrived = shown >= 0.9 + DOCK_AFTER / box.height || (progress >= 1 && left <= 2);
		if (!docked && arrived) {
			docked = true;
			anchor = box.top + box.height / 2;
			trim = left;
		} else if (docked && progress < 1) {
			docked = false;
			trim = 0;
		}
	};

	const onresize = async () => {
		await tick();
		measure();
		if (!docked || !content) return;
		const box = content.getBoundingClientRect();
		anchor = box.top + box.height / 2;
	};

	// progress remapped to [from, to], clamped
	const range = (from: number, to: number) =>
		Math.min(1, Math.max(0, (progress - from) / (to - from)));

	onMount(measure);
</script>

<svelte:window bind:innerHeight bind:innerWidth onscroll={measure} {onresize} />

<section
	class="px-[calc(var(--gutter)+8*var(--u))] text-center max-md:px-6"
	style:padding-bottom="{Math.max(0, (innerHeight - contentHeight) / 2 - trim)}px"
>
	<!-- measured where it is laid out, the moving part is inside -->
	<div bind:this={content} bind:clientHeight={contentHeight}>
		<div
			class={[
				'flex flex-col items-center gap-[calc(3*var(--u))] transition-transform duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none max-md:gap-8',
				// everything else has to be gone first, or it shows behind the text on its way up
				docked && 'delay-500'
			]}
			style:transform={docked ? `translateY(${layout.center - anchor}px)` : undefined}
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
	</div>
</section>

<!-- fills the bottom half once the text has moved up -->
{#if layout.pyramid}
	<div
		aria-hidden="true"
		class={[
			'pointer-events-none fixed inset-x-0 flex items-center justify-center transition-opacity duration-700 motion-reduce:transition-none',
			docked ? 'opacity-100 delay-1000' : 'opacity-0'
		]}
		style:top="{layout.pyramid.top}px"
		style:height="{layout.pyramid.height}px"
	>
		<Pyramid active={docked} style="font-size: {layout.pyramid.size}px" />
	</div>
{/if}
