<script lang="ts">
	import { cn } from '#lib/utils.js';

	let {
		value = $bindable(50),
		min = 0,
		max = 100,
		step = 1,
		label,
		class: className
	}: {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		class?: string;
	} = $props();

	const pct = $derived(((value - min) / (max - min)) * 100);
</script>

<label class={cn('group/slider flex w-full flex-col gap-2', className)}>
	{#if label}<span class="type-label-lg text-on-surface-variant">{label}</span>{/if}
	<span class="relative flex h-10 items-center">
		<span class="absolute inset-x-0 h-4 rounded-m3-full bg-surface-container-highest" aria-hidden="true"></span>
		<span
			class="absolute left-0 h-4 rounded-m3-full bg-m3-primary"
			style:width="{pct}%"
			aria-hidden="true"
		></span>
		<span
			class="pointer-events-none absolute z-10 h-2 w-2 -translate-x-1/2 rounded-m3-full bg-m3-primary transition-[height,width] duration-spring-fast-spatial ease-spring-fast-spatial group-has-[:focus-visible]/slider:h-7 group-has-[:focus-visible]/slider:w-2 group-active/slider:h-7 group-active/slider:w-2"
			style:left="{pct}%"
			aria-hidden="true"
		></span>
		<input
			type="range"
			{min}
			{max}
			{step}
			bind:value
			aria-label={label}
			class="absolute inset-x-0 z-20 h-10 w-full cursor-pointer appearance-none bg-transparent"
		/>
	</span>
</label>

<style>
	input[type='range'] {
		outline: none;
	}
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 8px;
		height: 32px;
		border-radius: 9999px;
		background: transparent;
		cursor: grab;
	}
	input[type='range']::-moz-range-thumb {
		width: 8px;
		height: 32px;
		border: 0;
		border-radius: 9999px;
		background: transparent;
		cursor: grab;
	}
</style>
