"""
build_datasets.py — Primary-Source Psychophysical & Reference Dataset Loader and Integrity Verifier
for AxiomLab (AxLab / AxLCh) v2.1.0.

Loads and verifies all 10,486 color-difference pairs across 3,814 unique colorimetric stimuli
from `real_datasets.npz`:

A. 6 Primary-Source Human Observer Psychophysical Datasets (10,452 pairs total):
1. MacAdam74 (128 pairs, 59 ceramic tiles):
   D. L. MacAdam (1974), "Uniform color scales", Journal of the Optical Society of America,
   64(12), 1691-1702, Table I (Observed color differences dV of 128 tile pairs judged by
   49-76 observers) & Table II (CIE 1964 10-deg D65 Y, x, y specifications of 59 tiles).
2. OSA-Atlas (3,673 lattice neighbor pairs across 558 official OSA-UCS samples):
   D. L. MacAdam (1978), "Colorimetric data for samples of OSA uniform color scales",
   JOSA 68(1), 121-130 / ASTM E1360-90 Table 1 (558 official (L, j, g) full-step and
   half-step pastel samples -> CIE D65 XYZ, evaluated across lattice steps dV in {1.0, sqrt(2), 2.0, 2*sqrt(2)}).
3. MacAdam42 (216 directional color-matching standard deviation pairs across 25 ellipses):
   D. L. MacAdam (1942), "Visual sensitivities to color differences in daylight",
   JOSA 32(5), 247-274, Table III (Observed standard deviations ds along 216 chromaticity
   directions at constant luminance Y = 0.20, adapted from CIE Illuminant C to D65 via Bradford CAT).
4. Munsell-V (2,251 Value step pairs, dV = 1.0):
   S. M. Newhall, D. Nickerson & D. B. Judd (1943), "Final report of the O.S.A. subcommittee on
   the spacing of the Munsell colors", JOSA 33(7), 385-418, Table I & II (Munsell renotation
   stimuli across 40 hues and 9 value levels V=1..9, adapted from CIE C to D65).
5. Munsell-C (2,369 Chroma step pairs, dV = 2.0):
   Newhall, Nickerson & Judd (1943), Table I (radial chroma steps across 40 hues and 9 value levels).
6. Munsell-H (1,815 Hue step pairs, chordal dV = 2 * C * sin(pi / 40)):
   Newhall, Nickerson & Judd (1943), Table I (circumferential hue steps across 40 hues and 9 value levels).

B. 1 Supplementary Analytical Reference Verification Dataset (34 pairs):
7. CIE-TC147 (34 CIEDE2000 reference test pairs across 5 perceptual regimes):
   G. Sharma, W. Wu & E. N. Dalal (2005), "The CIEDE2000 color-difference formula: Implementation
   notes, supplementary test data, and mathematical observations", Color Research & Application,
   30(1), 21-30, Table I / Luo, Cui & Rigg (2001). Note: Target dV values in this 34-pair table
   are exact analytical CIEDE2000 reference outputs; independent psychophysical averages (Mean6)
   exclude this table to avoid circularity with CIEDE2000.
"""

import os
import numpy as np

EXPECTED_PAIR_COUNTS = {
    "MacAdam74": 128,
    "OSA-Atlas": 3673,
    "MacAdam42": 216,
    "Munsell-V": 2251,
    "Munsell-C": 2369,
    "Munsell-H": 1815,
    "CIE-TC147": 34,
}


def load_real_datasets(npz_path=None):
    """Load and validate all 7 datasets (10,486 pairs total) from real_datasets.npz."""
    if npz_path is None:
        npz_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "real_datasets.npz")
    data = np.load(npz_path)
    datasets = {
        "MacAdam74": (data["X1_m74"].astype(np.float64), data["X2_m74"].astype(np.float64), data["dV_m74"].astype(np.float64)),
        "OSA-Atlas": (data["X1_osa"].astype(np.float64), data["X2_osa"].astype(np.float64), data["dV_osa"].astype(np.float64)),
        "MacAdam42": (data["X1_m42"].astype(np.float64), data["X2_m42"].astype(np.float64), data["dV_m42"].astype(np.float64)),
        "Munsell-V": (data["X1_mv"].astype(np.float64),  data["X2_mv"].astype(np.float64),  data["dV_mv"].astype(np.float64)),
        "Munsell-C": (data["X1_mc"].astype(np.float64),  data["X2_mc"].astype(np.float64),  data["dV_mc"].astype(np.float64)),
        "Munsell-H": (data["X1_mh"].astype(np.float64),  data["X2_mh"].astype(np.float64),  data["dV_mh"].astype(np.float64)),
        "CIE-TC147": (data["X1_tc"].astype(np.float64),  data["X2_tc"].astype(np.float64),  data["dV_tc"].astype(np.float64)),
    }
    verify_datasets(datasets)
    return datasets


def verify_datasets(datasets):
    """Verify structural integrity, positivity, and pair counts of all loaded datasets."""
    for name, expected_n in EXPECTED_PAIR_COUNTS.items():
        if name not in datasets:
            raise ValueError(f"Missing dataset {name!r}")
        x1, x2, dv = datasets[name]
        if x1.shape != (expected_n, 3) or x2.shape != (expected_n, 3) or dv.shape != (expected_n,):
            raise ValueError(
                f"Shape mismatch in {name}: expected ({expected_n}, 3), got {x1.shape}, {x2.shape}, {dv.shape}"
            )
        if not (np.all(np.isfinite(x1)) and np.all(np.isfinite(x2)) and np.all(np.isfinite(dv))):
            raise ValueError(f"Non-finite values detected in dataset {name}")
        if np.any(dv <= 0.0):
            raise ValueError(f"Non-positive dV values detected in dataset {name}")


if __name__ == "__main__":
    ds = load_real_datasets()
    total = sum(len(v[2]) for v in ds.values())
    psych_total = sum(len(ds[k][2]) for k in list(ds.keys())[:-1])
    all_pts = np.vstack([np.vstack([x1, x2]) for (x1, x2, _) in ds.values()])
    uniq_global = len(np.unique(np.round(all_pts, 6), axis=0))
    print(f"Verified {len(ds)} datasets ({total} total pairs; {psych_total} human psychophysical pairs; {uniq_global} unique stimuli):")
    for k, (x1, x2, dv) in ds.items():
        uniq_k = len(np.unique(np.round(np.vstack([x1, x2]), 6), axis=0))
        print(f"  - {k:12s}: {len(dv):4d} pairs | {uniq_k:4d} unique stimuli | dV range: [{dv.min():.4f}, {dv.max():.4f}]")
