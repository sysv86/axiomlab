<script lang="ts">
	import { ArrowUpRight, BookOpen, Check, Terminal } from '@lucide/svelte';
	import CodeBlock from '#lib/components/CodeBlock.svelte';
	import { bench } from '#lib/bench.js';

	const py = `import axiomlab as ax

lab = ax.from_hex("#3b82f6")            # AxiomLab (L, a, b)
lch = ax.to_LCh(lab)                    # (L, C, h)
xyz = ax.to_XYZ(lab)                    # back to CIE XYZ

d_power = ax.difference("#ff0055", "#00aa88")
d_homog = ax.difference("#ff0055", "#00aa88", use_power_law=False)

mid  = ax.mix("#0000ff", "#ffffff", 0.5, metric_step=True)
ramp = ax.gradient("#0000ff", "#ffffff", 16, metric_step=True)`;

	const js = `const ax = require("axiomlab");

const lab = ax.fromHex("#3b82f6");
const lch = ax.toLCh(lab);
const dE  = ax.difference("#ff0055", "#00aa88", { usePowerLaw: true });
const mid = ax.mix("#0000ff", "#ffffff", 0.5, true);
const ramp = ax.gradient("#0000ff", "#ffffff", 16, true);`;

	const verify = `# unit + property tests
python3 test_axiomlab.py          # 8 tests
node test_axiomlab.js

# dataset integrity
python3 build_datasets.py         # 10,486 pairs, 7 datasets

# full verification: invertibility, STRESS, ablation, 5-fold CV,
# bootstrap CI, gradient uniformity, Python ↔ JS parity
python3 optimize_and_verify.py

# HelmLab comparison (downloads COMBVD on first run)
python3 benchmark_helmlab.py`;

	const api = [
		['from_hex(hex)', 'sRGB hex → AxiomLab Lab'],
		['from_XYZ(xyz)', 'CIE XYZ (Y=1) → AxiomLab Lab'],
		['to_XYZ(lab)', 'AxiomLab Lab → CIE XYZ'],
		['to_LCh(lab)', 'Cartesian Lab → cylindrical LCh'],
		['difference(c1, c2, use_power_law=True)', 'Trained power-Riemannian ΔE'],
		['distance(xyz1, xyz2, use_power_law=False)', 'Homogeneous degree-1 Riemannian ds'],
		['euclidean_distance(xyz1, xyz2)', 'Plain Euclidean distance in AxiomLab'],
		['gamut_map(lab)', 'Project into sRGB by chroma reduction'],
		['mix(c1, c2, t, metric_step=True)', 'Arc-length color at fraction t'],
		['gradient(c1, c2, steps, metric_step=True)', 'Equal-arc gradient stops']
	];
</script>

<svelte:head>
	<title>API — AxiomLab</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-[1180px] flex-col gap-12 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
	<header class="flex flex-col gap-4">
		<p class="type-label-lg text-m3-primary">API</p>
		<h1 class="type-display-sm-emphasized text-on-surface">Small surface, closed form</h1>
		<p class="type-body-lg max-w-[68ch] text-on-surface-variant">
			AxiomLab ships as a pure-NumPy Python package and a zero-dependency JavaScript file. Both expose the same
			conversions and the same two metrics; parity is tested to 1e-15.
		</p>
		<div class="flex flex-wrap items-center gap-2">
			<span class="rounded-m3-full bg-tertiary-container px-3 py-1.5 type-label-md text-on-tertiary-container">Not yet on npm / PyPI</span>
			<span class="rounded-m3-full bg-surface-container-high px-3 py-1.5 font-mono text-xs">pip install "git+https://github.com/sysv86/axiomlab.git"</span>
			<span class="rounded-m3-full bg-surface-container-high px-3 py-1.5 font-mono text-xs">npm install github:sysv86/axiomlab</span>
			<span class="rounded-m3-full bg-secondary-container px-3 py-1.5 type-label-sm text-on-secondary-container">MIT</span>
		</div>
		<p class="type-body-sm max-w-[74ch] text-on-surface-variant">
			Registry status: the npm and PyPI packages are not published yet. The source installs above work now;
			<code class="font-mono">pip install axiomlab</code> and <code class="font-mono">npm install axiomlab</code>
			will return 404 until the first release is uploaded.
		</p>
	</header>

	<section class="grid gap-6 lg:grid-cols-2" aria-labelledby="quickstart-title">
		<div class="flex min-w-0 flex-col gap-3">
			<h2 id="quickstart-title" class="type-headline-sm-emphasized">Python</h2>
			<CodeBlock code={py} language="python" title="python" />
		</div>
		<div class="flex min-w-0 flex-col gap-3">
			<h2 class="type-headline-sm-emphasized">JavaScript</h2>
			<CodeBlock code={js} language="javascript" title="javascript" />
		</div>
	</section>

	<section class="flex flex-col gap-4" aria-labelledby="api-title">
		<h2 id="api-title" class="type-headline-sm-emphasized">Function surface</h2>
		<div class="overflow-x-auto rounded-m3-lg border border-outline-variant">
			<table class="w-full min-w-[620px] border-collapse text-left">
				<thead class="bg-surface-container">
					<tr>
						<th class="px-4 py-3 type-label-md text-on-surface-variant">Function</th>
						<th class="px-4 py-3 type-label-md text-on-surface-variant">Purpose</th>
					</tr>
				</thead>
				<tbody>
					{#each api as row (row[0])}
						<tr class="border-t border-outline-variant">
							<td class="px-4 py-3 font-mono text-xs text-on-surface">{row[0]}</td>
							<td class="px-4 py-3 type-body-sm text-on-surface-variant">{row[1]}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="type-body-sm text-on-surface-variant">
			JavaScript names are camelCase: <code class="font-mono">fromHex</code>, <code class="font-mono">difference</code>,
			<code class="font-mono">mix</code>, <code class="font-mono">gradient</code>. Options are
			<code class="font-mono">&#123; usePowerLaw: false &#125;</code>, <code class="font-mono">&#123; forceScEqSh: true &#125;</code>,
			<code class="font-mono">&#123; disableRt: true &#125;</code>.
		</p>
	</section>

	<section class="flex flex-col gap-4 rounded-m3-xl bg-surface-container-low p-5 sm:p-7" aria-labelledby="math-title">
		<div class="flex items-center gap-3">
			<BookOpen size={22} class="text-m3-primary" />
			<h2 id="math-title" class="type-headline-sm-emphasized">Pipeline</h2>
		</div>
		<ol class="grid gap-3 type-body-md text-on-surface-variant sm:grid-cols-2">
			<li><span class="type-label-lg text-on-surface">1. XYZ → LMS</span> — fixed 3×3 matrix M₁.</li>
			<li><span class="type-label-lg text-on-surface">2. Per-channel ψ</span> — signed cbrt with an epsilon offset for finite slope at zero.</li>
			<li><span class="type-label-lg text-on-surface">3. LMS′ → Lab₀</span> — fixed 3×3 matrix M₂.</li>
			<li><span class="type-label-lg text-on-surface">4. Lightness</span> — two-stage quadratic Padé on [0, 1.20], C¹ linear HDR extension above.</li>
			<li><span class="type-label-lg text-on-surface">5. Chroma / hue</span> — bounded three-shear warp, radial γ/β/G factors.</li>
			<li><span class="type-label-lg text-on-surface">6. Helmholtz–Kohlrausch</span> — bounded lightness shift from chroma.</li>
		</ol>
		<p class="type-body-md text-on-surface-variant">
			The metric is a midpoint-evaluated positive-definite tensor in (L, a, b). The homogeneous line element
			<code class="font-mono">ds = √(dxᵀ G(x̄) dx)</code> is degree-1, so arc-length integration is
			subdivision-invariant; the power form <code class="font-mono">dE = ds^γd</code> is the trained
			near-threshold variant. AxiomLab reports both.
		</p>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each [
				{ k: 'γd', v: '0.819' },
				{ k: 'mean arc CV', v: '0.03%' },
				{ k: 'tensor λmin', v: '≥ 0.134' },
				{ k: 'datasets', v: '7' }
			] as stat (stat.k)}
				<div class="rounded-m3-md bg-surface-container p-3">
					<p class="type-label-sm text-on-surface-variant">{stat.k}</p>
					<p class="type-title-md font-mono">{stat.v}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-4" aria-labelledby="verify-title">
		<div class="flex items-center gap-3">
			<Terminal size={22} class="text-m3-primary" />
			<h2 id="verify-title" class="type-headline-sm-emphasized">Reproduce every number</h2>
		</div>
		<CodeBlock code={verify} language="bash" title="shell" />
		<div class="flex items-start gap-3 rounded-m3-lg bg-surface-container p-4">
			<Check size={20} class="mt-0.5 shrink-0 text-m3-primary" />
			<p class="type-body-sm text-on-surface-variant">
				Last run: Python tests 8/8, Node tests pass, 7 datasets verified, Python ↔ JS parity max 4.4e-16
				(Lab) / 1.1e-15 (ΔE). HelmLab comparison: {bench.combvd_suite?.pairs ?? 3813} COMBVD pairs.
			</p>
		</div>
	</section>

	<section class="flex flex-col gap-3 rounded-m3-xl border border-outline-variant p-5" aria-labelledby="credits-title">
		<h2 id="credits-title" class="type-title-lg">Credits and licenses</h2>
		<p class="type-body-sm text-on-surface-variant">
			AxiomLab is MIT. The Svelte site's Material 3 token system, spring motion helpers, shape-morphing
			library and ripple attachment are adapted from
			<a class="underline text-m3-primary" href="https://github.com/olegpolin/material-expressive-svelte" target="_blank" rel="noopener noreferrer">material-expressive-svelte</a>
			(MIT, Copyright © 2026 Oleg Polin); the shape library is itself derived from AOSP (Apache-2.0).
			HelmLab is MIT, Copyright © 2026 Görkem Yıldız.
			The HelmLab comparison uses its published package and dataset loader.
		</p>
		<a
			href="https://github.com/sysv86/axiomlab"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 type-label-lg text-m3-primary"
		>
			Repository <ArrowUpRight size={16} />
		</a>
	</section>
</div>
