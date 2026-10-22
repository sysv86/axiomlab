<script lang="ts">
	import { cn } from '#lib/utils.js';

	let {
		checked = $bindable(false),
		id,
		label,
		class: className
	}: {
		checked?: boolean;
		id?: string;
		label?: string;
		class?: string;
	} = $props();
</script>

<button
	{id}
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	class={cn(
		'group relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-m3-full border-2 transition-colors duration-spring-fast-effects',
		checked
			? 'border-m3-primary bg-m3-primary'
			: 'border-outline bg-surface-container-highest',
		className
	)}
	onclick={() => (checked = !checked)}
>
	<span
		aria-hidden="true"
		class={cn(
			'absolute top-1/2 -translate-y-1/2 rounded-m3-full transition-all duration-spring-fast-spatial ease-spring-fast-spatial',
			checked
				? 'left-[calc(100%-26px)] h-6 w-6 bg-on-primary'
				: 'left-[6px] h-4 w-4 bg-outline group-hover:bg-on-surface-variant'
		)}
	></span>
</button>
