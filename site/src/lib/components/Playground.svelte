<script lang="ts">
	import { ArrowRight, RotateCcw } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import Chip from './Chip.svelte';
	import Slider from './Slider.svelte';
	import {
		axiom,
		cie76Hex,
		ciede2000Hex,
		helmDifference,
		helmGradient,
		linearGradient,
		oklabGradient,
		oklabHex,
	} from '#lib/color-metrics.js';
	import { shapePath } from '#lib/m3/shapes.js';
	import { theme } from '#lib/m3/theme.svelte.js';

	type Pair = { a: string; b: string; label: string };
	const PRESETS: Pair[] = [
		{ a: '#0000ff', b: '#ffffff', label: 'Blue → white' },
		{ a: '#3b82f6', b: '#f43f5e', label: 'Blue → rose' },
		{ a: '#f97316', b: '#0f766e', label: 'Orange → teal' },
		{ a: '#111827', b: '#e5e7eb', label: 'Black → grey' },
		{ a: '#22c55e', b: '#a855f7', label: 'Green → violet' }
	];

	let a = $state('#0000ff');
	let b = $state('#ffffff');

	// The playground is the only color picker on the site. Color A seeds the
	// page theme, and the scheme itself is generated in AxiomLab space.
	$effect(() => {
		theme.setSeed(a);
	});
	let steps = $state(12);
	let activePreset = $state(0);

	function setPair(pair: Pair, index: number) {
		a = pair.a;
		b = pair.b;
		activePreset = index;
	}

	function isLight(hex: string) {
		const [r, g, b] = axiom.hexToSRGB(hex);
		return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
	}

	function reset() {
		setPair(PRESETS[0], 0);
		steps = 12;
	}

	function normalizeHex(value: string) {
		let v = value.trim().replace(/^#/, '');
		if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
		return /^[0-9a-f]{6}$/i.test(v) ? `#${v.toLowerCase()}` : null;
	}

	const metrics = $derived.by(() => {
		const rows = [
			{ name: 'AxiomLab — Power-Riemannian', value: axiom.difference(a, b), color: 'var(--md-sys-color-primary)' },
			{
				name: 'AxiomLab — Homogeneous ds',
				value: axiom.difference(a, b, { usePowerLaw: false }),
				color: 'var(--md-sys-color-primary)'
			},
			{ name: 'HelmLab MetricSpace', value: helmDifference(a, b), color: 'var(--md-sys-color-tertiary)' },
			{ name: 'CIEDE2000', value: ciede2000Hex(a, b), color: 'var(--md-sys-color-secondary)' },
			{ name: 'OKLab (Euclidean)', value: oklabHex(a, b), color: 'var(--md-sys-color-outline)' },
			{ name: 'CIE76', value: cie76Hex(a, b), color: 'var(--md-sys-color-outline)' }
		];
		const max = Math.max(...rows.map((r) => r.value), 1e-9);
		return rows.map((r) => ({ ...r, pct: Math.max(2, (r.value / max) * 100) }));
	});

	const lab = $derived(axiom.fromHex(a));
	const lch = $derived(axiom.toLCh(lab));

	const ramps = $derived.by(() => [
		{ name: 'AxiomLab', note: 'Riemannian arc-length', colors: axiom.gradient(a, b, steps, true) },
		{ name: 'HelmLab', note: 'GenSpace + CIEDE2000 arc-length', colors: helmGradient(a, b, steps) },
		{ name: 'OKLab', note: 'linear Lab interpolation', colors: oklabGradient(a, b, steps) },
		{ name: 'Linear sRGB', note: 'gamma-encoded interpolation', colors: linearGradient(a, b, steps) }
	]);

	const blueWhiteMid = $derived.by(() => ({
		axiom: axiom.mix('#0000ff', '#ffffff', 0.5, true),
		helm: helmGradient('#0000ff', '#ffffff', 3)[1],
		oklab: oklabGradient('#0000ff', '#ffffff', 3)[1],
		linear: '#8080ff'
	}));
</script>

<section id="playground" class="flex scroll-mt-24 flex-col gap-6" aria-labelledby="playground-title">
	<div class="flex flex-col gap-3">
		<p class="type-label-lg text-m3-primary">Playground</p>
		<h2 id="playground-title" class="type-headline-lg-emphasized text-on-surface">Two colors, five metrics, one arc</h2>
		<p class="type-body-lg max-w-[68ch] text-on-surface-variant">
			Change either color to recompute AxiomLab, HelmLab and the standard metrics in your browser. Color A also
			seeds the page theme — generated in AxiomLab LCh, not HCT. Gradients are generated live along each space's
			own interpolation path.
		</p>
	</div>

	<div class="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
		<!-- color pair -->
		<div class="flex flex-col gap-5 rounded-m3-xl bg-surface-container-low p-5 sm:p-6">
			<div class="flex flex-wrap items-center gap-2">
				{#each PRESETS as preset, i (preset.label)}
					<Chip selected={activePreset === i} onclick={() => setPair(preset, i)}>{preset.label}</Chip>
				{/each}
				<button
					type="button"
					class="ms-auto grid size-10 cursor-pointer place-items-center rounded-m3-full text-on-surface-variant transition-colors hover:bg-on-surface/10"
					aria-label="Reset playground"
					onclick={reset}
				>
					<RotateCcw size={18} />
				</button>
			</div>

			<div class="grid grid-cols-2 gap-3">
				{#each [{ key: 'a', value: a, label: 'Color A' }, { key: 'b', value: b, label: 'Color B' }] as swatch (swatch.key)}
					<div class="flex flex-col gap-2">
						<div
							class="relative flex aspect-[4/3] items-end overflow-hidden rounded-m3-lg p-3"
							style:background-color={swatch.value}
						>
							<svg viewBox="0 0 100 100" aria-hidden="true" class="absolute -end-6 -top-6 size-28 fill-current" style:color={isLight(swatch.value) ? 'rgb(0 0 0 / 0.10)' : 'rgb(255 255 255 / 0.16)'}>
								<path d={shapePath(swatch.key === 'a' ? 'cookie9Sided' : 'clover4Leaf')} />
							</svg>
							<span class="relative rounded-m3-full bg-black/55 px-2 py-1 font-mono text-xs text-white backdrop-blur">
								{swatch.value}
							</span>
						</div>
						<label class="flex items-center gap-2">
							<input
								type="color"
								value={swatch.value}
								class="size-10 shrink-0 cursor-pointer rounded-m3-sm border border-outline-variant bg-transparent p-1"
								aria-label="{swatch.label} color picker"
								oninput={(e) => {
									const v = (e.currentTarget as HTMLInputElement).value;
									if (swatch.key === 'a') a = v;
									else b = v;
								}}
							/>
							<input
								type="text"
								value={swatch.value}
								spellcheck="false"
								class="h-10 w-full rounded-m3-sm border border-outline-variant bg-surface px-3 font-mono text-sm text-on-surface outline-none focus:border-m3-primary"
								aria-label="{swatch.label} hex value"
								onchange={(e) => {
									const v = normalizeHex((e.currentTarget as HTMLInputElement).value);
									if (!v) return;
									if (swatch.key === 'a') a = v;
									else b = v;
								}}
							/>
						</label>
					</div>
				{/each}
			</div>

			<div class="flex flex-col gap-3 border-t border-outline-variant pt-4">
				<div class="flex items-center justify-between">
					<p class="type-title-sm text-on-surface-variant">AxiomLab coordinates of A</p>
					<span class="rounded-m3-full bg-secondary-container px-3 py-1 font-mono text-xs text-on-secondary-container">
						L {lab[0].toFixed(4)} · a {lab[1].toFixed(4)} · b {lab[2].toFixed(4)}
					</span>
				</div>
				<div class="grid grid-cols-3 gap-2">
					{#each [{ k: 'L', v: lch[0].toFixed(3) }, { k: 'C', v: lch[1].toFixed(3) }, { k: 'h°', v: lch[2].toFixed(1) }] as row (row.k)}
						<div class="rounded-m3-md bg-surface-container p-3 text-center">
							<p class="type-label-sm text-on-surface-variant">{row.k}</p>
							<p class="type-title-md tabular-nums">{row.v}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- metrics -->
		<div class="flex flex-col gap-4 rounded-m3-xl bg-surface-container p-5 sm:p-6">
			<div class="flex items-baseline justify-between gap-3">
				<h3 class="type-title-lg">Color difference</h3>
				<span class="type-label-sm text-on-surface-variant">lower = more similar</span>
			</div>
			<ul class="flex flex-col gap-3.5">
				{#each metrics as row (row.name)}
					<li class="flex flex-col gap-1.5">
						<div class="flex items-baseline justify-between gap-3">
							<span class="type-body-md text-on-surface">{row.name}</span>
							<span class="font-mono text-sm tabular-nums text-on-surface-variant">{row.value.toFixed(4)}</span>
						</div>
						<div class="h-2 overflow-hidden rounded-m3-full bg-surface-container-highest">
							<div
								class="h-full rounded-m3-full transition-[width] duration-spring-slow-spatial ease-spring-slow-spatial"
								style:width="{row.pct}%"
								style:background-color={row.color}
							></div>
						</div>
					</li>
				{/each}
			</ul>
			<p class="type-body-sm text-on-surface-variant">
				The six columns use different units and scales. HelmLab's trained distance saturates near 0.15, so compare
				rankings within one metric — not raw magnitudes across metrics.
			</p>
		</div>
	</div>

	<!-- gradients -->
	<div class="flex flex-col gap-5 rounded-m3-xl bg-surface-container-low p-5 sm:p-6">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="flex flex-col gap-1">
				<h3 class="type-title-lg">Gradient paths</h3>
				<p class="type-body-md text-on-surface-variant">
					Same endpoints, four interpolation strategies. Equal hex steps are shown; perceptual spacing differs.
				</p>
			</div>
			<div class="w-full sm:w-64">
				<Slider bind:value={steps} min={5} max={24} label="Steps: {steps}" />
			</div>
		</div>

		<div class="flex flex-col gap-5">
			{#each ramps as ramp (ramp.name)}
				<div class="flex flex-col gap-2">
					<div class="flex items-baseline justify-between gap-3">
						<p class="type-title-sm text-on-surface">{ramp.name}</p>
						<p class="type-label-sm text-on-surface-variant">{ramp.note}</p>
					</div>
					<div class="flex h-14 overflow-hidden rounded-m3-md">
						{#each ramp.colors as color, i (i)}
							<span class="h-full flex-1" style:background-color={color} title={color}></span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- blue-white signature -->
	<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center rounded-m3-xl bg-primary-container p-5 text-on-primary-container sm:p-6">
		<div class="flex flex-col gap-2">
			<h3 class="type-title-lg">The blue→white test</h3>
			<p class="type-body-md max-w-[60ch] opacity-90">
				Naive RGB and some Lab paths drift through lavender. AxiomLab bends the blue region toward a sky-blue
				midpoint (<span class="font-mono">{blueWhiteMid.axiom}</span>); HelmLab lands at
				<span class="font-mono">{blueWhiteMid.helm}</span>.
			</p>
		</div>
		<div class="flex items-center gap-3">
			{#each [{ name: 'AxiomLab', c: blueWhiteMid.axiom }, { name: 'HelmLab', c: blueWhiteMid.helm }, { name: 'OKLab', c: blueWhiteMid.oklab }, { name: 'Linear', c: blueWhiteMid.linear }] as item (item.name)}
				<div class="flex flex-col items-center gap-1">
					<span class="size-12 rounded-m3-full border-2 border-white/60" style:background-color={item.c}></span>
					<span class="type-label-sm">{item.name}</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<a
			href={resolve('/benchmarks')}
			class="inline-flex h-11 items-center gap-2 rounded-m3-full bg-m3-primary px-5 type-label-lg text-on-primary"
		>
			See the benchmarks <ArrowRight size={18} />
		</a>
		<span class="type-body-sm text-on-surface-variant">
			AxiomLab dE on this pair: <span class="font-mono">{axiom.difference(a, b).toFixed(4)}</span> ·
			HelmLab: <span class="font-mono">{helmDifference(a, b).toFixed(4)}</span>
		</span>
	</div>
</section>
