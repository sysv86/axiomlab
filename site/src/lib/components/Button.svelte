<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';
	import { ripple } from '#lib/m3/ripple.svelte.js';

	type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
	type Size = 'sm' | 'md' | 'lg';

	let {
		variant = 'filled',
		size = 'md',
		href,
		onclick,
		class: className,
		children,
		ariaLabel,
		disabled = false,
		type = 'button'
	}: {
		variant?: Variant;
		size?: Size;
		href?: string;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children?: Snippet;
		ariaLabel?: string;
		disabled?: boolean;
		type?: 'button' | 'submit';
	} = $props();

	const VARIANTS: Record<Variant, string> = {
		filled: 'bg-m3-primary text-on-primary hover:shadow-m3-1',
		tonal: 'bg-secondary-container text-on-secondary-container hover:shadow-m3-1',
		outlined: 'bg-transparent text-on-surface-variant shadow-[inset_0_0_0_1px_var(--md-sys-color-outline-variant)]',
		text: 'bg-transparent text-m3-primary',
		elevated: 'bg-surface-container-low text-m3-primary shadow-m3-1 hover:shadow-m3-2'
	};

	const SIZES: Record<Size, string> = {
		sm: 'h-10 px-4 gap-2 type-label-lg',
		md: 'h-14 px-6 gap-2.5 type-title-md',
		lg: 'h-20 px-9 gap-3 type-headline-sm'
	};

	const classes = $derived(
		cn(
			'group relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap no-underline select-none',
			'rounded-m3-full transition-[background-color,color,box-shadow,border-radius,translate]',
			'duration-spring-default-spatial ease-spring-default-spatial active:rounded-m3-lg active:translate-y-px',
			'disabled:pointer-events-none disabled:opacity-40',
			VARIANTS[variant],
			SIZES[size],
			className
		)
	);
</script>

{#if href}
	<a {href} class={classes} aria-label={ariaLabel} {onclick} {@attach ripple()}>
		{@render children?.()}
	</a>
{:else}
	<button {type} {disabled} class={classes} aria-label={ariaLabel} {onclick} {@attach ripple()}>
		{@render children?.()}
	</button>
{/if}
