<script lang="ts">
	import { ArrowRight, ArrowUpRight, Check, Code2, FlaskConical, Gauge, Palette, Sparkles } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import HeroShapes from '#lib/components/HeroShapes.svelte';
	import Button from '#lib/components/Button.svelte';
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import Playground from '#lib/components/Playground.svelte';
	import { axiom } from '#lib/color-metrics.js';
	import { shapePath } from '#lib/m3/shapes.js';
	import results from '#lib/data/results.json';
	import { ripple } from '#lib/m3/ripple.svelte.js';

	const gen = (results as any).generation;
	const neutralMax = Number(gen.neutral_max_C).toExponential(2);
	const roundTrip = Number(gen.max_rt_xyz_srgb).toExponential(2);

	const heroFacts = [
		{ icon: Gauge, label: '18.18 Mean7 STRESS' },
		{ icon: Sparkles, label: '0.03% ideal arc CV' },
		{ icon: Check, label: `${roundTrip} XYZ round-trip` },
		{ icon: Code2, label: '1e-15 Python ↔ JS parity' }
	];

	const grays = Array.from({ length: 9 }, (_, i) => {
		const hex = axiom.sRGBToHex([i / 8, i / 8, i / 8]);
		return { hex, L: axiom.fromHex(hex)[0] };
	});

	const quickstart = `import axiomlab as ax

lab = ax.from_hex("#3b82f6")          # (L, a, b)
lch = ax.to_LCh(lab)                  # (L, C, h)
de  = ax.difference("#ff0055", "#00aa88")
mid = ax.mix("#0000ff", "#ffffff", 0.5, metric_step=True)
ramp = ax.gradient("#0000ff", "#ffffff", 16, metric_step=True)`;

	const FOOTER = [
		{ href: resolve('/'), label: 'Home' },
		{ href: resolve('/playground'), label: 'Playground' },
		{ href: resolve('/benchmarks'), label: 'Benchmarks' },
		{ href: resolve('/docs'), label: 'API' }
	];

	const tiles = [
		{
			href: '#playground',
			title: 'Playground',
			body: 'The two color pickers above drive every metric and every gradient — and the page theme itself.',
			shape: 'cookie9Sided' as const,
			container: 'bg-primary-container text-on-primary-container',
			badge: 'fill-m3-primary',
			arrow: 'bg-m3-primary text-on-primary',
			icon: FlaskConical
		},
		{
			href: resolve('/benchmarks'),
			title: 'Benchmarks',
			body: 'STRESS on 10,486 pairs, ablation, COMBVD cross-check, gradient uniformity and a live speed test.',
			shape: 'clover4Leaf' as const,
			container: 'bg-secondary-container text-on-secondary-container',
			badge: 'fill-m3-secondary',
			arrow: 'bg-m3-secondary text-on-secondary',
			icon: Gauge
		},
		{
			href: resolve('/docs'),
			title: 'API',
			body: 'Python and JavaScript quick start, the full function surface, the math, and how to reproduce every number.',
			shape: 'sunny' as const,
			container: 'bg-tertiary-container text-on-tertiary-container',
			badge: 'fill-tertiary',
			arrow: 'bg-tertiary text-on-tertiary',
			icon: Code2
		}
	];
</script>

<svelte:head>
	<title>AxiomLab — perceptual color, closed form</title>
</svelte:head>

<!-- hero -->
<section aria-labelledby="hero-title" class="relative isolate overflow-hidden bg-surface-container-low text-on-surface">
	<div
		class="@container/hero mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-x-10 gap-y-8 px-4 pt-10 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:px-10 lg:pt-14 lg:pb-12"
	>
		<div class="flex flex-col items-start gap-6">
			<span class="type-label-lg inline-flex h-8 items-center gap-2 rounded-m3-full bg-tertiary-container ps-3 pe-4 text-on-tertiary-container">
				<Sparkles size={16} />
				v2.1.0 · closed form · MIT
			</span>

			<h1 id="hero-title" class="hero-title type-display-lg-emphasized text-on-surface">
				Perceptual color, <span class="text-m3-primary">closed form</span>.
			</h1>

			<p class="type-body-lg max-w-[62ch] text-on-surface-variant @2xl/hero:type-title-lg">
				AxiomLab is a perceptual color space with a strictly positive-definite Riemannian metric, calibrated on
				10,486 human color-difference pairs. No lookup tables, no iterative inverse — one closed-form pipeline
				from XYZ to a metric you can integrate.
			</p>

			<ul class="flex flex-wrap gap-x-5 gap-y-2" aria-label="Key facts">
				{#each heroFacts as fact (fact.label)}
					<li class="type-label-lg inline-flex items-center gap-1.5 text-on-surface-variant">
						<fact.icon size={18} class="text-m3-primary" />
						{fact.label}
					</li>
				{/each}
			</ul>

			<div class="flex flex-wrap gap-3">
				<Button href="#playground" variant="filled" size="lg">
					Open the playground <ArrowRight size={20} />
				</Button>
				<Button href={resolve('/benchmarks')} variant="tonal" size="lg">Read the numbers</Button>
			</div>
		</div>

		<HeroShapes class="order-last mx-auto max-w-[280px] sm:max-w-[380px] lg:order-none lg:max-w-[460px] lg:self-center" />

		<div class="flex flex-wrap gap-3 lg:col-span-2">
			<a
				href="https://github.com/sysv86/axiomlab"
				target="_blank"
				rel="noopener noreferrer"
				class="type-label-lg inline-flex h-11 items-center gap-2 rounded-m3-full px-4 text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface"
				{@attach ripple()}
			>
				<Code2 size={18} /> Source on GitHub <ArrowUpRight size={16} />
			</a>
			<span class="type-label-lg inline-flex h-11 items-center gap-2 px-2 text-on-surface-variant">
				<Check size={18} class="text-m3-primary" /> Python · JavaScript · TypeScript
			</span>
		</div>
	</div>
</section>

<div class="mx-auto flex w-full max-w-[1440px] flex-col gap-14 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
	<!-- the playground is the main surface -->
	<Playground />

	<!-- compact technical strip -->
	<section class="flex flex-col gap-8" aria-labelledby="features-title">
		<div class="flex flex-col gap-3">
			<p class="type-label-lg text-m3-primary">Why it exists</p>
			<h2 id="features-title" class="type-headline-lg-emphasized text-on-surface">One space, two jobs</h2>
			<p class="type-body-lg max-w-[66ch] text-on-surface-variant">
				Measurement and generation usually pull in opposite directions. AxiomLab keeps both: a trained
				power-Riemannian dE for near-threshold judgment, and a homogeneous degree-1 line element for arcs.
			</p>
		</div>

		<div class="@container/features">
			<div class="grid grid-flow-dense grid-cols-1 gap-4 @2xl/features:grid-cols-2 @6xl/features:grid-cols-3">
				<div class="flex flex-col gap-4 rounded-m3-xl bg-surface-container-low p-5">
					<h3 class="type-title-lg">Two metrics, one tensor</h3>
					<p class="type-body-sm text-on-surface-variant">
						The trained power form uses γd = 0.819 for near-threshold differences. The homogeneous form is
						degree-1, so doubling a step doubles the distance — the property arc-length integration needs.
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each [
							{ k: 'γd', v: '0.819' },
							{ k: 'mean ideal arc CV', v: '0.03%' },
							{ k: 'tensor λmin', v: '≥ 0.134' },
							{ k: 'datasets', v: '7' }
						] as stat (stat.k)}
							<div class="rounded-m3-md bg-surface-container p-3">
								<p class="type-label-sm text-on-surface-variant">{stat.k}</p>
								<p class="type-title-md font-mono">{stat.v}</p>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex flex-col gap-4 rounded-m3-xl bg-secondary-container p-5 text-on-secondary-container">
					<h3 class="type-title-lg">Grays stay gray</h3>
					<p class="type-body-sm opacity-90">
						The achromatic axis is structural: the maximum chroma over the D65 gray ramp is
						<span class="font-mono">{neutralMax}</span>. The same transfer function generates the site theme,
						so neutral surfaces keep their tint without drifting in hue.
					</p>
					<div class="flex h-20 overflow-hidden rounded-m3-lg">
						{#each grays as gray (gray.hex)}
							<span class="h-full flex-1" style:background-color={gray.hex} title={gray.hex}></span>
						{/each}
					</div>
					<div class="flex justify-between type-label-sm opacity-80">
						{#each [grays[0], grays[4], grays[8]] as gray (gray.hex)}
							<span class="font-mono">L {gray.L.toFixed(2)}</span>
						{/each}
					</div>
				</div>

				<div class="flex flex-col gap-4 rounded-m3-xl bg-surface-container-low p-5">
					<h3 class="type-title-lg">Invertible by construction</h3>
					<p class="type-body-sm text-on-surface-variant">
						Quadratic Padé lightness plus an exact C¹ HDR extension. No search, no LUT, no branch drift.
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each [
							{ k: 'sRGB round-trip', v: roundTrip },
							{ k: 'HDR 100×', v: Number(gen.max_rt_xyz_hdr_100x).toExponential(2) },
							{ k: 'Rec.2020', v: Number(gen.max_rt_xyz_rec2020).toExponential(2) },
							{ k: 'JS ↔ Python', v: '4.4e-16' }
						] as stat (stat.k)}
							<div class="rounded-m3-md bg-surface-container p-3">
								<p class="type-label-sm text-on-surface-variant">{stat.k}</p>
								<p class="type-title-md font-mono tabular-nums">{stat.v}</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- tiles -->
	<section class="flex flex-col gap-8" aria-labelledby="pages-title">
		<div class="flex flex-col gap-3">
			<p class="type-label-lg text-m3-primary">Explore</p>
			<h2 id="pages-title" class="type-headline-lg-emphasized text-on-surface">See it in context</h2>
		</div>

		<div class="@container/tiles">
			<ul class="grid grid-cols-1 gap-4 @3xl/tiles:grid-cols-3">
				{#each tiles as tile (tile.title)}
					<li class="flex">
						<a
							href={tile.href}
							class="tile group/tile relative flex min-h-64 flex-1 flex-col justify-between gap-8 overflow-hidden rounded-m3-xl p-7 {tile.container}"
							{@attach ripple()}
						>
							<svg viewBox="0 0 100 100" aria-hidden="true" class="tile-deco pointer-events-none absolute -end-14 -top-14 size-56 fill-current opacity-10">
								<path d={shapePath(tile.shape)} />
							</svg>

							<span class="relative grid size-16 place-items-center">
								<svg viewBox="0 0 100 100" aria-hidden="true" class="absolute inset-0 {tile.badge}">
									<path d={shapePath(tile.shape)} />
								</svg>
								<tile.icon size={30} class="relative" />
							</span>

							<div class="relative flex items-end justify-between gap-6">
								<div class="flex flex-col gap-2">
									<h3 class="type-headline-sm-emphasized">{tile.title}</h3>
									<p class="type-body-md opacity-90">{tile.body}</p>
								</div>
								<span aria-hidden="true" class="tile-arrow grid size-14 shrink-0 place-items-center rounded-[28px] {tile.arrow}">
									<ArrowRight size={22} />
								</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- quick start -->
	<section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center" aria-labelledby="start-title">
		<div class="flex flex-col gap-4">
			<p class="type-label-lg text-m3-primary">Quick start</p>
			<h2 id="start-title" class="type-headline-lg-emphasized text-on-surface">One dependency: NumPy</h2>
			<p class="type-body-lg text-on-surface-variant">
				The Python package is pure NumPy; the JavaScript build is a single 18 KB file with no dependencies.
				Both implement the identical closed form.
			</p>
			<div class="flex flex-wrap items-center gap-2">
				<span class="rounded-m3-full bg-tertiary-container px-3 py-1.5 type-label-md text-on-tertiary-container">Not yet on npm / PyPI</span>
				<span class="rounded-m3-full bg-surface-container-high px-3 py-1.5 font-mono text-xs">pip install "git+https://github.com/sysv86/axiomlab.git"</span>
				<span class="rounded-m3-full bg-surface-container-high px-3 py-1.5 font-mono text-xs">npm install github:sysv86/axiomlab</span>
			</div>
			<p class="type-body-sm text-on-surface-variant">
				Source installs work today. Registry uploads are pending; the plain
				<code class="font-mono">pip install axiomlab</code> and <code class="font-mono">npm install axiomlab</code>
				commands will return 404 until the first release is published.
			</p>
			<Button href={resolve('/docs')} variant="outlined" size="md">Read the API <ArrowRight size={18} /></Button>
		</div>
		<CodeBlock code={quickstart} language="python" title="axiomlab.py" />
	</section>
</div>

<footer class="border-t border-outline-variant">
	<div class="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
		<div class="flex items-center gap-3">
			<svg viewBox="0 0 100 100" aria-hidden="true" class="size-8 shrink-0 fill-m3-primary">
				<path d={shapePath('cookie7Sided')} />
			</svg>
			<p class="type-body-md max-w-[62ch] text-on-surface-variant">
				AxiomLab v2.1 · Svelte 5 + Tailwind 4 + Material 3 Expressive · MIT license.
				Theme, motion and shape system adapted from
				<a class="underline" href="https://github.com/olegpolin/material-expressive-svelte" target="_blank" rel="noopener noreferrer">material-expressive-svelte by Oleg Polin</a>.
			</p>
		</div>
		<nav class="flex flex-wrap items-center gap-1" aria-label="Footer">
			{#each FOOTER as d (d.href)}
				<a href={d.href} class="type-label-lg inline-flex h-10 items-center rounded-m3-full px-3 text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface" {@attach ripple()}>{d.label}</a>
			{/each}
			<a href="https://github.com/sysv86/axiomlab" target="_blank" rel="noopener noreferrer" class="type-label-lg inline-flex h-10 items-center gap-1.5 rounded-m3-full px-3 text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface" {@attach ripple()}>
				GitHub <ArrowUpRight size={16} />
			</a>
		</nav>
	</div>
</footer>

<style>
	.hero-title {
		font-size: clamp(2.75rem, 1.25rem + 6.4cqi, 7.25rem);
		line-height: 1;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}
	:global(.dark) .hero-title {
		font-weight: 460;
	}
	.tile-deco {
		transition: rotate var(--md-sys-motion-spring-slow-spatial-duration) var(--md-sys-motion-spring-slow-spatial-easing);
	}
	.tile-arrow {
		transition:
			border-radius var(--md-sys-motion-spring-fast-spatial-duration) var(--md-sys-motion-spring-fast-spatial-easing),
			translate var(--md-sys-motion-spring-fast-spatial-duration) var(--md-sys-motion-spring-fast-spatial-easing);
	}
	:global(.tile:hover) .tile-deco,
	:global(.tile:focus-visible) .tile-deco {
		rotate: 45deg;
	}
	:global(.tile:hover) .tile-arrow,
	:global(.tile:focus-visible) .tile-arrow {
		border-radius: var(--radius-m3-lg);
		translate: 4px 0;
	}
	:global(.tile:active) .tile-arrow {
		border-radius: var(--radius-m3-md);
	}
</style>
