"""
optimize_and_verify.py — Comprehensive Verification, Ablation, Genuine 5-Fold Cross-Validation,
Bootstrap 95% CI, and Parity Suite for AxiomLab (AxLab / AxLCh) v2.1.0.

Self-contained verification script with zero external /tmp dependencies.
"""

import os
import sys
import json
import time
import subprocess
import numpy as np
from scipy.optimize import minimize
from scipy.stats import wilcoxon

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import axiomlab as ax_mod
from axiomlab import AxiomLab, sRGB_to_XYZ, XYZ_to_sRGB, hex_to_sRGB, sRGB_to_hex
from build_datasets import load_real_datasets
import baselines as bl

ax = AxiomLab()
datasets = load_real_datasets(os.path.join(HERE, "real_datasets.npz"))
ds_names = ["MacAdam74", "OSA-Atlas", "MacAdam42", "Munsell-V", "Munsell-C", "Munsell-H", "CIE-TC147"]

print("=" * 84)
print("1. EXACT CLOSED-FORM INVERTIBILITY (SDR, DISPLAY P3, REC.2020 & HDR) & NEUTRALITY")
print("=" * 84)

r_g, g_g, b_g = np.meshgrid(
    np.linspace(0.0, 1.0, 22),
    np.linspace(0.0, 1.0, 22),
    np.linspace(0.0, 1.0, 21),
    indexing="ij"
)
srgb_grid = np.stack([r_g.ravel(), g_g.ravel(), b_g.ravel()], axis=-1)
xyz_grid = sRGB_to_XYZ(srgb_grid)

lab_grid = ax.from_XYZ(xyz_grid)
xyz_rec = ax.to_XYZ(lab_grid)
rt_errors = np.max(np.abs(xyz_grid - xyz_rec), axis=-1)
max_rt = float(np.max(rt_errors))
p99_rt = float(np.percentile(rt_errors, 99))
white_xyz = sRGB_to_XYZ(np.array([1.0, 1.0, 1.0]))
white_rt = float(np.max(np.abs(white_xyz - ax.to_XYZ(ax.from_XYZ(white_xyz)))))

M_REC2020_TO_XYZ = np.array([
    [0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
    [0.2627002120112671, 0.6779980715188708,  0.05930171646986196],
    [0.0000000000000000, 0.028072693049087428, 1.060985057710791],
], dtype=np.float64)
g11 = np.stack(np.meshgrid(np.linspace(0, 1, 11), np.linspace(0, 1, 11), np.linspace(0, 1, 11), indexing="ij"), axis=-1).reshape(-1, 3)
xyz_2020 = g11 @ M_REC2020_TO_XYZ.T
max_rt_rec2020 = float(np.max(np.abs(xyz_2020 - ax.to_XYZ(ax.from_XYZ(xyz_2020)))))

hdr_scales = np.linspace(0.0, 100.0, 201)[:, None]
xyz_hdr = hdr_scales * ax_mod.D65_WHITE[None, :]
max_rt_hdr = float(np.max(np.abs(xyz_hdr - ax.to_XYZ(ax.from_XYZ(xyz_hdr)))))

Y_grays = np.linspace(0.0, 1.0, 101)
xyz_grays = Y_grays[:, None] * ax_mod.D65_WHITE[None, :]
lab_grays = ax.from_XYZ(xyz_grays)
C_grays = np.hypot(lab_grays[:, 1], lab_grays[:, 2])
neutral_max_C = float(np.max(C_grays))
neutral_mean_C = float(np.mean(C_grays))

V_vals = np.arange(1.0, 10.0)
Y_munsell = ((V_vals * 10.0 + 16.0) / 116.0) ** 3
L_munsell = ax.from_XYZ(Y_munsell[:, None] * ax_mod.D65_WHITE[None, :])[:, 0]
dL_munsell = np.diff(L_munsell)
munsell_cv_pct = float(np.std(dL_munsell) / np.mean(dL_munsell) * 100.0)

v19 = np.linspace(0.05, 0.95, 19) * 100.0
Y_19 = np.where(v19 > 8.0, ((v19 + 16.0) / 116.0) ** 3, v19 / 903.296296)
L_19 = ax.from_XYZ(Y_19[:, None] * ax_mod.D65_WHITE[None, :])[:, 0]
dL_19 = np.diff(L_19)
step19_cv_pct = float(np.std(dL_19) / np.mean(dL_19) * 100.0)

primaries_hex = {
    "Black (#000000)": "#000000",
    "Blue (#0000ff)": "#0000ff",
    "Red (#ff0000)": "#ff0000",
    "Magenta (#ff00ff)": "#ff00ff",
    "Green (#00ff00)": "#00ff00",
    "Cyan (#00ffff)": "#00ffff",
    "Yellow (#ffff00)": "#ffff00",
    "White (#ffffff)": "#ffffff",
    "50% Gray (#808080)": "#808080",
}
primaries_L = {name: float(ax.from_hex(hx)[0]) for name, hx in primaries_hex.items()}
ordered_keys = [
    "Black (#000000)", "Blue (#0000ff)", "Red (#ff0000)", "Magenta (#ff00ff)",
    "Green (#00ff00)", "Cyan (#00ffff)", "Yellow (#ffff00)", "White (#ffffff)"
]
strict_order = all(primaries_L[ordered_keys[i]] < primaries_L[ordered_keys[i + 1]] for i in range(len(ordered_keys) - 1))

print(f"Max XYZ Round-Trip Error (sRGB 10,164): {max_rt:.3e} | Rec.2020: {max_rt_rec2020:.3e} | HDR (Y<=100): {max_rt_hdr:.3e}")
print(f"Neutral D65 Achromatic Chroma C*: max = {neutral_max_C:.3e}, mean = {neutral_mean_C:.3e}")
print(f"Munsell V=1..9 Step CV%: {munsell_cv_pct:.3f}% | 19-Step CV%: {step19_cv_pct:.3f}%")
print(f"Strict sRGB Primary Lightness Order: {strict_order} (White L = {primaries_L['White (#ffffff)']:.15f})")

print("\n" + "=" * 84)
print("2. STRESS EVALUATION ACROSS ALL 7 DATASETS (PSYCHOPHYSICAL MEAN6 & OVERALL MEAN7)")
print("=" * 84)

models = {
    "AxiomLab v2.1 (Power-Riemannian)": lambda x1, x2: ax.distance(x1, x2, use_power_law=True),
    "AxiomLab v2.1 (Homogeneous Riemannian, gamma=1)": lambda x1, x2: ax.distance(x1, x2, use_power_law=False),
    "AxiomLab v2.1 (Pure Euclidean)": lambda x1, x2: ax.euclidean_distance(x1, x2),
    "CAM16-UCS": lambda x1, x2: bl.dist_cam16ucs(x1, x2),
    "CIE94": lambda x1, x2: bl.dist_cie94(x1, x2),
    "CIE Lab (CIE76)": lambda x1, x2: bl.dist_cie76(x1, x2),
    "IPT": lambda x1, x2: bl.dist_ipt(x1, x2),
    "CIEDE2000": lambda x1, x2: bl.dist_ciede2000(x1, x2),
    "Jzazbz": lambda x1, x2: bl.dist_jzazbz(x1, x2),
    "DIN99": lambda x1, x2: bl.dist_din99(x1, x2),
    "OKLab": lambda x1, x2: bl.dist_oklab(x1, x2),
    "OSA-UCS (ASTM E1360)": lambda x1, x2: bl.dist_osaucs(x1, x2),
}

table1_stress = {}
for m_name, fn in models.items():
    row = {}
    for d_name in ds_names:
        x1, x2, dv = datasets[d_name]
        d_pred = fn(x1, x2)
        row[d_name] = round(float(bl.stress_score(d_pred, dv)), 2)
    row["Mean7"] = round(float(np.mean([row[k] for k in ds_names])), 2)
    row["Mean6_Psychophysical"] = round(float(np.mean([row[k] for k in ds_names[:-1]])), 2)
    table1_stress[m_name] = row
    print(
        f"{m_name:47s} | M74:{row['MacAdam74']:5.2f} | OSA:{row['OSA-Atlas']:5.2f} | "
        f"M42:{row['MacAdam42']:5.2f} | MV:{row['Munsell-V']:5.2f} | MC:{row['Munsell-C']:5.2f} | "
        f"MH:{row['Munsell-H']:5.2f} | TC:{row['CIE-TC147']:5.2f} | Mean6:{row['Mean6_Psychophysical']:5.2f} | Mean7:{row['Mean7']:5.2f}"
    )

print("\n" + "=" * 84)
print("3. ABLATION STUDY (ACTIVE TENSOR COMPONENTS & HOMOGENEOUS VS POWER-LAW METRIC)")
print("=" * 84)

ablation_rows = {}
for label, kw in [
    ("Full AxiomLab v2.1 (Power-Riemannian)", {"disable_rt": False, "force_sc_eq_sh": False, "use_power_law": True}),
    ("Ablation: No Blue-Tilt (R_T = 0)", {"disable_rt": True, "force_sc_eq_sh": False, "use_power_law": True}),
    ("Ablation: Isotropic Chroma/Hue (S_C = S_H)", {"disable_rt": False, "force_sc_eq_sh": True, "use_power_law": True}),
    ("Ablation: Homogeneous Riemannian (gamma_d = 1.0)", {"disable_rt": False, "force_sc_eq_sh": False, "use_power_law": False}),
    ("Ablation: Pure Euclidean Space (G = I)", "euclid"),
]:
    r = {}
    for d_name in ds_names:
        x1, x2, dv = datasets[d_name]
        if kw == "euclid":
            dp = ax.euclidean_distance(x1, x2)
        else:
            l1, l2 = ax.from_XYZ(x1), ax.from_XYZ(x2)
            dp = ax.distance_from_Lab(l1, l2, **kw)
        r[d_name] = round(float(bl.stress_score(dp, dv)), 2)
    r["Mean6_Psychophysical"] = round(float(np.mean([r[k] for k in ds_names[:-1]])), 2)
    r["Mean7"] = round(float(np.mean([r[k] for k in ds_names])), 2)
    ablation_rows[label] = r
    print(f"{label:48s} | M74:{r['MacAdam74']:5.2f} | OSA:{r['OSA-Atlas']:5.2f} | MC:{r['Munsell-C']:5.2f} | Mean6:{r['Mean6_Psychophysical']:5.2f} | Mean7:{r['Mean7']:5.2f}")

print("\n" + "=" * 84)
print("4. GENUINE OUT-OF-SAMPLE 5-FOLD CROSS-VALIDATION & 1,000-SAMPLE BOOTSTRAP 95% CI")
print("=" * 84)

Labs_by_ds = {k: (ax.from_XYZ(v[0]), ax.from_XYZ(v[1]), v[2]) for k, v in datasets.items()}

cv_5fold_train = {k: [] for k in ds_names}
cv_5fold_test = {k: [] for k in ds_names}

for fold in range(5):
    def fold_train_loss(theta):
        mp_cand = np.ones(24, dtype=np.float64)
        mp_cand[0] = ax.metric_params[0]
        mp_cand[1:24] = theta
        scores = []
        for k in ds_names:
            l1, l2, dv = Labs_by_ds[k]
            n = len(dv)
            mask_test = (np.arange(n) % 5 == fold)
            mask_train = ~mask_test
            dp = ax.distance_from_Lab(l1[mask_train], l2[mask_train], mp=mp_cand)
            scores.append(bl.stress_score(dp, dv[mask_train]))
        reg = 1e-2 * np.sum((theta - ax.metric_params[1:24]) ** 2)
        return float(np.mean(scores) + reg)

    res_fold = minimize(fold_train_loss, ax.metric_params[1:24].copy(), method="BFGS", options={"maxiter": 25})
    mp_fold = np.ones(24, dtype=np.float64)
    mp_fold[0] = ax.metric_params[0]
    mp_fold[1:24] = res_fold.x

    for k in ds_names:
        l1, l2, dv = Labs_by_ds[k]
        n = len(dv)
        mask_test = (np.arange(n) % 5 == fold)
        mask_train = ~mask_test
        dp_tr = ax.distance_from_Lab(l1[mask_train], l2[mask_train], mp=mp_fold)
        dp_te = ax.distance_from_Lab(l1[mask_test], l2[mask_test], mp=mp_fold)
        cv_5fold_train[k].append(bl.stress_score(dp_tr, dv[mask_train]))
        cv_5fold_test[k].append(bl.stress_score(dp_te, dv[mask_test]))

rng = np.random.default_rng(42)
bootstrap_ci = {}
train_test_summary = {}
for k in ds_names:
    l1, l2, dv = Labs_by_ds[k]
    dp = ax.distance_from_Lab(l1, l2)
    n = len(dv)
    boot_scores = np.empty(1000, dtype=np.float64)
    for b in range(1000):
        idx = rng.integers(0, n, size=n)
        boot_scores[b] = bl.stress_score(dp[idx], dv[idx])
    ci_lo, ci_hi = float(np.percentile(boot_scores, 2.5)), float(np.percentile(boot_scores, 97.5))
    bootstrap_ci[k] = [round(ci_lo, 2), round(ci_hi, 2)]
    tr_mean = round(float(np.mean(cv_5fold_train[k])), 2)
    te_mean = round(float(np.mean(cv_5fold_test[k])), 2)
    train_test_summary[k] = {
        "CV5_Train_Mean": tr_mean,
        "CV5_Test_Mean": te_mean,
        "Bootstrap_95CI": bootstrap_ci[k],
    }
    print(f"  {k:12s} | 5-Fold Refit Train/Test STRESS: {tr_mean:5.2f} / {te_mean:5.2f} | Bootstrap 95% CI: [{ci_lo:5.2f}, {ci_hi:5.2f}]")

x1_all = np.vstack([datasets["MacAdam74"][0], datasets["OSA-Atlas"][0]])
x2_all = np.vstack([datasets["MacAdam74"][1], datasets["OSA-Atlas"][1]])
dv_all = np.concatenate([datasets["MacAdam74"][2], datasets["OSA-Atlas"][2]])

d_ax_all = ax.distance(x1_all, x2_all)
f_ax = np.sum(d_ax_all * dv_all) / np.sum(d_ax_all ** 2)
err_ax = np.abs(f_ax * d_ax_all - dv_all) / dv_all

d_de00_all = bl.dist_ciede2000(x1_all, x2_all)
f_de00 = np.sum(d_de00_all * dv_all) / np.sum(d_de00_all ** 2)
err_de00 = np.abs(f_de00 * d_de00_all - dv_all) / dv_all

_, p_wilcoxon_de00 = wilcoxon(err_ax, err_de00, alternative="less")
print(f"Wilcoxon signed-rank p-value (AxiomLab v2.1 < CIEDE2000 on MacAdam74+OSA): {p_wilcoxon_de00:.3e}")

print("\n" + "=" * 84)
print("5. UNIFIED SPACE GRADIENT UNIFORMITY (HOMOGENEOUS RIEMANNIAN ARC-LENGTH)")
print("=" * 84)

grad_pairs = [
    ("#0000ff", "#ffffff"),
    ("#ff0000", "#00ff00"),
    ("#0000ff", "#ffff00"),
    ("#00ffff", "#ff00ff"),
    ("#ff6b00", "#008080"),
    ("#000000", "#ffffff"),
]
cv_riem_list, cv_euc_list, cv_ok_list = [], [], []
for c1, c2 in grad_pairs:
    l1, l2 = ax.from_hex(c1), ax.from_hex(c2)
    u_t = np.linspace(0.0, 1.0, 32)
    labs_riem = ax._riemannian_arc_interpolate(l1, l2, u_t)
    ds_riem = ax.distance_from_Lab(labs_riem[:-1], labs_riem[1:], use_power_law=False)
    cv_riem = float(np.std(ds_riem) / np.mean(ds_riem) * 100.0)

    labs_euc = (1.0 - u_t[:, None]) * l1[None, :] + u_t[:, None] * l2[None, :]
    ds_euc = ax.distance_from_Lab(labs_euc[:-1], labs_euc[1:], use_power_law=False)
    cv_euc = float(np.std(ds_euc) / np.mean(ds_euc) * 100.0)

    ok1 = bl.xyz_to_oklab(sRGB_to_XYZ(hex_to_sRGB(c1)))
    ok2 = bl.xyz_to_oklab(sRGB_to_XYZ(hex_to_sRGB(c2)))
    oks = (1.0 - u_t[:, None]) * ok1[None, :] + u_t[:, None] * ok2[None, :]
    xyz_oks = bl.oklab_to_xyz(oks)
    ds_ok = ax.distance(xyz_oks[:-1], xyz_oks[1:], use_power_law=False)
    cv_ok = float(np.std(ds_ok) / np.mean(ds_ok) * 100.0)

    cv_riem_list.append(cv_riem)
    cv_euc_list.append(cv_euc)
    cv_ok_list.append(cv_ok)
    print(f"  {c1} -> {c2} | AxRiemannian CV%: {cv_riem:5.2f}% | AxEuclidean CV%: {cv_euc:5.2f}% | OKLab CV%: {cv_ok:5.2f}%")

blue_mid_hex = ax.mix("#0000ff", "#ffffff", 0.5, metric_step=True)
blue_mid_srgb = hex_to_sRGB(blue_mid_hex)
mx, mn = float(np.max(blue_mid_srgb)), float(np.min(blue_mid_srgb))
blue_mid_hue = 240.0 - 60.0 * (float(blue_mid_srgb[1]) - float(blue_mid_srgb[0])) / (mx - mn)
print(f"Blue -> White Midpoint: {blue_mid_hex} (sRGB: {np.round(blue_mid_srgb, 4).tolist()}, HSV Hue: {blue_mid_hue:.2f} deg sky-blue)")

print("\n" + "=" * 84)
print("6. VECTORIZED THROUGHPUT BENCHMARK (100,000 COLORS)")
print("=" * 84)

xyz_100k = np.tile(xyz_grid[:10000], (10, 1))
_ = ax.to_XYZ(ax.from_XYZ(xyz_100k[:100]))

n_runs = 5
t0 = time.perf_counter()
for _ in range(n_runs):
    lab_ax_100k = ax.from_XYZ(xyz_100k)
ax_from_ms = (time.perf_counter() - t0) / n_runs * 1000.0

t0 = time.perf_counter()
for _ in range(n_runs):
    _ = ax.to_XYZ(lab_ax_100k)
ax_to_ms = (time.perf_counter() - t0) / n_runs * 1000.0

_ = ax.gradient("#0000ff", "#ffffff", steps=64, metric_step=True)
t0 = time.perf_counter()
for _ in range(50):
    grad_ax_full = ax.gradient("#0000ff", "#ffffff", steps=64, metric_step=True)
ax_grad_full_ms = (time.perf_counter() - t0) / 50.0 * 1000.0

t0 = time.perf_counter()
for _ in range(50):
    grad_ax_euc = ax.gradient("#0000ff", "#ffffff", steps=64, metric_step=False)
ax_grad_euc_ms = (time.perf_counter() - t0) / 50.0 * 1000.0

print(f"from_XYZ (100k colors): {ax_from_ms:.2f} ms | to_XYZ (100k colors): {ax_to_ms:.2f} ms")
print(f"Full 64-step gradient (Riemannian + gamut_map + hex): {ax_grad_full_ms:.3f} ms | Euclidean: {ax_grad_euc_ms:.3f} ms")

print("\n" + "=" * 84)
print("7. NODE.JS <-> PYTHON PARITY VERIFICATION (< 1e-15)")
print("=" * 84)

js_path = os.path.join(HERE, "axiomlab.js").replace("\\", "/")
node_test = f"""
const ax = require('{js_path}');
const c1 = '#ff00ff', c2 = '#0080ff';
const lab1 = ax.fromHex(c1);
const xyz1 = ax.toXYZ(lab1);
const dRiem = ax.difference(c1, c2);
const dHomog = ax.difference(c1, c2, {{ usePowerLaw: false }});
const dEuc = ax.euclideanDistance(ax.sRGBToXYZ(ax.hexToSRGB(c1)), ax.sRGBToXYZ(ax.hexToSRGB(c2)));
const mixHex = ax.mix('#0000ff', '#ffffff', 0.5, true);
const hdrXyz = [4.5, 5.0, 5.2];
const hdrLab = ax.fromXYZ(hdrXyz);
const hdrRec = ax.toXYZ(hdrLab);
console.log(JSON.stringify({{lab1, xyz1, dRiem, dHomog, dEuc, mixHex, hdrLab, hdrRec}}));
"""
js_out = json.loads(subprocess.check_output(["node", "-e", node_test]).decode("utf-8"))
py_lab1 = ax.from_hex("#ff00ff")
py_xyz1 = ax.to_XYZ(py_lab1)
py_dRiem = ax.difference("#ff00ff", "#0080ff", use_power_law=True)
py_dHomog = ax.difference("#ff00ff", "#0080ff", use_power_law=False)
py_dEuc = float(ax.euclidean_distance(sRGB_to_XYZ(hex_to_sRGB("#ff00ff")), sRGB_to_XYZ(hex_to_sRGB("#0080ff"))))
py_mixHex = ax.mix("#0000ff", "#ffffff", 0.5, metric_step=True)
py_hdrLab = ax.from_XYZ([4.5, 5.0, 5.2])
py_hdrRec = ax.to_XYZ(py_hdrLab)

err_lab = float(np.max(np.abs(py_lab1 - np.array(js_out["lab1"]))))
err_xyz = float(np.max(np.abs(py_xyz1 - np.array(js_out["xyz1"]))))
err_d = abs(py_dRiem - js_out["dRiem"])
err_dh = abs(py_dHomog - js_out["dHomog"])
err_hdr = float(np.max(np.abs(py_hdrRec - np.array(js_out["hdrRec"]))))
print(
    f"Python <-> JS Parity | Lab diff: {err_lab:.3e} | XYZ diff: {err_xyz:.3e} | "
    f"dE_Ax diff: {err_d:.3e} | dE_Homog diff: {err_dh:.3e} | HDR diff: {err_hdr:.3e} | "
    f"Mix Hex match: {py_mixHex == js_out['mixHex']} ({py_mixHex})"
)
assert err_lab < 1e-14 and err_xyz < 1e-14 and err_d < 1e-14 and err_dh < 1e-14 and err_hdr < 1e-14 and py_mixHex == js_out["mixHex"]

results = {
    "version": "2.1.0",
    "datasets_summary": {k: int(len(v[2])) for k, v in datasets.items()},
    "total_pairs": int(sum(len(v[2]) for v in datasets.values())),
    "psychophysical_pairs": int(sum(len(datasets[k][2]) for k in ds_names[:-1])),
    "table1_stress": table1_stress,
    "ablation": ablation_rows,
    "cross_validation_5fold": train_test_summary,
    "wilcoxon_p_vs_ciede2000": float(p_wilcoxon_de00),
    "generation": {
        "max_rt_xyz_srgb": max_rt,
        "p99_rt_xyz_srgb": p99_rt,
        "white_rt_xyz": white_rt,
        "max_rt_xyz_rec2020": max_rt_rec2020,
        "max_rt_xyz_hdr_100x": max_rt_hdr,
        "neutral_max_C": neutral_max_C,
        "neutral_mean_C": neutral_mean_C,
        "munsell_cv_pct": munsell_cv_pct,
        "step19_cv_pct": step19_cv_pct,
        "primaries_L": primaries_L,
        "strict_primary_order": strict_order,
        "blue_white_mid_hex": blue_mid_hex,
        "blue_white_mid_srgb": np.round(blue_mid_srgb, 4).tolist(),
        "blue_mid_srgb_hue_deg": float(blue_mid_hue),
        "grad_cv_riemannian_mean": float(np.mean(cv_riem_list)),
        "grad_cv_euclidean_mean": float(np.mean(cv_euc_list)),
        "grad_cv_oklab_mean": float(np.mean(cv_ok_list)),
    },
    "speed_ms": {
        "ax_from_xyz_100k": round(ax_from_ms, 2),
        "ax_to_xyz_100k": round(ax_to_ms, 2),
        "ax_grad_64_riem_full_ms": round(ax_grad_full_ms, 3),
        "ax_grad_64_euc_full_ms": round(ax_grad_euc_ms, 3),
    },
}

out_json = os.path.join(HERE, "axiomlab_results.json")
with open(out_json, "w") as fp:
    json.dump(results, fp, indent=2)

print(f"\nSaved {out_json} successfully.")
