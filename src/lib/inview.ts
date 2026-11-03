import type { Attachment } from 'svelte/attachments';

// calls `onenter` the first time the element scrolls into view
export const inview =
	(onenter: () => void, threshold = 0.3): Attachment<HTMLElement> =>
	(node) => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				onenter();
				observer.disconnect();
			},
			{ threshold }
		);
		observer.observe(node);

		return () => observer.disconnect();
	};
