<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { prefersReducedMotion } from 'svelte/motion';
	import { cn } from '#lib/utils.js';
	import { morphPath, type ShapeName } from '#lib/m3/shapes.js';
	import { activeSpring, animateSpring } from '#lib/m3/motion.js';

	/*
	 * From material-expressive-svelte (MIT, Oleg Polin): a decorative shape that
	 * keeps morphing through `shapes` on the slow-spatial spring.
	 */
	let {
		shapes,
		interval = 2500,
		delay = 0,
		rotateStep = 45,
		paused = false,
		class: className
	}: {
		shapes: ShapeName[];
		interval?: number;
		delay?: number;
		rotateStep?: number;
		paused?: boolean;
		class?: string;
	} = $props();

	let index = $state(0);
	let progress = $state(0);

	const from = $derived(shapes[index % shapes.length]);
	const to = $derived(shapes[(index + 1) % shapes.length]);
	const d = $derived(morphPath(from, to, progress, 100, 1));
	const rotation = $derived((index + progress) * rotateStep);

	const cycle: Attachment<SVGSVGElement> = (node) => {
		if (paused || prefersReducedMotion.current || shapes.length < 2) return;

		let cancel: (() => void) | undefined;
		let timer: ReturnType<typeof setTimeout>;

		const step = () => {
			cancel?.();
			cancel = animateSpring(progress, 1, activeSpring('slow-spatial', node), (v) => (progress = v), {
				onComplete: () => {
					index += 1;
					progress = 0;
				}
			});
			timer = setTimeout(step, interval);
		};

		timer = setTimeout(step, untrack(() => progress) > 0 ? 0 : delay);
		return () => {
			clearTimeout(timer);
			cancel?.();
		};
	};
</script>

<svg
	viewBox="0 0 100 100"
	aria-hidden="true"
	focusable="false"
	class={cn('block overflow-visible', className)}
	style:rotate="{rotation}deg"
	{@attach cycle}
>
	<path {d} />
</svg>
