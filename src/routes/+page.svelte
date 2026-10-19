<script lang="ts">
	import { onMount } from 'svelte';
	import MorphText from '#lib/MorphText.svelte';
	import Portrait from '#lib/Portrait.svelte';
	import TypeText from '#lib/TypeText.svelte';
	import Warning from '#lib/Warning.svelte';

	const SCROLL = 'SCROLL!SCROLL!SCROLL!SCROLL'.repeat(4);
	const ABOUT =
		'i’m a freelance full-stack developer who’s been a computer science nerd since middle school, when i first started coding. i contribute to open source projects and work with companies to design and build custom software.';
	const MUSIC =
		'i’m also a music producer, since 2023 i’ve been playing guitar and working with rock and edm music, in april 2026 my band, nomorecho, released our first EP, mostly produced by me';

	// viewport heights of scrolling it takes the hero to turn into the about section
	const TRANSITION = 1.5;
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

	// progress remapped to [from, to], clamped
	const range = (from: number, to: number) =>
		Math.min(1, Math.max(0, (progress - from) / (to - from)));
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

	const measureAll = () => {
		offsets = {
			first: measure(first!, first!, firstEnd!),
			last: measure(last!, last!, lastEnd!),
			title: measure(title!, titleAnchor!, heroTitle!),
			body: measure(body!, bodyAnchor!, heroBody!)
		};
	};

	// `amount` 0 leaves the element where it is laid out, 1 puts it on its target
	const move = (offset: Offset | undefined, amount: number) =>
		offset &&
		`translate(${offset.x * amount}px, ${offset.y * amount}px) scale(${1 + (offset.scale - 1) * amount})`;

	onMount(() => {
		measureAll();
		document.fonts.ready.then(measureAll);

		return () => clearTimeout(warningTimer);
	});
</script>

<svelte:head>
	<title>sebastiano girotto</title>
	<meta name="description" content="sebastiano girotto, full-stack developer" />
</svelte:head>

<svelte:window bind:scrollY bind:innerHeight onresize={measureAll} />

<!-- the name stays pinned top right for the whole site once it gets there -->
<h1
	class="fixed top-[4vw] left-[8vw] z-10 text-[10.4vw] leading-[1.2] font-bold tracking-tight max-md:top-6 max-md:left-6 max-md:text-[13vw]"
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
	class="invisible fixed top-[2vw] right-[3vw] text-[2.4vw] leading-[1.2] font-bold tracking-tight max-md:top-5 max-md:right-6 max-md:text-[6vw]"
>
	<span bind:this={firstEnd} class="inline-block">sebastiano</span>
	<span bind:this={lastEnd} class="inline-block">girotto</span>
</div>

<main class="relative h-[300vh]">
	<div class="sticky top-0 z-20 h-screen overflow-hidden">
		<Portrait
			delay={600}
			progress={range(0, 0.2)}
			class="absolute top-[55%] right-[8vw] -translate-y-1/2 text-[min(0.8vw,0.85vh)] leading-[1.1] max-md:right-6 max-md:text-[calc((100vw-3rem)/74)]"
		/>

		<p
			class={[
				'absolute right-[8vw] bottom-[8vw] text-[5.1vw] leading-none max-md:right-6 max-md:bottom-6 max-md:text-[6vw]',
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
			class={[
				'absolute inset-x-[8vw] top-[11vw] flex flex-col items-start gap-[3vw] max-md:inset-x-6 max-md:top-24 max-md:gap-6',
				progress === 0 && 'opacity-0'
			]}
		>
			<h2
				bind:this={title}
				class="text-[5.1vw] leading-none max-md:text-[9vw]"
				style:transform={move(offsets?.title, 1 - titleMove)}
				style:transform-origin={offsets?.title.origin}
				style:font-weight={400 + 300 * titleMove}
			>
				<span bind:this={titleAnchor}
					><MorphText from="full-stack" to="about me" progress={range(0.15, 0.6)} /></span
				>
			</h2>
			<p
				bind:this={body}
				class="w-[62vw] text-[2.2vw] leading-[1.45] max-md:w-auto max-md:text-[4.4vw]"
				style:transform={move(offsets?.body, 1 - bodyMove)}
				style:transform-origin={offsets?.body.origin}
			>
				<span bind:this={bodyAnchor}
					><MorphText from="developer" to={ABOUT} progress={range(0.25, 1)} /></span
				>
			</p>
			<p
				class="w-[62vw] self-end text-[2.2vw] leading-[1.45] max-md:w-auto max-md:self-auto max-md:text-[4.4vw]"
			>
				<MorphText
					from=""
					to={MUSIC}
					progress={range(0.5, 1)}
					links={{ nomorecho: 'https://nomorecho.com' }}
				/>
			</p>
		</section>

		<Warning
			text={SCROLL}
			bind:open={warningOpen}
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
		/>
	</div>
</main>
