# AxiomLab (AxLab / AxLCh) v2.1.0

**Unified Closed-Form Perceptual Color Space & Positive-Definite Midpoint Riemannian Metric Tensor**

[Website](https://kerneldroid.github.io/axiomlab/) · [Playground](https://kerneldroid.github.io/axiomlab/playground/) · [Benchmarks](https://kerneldroid.github.io/axiomlab/benchmarks/) · [API](https://kerneldroid.github.io/axiomlab/docs/)

> **Registry status (2026-10-22):** the packages are **not published to npm or PyPI yet**. `pip install axiomlab` and `npm install axiomlab` will return 404. Until the first registry upload, install from source:
> ```bash
> pip install "git+https://github.com/sysv86/axiomlab.git"
> npm install github:sysv86/axiomlab
> ```

Calibrated and validated on **6 primary-source human psychophysical datasets (10,452 color pairs)** plus the **CIE TC 1-47 / Sharma et al. (2005) CIEDE2000 reference verification set (34 pairs; 10,486 pairs total across 3,814 unique colorimetric stimuli)** — with **zero synthetic random pairs, zero dead or bound-clamped parameters, and self-contained reproducible benchmarks**.

---

## 1. Datasets (`build_datasets.py` & `real_datasets.npz`)

### A. Primary-Source Human Observer Psychophysical Datasets (10,452 pairs)
1. **MacAdam (1974)** — *JOSA* 64(12), 1691–1702, Table I & II (`128 pairs`, `59 ceramic tiles`, 49–76 observers).
2. **OSA-UCS Atlas (ASTM E1360-90)** — MacAdam (1978) *JOSA* 68(1), 121–130 / ASTM E1360-90 Table 1 (`3,673 lattice neighbor pairs` across `558` official full-step and pastel half-step samples, $\Delta V \in \{1, \sqrt{2}, 2, 2\sqrt{2}\}$).
3. **MacAdam (1942)** — *JOSA* 32(5), 247–274, Table III (`216 directional color-matching standard deviation pairs` across `25` ellipses in daylight, adapted from Illuminant C to D65 via Bradford CAT).
4. **Munsell Renotation Value Steps (Newhall, Nickerson & Judd 1943)** — *JOSA* 33(7), 385–418, Table I & II (`2,251` $\Delta V = 1$ pairs across 40 hues).
5. **Munsell Renotation Chroma Steps (Newhall et al. 1943)** — Table I (`2,369` $\Delta C = 2$ pairs across 40 hues and 9 value levels).
6. **Munsell Renotation Hue Steps (Newhall et al. 1943)** — Table I (`1,815` circumferential hue steps across 40 hues and 9 value levels).

### B. Analytical Reference Verification Set (34 pairs)
7. **CIE TC 1-47 / Sharma, Wu & Dalal (2005)** — *Color Res. Appl.* 30(1), 21–30, Table I (`34 pairs` across 5 perceptual regimes). Because the target values in this table are analytical CIEDE2000 outputs, both the 6-dataset independent psychophysical average (**Mean6**) and the 7-dataset overall average (**Mean7**) are reported.

---

## 2. Verified STRESS Results (`optimize_and_verify.py`)

| Model / Metric | MacAdam74 (128) | OSA-Atlas (3673) | MacAdam42 (216) | Munsell-V (2251) | Munsell-C (2369) | Munsell-H (1815) | CIE-TC147 (34) | Mean6 (Psych.) | Mean7 (All) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AxiomLab v2.1 (Power-Riemannian, $\gamma_d = 0.819$)** | **15.93** | **11.49** | **24.19** | **7.67** | **28.45** | **24.44** | **15.10** | **18.70** | **18.18** |
| **AxiomLab v2.1 (Homogeneous Riemannian, $\gamma_d = 1.0$)** | **16.41** | **13.13** | **29.22** | **10.01** | **34.79** | **26.34** | **14.68** | **21.65** | **20.65** |
| **AxiomLab v2.1 (Pure Euclidean, $G = I$)** | **17.47** | **11.92** | **29.67** | **11.30** | **35.81** | **25.36** | **19.84** | **21.92** | **21.62** |
| CAM16-UCS | 18.70 | 18.16 | 31.39 | 13.08 | 42.50 | 33.75 | 17.84 | 26.26 | 25.06 |
| CIE94 | 19.79 | 20.24 | 39.58 | 10.41 | 45.37 | 31.49 | 20.33 | 27.81 | 26.74 |
| CIE Lab (CIE76) | 24.53 | 20.25 | 44.99 | 25.53 | 24.29 | 31.50 | 23.58 | 28.52 | 27.81 |
| IPT | 21.27 | 12.39 | 38.49 | 19.68 | 34.85 | 30.93 | 38.12 | 26.27 | 27.96 |
| CIEDE2000 | 22.13 | 27.95 | 40.87 | 21.47 | 49.18 | 34.62 | 0.07* | 32.70 | 28.04 |
| Jzazbz | 23.21 | 16.24 | 32.93 | 25.06 | 35.93 | 28.56 | 35.74 | 26.99 | 28.24 |
| DIN99 | 23.31 | 21.24 | 37.56 | 22.39 | 43.51 | 38.63 | 15.20 | 31.11 | 28.83 |
| OKLab | 32.72 | 26.21 | 38.17 | 14.27 | 43.74 | 32.41 | 45.73 | 31.25 | 33.32 |
| OSA-UCS (ASTM E1360) | 19.85 | 11.41 | 43.99 | 44.54 | 45.44 | 29.17 | 46.75 | 32.40 | 34.45 |

*\*Note: `CIE-TC147` target values are defined by the CIEDE2000 formula itself.*

### 2b. Cross-comparison with HelmLab 1.0

[HelmLab](https://github.com/Grkmyldz148/helmlab) is a two-space family calibrated on COMBVD. Because the two models are trained on different corpora, the same harness reports both protocols (`benchmark_helmlab.py`):

| Suite | AxiomLab v2.1 | HelmLab 1.0 | CIEDE2000 |
| :--- | :---: | :---: | :---: |
| AxiomLab 7-dataset suite (10,486 pairs, Mean7) | **18.18** | 35.00 | 28.04 |
| COMBVD (3,813 pairs, raw) | 33.72 | **22.73** | 29.18 |
| COMBVD (3,813 pairs, Bradford CAT) | 33.47 | **22.48** | 29.13 |

Each model wins in its own calibration domain. The harness reproduces HelmLab's published 22.73 / 22.48 and CIEDE2000's 29.18 exactly. Gradient step uniformity is also measured for both (16-step 8-bit ramps, two metrics); HelmLab's built-in CIEDE2000 arc-length reparameterization wins the CIEDE2000 column, AxiomLab wins under its own metric. Full tables, ablation, live browser timings and caveats: <https://kerneldroid.github.io/axiomlab/benchmarks/>.

---

## 3. Mathematical & Architectural Highlights

- **Globally Monotonic SDR/WCG/HDR Invertibility**: `from_XYZ` and `to_XYZ` pair a 2-stage quadratic Padé lightness curve on $|L_0| \le 1.20$ with an exact $C^1$-continuous linear HDR extension for $|L_0| > 1.20$ and branch-stable Citardauq quadratic inversion. Round-trip error is $< 2.3 \times 10^{-15}$ across sRGB and Rec.2020, and $< 1.6 \times 10^{-13}$ up to $100\times$ D65 white HDR luminance.
- **Exact D65 Achromatic Neutrality**: D65 white (`[0.95047, 1.00000, 1.08883]`) and `#ffffff` map to $(L, a, b) = (1.0, 0.0, 0.0)$ to machine precision ($C^* < 3 \times 10^{-14}$).
- **Strictly Positive-Definite Midpoint Riemannian Tensor**: The blue-region tilt amplitude satisfies $|R_T| \le 1.7318 < 2.0$, ensuring minimum tensor eigenvalue $\lambda_{\min} \ge 0.134 > 0$ everywhere.
- **Subdivision-Invariant Geodesic Interpolation**: `mix()` and `gradient()` integrate arc length using the homogeneous degree-1 Riemannian line element $ds = \sqrt{dx^T G(\bar{x}) dx}$ (`use_power_law=False`), achieving **0.03% mean step CV** across sRGB gradients and a sky-blue (`#88a7e6`, $220.2^\circ$ HSV hue) blue-to-white midpoint with zero purple shift.

---

## 4. Quick Start (Python & JavaScript / TypeScript)

### Python
```python
import axiomlab as ax

# Convert hex / sRGB / CIE XYZ to AxiomLab (L, a, b) and cylindrical (L, C, h)
lab = ax.from_hex("#3b82f6")
lch = ax.to_LCh(lab)
xyz = ax.to_XYZ(lab)

# Perceptual color difference (Power-Riemannian Delta E_Ax or Homogeneous Riemannian ds)
de_power = ax.difference("#ff0055", "#00aa88", use_power_law=True)
de_homog = ax.difference("#ff0055", "#00aa88", use_power_law=False)

# Geodesic arc-length color mixing & gradient generation
mid_hex = ax.mix("#0000ff", "#ffffff", t=0.5, metric_step=True)
ramp = ax.gradient("#0000ff", "#ffffff", steps=16, metric_step=True)
```

### JavaScript / TypeScript (Node.js & Browser UMD)
```javascript
const ax = require("./axiomlab.js");

const lab = ax.fromHex("#3b82f6");
const dE = ax.difference("#ff0055", "#00aa88", { usePowerLaw: true });
const mid = ax.mix("#0000ff", "#ffffff", 0.5, true); // "#88a7e6"
const ramp = ax.gradient("#0000ff", "#ffffff", 16, true);
```

---

## 5. Verification & Unit Tests

```bash
# Run Python & JavaScript unit tests
python3 test_axiomlab.py
node test_axiomlab.js

# Verify dataset integrity & run full benchmark / 5-fold CV / parity suite
python3 build_datasets.py
python3 optimize_and_verify.py

# Cross-space comparison with HelmLab (downloads COMBVD on first run)
pip install -e ".[benchmark]"
python3 benchmark_helmlab.py
```

---

## 6. Website (`site/`)

A lightweight Svelte 5 / SvelteKit 3 / Tailwind 4 site with:

- **Playground** — two color pickers, live AxiomLab (power + homogeneous), HelmLab MetricSpace, CIEDE2000, OKLab and CIE76; four live gradient paths; LCh readout; blue→white test.
- **Benchmarks** — STRESS by dataset, ablation, COMBVD cross-check, gradient uniformity under two metrics, and a live in-browser speed test.
- **API** — Python/JavaScript quick start, function surface, pipeline notes, reproduction commands.

The Material 3 role system, spring motion, 35-shape morphing library and ripple attachment are adapted from [material-expressive-svelte](https://github.com/olegpolin/material-expressive-svelte) by **Oleg Polin** (MIT, Copyright © 2026 Oleg Polin). The theme itself is generated by AxiomLab: the Playground's Color A seeds the scheme, and every M3 role is sampled in AxiomLab LCh rather than HCT/Material Color Utilities.

```bash
cd site
npm install
npm run sync
npm run dev      # http://localhost:5173/axiomlab/
npm run build    # static output in site/build
```

Site published at <https://kerneldroid.github.io/axiomlab/>. The npm and PyPI packages are **not published yet**; see the registry status note at the top.

## 7. License and credits

AxiomLab is MIT (see `LICENSE`). The site's M3 token/spring/shape/ripple code and the original Svelte page are by **Oleg Polin** — [material-expressive-svelte](https://github.com/olegpolin/material-expressive-svelte), MIT, Copyright © 2026 Oleg Polin (see `LICENSE-material-expressive-svelte`); the shape library is derived from AOSP under Apache-2.0. HelmLab is MIT, Copyright © 2026 Görkem Yıldız; the comparison uses its published package and COMBVD loader.
