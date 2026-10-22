<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { ShapeName } from '#lib/m3/shapes.js';
	import { cn } from '#lib/utils.js';
	import MorphingShape from './MorphingShape.svelte';

	/*
	 * From material-expressive-svelte (MIT, Oleg Polin): five library shapes in
	 * the container / accent roles, morphing on staggered cycles and floating.
	 */
	let { class: className }: { class?: string } = $props();

	type Blob = {
		id: string;
		shapes: ShapeName[];
		place: string;
		fill: string;
		delay: number;
		rotate: number;
		float: [number, number];
	};

	const BLOBS: Blob[] = [
		{
			id: 'big',
			shapes: ['cookie9Sided', 'sunny', 'flower', 'softBurst', 'cookie12Sided', 'puffy'],
			place: 'left-[2%] top-[8%] w-[62%]',
			fill: 'fill-primary-container',
			delay: 0,
			rotate: 40,
			float: [7, 14]
		},
		{
			id: 'tertiary',
			shapes: ['clover4Leaf', 'pill', 'gem', 'arch', 'cookie6Sided'],
			place: 'right-[2%] bottom-[4%] w-[44%]',
			fill: 'fill-tertiary-container',
			delay: 700,
			rotate: -30,
			float: [8.5, 12]
		},
		{
			id: 'secondary',
			shapes: ['pentagon', 'cookie4Sided', 'diamond', 'semiCircle', 'puffyDiamond'],
			place: 'right-[6%] top-[2%] w-[30%]',
			fill: 'fill-secondary-container',
			delay: 1400,
			rotate: 60,
			float: [6, 10]
		},
		{
			id: 'accent',
			shapes: ['circle', 'square', 'slanted', 'cookie7Sided', 'oval'],
			place: 'left-[10%] bottom-[8%] w-[20%]',
			fill: 'fill-m3-primary',
			delay: 2000,
			rotate: 90,
			float: [5.5, 9]
		},
		{
			id: 'spark',
			shapes: ['verySunny', 'softBoom', 'burst', 'clover8Leaf'],
			place: 'left-[46%] top-[56%] w-[13%]',
			fill: 'fill-tertiary',
			delay: 1000,
			rotate: -45,
			float: [6.5, 16]
		}
	];

	let visible = $state(true);

	const watchVisibility: Attachment<HTMLElement> = (node) => {
		const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
			rootMargin: '64px'
		});
		io.observe(node);
		return () => io.disconnect();
	};
</script>

<div
	aria-hidden="true"
	data-paused={!visible || undefined}
	class={cn('hero-shapes relative aspect-square w-full select-none', className)}
	{@attach watchVisibility}
>
	{#each BLOBS as blob (blob.id)}
		<div
			class={cn('float absolute', blob.place)}
			style:--float-duration="{blob.float[0]}s"
			style:--float-lift="-{blob.float[1]}px"
		>
			<MorphingShape
				shapes={blob.shapes}
				delay={blob.delay}
				rotateStep={blob.rotate}
				paused={!visible}
				class={cn('w-full', blob.fill)}
			/>
		</div>
	{/each}
</div>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.float {
			animation: float var(--float-duration) ease-in-out infinite alternate;
		}
		.hero-shapes[data-paused] .float {
			animation-play-state: paused;
		}
	}

	@keyframes float {
		from {
			translate: 0 0;
		}
		to {
			translate: 0 var(--float-lift);
		}
	}
</style>
