<script lang="ts">
	import { Check, Copy } from '@lucide/svelte';
	import { cn } from '#lib/utils.js';

	let {
		code,
		language = 'javascript',
		title,
		class: className
	}: {
		code: string;
		language?: string;
		title?: string;
		class?: string;
	} = $props();

	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			// clipboard unavailable
		}
	}
</script>

<div class={cn('overflow-hidden rounded-m3-lg bg-inverse-surface text-inverse-on-surface', className)}>
	<div class="flex items-center justify-between border-b border-white/10 px-4 py-2">
		<span class="type-label-md text-inverse-on-surface/70">{title ?? language}</span>
		<button
			type="button"
			class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-m3-full px-3 type-label-md text-inverse-on-surface/80 transition-colors hover:bg-white/10 hover:text-inverse-on-surface"
			onclick={copy}
		>
			{#if copied}<Check size={16} /> Copied{:else}<Copy size={16} /> Copy{/if}
		</button>
	</div>
	<pre class="overflow-x-auto p-4 text-[13px] leading-relaxed"><code>{code}</code></pre>
</div>
