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
	// room left between the text on the page and the codes flowing around it
	const TEXT_PADDING = 4;
	// how round the corners of the room around a line of text are
	const TEXT_RADIUS = 36;
	// distance over which the codes fade back in past the padding
	const TEXT_FADE = 30;
	// how softly the room around neighbouring lines melts together, filling inner corners
	const TEXT_BLEND = 12;

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
		// how much of each byte shows, 0 behind text and 1 away from it
		let visibility = new Float32Array(0);
		// sum of exp(-distance / TEXT_BLEND) from each byte to every line of text near it
		let field = new Float32Array(0);
		let textDirty = true;
		let w = 0;
		let h = 0;
		let cols = 0; // bytes per row
		let rows = 0;
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

		type Box = { left: number; top: number; right: number; bottom: number };

		// one box per line of visible text, made out of the boxes of its words and characters
		const textLines = () => {
			const lines: Box[] = [];
			const range = document.createRange();
			const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
			for (let node = walker.nextNode(); node; node = walker.nextNode()) {
				const parent = node.parentElement!;
				// screen reader text is clipped to a pixel but still lays out as one long line
				if (parent.closest('.sr-only')) continue;
				// also skips characters that are still waiting to be typed or morphed in
				if (!parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;

				range.selectNodeContents(node);
				for (const rect of range.getClientRects()) {
					if (rect.width <= 1 || rect.height <= 1) continue;
					const line = lines.find((line) => {
						const overlap = Math.min(line.bottom, rect.bottom) - Math.max(line.top, rect.top);
						const gap = Math.max(line.left, rect.left) - Math.min(line.right, rect.right);
						return overlap > rect.height / 2 && gap < rect.height / 2;
					});
					if (!line) {
						lines.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
						continue;
					}
					line.left = Math.min(line.left, rect.left);
					line.top = Math.min(line.top, rect.top);
					line.right = Math.max(line.right, rect.right);
					line.bottom = Math.max(line.bottom, rect.bottom);
				}
			}
			return lines;
		};

		// fades out the bytes near visible text, so the codes flow around it in a rounded, soft shape
		const coverText = () => {
			visibility.fill(1);
			if (!bytes.length) return;
			field.fill(0);

			// past this a line has no say in whether a byte shows
			const reach = TEXT_PADDING + TEXT_FADE + 4 * TEXT_BLEND;
			// distances are measured between the edges of a byte and of the text, not their centers
			const halfW = byteWidth / 2;
			const halfH = FONT_SIZE / 2;
			const touched: number[] = [];

			for (const line of textLines()) {
				const cx = (line.left + line.right) / 2;
				const cy = (line.top + line.bottom) / 2;
				const hx = (line.right - line.left) / 2 + halfW;
				const hy = (line.bottom - line.top) / 2 + halfH;
				const radius = Math.min(TEXT_RADIUS, hx, hy);

				const c0 = Math.max(0, Math.ceil((line.left - reach - byteWidth - offsetX) / stride));
				const c1 = Math.min(cols - 1, Math.floor((line.right + reach - offsetX) / stride));
				const r0 = Math.max(0, Math.ceil((line.top - reach - FONT_SIZE - offsetY) / ROW_HEIGHT));
				const r1 = Math.min(rows - 1, Math.floor((line.bottom + reach - offsetY) / ROW_HEIGHT));
				for (let r = r0; r <= r1; r++) {
					const qy = Math.abs(offsetY + r * ROW_HEIGHT + halfH - cy) - hy + radius;
					for (let c = c0; c <= c1; c++) {
						const qx = Math.abs(offsetX + c * stride + halfW - cx) - hx + radius;
						// signed distance to the line's box with rounded corners
						const dist =
							Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
						const i = r * cols + c;
						if (field[i] === 0) touched.push(i);
						// clamped so deep inside a huge heading it can't overflow
						field[i] += Math.exp(-Math.max(dist, -40) / TEXT_BLEND);
					}
				}
			}

			// a smooth minimum of the distances, which rounds off the corners where lines meet
			for (const i of touched) {
				const dist = -TEXT_BLEND * Math.log(field[i]);
				visibility[i] = smooth(Math.min(1, Math.max(0, (dist - TEXT_PADDING) / TEXT_FADE)));
			}
		};

		const draw = () => {
			if (textDirty) {
				textDirty = false;
				coverText();
			}
			ctx.clearRect(0, 0, w, h);
			ctx.fillStyle = color;
			const radius = BUBBLE_RADIUS * strength;

			for (let i = 0; i < bytes.length; i++) {
				if (!visibility[i]) {
					inside[i] = 0;
					continue;
				}
				ctx.globalAlpha = ALPHA * visibility[i];
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

			// css animations move text around without touching the dom, the endless ones (like the cursor blink) don't
			if (
				document
					.getAnimations()
					.some((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity)
			)
				textDirty = true;

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
			rows = Math.ceil(h / ROW_HEIGHT);
			offsetX = (w - cols * stride + gap) / 2;
			offsetY = (h - rows * ROW_HEIGHT) / 2;

			bytes = Array.from({ length: cols * rows }, byte);
			faces = new Array(bytes.length).fill(':3');
			inside = new Uint8Array(bytes.length);
			visibility = new Float32Array(bytes.length);
			field = new Float32Array(bytes.length);
			textDirty = true;
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

		// the animation loop picks this up on its own, with reduced motion the wall is redrawn once
		let pending = 0;
		const invalidate = () => {
			textDirty = true;
			if (reducedMotion.matches && !pending)
				pending = requestAnimationFrame(() => {
					pending = 0;
					draw();
				});
		};

		// text gets typed, morphed and moved around while scrolling
		const observer = new MutationObserver(invalidate);
		observer.observe(document.body, {
			subtree: true,
			childList: true,
			characterData: true,
			attributeFilter: ['class', 'style']
		});

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
		window.addEventListener('scroll', invalidate, { passive: true });
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onLeave);
		document.documentElement.addEventListener('pointerleave', onLeave);
		reducedMotion.addEventListener('change', sync);

		return () => {
			destroyed = true;
			cancelAnimationFrame(raf);
			cancelAnimationFrame(pending);
			observer.disconnect();
			window.removeEventListener('resize', layout);
			window.removeEventListener('scroll', invalidate);
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
