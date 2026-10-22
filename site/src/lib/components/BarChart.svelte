<script lang="ts">
	import { cn } from '#lib/utils.js';

	let {
		rows,
		max,
		unit = '',
		decimals = 2,
		class: className
	}: {
		rows: Array<{ label: string; value: number; highlight?: boolean }>;
		max?: number;
		unit?: string;
		decimals?: number;
		class?: string;
	} = $props();

	const top = $derived(max ?? Math.max(...rows.map((r) => r.value), 1e-9));
</script>

<ul class={cn('flex flex-col gap-2.5', className)}>
	{#each rows as row (row.label)}
		<li class="grid grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] items-center gap-3">
			<span class="truncate type-body-sm text-on-surface-variant" title={row.label}>{row.label}</span>
			<span class="h-2.5 overflow-hidden rounded-m3-full bg-surface-container-highest">
				<span
					class={cn(
						'block h-full rounded-m3-full transition-[width] duration-spring-slow-spatial ease-spring-slow-spatial',
						row.highlight ? 'bg-m3-primary' : 'bg-outline'
					)}
					style:width="{(row.value / top) * 100}%"
				></span>
			</span>
			<span class="w-14 text-end font-mono text-xs tabular-nums text-on-surface">
				{row.value.toFixed(decimals)}{unit}
			</span>
		</li>
	{/each}
</ul>
