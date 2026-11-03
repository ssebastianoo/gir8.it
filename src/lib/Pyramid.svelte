<script module lang="ts">
	// size of the character grid the pyramid is drawn on
	export const COLS = 40;
	export const ROWS = 18;
	// line height, as a multiple of the font size
	export const LINE_HEIGHT = 1.1;
	// width of a character, as a multiple of the font size
	export const CHAR_WIDTH = 0.6;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		// only spins while true
		active?: boolean;
	}

	let { active = true, ...rest }: Props = $props();

	// radians per ms
	const SPIN = 0.0009;
	const FRAME_MS = 1000 / 24;
	// how far it leans to the right, and how much of its top shows
	const LEAN = 0.35;
	const PITCH = 0.2;
	// grid rows per unit of the model
	const SCALE = ROWS / 2.5;
	// a row is taller than a column is wide
	const ASPECT = LINE_HEIGHT / CHAR_WIDTH;

	// darkest to lightest, the same ramp as the portrait
	const RAMP = '.:-=+*#%@';
	const LIGHT = norm([-0.5, 0.7, 0.8]);

	type Vec = [number, number, number];

	function norm([x, y, z]: Vec): Vec {
		const length = Math.hypot(x, y, z);
		return [x / length, y / length, z / length];
	}
	const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
	const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	const cross = (a: Vec, b: Vec): Vec => [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	];

	const APEX: Vec = [0, 1, 0];
	const BASE: Vec[] = [
		[-1, -0.8, -1],
		[1, -0.8, -1],
		[1, -0.8, 1],
		[-1, -0.8, 1]
	];
	const CENTER: Vec = [0, -0.2, 0];
	// four sides and the two halves of the bottom
	const FACES: [Vec, Vec, Vec][] = [
		[APEX, BASE[0], BASE[1]],
		[APEX, BASE[1], BASE[2]],
		[APEX, BASE[2], BASE[3]],
		[APEX, BASE[3], BASE[0]],
		[BASE[0], BASE[1], BASE[2]],
		[BASE[0], BASE[2], BASE[3]]
	];

	// spins around its own axis, tips towards the viewer, then leans to the right
	const rotate = ([x, y, z]: Vec, angle: number): Vec => {
		const [sy, cy] = [Math.sin(angle), Math.cos(angle)];
		const [x1, z1] = [x * cy + z * sy, -x * sy + z * cy];
		const [sp, cp] = [Math.sin(PITCH), Math.cos(PITCH)];
		const [y2, z2] = [y * cp - z1 * sp, y * sp + z1 * cp];
		const [sl, cl] = [Math.sin(LEAN), Math.cos(LEAN)];
		return [x1 * cl + y2 * sl, -x1 * sl + y2 * cl, z2];
	};

	const draw = (angle: number) => {
		const depth = new Float32Array(COLS * ROWS).fill(-Infinity);
		const cells = new Array<string>(COLS * ROWS).fill(' ');
		const center = rotate(CENTER, angle);

		for (const face of FACES) {
			const [a, b, c] = face.map((vertex) => rotate(vertex, angle));
			let normal = norm(cross(sub(b, a), sub(c, a)));
			const middle: Vec = [
				(a[0] + b[0] + c[0]) / 3,
				(a[1] + b[1] + c[1]) / 3,
				(a[2] + b[2] + c[2]) / 3
			];
			if (dot(normal, sub(middle, center)) < 0) normal = [-normal[0], -normal[1], -normal[2]];
			// turned away from the viewer
			if (normal[2] <= 0) continue;

			const shade = 0.15 + 0.85 * Math.max(0, dot(normal, LIGHT));
			const char = RAMP[Math.min(RAMP.length - 1, Math.floor(shade * RAMP.length))];

			const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
			if (Math.abs(area) < 1e-6) continue;

			for (let r = 0; r < ROWS; r++) {
				const y = -(r + 0.5 - ROWS / 2) / SCALE;
				for (let col = 0; col < COLS; col++) {
					const x = (col + 0.5 - COLS / 2) / (SCALE * ASPECT);
					const wa = ((b[0] - x) * (c[1] - y) - (c[0] - x) * (b[1] - y)) / area;
					const wb = ((c[0] - x) * (a[1] - y) - (a[0] - x) * (c[1] - y)) / area;
					const wc = 1 - wa - wb;
					if (wa < 0 || wb < 0 || wc < 0) continue;
					const z = wa * a[2] + wb * b[2] + wc * c[2];
					const i = r * COLS + col;
					if (z <= depth[i]) continue;
					depth[i] = z;
					cells[i] = char;
				}
			}
		}

		// leading spaces become an indent, so the hex wall flows around the silhouette
		return Array.from({ length: ROWS }, (_, r) => {
			const row = cells.slice(r * COLS, (r + 1) * COLS).join('');
			const text = row.trim();
			return { indent: row.length - row.trimStart().length, text };
		});
	};

	let angle = $state(0.6);
	const rows = $derived(draw(angle));

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let raf = 0;
		let last = 0;
		let before = 0;
		const tick = (now: number) => {
			raf = requestAnimationFrame(tick);
			if (!active) {
				before = 0;
				return;
			}
			if (now - last < FRAME_MS) return;
			angle += (now - (before || now)) * SPIN;
			before = last = now;
		};
		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	});
</script>

<div aria-hidden="true" {...rest}>
	{#each rows as { indent, text }, r (r)}
		<div class="h-[1.1em] whitespace-pre" style:padding-left="{indent}ch">{text}</div>
	{/each}
</div>
