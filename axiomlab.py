"""
AxiomLab (AxLab / AxLCh) v2.1.0 — Unified Closed-Form Perceptual Color Space
& Midpoint Riemannian / Power-Riemannian Metric Tensor.

Calibrated and validated on 6 primary-source human psychophysical datasets (10,452 pairs)
plus the CIE TC 1-47 / Sharma et al. (2005) reference verification table (34 pairs; 10,486 total):
1. MacAdam (1974) JOSA 64(12), Table I & II (128 pairs, 59 ceramic tiles)
2. OSA-UCS Uniform Color Scales Atlas, MacAdam (1978) / ASTM E1360-90 Table 1 (3,673 pairs, 558 samples)
3. MacAdam (1942) JOSA 32(5), Table III (216 directional discrimination pairs across 25 ellipses)
4. Munsell Renotation Value Steps, Newhall, Nickerson & Judd (1943) JOSA 33(7) (2,251 pairs)
5. Munsell Renotation Chroma Steps, Newhall et al. (1943) Table I (2,369 pairs)
6. Munsell Renotation Hue Steps, Newhall et al. (1943) Table I (1,815 pairs)
7. CIE TC 1-47 / Sharma, Wu & Dalal (2005) Color Res. Appl. 30(1), Table I (34 CIEDE2000 reference pairs)

Key Mathematical Properties:
- Globally Monotonic & Pole-Free Forward/Inverse Transform (from_XYZ / to_XYZ):
  Uses a 2-stage quadratic Pade lightness curve on the SDR/WCG domain |L0| <= 1.2 with
  exact C^1-smooth linear HDR continuation for |L0| > 1.2 and branch-stable Citardauq
  quadratic inversion (< 3e-15 round-trip error across sRGB, Display P3, Rec.2020, and HDR).
- Exact D65 Achromatic Neutrality:
  D65 white maps to (L, a, b) = (1.0, 0.0, 0.0) and neutral grays have C* < 1e-15.
- Strictly Positive-Definite Midpoint Riemannian Metric Tensor (lambda_min > 0.134):
  distance_from_Lab(..., use_power_law=False) evaluates the homogeneous degree-1 Riemannian
  line element ds = sqrt(dx^T G(x_bar) dx), which is used directly for subdivision-invariant
  geodesic arc-length reparameterization in mix() and gradient(). Setting use_power_law=True
  (default) applies the global Stevens exponent ds ** gamma_d for supra-threshold Delta E_Ax.
"""

import numpy as np

__version__ = "2.1.0"

D65_WHITE = np.array([0.95047, 1.00000, 1.08883], dtype=np.float64)

M_SRGB_TO_XYZ = np.array([
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151521, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041],
], dtype=np.float64)

M_XYZ_TO_SRGB = np.array([
    [ 3.2404549850111395, -1.5371391384715571, -0.4985315532562290],
    [-0.9692665717111220,  1.8760112807842577,  0.04155609014264147],
    [ 0.05564343937975769, -0.20402589254317857,  1.0572251616100772],
], dtype=np.float64)

EPS_CBRT = 1.8500000000000000e-04
ALPHA_CBRT = float(EPS_CBRT ** (1.0 / 3.0))
BETA_CBRT = float((1.0 + EPS_CBRT) ** (1.0 / 3.0) - ALPHA_CBRT)
PADE_HDR_KNOT = 1.20

M1 = np.array([
    [0.8007897293525293, 0.35817808694125236, -0.10957146753758704],
    [0.01891636921953598, 0.9414338308734829, 0.03727554133742159],
    [0.03034578742007905, 0.20056152129983834, 0.7077282203199756],
], dtype=np.float64)

M1_INV = np.array([
    [ 1.2527456813274809, -0.5238165552254749,  0.22154087389799396],
    [-0.023306303134405886, 1.0840085771597772, -0.060702274025371365],
    [-0.04711018377845677, -0.2847347014283811,  1.4206748852068378],
], dtype=np.float64)

M2 = np.array([
    [0.17907775423005695,  0.8210659807828020, -0.0001437350128589846],
    [2.0924236161521470,  -2.3840248667013424,  0.2916012505491957],
    [0.2509357737699382,   0.6507451704957752, -0.9016809442657134],
], dtype=np.float64)

M2_INV = np.array([
    [1.0,  0.3777012641845808,  0.12198818956626749],
    [1.0, -0.0823701527542963, -0.026797699028249126],
    [1.0,  0.045666685257185376, -1.09443066170934],
], dtype=np.float64)

PADE_PARAMS = [
    1.5222037803232455,
    2.1821122750109523,
    -1.4891495361303222,
    0.005039997830872463,
    0.3450927054189581,
    2.1785242831924148,
]

SPACE_PARAMS = {
    "M1": [
        [0.8007897293525293, 0.35817808694125236, -0.10957146753758704],
        [0.01891636921953598, 0.9414338308734829, 0.03727554133742159],
        [0.03034578742007905, 0.20056152129983834, 0.7077282203199756],
    ],
    "M2": [
        [0.17907775423005695, 0.8210659807828020, -0.0001437350128589846],
        [2.0924236161521470, -2.3840248667013424, 0.2916012505491957],
        [0.2509357737699382, 0.6507451704957752, -0.9016809442657134],
    ],
    "pade": [
        1.5222037803232455,
        2.1821122750109523,
        -1.4891495361303222,
        0.005039997830872463,
        0.3450927054189581,
        2.1785242831924148,
    ],
    "g_a": 0.09108176399298708,
    "kappa_a": 1.964812539418274,
    "shear1_c0": -0.24936110753013221,
    "shear1_L": 0.059715714318523856,
    "shear2_c0": 0.03970266027475921,
    "shear2_neg_b": -0.24607408878759918,
    "shear2_L": -0.1605439353377005,
    "shear3_c0": 0.12997695200629483,
    "shear3_L": -0.24971161904287326,
    "gamma0": 0.9770459026098068,
    "gamma_u": 0.026889860139027753,
    "gamma_v": 0.04165173612424408,
    "gamma_u2": -0.07764175072350689,
    "gamma_v2": 0.03496869257405992,
    "beta0": 1.2657900219775893,
    "beta_u": -0.799221944093932,
    "beta_v": -0.8004857191382329,
    "beta_u2": -0.26468566797414494,
    "beta_v2": 0.5998831658127969,
    "G0": 1.7213446738671885,
    "G_u": -0.0232299702538535,
    "G_v": 0.01798617639199676,
    "G_u2": -0.08820220504820131,
    "G_v2": 0.18195719702099028,
    "G_u3": -0.025747467334393283,
    "G_v3": -0.030179780726695575,
    "G_L": 0.24869414280778906,
    "hk_weight": 0.009888920447732793,
    "hk_u": -0.10014527480468145,
    "hk_v": 0.0999809494722004,
    "hk_u2": 0.08001627475470999,
    "hk_v2": 0.08011416522563647,
    "hk_sat": 1.972384619283746,
}

# 24 strictly interior parameters of the Positive-Definite Midpoint Riemannian Metric Tensor:
# [0..3]:   S_L lightness weight (sl0, sl_quad, sl_lin, sl_C)
# [4..11]:  S_C radial chroma weight (sc0, sc_C, and 3-harmonic Chebyshev sc_u1..sc_v3)
# [12..19]: S_H tangential hue weight (sh0, sh_C, and 3-harmonic Chebyshev sh_u1..sh_v3)
# [20..22]: R_T blue-region ellipse tilt (rt_amp = 1.7318 < 2.0, rt_theta [rad], rt_width)
# [23]:     gamma_d Stevens power exponent
METRIC_PARAMS = np.array([
    0.9465009484606366,
    0.07285594710490119,
    -0.1257156856395571,
    -0.049907693882207706,
    0.9259817202251951,
    0.036235611086628046,
    0.03760691276146205,
    0.05735381895409998,
    -0.019409421349135418,
    -0.03517077215651313,
    0.06170619988807013,
    0.030165782422177496,
    0.9269454908628749,
    -0.08151019240844108,
    0.06618187932713654,
    -0.04516514198437625,
    0.03374470057201408,
    -0.016649187134725758,
    -0.05107822218110661,
    -0.00922828383919965,
    1.731849261538462,
    3.9875348753332647,
    8.051624752937407,
    0.8194322324209308,
], dtype=np.float64)


def sRGB_to_XYZ(srgb):
    """Convert non-linear sRGB (including extended negative/WCG values) to CIE XYZ (D65, Y=1)."""
    srgb = np.asarray(srgb, dtype=np.float64)
    s = np.sign(srgb)
    a = np.abs(srgb)
    lin = s * np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    return lin @ M_SRGB_TO_XYZ.T


def XYZ_to_sRGB(xyz):
    """Convert CIE XYZ (D65, Y=1) to non-linear extended sRGB."""
    xyz = np.asarray(xyz, dtype=np.float64)
    lin = xyz @ M_XYZ_TO_SRGB.T
    s = np.sign(lin)
    a = np.abs(lin)
    return s * np.where(a <= 0.0031308, 12.92 * a, 1.055 * (a ** (1.0 / 2.4)) - 0.055)


def hex_to_sRGB(hex_str):
    """Parse '#rrggbb' or '#rgb' hex string to sRGB float array in [0, 1]."""
    h = str(hex_str).strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        raise ValueError(f"Invalid hex color string: {hex_str!r}")
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)], dtype=np.float64) / 255.0


def sRGB_to_hex(srgb):
    """Format sRGB float array in [0, 1] to '#rrggbb' hex string."""
    rgb = np.clip(np.round(np.asarray(srgb, dtype=np.float64) * 255.0), 0, 255).astype(int)
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"


def psi_fwd(x):
    """Regularized cube-root cone response with finite slope at 0 and psi(0)=0, psi(1)=1."""
    x = np.asarray(x, dtype=np.float64)
    return np.sign(x) * (np.cbrt(np.abs(x) + EPS_CBRT) - ALPHA_CBRT) / BETA_CBRT


def psi_inv(u):
    """Exact closed-form inverse of psi_fwd."""
    u = np.asarray(u, dtype=np.float64)
    return np.sign(u) * (((np.abs(u) * BETA_CBRT + ALPHA_CBRT) ** 3) - EPS_CBRT)


def _quad_root_pos(A, B, y):
    """Branch-stable positive root of A * x^2 + B * x - y = 0 for y >= 0."""
    disc = np.maximum(0.0, B * B + 4.0 * A * y)
    sqrt_d = np.sqrt(disc)
    return np.where(
        B >= 0.0,
        (2.0 * y) / (B + sqrt_d + 1e-30),
        (-B + sqrt_d) / (2.0 * A + 1e-30),
    )


def _pade_step_fwd(x, p1, q1, q2):
    """Single Pade rational step on [0, PADE_HDR_KNOT] with C^1-smooth linear HDR continuation."""
    p2 = 1.0 + q1 + q2 - p1
    x0 = PADE_HDR_KNOT
    denom0 = 1.0 + q1 * x0 + q2 * x0 * x0
    y0 = (p1 * x0 + p2 * x0 * x0) / denom0
    slope0 = (p1 + 2.0 * p2 * x0 + (p2 * q1 - p1 * q2) * x0 * x0) / (denom0 * denom0)
    xc = np.minimum(x, x0)
    y_pade = (p1 * xc + p2 * xc * xc) / (1.0 + q1 * xc + q2 * xc * xc)
    return np.where(x <= x0, y_pade, y0 + slope0 * (x - x0))


def _pade_step_inv(y, p1, q1, q2):
    """Exact closed-form inverse of _pade_step_fwd."""
    p2 = 1.0 + q1 + q2 - p1
    x0 = PADE_HDR_KNOT
    denom0 = 1.0 + q1 * x0 + q2 * x0 * x0
    y0 = (p1 * x0 + p2 * x0 * x0) / denom0
    slope0 = (p1 + 2.0 * p2 * x0 + (p2 * q1 - p1 * q2) * x0 * x0) / (denom0 * denom0)
    yc = np.minimum(y, y0)
    B = p1 - q1 * yc
    A = p2 - q2 * yc
    x_pade = _quad_root_pos(A, B, yc)
    return np.where(y <= y0, x_pade, x0 + (y - y0) / slope0)


def pade_lightness_fwd(L0, pade=PADE_PARAMS):
    """2-stage quadratic Pade lightness bijection with C^1 HDR continuation."""
    L0 = np.asarray(L0, dtype=np.float64)
    s = np.sign(L0)
    x = np.abs(L0)
    y1 = _pade_step_fwd(x, pade[0], pade[1], pade[2])
    y2 = _pade_step_fwd(y1, pade[3], pade[4], pade[5])
    return s * y2


def pade_lightness_inv(L1, pade=PADE_PARAMS):
    """Exact closed-form inverse of pade_lightness_fwd."""
    L1 = np.asarray(L1, dtype=np.float64)
    s = np.sign(L1)
    y2 = np.abs(L1)
    y1 = _pade_step_inv(y2, pade[3], pade[4], pade[5])
    x = _pade_step_inv(y1, pade[0], pade[1], pade[2])
    return s * x


def _a_stretch_fwd(a0, g_a, kappa_a):
    """Pointwise near-neutral red-green opponent stretch (exact quadratic bijection)."""
    s = np.sign(a0)
    x = np.abs(a0)
    return s * x * ((1.0 + g_a) + kappa_a * x) / (1.0 + kappa_a * x)


def _a_stretch_inv(a1, g_a, kappa_a):
    """Branch-stable closed-form quadratic inverse of _a_stretch_fwd."""
    s = np.sign(a1)
    y = np.abs(a1)
    B = (1.0 + g_a) - kappa_a * y
    return s * _quad_root_pos(kappa_a, B, y)


class AxiomLab:
    """
    AxiomLab (AxLab / AxLCh) v2.1: Unified Closed-Form Perceptual Color Space
    & Midpoint Riemannian Metric Tensor.
    """
    def __init__(self, space_params=None, metric_params=None):
        if space_params is None:
            self.space_params = dict(SPACE_PARAMS)
            self.M1 = M1.copy()
            self.M1_inv = M1_INV.copy()
            self.M2 = M2.copy()
            self.M2_inv = M2_INV.copy()
        else:
            self.space_params = dict(SPACE_PARAMS)
            self.space_params.update(space_params)
            self.M1 = np.asarray(self.space_params["M1"], dtype=np.float64)
            self.M1_inv = np.linalg.inv(self.M1)
            self.M2 = np.asarray(self.space_params["M2"], dtype=np.float64)
            self.M2_inv = np.linalg.inv(self.M2)
        self.metric_params = (
            METRIC_PARAMS.copy()
            if metric_params is None
            else np.asarray(metric_params, dtype=np.float64).copy()
        )

    def _shear1(self, a1, L1):
        sp = self.space_params
        return sp["shear1_c0"] + sp["shear1_L"] * (L1 - 0.5)

    def _shear2(self, b1, L1):
        sp = self.space_params
        blue_gate = b1 / np.sqrt(b1 * b1 + 0.015)
        return sp["shear2_c0"] + sp["shear2_neg_b"] * blue_gate + sp["shear2_L"] * (L1 - 0.5)

    def _shear3(self, a2, L1):
        sp = self.space_params
        return sp["shear3_c0"] + sp["shear3_L"] * (L1 - 0.5)

    def _radial_factors(self, u1, v1, L1):
        sp = self.space_params
        u2 = u1 * u1 - v1 * v1
        v2 = 2.0 * u1 * v1
        u3 = u1 * u2 - v1 * v2
        v3 = v1 * u2 + u1 * v2
        gamma = np.clip(
            sp["gamma0"] + sp["gamma_u"] * u1 + sp["gamma_v"] * v1 + sp["gamma_u2"] * u2 + sp["gamma_v2"] * v2,
            0.50, 1.25
        )
        beta = sp["beta0"] * np.exp(
            sp["beta_u"] * u1 + sp["beta_v"] * v1 + sp["beta_u2"] * u2 + sp["beta_v2"] * v2
        )
        G = np.maximum(
            0.20,
            sp["G0"] * (1.0 + sp["G_u"] * u1 + sp["G_v"] * v1
                        + sp["G_u2"] * u2 + sp["G_v2"] * v2
                        + sp["G_u3"] * u3 + sp["G_v3"] * v3
                        + sp["G_L"] * (L1 - 0.5))
        )
        return gamma, beta, G

    def _hk_factor(self, a, b):
        sp = self.space_params
        C = np.hypot(a, b)
        safe_C = np.maximum(C, 1e-18)
        u1 = np.where(C > 1e-18, a / safe_C, 0.0)
        v1 = np.where(C > 1e-18, b / safe_C, 0.0)
        u2 = u1 * u1 - v1 * v1
        v2 = 2.0 * u1 * v1
        sat_C = C / (1.0 + sp["hk_sat"] * C)
        raw_k = sat_C * (sp["hk_weight"] + sp["hk_u"] * u1 + sp["hk_v"] * v1 + sp["hk_u2"] * u2 + sp["hk_v2"] * v2)
        return 0.35 * (raw_k / np.sqrt(1.0 + (raw_k / 0.35) ** 2))

    def from_XYZ(self, XYZ):
        """Exact closed-form forward transform from CIE XYZ (D65) to AxiomLab (L, a, b)."""
        XYZ = np.asarray(XYZ, dtype=np.float64)
        sp = self.space_params
        lms = XYZ @ self.M1.T
        lms_c = psi_fwd(lms)
        Lab0 = lms_c @ self.M2.T
        L0, a0, b0 = Lab0[..., 0], Lab0[..., 1], Lab0[..., 2]

        # Stage 1: 2-stage quadratic Pade lightness with C^1 HDR continuation
        L1 = pade_lightness_fwd(L0, sp["pade"])

        # Stage 2: Pointwise near-neutral red-green opponent stretch
        a1 = _a_stretch_fwd(a0, sp["g_a"], sp["kappa_a"])

        # Stage 3: 3-stage symplectic opponent shear flow
        b1 = b0 + self._shear1(a1, L1) * a1
        a2 = a1 + self._shear2(b1, L1) * b1
        b2 = b1 + self._shear3(a2, L1) * a2

        # Stage 4: Weber-Fechner log-power radial chroma compression along invariant (u, v)
        C2 = np.hypot(a2, b2)
        safe_C2 = np.maximum(C2, 1e-18)
        u = np.where(C2 > 1e-18, a2 / safe_C2, 0.0)
        v = np.where(C2 > 1e-18, b2 / safe_C2, 0.0)
        gamma, beta, G = self._radial_factors(u, v, L1)
        C = np.where(C2 > 1e-18, G * np.log1p(beta * (safe_C2 ** gamma)) / beta, 0.0)
        a = C * u
        b = C * v

        # Stage 5: Self-gated quadratic Helmholtz-Kohlrausch (HK) lightness
        k_hk = self._hk_factor(a, b)
        L = L1 + k_hk * L1 * (1.0 - L1)
        return np.stack([L, a, b], axis=-1)

    def to_XYZ(self, Lab):
        """Exact closed-form analytical inverse from AxiomLab (L, a, b) to CIE XYZ (D65)."""
        Lab = np.asarray(Lab, dtype=np.float64)
        sp = self.space_params
        L, a, b = Lab[..., 0], Lab[..., 1], Lab[..., 2]

        # Invert Stage 5 (HK lightness) via Citardauq formula
        k_hk = self._hk_factor(a, b)
        B_hk = 1.0 + k_hk
        disc_hk = np.maximum(0.0, B_hk * B_hk - 4.0 * k_hk * L)
        L1 = (2.0 * L) / (B_hk + np.sqrt(disc_hk) + 1e-30)

        # Invert Stage 4 (Weber-Fechner log-power radial chroma) via expm1
        C = np.hypot(a, b)
        safe_C = np.maximum(C, 1e-18)
        u = np.where(C > 1e-18, a / safe_C, 0.0)
        v = np.where(C > 1e-18, b / safe_C, 0.0)
        gamma, beta, G = self._radial_factors(u, v, L1)
        arg_exp = np.minimum(700.0, beta * safe_C / G)
        C2 = np.where(C > 1e-18, (np.expm1(arg_exp) / beta) ** (1.0 / gamma), 0.0)
        a2 = C2 * u
        b2 = C2 * v

        # Invert Stage 3 (3-stage symplectic shear flow) via 3 exact subtractions
        b1 = b2 - self._shear3(a2, L1) * a2
        a1 = a2 - self._shear2(b1, L1) * b1
        b0 = b1 - self._shear1(a1, L1) * a1

        # Invert Stage 2 (pointwise near-neutral a-stretch)
        a0 = _a_stretch_inv(a1, sp["g_a"], sp["kappa_a"])

        # Invert Stage 1 (2-stage Pade lightness)
        L0 = pade_lightness_inv(L1, sp["pade"])

        Lab0 = np.stack([L0, a0, b0], axis=-1)
        lms_c = Lab0 @ self.M2_inv.T
        lms = psi_inv(lms_c)
        return lms @ self.M1_inv.T

    def from_sRGB(self, srgb):
        return self.from_XYZ(sRGB_to_XYZ(srgb))

    def to_sRGB(self, Lab, clip=True):
        srgb = XYZ_to_sRGB(self.to_XYZ(Lab))
        return np.clip(srgb, 0.0, 1.0) if clip else srgb

    def from_hex(self, hex_str):
        return self.from_sRGB(hex_to_sRGB(hex_str))

    def to_hex(self, Lab):
        return sRGB_to_hex(self.to_sRGB(self.gamut_map(Lab), clip=True))

    @staticmethod
    def to_LCh(Lab):
        Lab = np.asarray(Lab, dtype=np.float64)
        L, a, b = Lab[..., 0], Lab[..., 1], Lab[..., 2]
        C = np.hypot(a, b)
        h = np.degrees(np.arctan2(b, a)) % 360.0
        h = np.where(C < 1e-12, 0.0, h)
        return np.stack([L, C, h], axis=-1)

    @staticmethod
    def from_LCh(LCh):
        LCh = np.asarray(LCh, dtype=np.float64)
        L, C, h = LCh[..., 0], LCh[..., 1], LCh[..., 2]
        hr = np.radians(h)
        return np.stack([L, C * np.cos(hr), C * np.sin(hr)], axis=-1)

    def gamut_map(self, Lab):
        """8-step binary-search ray-intersection sRGB gamut mapping along constant (L, h) for arbitrary (..., 3) shapes."""
        Lab = np.asarray(Lab, dtype=np.float64)
        orig_shape = Lab.shape
        flat = Lab.reshape(-1, 3)
        L = np.clip(flat[:, 0], 0.0, 1.0)
        a = flat[:, 1].copy()
        b = flat[:, 2].copy()
        out = np.stack([L, a, b], axis=-1)

        lin = self.to_XYZ(out) @ M_XYZ_TO_SRGB.T
        in_gamut = np.all((lin >= -1e-6) & (lin <= 1.0 + 1e-6), axis=-1)
        if not np.all(in_gamut):
            lo = np.zeros_like(L)
            hi = np.ones_like(L)
            for _ in range(8):
                mid = 0.5 * (lo + hi)
                cand = np.stack([L, a * mid, b * mid], axis=-1)
                lin_c = self.to_XYZ(cand) @ M_XYZ_TO_SRGB.T
                ok = np.all((lin_c >= -1e-6) & (lin_c <= 1.0 + 1e-6), axis=-1)
                lo = np.where(ok, mid, lo)
                hi = np.where(ok, hi, mid)
            scale = np.where(in_gamut, 1.0, lo)
            out = np.stack([L, a * scale, b * scale], axis=-1)
        return out.reshape(orig_shape)

    @staticmethod
    def euclidean_distance_from_Lab(Lab1, Lab2):
        """Pure Euclidean norm in AxiomLab coordinates."""
        d = np.asarray(Lab2, dtype=np.float64) - np.asarray(Lab1, dtype=np.float64)
        return np.sqrt(np.sum(d * d, axis=-1))

    def euclidean_distance(self, XYZ1, XYZ2):
        """Pure Euclidean norm in AxiomLab coordinates from CIE XYZ."""
        return self.euclidean_distance_from_Lab(self.from_XYZ(XYZ1), self.from_XYZ(XYZ2))

    def distance(self, XYZ1, XYZ2, use_power_law=True):
        """Compute perceptual color difference Delta E_Ax from CIE XYZ."""
        Lab1 = self.from_XYZ(XYZ1)
        Lab2 = self.from_XYZ(XYZ2)
        return self.distance_from_Lab(Lab1, Lab2, use_power_law=use_power_law)

    @staticmethod
    def _parse_color_input(color):
        if isinstance(color, str):
            return sRGB_to_XYZ(hex_to_sRGB(color))
        if isinstance(color, (list, tuple)) and len(color) > 0 and isinstance(color[0], str):
            return sRGB_to_XYZ(np.array([hex_to_sRGB(c) for c in color], dtype=np.float64))
        return sRGB_to_XYZ(color)

    def difference(self, color1, color2, use_power_law=True):
        """Compute perceptual color difference Delta E_Ax between two hex or sRGB colors (scalar or batch)."""
        x1 = self._parse_color_input(color1)
        x2 = self._parse_color_input(color2)
        d = self.distance(x1, x2, use_power_law=use_power_law)
        return float(d) if np.ndim(d) == 0 else d

    def distance_from_Lab(self, Lab1, Lab2, mp=None, disable_rt=False, force_sc_eq_sh=False, use_power_law=True):
        """
        Midpoint Riemannian Metric Tensor ds = sqrt(dx^T G(x_bar) dx) in AxiomLab coordinates.
        When use_power_law=False, returns the homogeneous degree-1 Riemannian line element ds.
        When use_power_law=True (default), returns the Stevens power-law distance ds ** gamma_d.
        """
        if mp is None:
            mp = self.metric_params
        Lab1 = np.asarray(Lab1, dtype=np.float64)
        Lab2 = np.asarray(Lab2, dtype=np.float64)
        L1, a1, b1 = Lab1[..., 0], Lab1[..., 1], Lab1[..., 2]
        L2, a2, b2 = Lab2[..., 0], Lab2[..., 1], Lab2[..., 2]

        dL = L2 - L1
        da = a2 - a1
        db = b2 - b1

        L_bar = 0.5 * (L1 + L2)
        a_bar = 0.5 * (a1 + a2)
        b_bar = 0.5 * (b1 + b2)
        C_bar = np.hypot(a_bar, b_bar)
        C_safe = np.maximum(C_bar, 1e-12)

        u1 = np.where(C_bar > 1e-12, a_bar / C_safe, 1.0)
        v1 = np.where(C_bar > 1e-12, b_bar / C_safe, 0.0)
        u2 = u1 * u1 - v1 * v1
        v2 = 2.0 * u1 * v1
        u3 = u1 * u2 - v1 * v2
        v3 = v1 * u2 + u1 * v2

        dC_proj = u1 * da + v1 * db
        dH_proj = -v1 * da + u1 * db

        L_m = L_bar - 0.5
        SL = np.maximum(
            0.20,
            mp[0] * (1.0 + mp[1] * (L_m * L_m) / np.sqrt(0.04 + L_m * L_m) + mp[2] * L_m + mp[3] * C_bar)
        )

        SC_dir = np.maximum(
            0.30,
            1.0 + mp[6] * u1 + mp[7] * v1 + mp[8] * u2 + mp[9] * v2 + mp[10] * u3 + mp[11] * v3
        )
        SC = np.maximum(0.20, mp[4] * (1.0 + mp[5] * C_bar) * SC_dir)

        if force_sc_eq_sh:
            SH = SC
        else:
            SH_dir = np.maximum(
                0.30,
                1.0 + mp[14] * u1 + mp[15] * v1 + mp[16] * u2 + mp[17] * v2 + mp[18] * u3 + mp[19] * v3
            )
            SH = np.maximum(0.20, mp[12] * (1.0 + mp[13] * C_bar) * SH_dir)

        if disable_rt:
            RT = np.zeros_like(C_bar)
        else:
            C4 = (C_bar * C_bar) ** 2
            C0_4 = 0.32 ** 4
            C_gate = C4 / (C0_4 + C4)
            u_b0 = np.cos(mp[21])
            v_b0 = np.sin(mp[21])
            du_b = u1 - u_b0
            dv_b = v1 - v_b0
            blue_bell = np.exp(-mp[22] * (du_b * du_b + dv_b * dv_b))
            RT = mp[20] * C_gate * blue_bell

        tL = dL / SL
        tC = dC_proj / SC
        tH = dH_proj / SH

        ds2 = np.maximum(0.0, tL * tL + tC * tC + tH * tH + RT * tC * tH)
        ds = np.sqrt(ds2)
        return ds ** mp[23] if use_power_law else ds

    def _riemannian_arc_interpolate(self, l1, l2, u_targets, n_ctrl=32):
        """
        Vectorized Riemannian arc-length reparameterization between l1 and l2 using the
        homogeneous degree-1 line element ds = sqrt(dx^T G(x_bar) dx) (use_power_law=False),
        ensuring subdivision-invariant arc-length parameterization.
        """
        u_grid = np.linspace(0.0, 1.0, n_ctrl + 1)[:, None]
        pts = (1.0 - u_grid) * l1[None, :] + u_grid * l2[None, :]
        ds = self.distance_from_Lab(pts[:-1], pts[1:], use_power_law=False)
        cum_s = np.concatenate([[0.0], np.cumsum(ds)])
        total_s = cum_s[-1]
        if total_s < 1e-12:
            t_mapped = np.asarray(u_targets, dtype=np.float64)
        else:
            t_mapped = np.interp(np.asarray(u_targets, dtype=np.float64) * total_s, cum_s, u_grid[:, 0])
        if t_mapped.ndim == 0:
            return (1.0 - float(t_mapped)) * l1 + float(t_mapped) * l2
        return (1.0 - t_mapped[:, None]) * l1[None, :] + t_mapped[:, None] * l2[None, :]

    def mix(self, color1, color2, t=0.5, metric_step=True):
        """
        Interpolate between color1 and color2 in AxiomLab coordinates.
        When metric_step=True (default), reparameterizes arc-length under the homogeneous
        Riemannian metric tensor ds.
        """
        l1 = self.from_hex(color1) if isinstance(color1, str) else self.from_sRGB(color1)
        l2 = self.from_hex(color2) if isinstance(color2, str) else self.from_sRGB(color2)
        if metric_step:
            lab = self._riemannian_arc_interpolate(l1, l2, float(t))
        else:
            lab = (1.0 - t) * l1 + t * l2
        return self.to_hex(lab) if isinstance(color1, str) else self.to_sRGB(self.gamut_map(lab))

    def gradient(self, color1, color2, steps=16, metric_step=True):
        """
        Generate a perceptually uniform N-step gradient in AxiomLab coordinates.
        """
        l1 = self.from_hex(color1) if isinstance(color1, str) else self.from_sRGB(color1)
        l2 = self.from_hex(color2) if isinstance(color2, str) else self.from_sRGB(color2)
        u_targets = np.array([0.0], dtype=np.float64) if steps <= 1 else np.linspace(0.0, 1.0, steps)
        if metric_step:
            labs = self._riemannian_arc_interpolate(l1, l2, u_targets)
        else:
            labs = (1.0 - u_targets[:, None]) * l1[None, :] + u_targets[:, None] * l2[None, :]
        mapped = self.gamut_map(labs)
        srgbs = self.to_sRGB(mapped, clip=True)
        if isinstance(color1, str):
            return [sRGB_to_hex(s) for s in srgbs]
        return srgbs


# Module-level singleton & convenience functions for 1:1 API parity with JavaScript/TypeScript
DEFAULT_AXIOMLAB = AxiomLab()

from_XYZ = DEFAULT_AXIOMLAB.from_XYZ
to_XYZ = DEFAULT_AXIOMLAB.to_XYZ
from_sRGB = DEFAULT_AXIOMLAB.from_sRGB
to_sRGB = DEFAULT_AXIOMLAB.to_sRGB
from_hex = DEFAULT_AXIOMLAB.from_hex
to_hex = DEFAULT_AXIOMLAB.to_hex
to_LCh = AxiomLab.to_LCh
from_LCh = AxiomLab.from_LCh
gamut_map = DEFAULT_AXIOMLAB.gamut_map
euclidean_distance_from_Lab = AxiomLab.euclidean_distance_from_Lab
euclidean_distance = DEFAULT_AXIOMLAB.euclidean_distance
distance_from_Lab = DEFAULT_AXIOMLAB.distance_from_Lab
distance = DEFAULT_AXIOMLAB.distance
difference = DEFAULT_AXIOMLAB.difference
mix = DEFAULT_AXIOMLAB.mix
gradient = DEFAULT_AXIOMLAB.gradient
