<script lang="ts">
	import { inview } from '#lib/inview.ts';

	const WORKS = [
		{
			title: 'planum',
			date: 'sep 2026 – present',
			description:
				'designing and developing modern web applications to automate internal business processes, streamline workflows, and improve operational efficiency through ai integrations.',
			stack: [
				'typescript',
				'sveltekit',
				'postgresql',
				'drizzle orm',
				'anthropic sdk',
				'openai api',
				'dropbox',
				'cloudflare'
			]
		},
		{
			title: 't&m logistica integrata',
			date: 'aug 2025 – mar 2026',
			description:
				'developed the frontend of a web-based logistics management platform, focusing on intuitive interfaces and efficient workflows for truck and warehouse operations.',
			stack: ['figma', 'sveltekit', 'cloudflare']
		},
		{
			title: 'clarity',
			date: 'apr 2025 – feb 2026',
			description:
				'designed and developed an ai-powered crm for insurance agents, featuring client management, sales pipelines, workflow automation, and intelligent business tools.',
			stack: [
				'typescript',
				'sveltekit',
				'postgresql',
				'drizzle orm',
				'stripe',
				'openai api',
				'tailwind css',
				'cloudflare'
			]
		},
		{
			title: 'm4ss',
			date: 'jul 2023 – nov 2023',
			description:
				'worked as a frontend developer, designing and implementing responsive web interfaces for iot products, with a focus on usability and real-time data visualization.',
			stack: ['sveltekit', 'javascript', 'html', 'css', 'ui/ux design']
		}
	];

	let seen = $state<boolean[]>([]);
</script>

<!-- the "work" title is the about title, turned into it by the hero's scroll -->
<section
	class="relative -mt-[calc(100vh-24*var(--u))] px-[calc(var(--gutter)+8*var(--u))] pb-[calc(20*var(--u))] max-md:-mt-[calc(100vh-12rem)] max-md:px-6 max-md:pb-24"
>
	<ol class="relative flex flex-col gap-[calc(9*var(--u))] max-md:gap-14">
		<!-- the roadmap -->
		<span
			aria-hidden="true"
			class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-primary/30 max-md:left-1.5"
		></span>

		{#each WORKS as work, i (work.title)}
			{@const flip = i % 2 === 1}
			<li
				{@attach inview(() => (seen[i] = true), 0.15)}
				class={[
					'relative grid grid-cols-2 gap-x-[calc(7*var(--u))] transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none max-md:grid-cols-1 max-md:gap-y-5 max-md:pl-8',
					seen[i] ? 'opacity-100' : 'translate-y-6 opacity-0'
				]}
			>
				<span
					aria-hidden="true"
					class="absolute top-[calc(1.2*var(--u))] left-1/2 size-[calc(0.7*var(--u))] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary max-md:top-[0.6em] max-md:left-1.5 max-md:size-2"
				></span>

				<div
					class={[
						'flex flex-col gap-[calc(0.6*var(--u))] max-md:col-start-1 max-md:row-start-1 max-md:items-start max-md:text-left',
						flip ? 'col-start-2 row-start-1 items-start text-left' : 'items-end text-right'
					]}
				>
					<h3 class="text-[calc(2.6*var(--u))] leading-tight font-bold max-md:text-[6vw]">
						{work.title}
					</h3>
					<p class="text-[calc(1.4*var(--u))] leading-[1.5] text-primary/60 max-md:text-[3.6vw]">
						{work.stack.join(', ')}
					</p>
				</div>

				<div
					class={[
						'flex flex-col gap-[calc(0.8*var(--u))] max-md:col-start-1 max-md:row-start-2 max-md:items-start max-md:text-left',
						flip ? 'col-start-1 row-start-1 items-end text-right' : 'items-start text-left'
					]}
				>
					<p class="text-[calc(1.4*var(--u))] leading-tight text-primary/60 max-md:text-[3.6vw]">
						{work.date}
					</p>
					<p class="text-[calc(1.7*var(--u))] leading-[1.5] max-md:text-[4vw]">
						{work.description}
					</p>
				</div>
			</li>
		{/each}
	</ol>
</section>
