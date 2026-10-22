<script lang="ts">
	import { Activity, Check, Info, Timer, TriangleAlert } from '@lucide/svelte';
	import BarChart from './BarChart.svelte';
	import Chip from './Chip.svelte';
	import { bench, DATASET_LABELS, DATASETS } from '#lib/bench.js';
	import results from '#lib/data/results.json';
	import { axiom, helmDistanceXyz, helmFromXyz } from '#lib/color-metrics.js';
	import { cn } from '#lib/utils.js';

	const suite = bench.axiomlab_suite;
	const methods = Object.keys(suite.methods);
	const mean7 = methods
		.map((m) => ({ label: m.replace('AxiomLab v2.1 ', 'AxiomLab '), value: suite.methods[m].Mean7, highlight: m.startsWith('AxiomLab v2.1 (Power') }))
		.sort((x, y) => x.value - y.value);
	const showOnly = ['AxiomLab v2.1 (Power-Riemannian)', 'HelmLab 1.0 MetricSpace', 'CIEDE2000', 'CAM16-UCS', 'OKLab (Euclidean)', 'IPT (Euclidean)'];
	const rows = methods.filter((m) => showOnly.includes(m));

	const ablation = (results as any).ablation as Record<string, Record<string, number>>;
	const ablationRows = Object.entries(ablation)
		.map(([label, row]) => ({ label: label.replace('Ablation: ', '').replace('Full ', ''), value: row.Mean7 }))
		.sort((a, b) => a.value - b.value);

	let gradientMetric = $state<'cv_axiom' | 'cv_ciede2000'>('cv_ciede2000');
	const gradPairs = bench.gradients.pairs;
	const gradMethods = ['AxiomLab', 'HelmLab', 'OKLab', 'Linear sRGB'];

	let live = $state<null | { axConvert: number; helmConvert: number; axDistance: number; helmDistance: number }>(null);
	let running = $state(false);

	const N = 20000;
	const testXyz: number[][] = [];
	for (let i = 0; i < N; i++) {
		testXyz.push([Math.random() * 1.1, Math.random() * 1.1, Math.random() * 1.1]);
	}

	function runBenchmark() {
		running = true;
		live = null;
		setTimeout(() => {
			const run = (fn: () => void, runs = 3) => {
				fn();
				const t0 = performance.now();
				for (let r = 0; r < runs; r++) fn();
				return (performance.now() - t0) / runs;
			};
			const axConvert = run(() => {
				for (const x of testXyz) axiom.fromXYZ(x as [number, number, number]);
			});
			const helmConvert = run(() => {
				for (const x of testXyz) helmFromXyz(x as [number, number, number]);
			});
			const axDistance = run(() => {
				for (let i = 0; i < N / 2; i++) axiom.distance(testXyz[i] as [number, number, number], testXyz[i + N / 2] as [number, number, number]);
			});
			const helmDistance = run(() => {
				for (let i = 0; i < N / 2; i++)
					helmDistanceXyz(testXyz[i] as [number, number, number], testXyz[i + N / 2] as [number, number, number]);
			});
			live = { axConvert, helmConvert, axDistance, helmDistance };
			running = false;
		}, 30);
	}
</script>

<section class="flex flex-col gap-10" aria-labelledby="bench-title">
	<div class="flex flex-col gap-3">
		<p class="type-label-lg text-m3-primary">Benchmarks</p>
		<h2 id="bench-title" class="type-headline-lg-emphasized text-on-surface">Measured, not asserted</h2>
		<p class="type-body-lg max-w-[70ch] text-on-surface-variant">
			STRESS (Standardized Residual Sum of Squares, lower is better) on primary-source psychophysical data and on
			COMBVD. Every number on this page comes from the scripts in the repository, with the HelmLab comparison
			run by the same harness.
		</p>
	</div>

	<!-- headline tiles -->
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		{#each [
			{ value: '10,486', label: 'color pairs', sub: '6 psychophysical + 1 reference' },
			{ value: '18.18', label: 'Mean7 STRESS', sub: 'AxiomLab Power-Riemannian' },
			{ value: '35.2%', label: 'lower than CIEDE2000', sub: 'Mean7: 28.04 → 18.18' },
			{ value: '2.3e-15', label: 'round-trip error', sub: 'sRGB XYZ, closed form' }
		] as tile (tile.label)}
			<div class="flex flex-col gap-1 rounded-m3-lg bg-surface-container-low p-4">
				<span class="type-headline-sm-emphasized text-on-surface">{tile.value}</span>
				<span class="type-label-lg text-on-surface">{tile.label}</span>
				<span class="type-body-sm text-on-surface-variant">{tile.sub}</span>
			</div>
		{/each}
	</div>

	<!-- two suites -->
	<div class="flex flex-col gap-4 rounded-m3-xl bg-tertiary-container p-5 text-on-tertiary-container sm:p-6">
		<div class="flex items-start gap-3">
			<Info size={22} class="mt-0.5 shrink-0" />
			<div class="flex flex-col gap-1">
				<h3 class="type-title-lg">Calibration domain decides the winner</h3>
				<p class="type-body-md max-w-[78ch] opacity-90">
					AxiomLab is calibrated on the 7-dataset suite below; HelmLab is trained on COMBVD. Each wins in its own
					domain. Reporting a single pooled number would hide that, so both protocols are shown.
				</p>
			</div>
		</div>

		<div class="grid gap-3 md:grid-cols-2">
			<div class="rounded-m3-lg bg-surface/60 p-4 backdrop-blur">
				<p class="type-label-lg">AxiomLab's suite · 10,486 pairs</p>
				<div class="mt-3 flex items-end justify-between gap-3">
					<div>
						<p class="type-display-sm-emphasized">18.18</p>
						<p class="type-body-sm opacity-80">AxiomLab Mean7</p>
					</div>
					<div class="text-end">
						<p class="type-headline-sm">35.00</p>
						<p class="type-body-sm opacity-80">HelmLab Mean7</p>
					</div>
				</div>
			</div>
			<div class="rounded-m3-lg bg-surface/60 p-4 backdrop-blur">
				<p class="type-label-lg">COMBVD · 3,813 pairs</p>
				<div class="mt-3 flex items-end justify-between gap-3">
					<div>
						<p class="type-display-sm-emphasized">22.73</p>
						<p class="type-body-sm opacity-80">HelmLab raw (22.48 CAT)</p>
					</div>
					<div class="text-end">
						<p class="type-headline-sm">33.72</p>
						<p class="type-body-sm opacity-80">AxiomLab raw (33.47 CAT)</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- main table -->
	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-1">
			<h3 class="type-title-lg">STRESS by dataset</h3>
			<p class="type-body-md text-on-surface-variant">
				AxiomLab's 6 psychophysical datasets plus the CIE TC 1-47 analytical verification set. Lower is better.
			</p>
		</div>
		<div class="overflow-x-auto rounded-m3-lg border border-outline-variant">
			<table class="w-full min-w-[880px] border-collapse text-left">
				<thead class="bg-surface-container">
					<tr>
						<th class="px-3 py-3 type-label-md text-on-surface-variant">Method</th>
						{#each DATASETS as ds (ds)}
							<th class="px-2 py-3 text-end type-label-sm text-on-surface-variant" title={DATASET_LABELS[ds]}>{DATASET_LABELS[ds]}</th>
						{/each}
						<th class="px-2 py-3 text-end type-label-md text-on-surface-variant">Mean6</th>
						<th class="px-3 py-3 text-end type-label-md text-on-surface-variant">Mean7</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as m (m)}
						<tr class={cn('border-t border-outline-variant', m.startsWith('AxiomLab v2.1 (Power') ? 'bg-primary-container/60' : '')}>
							<td class="px-3 py-3 type-body-sm">{m.replace('AxiomLab v2.1 ', 'AxiomLab ')}</td>
							{#each DATASETS as ds (ds)}
								<td class="px-2 py-3 text-end font-mono text-xs tabular-nums">{suite.methods[m][ds].toFixed(2)}</td>
							{/each}
							<td class="px-2 py-3 text-end font-mono text-xs tabular-nums">{suite.methods[m].Mean6_Psychophysical.toFixed(2)}</td>
							<td class="px-3 py-3 text-end font-mono text-xs font-semibold tabular-nums">{suite.methods[m].Mean7.toFixed(2)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="flex flex-col gap-3 rounded-m3-xl bg-surface-container-low p-5">
			<h3 class="type-title-lg">Mean7 STRESS by method</h3>
			<BarChart rows={mean7} unit="" />
		</div>
		<div class="flex flex-col gap-3 rounded-m3-xl bg-surface-container-low p-5">
			<h3 class="type-title-lg">Ablation (AxiomLab)</h3>
			<p class="type-body-sm text-on-surface-variant">Mean7 STRESS. Every tensor component earns its place.</p>
			<BarChart rows={ablationRows.map((r) => ({ ...r, highlight: r.label.startsWith('AxiomLab') }))} />
		</div>
	</div>

	<!-- COMBVD table -->
	{#if bench.combvd_suite}
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1">
				<h3 class="type-title-lg">COMBVD (HelmLab's corpus)</h3>
				<p class="type-body-md text-on-surface-variant">
					Evaluated raw and after Bradford CAT to D65, matching HelmLab's published protocol. Our harness
					reproduces HelmLab's 22.73 / 22.48 and CIEDE2000's 29.18 to two decimals.
				</p>
			</div>
			<div class="overflow-x-auto rounded-m3-lg border border-outline-variant">
				<table class="w-full min-w-[520px] border-collapse text-left">
					<thead class="bg-surface-container">
						<tr>
							<th class="px-4 py-3 type-label-md text-on-surface-variant">Method</th>
							<th class="px-4 py-3 text-end type-label-md text-on-surface-variant">raw</th>
							<th class="px-4 py-3 text-end type-label-md text-on-surface-variant">Bradford CAT</th>
						</tr>
					</thead>
					<tbody>
						{#each Object.keys(bench.combvd_suite.raw) as m (m)}
							<tr class="border-t border-outline-variant">
								<td class="px-4 py-3 type-body-sm">{m.replace('AxiomLab v2.1 ', 'AxiomLab ')}</td>
								<td class="px-4 py-3 text-end font-mono text-xs tabular-nums">{bench.combvd_suite.raw[m].toFixed(2)}</td>
								<td class="px-4 py-3 text-end font-mono text-xs tabular-nums">{bench.combvd_suite.bradford_cat[m].toFixed(2)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- gradients -->
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div class="flex flex-col gap-1">
				<h3 class="type-title-lg">Gradient step uniformity</h3>
				<p class="type-body-md max-w-[70ch] text-on-surface-variant">
					Coefficient of variation of 16-step hex ramps, measured with two metrics. 8-bit quantization sets a
					floor of roughly 1–5%, so treat these as delivered-output numbers, not ideal-path numbers.
				</p>
			</div>
			<div class="flex gap-2">
				<Chip selected={gradientMetric === 'cv_ciede2000'} onclick={() => (gradientMetric = 'cv_ciede2000')}>CIEDE2000 CV</Chip>
				<Chip selected={gradientMetric === 'cv_axiom'} onclick={() => (gradientMetric = 'cv_axiom')}>AxiomLab CV</Chip>
			</div>
		</div>

		<div class="overflow-x-auto rounded-m3-lg border border-outline-variant">
			<table class="w-full min-w-[720px] border-collapse text-left">
				<thead class="bg-surface-container">
					<tr>
						<th class="px-4 py-3 type-label-md text-on-surface-variant">Pair</th>
						{#each gradMethods as m (m)}
							<th class="px-4 py-3 text-end type-label-md text-on-surface-variant">{m}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each gradPairs as pair (pair.from + pair.to)}
						<tr class="border-t border-outline-variant">
							<td class="px-4 py-3">
								<span class="flex items-center gap-2">
									<span class="size-4 rounded-full border border-outline-variant" style:background-color={pair.from}></span>
									<span class="size-4 rounded-full border border-outline-variant" style:background-color={pair.to}></span>
									<span class="type-body-sm">{pair.from} → {pair.to}</span>
								</span>
							</td>
							{#each gradMethods as m (m)}
								<td class={cn('px-4 py-3 text-end font-mono text-xs tabular-nums', m === 'AxiomLab' && gradientMetric === 'cv_axiom' ? 'text-m3-primary font-semibold' : '')}>
									{pair.methods[m][gradientMetric].toFixed(2)}%
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="type-body-sm text-on-surface-variant">
			Each space wins the column measured in its own metric. HelmLab's gradient applies CIEDE2000 arc-length
			reparameterization, so the CIEDE2000 column favours it by construction; AxiomLab's arc length is measured
			in its own homogeneous metric.
		</p>
	</div>

	<!-- live speed -->
	<div class="flex flex-col gap-4 rounded-m3-xl bg-surface-container p-5 sm:p-6">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<Timer size={22} class="text-m3-primary" />
				<div>
					<h3 class="type-title-lg">Live speed test</h3>
					<p class="type-body-sm text-on-surface-variant">20,000 XYZ conversions and 10,000 distances, in this browser.</p>
				</div>
			</div>
			<button
				type="button"
				class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-m3-full bg-m3-primary px-5 type-label-lg text-on-primary disabled:opacity-50"
				onclick={runBenchmark}
				disabled={running}
			>
				<Activity size={18} /> {running ? 'Running…' : 'Run benchmark'}
			</button>
		</div>

		{#if live}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{#each [
					{ label: 'AxiomLab convert', value: live.axConvert.toFixed(1) + ' ms' },
					{ label: 'HelmLab convert', value: live.helmConvert.toFixed(1) + ' ms' },
					{ label: 'AxiomLab 10k dE', value: live.axDistance.toFixed(1) + ' ms' },
					{ label: 'HelmLab 10k dE', value: live.helmDistance.toFixed(1) + ' ms' }
				] as cell (cell.label)}
					<div class="rounded-m3-lg bg-surface-container-low p-3">
						<p class="type-label-sm text-on-surface-variant">{cell.label}</p>
						<p class="type-title-lg tabular-nums">{cell.value}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="type-body-sm text-on-surface-variant">Results appear here. Timings are indicative and depend on the device.</p>
		{/if}
	</div>

	<!-- methodology -->
	<div class="flex flex-col gap-4 rounded-m3-xl border border-outline-variant p-5 sm:p-6">
		<div class="flex items-center gap-3">
			<Check size={22} class="text-m3-primary" />
			<h3 class="type-title-lg">What was actually run</h3>
		</div>
		<ul class="grid gap-2 type-body-md text-on-surface-variant sm:grid-cols-2">
			<li><code class="font-mono text-on-surface">python3 test_axiomlab.py</code> — 8/8 pass</li>
			<li><code class="font-mono text-on-surface">node test_axiomlab.js</code> — pass</li>
			<li><code class="font-mono text-on-surface">python3 build_datasets.py</code> — 7 datasets verified</li>
			<li><code class="font-mono text-on-surface">python3 optimize_and_verify.py</code> — full suite</li>
			<li><code class="font-mono text-on-surface">python3 benchmark_helmlab.py</code> — this page</li>
			<li>Python ↔ JS parity: max 4.4e-16 Lab, 1.1e-15 ΔE</li>
		</ul>
		<div class="flex items-start gap-3 rounded-m3-lg bg-surface-container-high p-4">
			<TriangleAlert size={20} class="mt-0.5 shrink-0 text-m3-primary" />
			<div class="flex flex-col gap-1">
				<p class="type-title-sm">Caveats</p>
				<ul class="list-disc ps-4 type-body-sm text-on-surface-variant">
					{#each bench.caveats as caveat (caveat)}
						<li>{caveat}</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>
