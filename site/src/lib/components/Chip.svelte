<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Check } from '@lucide/svelte';
	import { cn } from '#lib/utils.js';
	import { ripple } from '#lib/m3/ripple.svelte.js';

	let {
		selected = $bindable(false),
		onclick,
		class: className,
		children,
		ariaLabel
	}: {
		selected?: boolean;
		onclick?: () => void;
		class?: string;
		children?: Snippet;
		ariaLabel?: string;
	} = $props();
</script>

<button
	type="button"
	aria-pressed={selected}
	aria-label={ariaLabel}
	class={cn(
		'relative inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-m3-sm px-4 type-label-lg transition-[background-color,color,border-radius,box-shadow]',
		'duration-spring-fast-spatial ease-spring-fast-spatial',
		selected
			? 'rounded-m3-lg bg-secondary-container text-on-secondary-container shadow-none'
			: 'bg-transparent text-on-surface-variant shadow-[inset_0_0_0_1px_var(--md-sys-color-outline-variant)] hover:bg-on-surface/5',
		className
	)}
	onclick={() => {
		selected = !selected;
		onclick?.();
	}}
	{@attach ripple()}
>
	{#if selected}
		<Check size={16} strokeWidth={2.5} aria-hidden="true" />
	{/if}
	{@render children?.()}
</button>
