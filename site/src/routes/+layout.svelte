<script lang="ts">
	import './layout.css';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		BarChart3,
		BookOpen,
		FlaskConical,
		Code2,
		Home,
		Moon,
		Sun
	} from '@lucide/svelte';
	import { theme } from '#lib/m3/theme.svelte.js';
	import { shapePath } from '#lib/m3/shapes.js';
	import { DURATION, EASING } from '#lib/m3/motion.js';
	import { ripple } from '#lib/m3/ripple.svelte.js';
	import { cn } from '#lib/utils.js';
	import googleSansFont from '#lib/assets/fonts/google-sans-flex-latin.woff2?url';
	import robotoFlexFont from '#lib/assets/fonts/roboto-flex-latin.woff2?url';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const fontCss = `
@font-face {
	font-family: 'Google Sans Flex Variable';
	font-style: normal;
	font-display: swap;
	font-weight: 1 1000;
	font-stretch: 25% 151%;
	src: url('${googleSansFont}') format('woff2-variations');
}
@font-face {
	font-family: 'Roboto Flex Variable';
	font-style: normal;
	font-display: swap;
	font-weight: 100 1000;
	font-stretch: 25% 151%;
	src: url('${robotoFlexFont}') format('woff2-variations');
}`;

	const DESTINATIONS = [
		{ href: resolve('/'), label: 'Home', icon: Home },
		{ href: resolve('/playground'), label: 'Playground', icon: FlaskConical },
		{ href: resolve('/benchmarks'), label: 'Benchmarks', icon: BarChart3 },
		{ href: resolve('/docs'), label: 'API', icon: BookOpen }
	];

	const path = $derived(page.url.pathname.replace(/\/$/, '') || '/');
	const current = $derived.by(() => {
		let best = '';
		for (const d of DESTINATIONS) {
			const target = new URL(d.href, 'https://x').pathname.replace(/\/$/, '') || '/';
			const hit = target === '/' ? path === '/' : path === target || path.startsWith(`${target}/`);
			if (hit && d.href.length > best.length) best = d.href;
		}
		return best;
	});

	onMount(() => {
		theme.restore();
		theme.apply();
	});

	$effect(() => {
		// Track the derived color map so every seed / mode change is written.
		theme.colors;
		theme.apply();
		theme.persist();
	});

	let mainEl = $state<HTMLElement | null>(null);

	onNavigate((navigation) => {
		if (!document.startViewTransition || document.visibilityState === 'hidden') return;
		const from = navigation.from?.url.pathname;
		const to = navigation.to?.url.pathname;
		if (!from || !to || from === to) return;

		const root = document.documentElement;
		return new Promise<void>((resolveTransition) => {
			root.dataset.pageTransition = '';
			const transition = document.startViewTransition(async () => {
				resolveTransition();
				await navigation.complete.catch(() => {});
			});
			transition.ready.then(() => fadeThrough(root)).catch(() => {});
			transition.finished.catch(() => {}).finally(() => delete root.dataset.pageTransition);
		});
	});

	function fadeThrough(root: HTMLElement) {
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const timing: KeyframeAnimationOptions = { duration: DURATION.long1, easing: EASING.emphasized, fill: 'both' };
		const offset = [0, 0.35, 1];
		root.animate({ opacity: [1, 0, 0], offset }, { ...timing, pseudoElement: '::view-transition-old(page)' });
		root.animate(
			reduce ? { opacity: [0, 0, 1], offset } : { opacity: [0, 0, 1], scale: [0.92, 0.92, 1], offset },
			{ ...timing, pseudoElement: '::view-transition-new(page)' }
		);
	}

	afterNavigate(({ from, to, type }) => {
		if (type === 'enter' || !from || !to || to.url.hash) return;
		if (from.url.pathname === to.url.pathname) return;
		const target = mainEl?.querySelector<HTMLElement>('h1') ?? mainEl;
		if (!target) return;
		if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
		target.focus({ preventScroll: true });
	});
</script>

<svelte:head>
	<title>AxiomLab — perceptual color, closed form</title>
	<link rel="preload" href={googleSansFont} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={robotoFlexFont} as="font" type="font/woff2" crossorigin="anonymous" />
	{@html `<style>${fontCss}</style>`}
</svelte:head>

<a
	href="#main-content"
	class="type-label-lg fixed start-4 top-4 z-[60] inline-flex h-12 -translate-y-[calc(100%+32px)] items-center rounded-m3-full bg-m3-primary px-6 text-on-primary shadow-m3-3 transition-[translate] duration-spring-fast-spatial ease-spring-fast-spatial focus:translate-y-0"
>
	Skip to content
</a>

<div class="flex min-h-dvh bg-surface text-on-surface">
	<!-- desktop navigation rail -->
	<aside class="sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-outline-variant bg-surface-container-low min-[840px]:flex min-[1200px]:w-64 w-20">
		<a
			href={resolve('/')}
			class="flex h-20 items-center gap-3 px-5 text-on-surface"
			aria-label="AxiomLab home"
			{@attach ripple()}
		>
			<svg viewBox="0 0 100 100" aria-hidden="true" class="size-9 shrink-0 fill-m3-primary">
				<path d={shapePath('cookie9Sided')} />
			</svg>
			<span class="type-title-lg-emphasized hidden min-[1200px]:block">AxiomLab</span>
		</a>


		<nav class="flex flex-1 flex-col gap-1 px-3 pt-4" aria-label="Primary">
			{#each DESTINATIONS as d (d.href)}
				<a
					href={d.href}
					aria-current={current === d.href ? 'page' : undefined}
					class={cn(
						'group relative flex h-14 items-center gap-3 rounded-m3-full px-4 type-label-lg transition-colors',
						current === d.href
							? 'bg-secondary-container text-on-secondary-container'
							: 'text-on-surface-variant hover:bg-on-surface/10'
					)}
					{@attach ripple()}
				>
					<d.icon size={22} class="shrink-0" />
					<span class="hidden min-[1200px]:block">{d.label}</span>
				</a>
			{/each}
		</nav>

		<div class="flex flex-col gap-2 px-3 pb-5">
			<a
				href="https://github.com/sysv86/axiomlab"
				target="_blank"
				rel="noopener noreferrer"
				class="flex h-12 items-center gap-3 rounded-m3-full px-4 type-label-lg text-on-surface-variant hover:bg-on-surface/10"
				{@attach ripple()}
			>
				<Code2 size={20} class="shrink-0" />
				<span class="hidden min-[1200px]:block">GitHub</span>
			</a>
			<button
				type="button"
				class="flex h-12 w-full cursor-pointer items-center gap-3 rounded-m3-full px-4 type-label-lg text-on-surface-variant hover:bg-on-surface/10"
				onclick={() => theme.toggleDark()}
				aria-label={theme.dark ? 'Use light theme' : 'Use dark theme'}
				{@attach ripple()}
			>
				{#if theme.dark}<Sun size={20} class="shrink-0" />{:else}<Moon size={20} class="shrink-0" />{/if}
				<span class="hidden min-[1200px]:block">{theme.dark ? 'Light theme' : 'Dark theme'}</span>
			</button>
		</div>
	</aside>

	<div class="flex min-w-0 flex-1 flex-col">
		<!-- mobile top app bar -->
		<header class="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-outline-variant bg-surface/90 px-4 backdrop-blur min-[840px]:hidden">
			<a href={resolve('/')} class="flex items-center gap-2.5 text-on-surface">
				<svg viewBox="0 0 100 100" aria-hidden="true" class="size-8 fill-m3-primary">
					<path d={shapePath('cookie9Sided')} />
				</svg>
				<span class="type-title-lg-emphasized">AxiomLab</span>
			</a>
			<div class="flex items-center gap-1">
				<button
					type="button"
					class="grid size-12 cursor-pointer place-items-center rounded-m3-full text-on-surface-variant hover:bg-on-surface/10"
					onclick={() => theme.toggleDark()}
					aria-label={theme.dark ? 'Use light theme' : 'Use dark theme'}
				>
					{#if theme.dark}<Sun size={22} />{:else}<Moon size={22} />{/if}
				</button>
			</div>
		</header>

		<main id="main-content" bind:this={mainEl} tabindex="-1" class="flex min-w-0 flex-1 flex-col outline-none">
			<div data-page-transition-target class="flex min-w-0 flex-1 flex-col">
				{@render children()}
			</div>
		</main>

		<!-- mobile navigation bar -->
		<nav
			class="sticky bottom-0 z-30 flex h-20 items-stretch justify-around border-t border-outline-variant bg-surface-container pb-[env(safe-area-inset-bottom)] min-[840px]:hidden"
			aria-label="Primary"
		>
			{#each DESTINATIONS as d (d.href)}
				<a
					href={d.href}
					aria-current={current === d.href ? 'page' : undefined}
					class="flex flex-1 flex-col items-center justify-center gap-1 rounded-m3-lg text-on-surface-variant"
					{@attach ripple()}
				>
					<span
						class={cn(
							'grid h-8 w-16 place-items-center rounded-m3-full transition-colors',
							current === d.href ? 'bg-secondary-container text-on-secondary-container' : ''
						)}
					>
						<d.icon size={22} />
					</span>
					<span class="type-label-sm">{d.label}</span>
				</a>
			{/each}
		</nav>
	</div>
</div>

<style>
	main :global(h1[tabindex='-1']:focus) {
		outline: none;
	}

	:global {
		:root[data-page-transition] [data-page-transition-target] {
			view-transition-name: page;
		}
		::view-transition-old(root),
		::view-transition-new(root),
		::view-transition-group(page),
		::view-transition-old(page),
		::view-transition-new(page) {
			animation: none;
		}
		::view-transition-new(page) {
			transform-origin: 50% min(40vh, 50%);
		}
	}
</style>
