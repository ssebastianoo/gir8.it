<script lang="ts">
	import TypeText from '#lib/TypeText.svelte';

	interface Props {
		text: string;
		open?: boolean;
		class?: string;
	}

	let { text, open = $bindable(true), class: className }: Props = $props();

	// figlet "banner3", 7 rows per letter
	// prettier-ignore
	const LETTERS: Record<string, string[]> = {
		S: [' ######  ', '##    ## ', '##       ', ' ######  ', '      ## ', '##    ## ', ' ######  '],
		C: [' ######  ', '##    ## ', '##       ', '##       ', '##       ', '##    ## ', ' ######  '],
		R: ['########  ', '##     ## ', '##     ## ', '########  ', '##   ##   ', '##    ##  ', '##     ## '],
		O: [' #######  ', '##     ## ', '##     ## ', '##     ## ', '##     ## ', '##     ## ', ' #######  '],
		L: ['##       ', '##       ', '##       ', '##       ', '##       ', '##       ', '######## '],
		'!': ['####', '####', '####', ' ## ', '    ', '####', '####']
	};

	const banner = (word: string) =>
		Array.from({ length: 7 }, (_, row) =>
			[...word]
				.map((letter) => LETTERS[letter][row])
				.join('')
				.replaceAll(' ', '.')
		).join('\n');

	const COMMAND = './scroll.sh';
	const COMMAND_DELAY = 400;
	const COMMAND_SPEED = 45;

	const BANNER = banner('SCROLL!');
	const BANNER_SPEED = 3;
	// a beat after the command is typed, as if enter was pressed
	const BANNER_DELAY = COMMAND_DELAY + COMMAND.length * COMMAND_SPEED + 350;

	const TEXT_DELAY = BANNER_DELAY + BANNER.length * BANNER_SPEED + 200;

	// crt switch-off: collapse to a horizontal line, then to a dot
	const powerOff = (_node: Element) => ({
		duration: 300,
		css: (t: number) =>
			`transform: scale(${Math.min(1, t * 2)}, ${Math.max(0.005, t * 2 - 1)}); opacity: ${Math.min(1, t * 3)}`
	});
</script>

{#if open}
	<section
		aria-label="warning"
		out:powerOff
		class={[
			'flex w-[46vw] animate-alert-in flex-col items-center gap-[1vw] border-2 border-t-[0.8vw] border-primary bg-background p-[1.2vw] shadow-[0_0_3vw] shadow-primary/15 motion-reduce:animate-none max-md:w-[88vw] max-md:gap-3 max-md:border-t-8 max-md:p-3',
			className
		]}
	>
		<p class="self-start text-[1.1vw] max-md:text-[2.6vw]">
			<span class="opacity-60">seb@gir8.it:~ $</span>
			<TypeText text={COMMAND} delay={COMMAND_DELAY} speed={COMMAND_SPEED} scramble={90} />
		</p>
		<div
			aria-hidden="true"
			class="text-[1.05vw] leading-[1.15] font-bold whitespace-nowrap max-md:text-[1.75vw]"
		>
			<TypeText text={BANNER} delay={BANNER_DELAY} speed={BANNER_SPEED} scramble={200} />
		</div>
		<p class="text-[1.25vw] leading-snug font-bold break-all max-md:text-[2.6vw]">
			<TypeText {text} delay={TEXT_DELAY} speed={10} scramble={250} cursor />
		</p>
	</section>
{/if}
