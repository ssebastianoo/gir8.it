<script lang="ts">
	import { onMount } from 'svelte';

	const FONT_SIZE = 14;
	const ROW_HEIGHT = 22;
	const TICK_MS = 60;
	// fraction of the tuplets that change on every tick
	const CHURN = 0.025;

	const ALPHA = 0.12;
	const BUBBLE_RADIUS = 80;
	// fraction of its distance to the cursor a code travels at the very center of the field
	const BUBBLE_PULL = 0.55;

	let canvas: HTMLCanvasElement;

	const byte = () =>
		Math.floor(Math.random() * 256)
			.toString(16)
			.padStart(2, '0');

	// all of them are 2 characters wide, so they fit where a byte was
	const FACES = [':3', 'hi', '<3', ':p', ':)', ':D', 'xD', ';)'];
	const face = () => FACES[Math.floor(Math.random() * FACES.length)];

	const smooth = (t: number) => t * t * (3 - 2 * t);

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

		// flat list of bytes, every 4 consecutive ones make up a tuplet
		let bytes: string[] = [];
		// what each byte turns into while it is inside the field, picked when it enters
		let faces: string[] = [];
		let inside = new Uint8Array(0);
		let w = 0;
		let h = 0;
		let cols = 0; // bytes per row
		let stride = 0; // distance between two bytes
		let byteWidth = 0;
		let offsetX = 0;
		let offsetY = 0;
		let color = '';

		// bubble state: `mx`/`my` follow the pointer (`tx`/`ty`), `strength` fades in and out
		let tx = 0;
		let ty = 0;
		let mx = 0;
		let my = 0;
		let strength = 0;
		let active = false;

		let raf = 0;
		let last = 0;
		let acc = 0;

		const draw = () => {
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = color;
			const radius = BUBBLE_RADIUS * strength;

			ctx.globalAlpha = ALPHA;
			for (let i = 0; i < bytes.length; i++) {
				const x = offsetX + (i % cols) * stride;
				const y = offsetY + Math.floor(i / cols) * ROW_HEIGHT;

				if (radius > 0) {
					const dx = x + byteWidth / 2 - mx;
					const dy = y + FONT_SIZE / 2 - my;
					const dist = Math.hypot(dx, dy);
					if (dist < radius) {
						const ease = smooth(1 - dist / radius);
						// the closer a code is, the harder it is pulled towards the cursor
						const pull = BUBBLE_PULL * strength * ease;
						if (!inside[i]) {
							inside[i] = 1;
							faces[i] = face();
						}
						ctx.fillText(faces[i], x - dx * pull, y - dy * pull);
						continue;
					}
				}
				inside[i] = 0;
				ctx.fillText(bytes[i], x, y);
			}

			ctx.globalAlpha = 1;
		};

		const churn = () => {
			const tuplets = bytes.length / 4;
			const count = Math.max(1, Math.floor(tuplets * CHURN));
			for (let n = 0; n < count; n++) {
				const t = Math.floor(Math.random() * tuplets) * 4;
				for (let b = 0; b < 4; b++) bytes[t + b] = byte();
			}
		};

		const frame = (now: number) => {
			const dt = Math.min(now - last, 100);
			last = now;

			acc += dt;
			while (acc >= TICK_MS) {
				acc -= TICK_MS;
				if (bytes.length) churn();
			}

			mx += (tx - mx) * (1 - Math.exp(-dt / 70));
			my += (ty - my) * (1 - Math.exp(-dt / 70));
			strength += ((active ? 1 : 0) - strength) * (1 - Math.exp(-dt / 120));
			if (strength < 0.001) strength = 0;

			draw();
			raf = requestAnimationFrame(frame);
		};

		const layout = () => {
			const dpr = window.devicePixelRatio || 1;
			w = window.innerWidth;
			h = window.innerHeight;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			ctx.font = `${FONT_SIZE}px ${getComputedStyle(canvas).fontFamily}`;
			color = getComputedStyle(document.documentElement).color;
			ctx.textBaseline = 'top';

			// one space between bytes, and between tuplets
			byteWidth = ctx.measureText('00').width;
			const gap = ctx.measureText(' ').width;
			stride = byteWidth + gap;

			const tupletWidth = stride * 4;
			cols = Math.ceil(w / tupletWidth) * 4;
			const rows = Math.ceil(h / ROW_HEIGHT);
			offsetX = (w - cols * stride + gap) / 2;
			offsetY = (h - rows * ROW_HEIGHT) / 2;

			bytes = Array.from({ length: cols * rows }, byte);
			faces = new Array(bytes.length).fill(':3');
			inside = new Uint8Array(bytes.length);
			draw();
		};

		const onMove = (e: PointerEvent) => {
			tx = e.clientX;
			ty = e.clientY;
			if (!active && strength === 0) {
				mx = tx;
				my = ty;
			}
			active = true;
			if (reducedMotion.matches) {
				mx = tx;
				my = ty;
				strength = 1;
				draw();
			}
		};

		const onLeave = () => {
			active = false;
			if (reducedMotion.matches) {
				strength = 0;
				draw();
			}
		};

		const onUp = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') onLeave();
		};

		const sync = () => {
			cancelAnimationFrame(raf);
			if (reducedMotion.matches) return;
			last = performance.now();
			raf = requestAnimationFrame(frame);
		};

		let destroyed = false;
		// measure with the real font, not the fallback
		document.fonts.load(`${FONT_SIZE}px ${getComputedStyle(canvas).fontFamily}`).then(() => {
			if (!destroyed) layout();
		});
		sync();
		window.addEventListener('resize', layout);
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onLeave);
		document.documentElement.addEventListener('pointerleave', onLeave);
		reducedMotion.addEventListener('change', sync);

		return () => {
			destroyed = true;
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', layout);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onLeave);
			document.documentElement.removeEventListener('pointerleave', onLeave);
			reducedMotion.removeEventListener('change', sync);
		};
	});
</script>

<canvas
	bind:this={canvas}
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 -z-10 size-full font-mono"
></canvas>
