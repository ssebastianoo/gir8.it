<script lang="ts">
	import { onMount } from 'svelte';
	import MorphText from '#lib/MorphText.svelte';
	import Portrait from '#lib/Portrait.svelte';
	import Pyramid, { CHAR_WIDTH, COLS, LINE_HEIGHT, ROWS } from '#lib/Pyramid.svelte';
	import TypeText from '#lib/TypeText.svelte';
	import Warning from '#lib/Warning.svelte';
	import Work from '#lib/Work.svelte';

	const SCROLL = 'SCROLL!SCROLL!SCROLL!SCROLL'.repeat(4);
	const ABOUT =
		'i’m a freelance full-stack developer who’s been a computer science nerd since middle school, when i first started coding. i contribute to open source projects and work with companies to design and build custom software.';
	const MUSIC =
		'i’m also a music producer, since 2023 i’ve been playing guitar and working with rock and edm music, in april 2026 my band, nomorecho, released our first EP, mostly produced by me';

	// viewport heights of scrolling it takes the hero to turn into the about section
	const TRANSITION = 1.5;
	// viewport heights of scrolling, from the top, before the about section starts to vanish, which
	// leaves it a moment to be read once it has shown up
	const WORK_START = 2;
	// viewport heights of scrolling it takes the about section to turn into the work title, which
	// is also how long the roadmap takes to get up to the page
	const WORK_TRANSITION = 0.6;
	// ms without any scrolling, once the intro has finished typing, before the scroll warning shows up
	const WARNING_AFTER = 3000;

	let scrollY = $state(0);
	let innerHeight = $state(1);
	let warningOpen = $state(false);
	let scrolled = false;
	let warningTimer: ReturnType<typeof setTimeout>;

	const introDone = () => {
		warningTimer = setTimeout(() => {
			if (!scrolled) warningOpen = true;
		}, WARNING_AFTER);
	};

	const progress = $derived(Math.min(1, Math.max(0, scrollY / (innerHeight * TRANSITION))));

	const workProgress = $derived(
		Math.min(1, Math.max(0, (scrollY - innerHeight * WORK_START) / (innerHeight * WORK_TRANSITION)))
	);
	// the about section is leaving, to make room for the work title
	const leaving = $derived(workProgress > 0);

	// progress remapped to [from, to], clamped
	const remap = (value: number, from: number, to: number) =>
		Math.min(1, Math.max(0, (value - from) / (to - from)));
	const range = (from: number, to: number) => remap(progress, from, to);
	const workRange = (from: number, to: number) => remap(workProgress, from, to);
	const ease = (t: number) => t * t * (3 - 2 * t);

	const nameMove = $derived(ease(range(0, 0.45)));
	const titleMove = $derived(ease(range(0, 0.45)));
	const bodyMove = $derived(ease(range(0.05, 0.5)));

	$effect(() => {
		if (progress > 0) {
			scrolled = true;
			warningOpen = false;
		}
	});

	// how an element has to move so that `anchor` (inside it) lands on `target`
	type Offset = { x: number; y: number; scale: number; origin: string };

	let first = $state<HTMLElement>();
	let last = $state<HTMLElement>();
	let firstEnd = $state<HTMLElement>();
	let lastEnd = $state<HTMLElement>();
	let heroTitle = $state<HTMLElement>();
	let heroBody = $state<HTMLElement>();
	let title = $state<HTMLElement>();
	let titleAnchor = $state<HTMLElement>();
	let body = $state<HTMLElement>();
	let bodyAnchor = $state<HTMLElement>();

	let offsets = $state<Record<'first' | 'last' | 'title' | 'body', Offset>>();

	// how far the title has to move sideways to end up centered once it reads "work"
	let section = $state<HTMLElement>();
	let workWidth = $state<HTMLElement>();
	let center = $state(0);

	// where the pyramid goes, in the room under the about text, if there is enough of it
	const MIN_PYRAMID = 7;
	let pyramid = $state<{ top: number; height: number; size: number }>();

	const measure = (el: HTMLElement, anchor: HTMLElement, target: HTMLElement): Offset => {
		const transform = el.style.transform;
		el.style.transform = 'none';
		const box = el.getBoundingClientRect();
		const from = anchor.getBoundingClientRect();
		el.style.transform = transform;
		const to = target.getBoundingClientRect();
		const size = (node: HTMLElement) => parseFloat(getComputedStyle(node).fontSize);

		return {
			x: to.left - from.left,
			y: to.top - from.top,
			scale: size(target) / size(anchor),
			origin: `${from.left - box.left}px ${from.top - box.top}px`
		};
	};

	const measurePyramid = () => {
		// the text collapses while it goes away, which says nothing about the room under it
		if (leaving) return;
		const stage = section!.offsetParent as HTMLElement;
		const gap = stage.clientHeight * 0.04;
		const top = section!.offsetTop + section!.offsetHeight + gap;
		const height = stage.clientHeight - top - gap;
		const size = Math.min(
			height / (ROWS * LINE_HEIGHT),
			(stage.clientWidth * 0.92) / (COLS * CHAR_WIDTH),
			20
		);
		pyramid = size >= MIN_PYRAMID ? { top, height, size } : undefined;
	};

	const measureAll = () => {
		offsets = {
			first: measure(first!, first!, firstEnd!),
			last: measure(last!, last!, lastEnd!),
			title: measure(title!, titleAnchor!, heroTitle!),
			body: measure(body!, bodyAnchor!, heroBody!)
		};
		center = (section!.clientWidth - workWidth!.offsetWidth) / 2;
		measurePyramid();
	};

	// `amount` 0 leaves the element where it is laid out, 1 puts it on its target
	const move = (offset: Offset | undefined, amount: number) =>
		offset &&
		`translate(${offset.x * amount}px, ${offset.y * amount}px) scale(${1 + (offset.scale - 1) * amount})`;

	onMount(() => {
		measureAll();
		document.fonts.ready.then(measureAll);

		// the text can still reflow after the fonts are in, and with it the room under it
		const observer = new ResizeObserver(measurePyramid);
		observer.observe(section!);

		return () => {
			clearTimeout(warningTimer);
			observer.disconnect();
		};
	});
</script>

<svelte:head>
	<title>sebastiano girotto</title>
	<meta name="description" content="sebastiano girotto, full-stack developer" />
</svelte:head>

<svelte:window bind:scrollY bind:innerHeight onresize={measureAll} />

<!-- the name stays pinned top right for the whole site once it gets there -->
<h1
	class="fixed top-[calc(4*var(--u))] left-[calc(var(--gutter)+8*var(--u))] z-10 text-[calc(10.4*var(--u))] leading-[1.2] font-bold tracking-tight max-md:top-6 max-md:left-6 max-md:text-[13vw]"
>
	<span
		bind:this={first}
		class="inline-block origin-top-left"
		style:transform={move(offsets?.first, nameMove)}><TypeText text="sebastiano" /></span
	><br /><span
		bind:this={last}
		class="inline-block origin-top-left"
		style:transform={move(offsets?.last, nameMove)}
		><TypeText text="girotto" delay={11 * 55} /></span
	>
</h1>
<!-- where the name ends up, only used for measuring -->
<div
	aria-hidden="true"
	class="invisible fixed top-[calc(2*var(--u))] right-[calc(var(--gutter)+3*var(--u))] text-[calc(2.4*var(--u))] leading-[1.2] font-bold tracking-tight max-md:top-5 max-md:right-6 max-md:text-[6vw]"
>
	<span bind:this={firstEnd} class="inline-block">sebastiano</span>
	<span bind:this={lastEnd} class="inline-block">girotto</span>
</div>

<!-- the roadmap comes up from the bottom of the screen as soon as the about section starts to vanish,
	so the page ends once it has settled under the title -->
<main class="relative h-[calc(400vh-24*var(--u))] max-md:h-[calc(400vh-12rem)]">
	<div class="sticky top-0 z-20 h-screen overflow-hidden">
		<Portrait
			delay={600}
			progress={range(0, 0.2)}
			class="absolute top-[55%] right-[calc(var(--gutter)+8*var(--u))] -translate-y-1/2 text-[min(calc(0.8*var(--u)),0.85vh)] leading-[1.1] max-md:right-6 max-md:text-[calc((100vw-3rem)/74)]"
		/>

		<p
			class={[
				'absolute right-[calc(var(--gutter)+8*var(--u))] bottom-[calc(8*var(--u))] text-[calc(5.1*var(--u))] leading-none max-md:right-6 max-md:bottom-6 max-md:text-[6vw]',
				progress > 0 && 'opacity-0'
			]}
		>
			<span bind:this={heroTitle}><TypeText text="full-stack" delay={1300} speed={40} /></span>
			<span bind:this={heroBody}
				><TypeText
					text="developer"
					delay={1300 + 11 * 40}
					speed={40}
					cursor
					ondone={introDone}
				/></span
			>
		</p>

		<section
			bind:this={section}
			class={[
				'absolute top-[calc(11*var(--u))] right-[calc(var(--gutter)+8*var(--u))] left-[calc(var(--gutter)+8*var(--u))] flex flex-col items-start gap-[calc(3*var(--u))] max-md:top-24 max-md:right-6 max-md:left-6 max-md:gap-6',
				progress === 0 && 'opacity-0'
			]}
		>
			<div style:transform="translateX({center * ease(workRange(0.2, 1))}px)">
				<h2
					bind:this={title}
					class="text-[calc(5.1*var(--u))] leading-none max-md:text-[9vw]"
					style:transform={move(offsets?.title, 1 - titleMove)}
					style:transform-origin={offsets?.title.origin}
					style:font-weight={400 + 300 * titleMove}
				>
					<span bind:this={titleAnchor}
						><MorphText
							from={leaving ? 'about me' : 'full-stack'}
							to={leaving ? 'work' : 'about me'}
							progress={leaving ? workRange(0.2, 1) : range(0.15, 0.6)}
						/></span
					>
					<!-- how wide the final title is, only used for measuring -->
					<span
						bind:this={workWidth}
						aria-hidden="true"
						class="invisible absolute font-bold whitespace-nowrap">work</span
					>
				</h2>
			</div>
			<p
				bind:this={body}
				class="w-[calc(62*var(--u))] text-[calc(2.2*var(--u))] leading-[1.45] max-md:w-auto max-md:text-[4.4vw]"
				style:transform={move(offsets?.body, 1 - bodyMove)}
				style:transform-origin={offsets?.body.origin}
			>
				<span bind:this={bodyAnchor}
					><MorphText
						from={leaving ? ABOUT : 'developer'}
						to={leaving ? '' : ABOUT}
						progress={leaving ? workRange(0.1, 0.7) : range(0.25, 1)}
					/></span
				>
			</p>
			<p
				class="w-[calc(62*var(--u))] self-end text-[calc(2.2*var(--u))] leading-[1.45] max-md:w-auto max-md:self-auto max-md:text-[4.4vw]"
			>
				<MorphText
					from={leaving ? MUSIC : ''}
					to={leaving ? '' : MUSIC}
					progress={leaving ? workRange(0, 0.4) : range(0.5, 1)}
					links={{ nomorecho: 'https://nomorecho.com' }}
				/>
			</p>
		</section>

		<!-- fills the room the about text leaves under it -->
		{#if pyramid}
			<div
				aria-hidden="true"
				class={[
					'pointer-events-none absolute inset-x-0 flex items-center justify-center transition-opacity duration-500',
					progress < 1 || leaving ? 'opacity-0' : 'opacity-100'
				]}
				style:top="{pyramid.top}px"
				style:height="{pyramid.height}px"
			>
				<Pyramid active={progress >= 1 && !leaving} style="font-size: {pyramid.size}px" />
			</div>
		{/if}

		<Warning
			text={SCROLL}
			bind:open={warningOpen}
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
		/>
	</div>
</main>

<Work />
