"""
baselines.py — Self-Contained Standard Colorimetric Baselines & STRESS Metric
for AxiomLab v2.1 Verification & Benchmarking.

Implements exact, vectorized reference formulas for:
- STRESS (Standardized Residual Sum of Squares, Garcia et al. 2007)
- CIE 1976 L*a*b* (CIE76)
- CIE94 (Graphic Arts k_L=k_C=k_H=1, K_1=0.045, K_2=0.015)
- CIEDE2000 (CIE 142-2001 / Sharma, Wu & Dalal 2005)
- CAM16-UCS (Li et al. 2017, standard D65 viewing conditions)
- OKLab (Ottosson 2020)
- IPT (Ebner & Fairchild 1998)
- DIN99 (DIN 6176:2001)
- Jzazbz (Safdar et al. 2017)
- OSA-UCS (ASTM E1360-90 / MacAdam 1974 closed-form polynomial transformation)
"""

import numpy as np

D65_XYZ = np.array([0.95047, 1.00000, 1.08883], dtype=np.float64)


def stress_score(d_pred, d_obs):
    """
    Standardized Residual Sum of Squares (STRESS) in [0, 100]:
        STRESS = 100 * sqrt( sum((f * d_pred - d_obs)^2) / sum(d_obs^2) )
    where f = sum(d_pred * d_obs) / sum(d_pred^2).
    """
    d_pred = np.asarray(d_pred, dtype=np.float64)
    d_obs = np.asarray(d_obs, dtype=np.float64)
    denom = np.sum(d_pred * d_pred)
    if denom <= 1e-30:
        return 100.0
    f = np.sum(d_pred * d_obs) / denom
    return float(100.0 * np.sqrt(np.sum((f * d_pred - d_obs) ** 2) / np.sum(d_obs * d_obs)))


def xyz_to_cielab(xyz, white=D65_XYZ):
    """Convert CIE XYZ (Y_w = 1.0) to CIE 1976 L*a*b*."""
    xyz = np.asarray(xyz, dtype=np.float64)
    r = xyz / white
    delta = 6.0 / 29.0
    delta3 = delta ** 3
    f = np.where(r > delta3, np.cbrt(np.maximum(r, 0.0)), r / (3.0 * delta * delta) + 4.0 / 29.0)
    L = 116.0 * f[..., 1] - 16.0
    a = 500.0 * (f[..., 0] - f[..., 1])
    b = 200.0 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], axis=-1)


def dist_cie76(xyz1, xyz2):
    """CIE 1976 Delta E*_ab."""
    lab1 = xyz_to_cielab(xyz1)
    lab2 = xyz_to_cielab(xyz2)
    return np.linalg.norm(lab2 - lab1, axis=-1)


def dist_cie94(xyz1, xyz2):
    """CIE94 Delta E*_94 (reference graphic arts parameters)."""
    lab1 = xyz_to_cielab(xyz1)
    lab2 = xyz_to_cielab(xyz2)
    dL = lab1[..., 0] - lab2[..., 0]
    C1 = np.hypot(lab1[..., 1], lab1[..., 2])
    C2 = np.hypot(lab2[..., 1], lab2[..., 2])
    dC = C1 - C2
    da = lab1[..., 1] - lab2[..., 1]
    db = lab1[..., 2] - lab2[..., 2]
    dH2 = np.maximum(0.0, da * da + db * db - dC * dC)
    SC = 1.0 + 0.045 * C1
    SH = 1.0 + 0.015 * C1
    return np.sqrt(dL * dL + (dC / SC) ** 2 + dH2 / (SH * SH))


def dist_ciede2000(xyz1, xyz2):
    """Exact CIEDE2000 color-difference formula (Sharma, Wu & Dalal 2005)."""
    lab1 = xyz_to_cielab(xyz1)
    lab2 = xyz_to_cielab(xyz2)
    L1, a1, b1 = lab1[..., 0], lab1[..., 1], lab1[..., 2]
    L2, a2, b2 = lab2[..., 0], lab2[..., 1], lab2[..., 2]

    C1 = np.hypot(a1, b1)
    C2 = np.hypot(a2, b2)
    C_bar = 0.5 * (C1 + C2)
    C_bar7 = C_bar ** 7
    G = 0.5 * (1.0 - np.sqrt(C_bar7 / (C_bar7 + 25.0 ** 7)))

    a1p = (1.0 + G) * a1
    a2p = (1.0 + G) * a2
    C1p = np.hypot(a1p, b1)
    C2p = np.hypot(a2p, b2)

    h1p = np.degrees(np.arctan2(b1, a1p)) % 360.0
    h1p = np.where(C1p < 1e-12, 0.0, h1p)
    h2p = np.degrees(np.arctan2(b2, a2p)) % 360.0
    h2p = np.where(C2p < 1e-12, 0.0, h2p)

    dLp = L2 - L1
    dCp = C2p - C1p

    dh_diff = h2p - h1p
    dhp = np.where(
        (C1p * C2p) < 1e-12,
        0.0,
        np.where(dh_diff > 180.0, dh_diff - 360.0, np.where(dh_diff < -180.0, dh_diff + 360.0, dh_diff))
    )
    dHp = 2.0 * np.sqrt(C1p * C2p) * np.sin(np.radians(0.5 * dhp))

    Lp_bar = 0.5 * (L1 + L2)
    Cp_bar = 0.5 * (C1p + C2p)

    h_sum = h1p + h2p
    hp_bar = np.where(
        (C1p * C2p) < 1e-12,
        h_sum,
        np.where(np.abs(h1p - h2p) <= 180.0, 0.5 * h_sum, np.where(h_sum < 360.0, 0.5 * (h_sum + 360.0), 0.5 * (h_sum - 360.0)))
    )

    T = (
        1.0
        - 0.17 * np.cos(np.radians(hp_bar - 30.0))
        + 0.24 * np.cos(np.radians(2.0 * hp_bar))
        + 0.32 * np.cos(np.radians(3.0 * hp_bar + 6.0))
        - 0.20 * np.cos(np.radians(4.0 * hp_bar - 63.0))
    )

    dTheta = 30.0 * np.exp(-(((hp_bar - 275.0) / 25.0) ** 2))
    Cp_bar7 = Cp_bar ** 7
    RC = 2.0 * np.sqrt(Cp_bar7 / (Cp_bar7 + 25.0 ** 7))
    L_m50_2 = (Lp_bar - 50.0) ** 2
    SL = 1.0 + (0.015 * L_m50_2) / np.sqrt(20.0 + L_m50_2)
    SC = 1.0 + 0.045 * Cp_bar
    SH = 1.0 + 0.015 * Cp_bar * T
    RT = -np.sin(np.radians(2.0 * dTheta)) * RC

    tL = dLp / SL
    tC = dCp / SC
    tH = dHp / SH
    return np.sqrt(tL * tL + tC * tC + tH * tH + RT * tC * tH)


def dist_din99(xyz1, xyz2):
    """DIN99 color-difference formula (DIN 6176)."""
    def _to_din99(xyz):
        lab = xyz_to_cielab(xyz)
        L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
        L99 = 105.51 * np.log(1.0 + 0.0158 * L)
        rad = np.radians(16.0)
        c16, s16 = np.cos(rad), np.sin(rad)
        e = a * c16 + b * s16
        f = 0.7 * (-a * s16 + b * c16)
        G = np.hypot(e, f)
        C99 = np.log(1.0 + 0.045 * G) / 0.045
        scale = np.where(G > 1e-12, C99 / np.maximum(G, 1e-12), 0.0)
        return np.stack([L99, e * scale, f * scale], axis=-1)
    return np.linalg.norm(_to_din99(xyz2) - _to_din99(xyz1), axis=-1)


_M1_OKLAB = np.array([
    [0.8189330101, 0.3618667424, -0.1288597137],
    [0.0329845436, 0.9293118715,  0.0361456387],
    [0.0482003018, 0.2643662691,  0.6338517070],
], dtype=np.float64)
_M1_OKLAB_INV = np.linalg.inv(_M1_OKLAB)

_M2_OKLAB = np.array([
    [0.2104542553,  0.7936177850, -0.0040720468],
    [1.9779984951, -2.4285922050,  0.4505937099],
    [0.0259040371,  0.7827717662, -0.8086757660],
], dtype=np.float64)
_M2_OKLAB_INV = np.linalg.inv(_M2_OKLAB)


def xyz_to_oklab(xyz):
    xyz = np.asarray(xyz, dtype=np.float64)
    lms = xyz @ _M1_OKLAB.T
    lms_c = np.cbrt(lms)
    return lms_c @ _M2_OKLAB.T


def oklab_to_xyz(lab):
    lab = np.asarray(lab, dtype=np.float64)
    lms_c = lab @ _M2_OKLAB_INV.T
    lms = lms_c ** 3
    return lms @ _M1_OKLAB_INV.T


def dist_oklab(xyz1, xyz2):
    return np.linalg.norm(xyz_to_oklab(xyz2) - xyz_to_oklab(xyz1), axis=-1)


_M1_IPT = np.array([
    [ 0.4002, 0.7075, -0.0807],
    [-0.2280, 1.1500,  0.0612],
    [ 0.0000, 0.0000,  0.9184],
], dtype=np.float64)

_M2_IPT = np.array([
    [0.4000,  0.4000,  0.2000],
    [4.4550, -4.8510,  0.3960],
    [0.8056,  0.3572, -1.1628],
], dtype=np.float64)


def dist_ipt(xyz1, xyz2):
    def _to_ipt(xyz):
        lms = np.asarray(xyz, dtype=np.float64) @ _M1_IPT.T
        lms_p = np.sign(lms) * (np.abs(lms) ** 0.43)
        return lms_p @ _M2_IPT.T
    return np.linalg.norm(_to_ipt(xyz2) - _to_ipt(xyz1), axis=-1)


def dist_jzazbz(xyz1, xyz2):
    """Jzazbz color space Euclidean distance (Safdar et al. 2017, scaled to Y_w=100 nits)."""
    M1_jz = np.array([
        [0.41478972, 0.579999, 0.0146480],
        [-0.2015100, 1.120649, 0.0531008],
        [-0.0166008, 0.264800, 0.6684799],
    ], dtype=np.float64)
    M2_jz = np.array([
        [0.5, 0.5, 0.0],
        [3.524000, -4.066708, 0.542708],
        [0.199076, 1.096799, -1.295875],
    ], dtype=np.float64)
    b_p, g_p = 1.15, 0.66
    c1 = 3424.0 / 4096.0
    c2 = 2413.0 / 128.0
    c3 = 2392.0 / 128.0
    n = 2610.0 / 16384.0
    p = 1.7 * 2523.0 / 32.0
    d = -0.56
    d0 = 1.6295499532821566e-11

    def _to_jz(xyz):
        xyz_s = np.asarray(xyz, dtype=np.float64) * 100.0
        X, Y, Z = xyz_s[..., 0], xyz_s[..., 1], xyz_s[..., 2]
        Xp = b_p * X - (b_p - 1.0) * Z
        Yp = g_p * Y - (g_p - 1.0) * X
        lms = np.stack([Xp, Yp, Z], axis=-1) @ M1_jz.T
        lms_n = np.maximum(lms / 10000.0, 0.0) ** n
        lms_p = ((c1 + c2 * lms_n) / (1.0 + c3 * lms_n)) ** p
        Iab = lms_p @ M2_jz.T
        Iz, az, bz = Iab[..., 0], Iab[..., 1], Iab[..., 2]
        Jz = ((1.0 + d) * Iz) / (1.0 + d * Iz) - d0
        return np.stack([Jz, az, bz], axis=-1)
    return np.linalg.norm(_to_jz(xyz2) - _to_jz(xyz1), axis=-1)


def dist_cam16ucs(xyz1, xyz2):
    """CAM16-UCS Euclidean distance (Li et al. 2017, standard D65 viewing conditions)."""
    M16 = np.array([
        [ 0.401288, 0.650173, -0.051461],
        [-0.250268, 1.204414,  0.045854],
        [-0.002079, 0.048952,  0.953127],
    ], dtype=np.float64)
    XYZ_w = D65_XYZ * 100.0
    RGB_w = XYZ_w @ M16.T
    L_A = 64.0 / np.pi * 0.2
    Y_b = 20.0
    F, c, N_c = 1.0, 0.69, 1.0
    k = 1.0 / (5.0 * L_A + 1.0)
    F_L = 0.2 * (k ** 4) * (5.0 * L_A) + 0.1 * ((1.0 - k ** 4) ** 2) * ((5.0 * L_A) ** (1.0 / 3.0))
    n = Y_b / 100.0
    z = 1.48 + np.sqrt(n)
    N_bb = 0.725 * ((1.0 / n) ** 0.2)
    N_cb = N_bb
    D = F * (1.0 - (1.0 / 3.6) * np.exp((-L_A - 42.0) / 92.0))
    D = np.clip(D, 0.0, 1.0)
    D_RGB = D * (100.0 / RGB_w) + 1.0 - D
    RGB_wc = D_RGB * RGB_w
    tmp_w = (F_L * RGB_wc / 100.0) ** 0.42
    RGB_aw = 400.0 * (tmp_w / (tmp_w + 27.13)) + 0.1
    A_w = (2.0 * RGB_aw[0] + RGB_aw[1] + 0.05 * RGB_aw[2] - 0.305) * N_bb

    def _to_cam16ucs(xyz):
        XYZ = np.asarray(xyz, dtype=np.float64) * 100.0
        RGB_c = (XYZ @ M16.T) * D_RGB
        s = np.sign(RGB_c)
        tmp = (F_L * np.abs(RGB_c) / 100.0) ** 0.42
        RGB_a = s * 400.0 * (tmp / (tmp + 27.13)) + 0.1
        R_a, G_a, B_a = RGB_a[..., 0], RGB_a[..., 1], RGB_a[..., 2]
        a = R_a - 12.0 * G_a / 11.0 + B_a / 11.0
        b = (R_a + G_a - 2.0 * B_a) / 9.0
        h_rad = np.arctan2(b, a) % (2.0 * np.pi)
        e_t = 0.25 * (np.cos(h_rad + 2.0) + 3.8)
        A = (2.0 * R_a + G_a + 0.05 * B_a - 0.305) * N_bb
        J = 100.0 * (np.maximum(A / A_w, 0.0) ** (c * z))
        t = (50000.0 / 13.0 * N_c * N_cb * e_t * np.hypot(a, b)) / (R_a + G_a + 1.05 * B_a)
        C = (t ** 0.9) * np.sqrt(J / 100.0) * ((1.64 - 0.29 ** n) ** 0.73)
        M = C * (F_L ** 0.25)
        Jp = 1.7 * J / (1.0 + 0.007 * J)
        Mp = np.log(1.0 + 0.0228 * M) / 0.0228
        return np.stack([Jp, Mp * np.cos(h_rad), Mp * np.sin(h_rad)], axis=-1)
    return np.linalg.norm(_to_cam16ucs(xyz2) - _to_cam16ucs(xyz1), axis=-1)


def dist_osaucs(xyz1, xyz2):
    """OSA-UCS (ASTM E1360-90 / MacAdam 1974) Euclidean distance."""
    M_osa = np.array([
        [ 0.7990, 0.4194, -0.1648],
        [-0.4493, 1.3265,  0.0927],
        [-0.1149, 0.3394,  0.7170],
    ], dtype=np.float64)

    def _to_osa(xyz):
        XYZ = np.asarray(xyz, dtype=np.float64) * 100.0
        X, Y, Z = XYZ[..., 0], XYZ[..., 1], XYZ[..., 2]
        S = np.maximum(X + Y + Z, 1e-12)
        x = X / S
        y = Y / S
        K = 4.4934 * x * x + 4.3034 * y * y - 4.276 * x * y - 1.3744 * x - 2.5643 * y + 1.8103
        Y0 = K * Y
        Y0_cbrt = np.cbrt(np.maximum(Y0, 0.0))
        L_prime = 5.9 * (Y0_cbrt - 2.0 / 3.0 + 0.042 * np.cbrt(Y0 - 30.0))
        L = (L_prime - 14.3993) / np.sqrt(2.0)
        C = L_prime / (5.9 * (Y0_cbrt - 2.0 / 3.0))
        rgb_c = np.cbrt(np.maximum(XYZ @ M_osa.T, 0.0))
        R_c, G_c, B_c = rgb_c[..., 0], rgb_c[..., 1], rgb_c[..., 2]
        a = -13.7 * R_c + 17.7 * G_c - 4.0 * B_c
        b = 1.7 * R_c + 8.0 * G_c - 9.7 * B_c
        return np.stack([L, C * b, C * a], axis=-1)
    return np.linalg.norm(_to_osa(xyz2) - _to_osa(xyz1), axis=-1)
