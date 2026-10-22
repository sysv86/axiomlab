// Generated from ../../axiomlab.js by scripts/sync.mjs — do not edit.
const AxiomLab = (function () {

  "use strict";

  const D65_WHITE = [0.95047, 1.00000, 1.08883];

  const M_SRGB_TO_XYZ = [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151521, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041]
  ];

  const M_XYZ_TO_SRGB = [
    [ 3.2404549850111395, -1.5371391384715571, -0.4985315532562290],
    [-0.9692665717111220,  1.8760112807842577,  0.04155609014264147],
    [ 0.05564343937975769, -0.20402589254317857,  1.0572251616100772]
  ];

  const EPS_CBRT = 1.8500000000000000e-04;
  const ALPHA_CBRT = Math.cbrt(EPS_CBRT);
  const BETA_CBRT = Math.cbrt(1.0 + EPS_CBRT) - ALPHA_CBRT;
  const PADE_HDR_KNOT = 1.20;

  const M1 = [
    [0.8007897293525293, 0.35817808694125236, -0.10957146753758704],
    [0.01891636921953598, 0.9414338308734829, 0.03727554133742159],
    [0.03034578742007905, 0.20056152129983834, 0.7077282203199756]
  ];
  const M1_INV = [
    [ 1.2527456813274809, -0.5238165552254749,  0.22154087389799396],
    [-0.023306303134405886, 1.0840085771597772, -0.060702274025371365],
    [-0.04711018377845677, -0.2847347014283811,  1.4206748852068378]
  ];
  const M2 = [
    [0.17907775423005695,  0.8210659807828020, -0.0001437350128589846],
    [2.0924236161521470,  -2.3840248667013424,  0.2916012505491957],
    [0.2509357737699382,   0.6507451704957752, -0.9016809442657134]
  ];
  const M2_INV = [
    [1.0,  0.3777012641845808,  0.12198818956626749],
    [1.0, -0.0823701527542963, -0.026797699028249126],
    [1.0,  0.045666685257185376, -1.09443066170934]
  ];
  const PADE = [
    1.5222037803232455,
    2.1821122750109523,
    -1.4891495361303222,
    0.005039997830872463,
    0.3450927054189581,
    2.1785242831924148
  ];
  const SP = {
    "M1": M1,
    "M2": M2,
    "pade": PADE,
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
    "hk_sat": 1.972384619283746
  };
  const MP = [
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
    0.8194322324209308
  ];

  function matVec3(M, v) {
    return [
      M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
      M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
      M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
    ];
  }

  function srgbToLinear(c) {
    const s = c < 0 ? -1.0 : (c > 0 ? 1.0 : 0.0);
    const a = Math.abs(c);
    return s * (a <= 0.04045 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4));
  }

  function linearToSrgb(c) {
    const s = c < 0 ? -1.0 : (c > 0 ? 1.0 : 0.0);
    const a = Math.abs(c);
    return s * (a <= 0.0031308 ? 12.92 * a : 1.055 * Math.pow(a, 1.0 / 2.4) - 0.055);
  }

  function sRGBToXYZ(srgb) {
    const lin = [srgbToLinear(srgb[0]), srgbToLinear(srgb[1]), srgbToLinear(srgb[2])];
    return matVec3(M_SRGB_TO_XYZ, lin);
  }

  function XYZToSRGB(xyz) {
    const lin = matVec3(M_XYZ_TO_SRGB, xyz);
    return [linearToSrgb(lin[0]), linearToSrgb(lin[1]), linearToSrgb(lin[2])];
  }

  function hexToSRGB(hex) {
    let h = String(hex).trim().replace(/^#/, "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) {
      throw new Error("Invalid hex color string: " + hex);
    }
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255.0, ((n >> 8) & 255) / 255.0, (n & 255) / 255.0];
  }

  function sRGBToHex(srgb) {
    const r = Math.max(0, Math.min(255, Math.round(srgb[0] * 255)));
    const g = Math.max(0, Math.min(255, Math.round(srgb[1] * 255)));
    const b = Math.max(0, Math.min(255, Math.round(srgb[2] * 255)));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function psiFwd(x) {
    const s = x < 0 ? -1.0 : (x > 0 ? 1.0 : 0.0);
    return s * (Math.cbrt(Math.abs(x) + EPS_CBRT) - ALPHA_CBRT) / BETA_CBRT;
  }

  function psiInv(u) {
    const s = u < 0 ? -1.0 : (u > 0 ? 1.0 : 0.0);
    const t = Math.abs(u) * BETA_CBRT + ALPHA_CBRT;
    return s * (t * t * t - EPS_CBRT);
  }

  function quadRootPos(A, B, y) {
    const disc = Math.max(0.0, B * B + 4.0 * A * y);
    const sqrtD = Math.sqrt(disc);
    return B >= 0.0
      ? (2.0 * y) / (B + sqrtD + 1e-30)
      : (-B + sqrtD) / (2.0 * A + 1e-30);
  }

  function padeStepFwd(x, p1, q1, q2) {
    const p2 = 1.0 + q1 + q2 - p1;
    const x0 = PADE_HDR_KNOT;
    if (x <= x0) {
      return (p1 * x + p2 * x * x) / (1.0 + q1 * x + q2 * x * x);
    }
    const denom0 = 1.0 + q1 * x0 + q2 * x0 * x0;
    const y0 = (p1 * x0 + p2 * x0 * x0) / denom0;
    const slope0 = (p1 + 2.0 * p2 * x0 + (p2 * q1 - p1 * q2) * x0 * x0) / (denom0 * denom0);
    return y0 + slope0 * (x - x0);
  }

  function padeStepInv(y, p1, q1, q2) {
    const p2 = 1.0 + q1 + q2 - p1;
    const x0 = PADE_HDR_KNOT;
    const denom0 = 1.0 + q1 * x0 + q2 * x0 * x0;
    const y0 = (p1 * x0 + p2 * x0 * x0) / denom0;
    if (y <= y0) {
      const B = p1 - q1 * y;
      const A = p2 - q2 * y;
      return quadRootPos(A, B, y);
    }
    const slope0 = (p1 + 2.0 * p2 * x0 + (p2 * q1 - p1 * q2) * x0 * x0) / (denom0 * denom0);
    return x0 + (y - y0) / slope0;
  }

  function padeLightnessFwd(L0) {
    const s = L0 < 0 ? -1.0 : (L0 > 0 ? 1.0 : 0.0);
    const x = Math.abs(L0);
    const y1 = padeStepFwd(x, PADE[0], PADE[1], PADE[2]);
    const y2 = padeStepFwd(y1, PADE[3], PADE[4], PADE[5]);
    return s * y2;
  }

  function padeLightnessInv(L1) {
    const s = L1 < 0 ? -1.0 : (L1 > 0 ? 1.0 : 0.0);
    const y2 = Math.abs(L1);
    const y1 = padeStepInv(y2, PADE[3], PADE[4], PADE[5]);
    const x = padeStepInv(y1, PADE[0], PADE[1], PADE[2]);
    return s * x;
  }

  function aStretchFwd(a0) {
    const s = a0 < 0 ? -1.0 : (a0 > 0 ? 1.0 : 0.0);
    const x = Math.abs(a0);
    return s * x * ((1.0 + SP.g_a) + SP.kappa_a * x) / (1.0 + SP.kappa_a * x);
  }

  function aStretchInv(a1) {
    const s = a1 < 0 ? -1.0 : (a1 > 0 ? 1.0 : 0.0);
    const y = Math.abs(a1);
    const B = (1.0 + SP.g_a) - SP.kappa_a * y;
    return s * quadRootPos(SP.kappa_a, B, y);
  }

  function shear1(a1, L1) {
    return SP.shear1_c0 + SP.shear1_L * (L1 - 0.5);
  }

  function shear2(b1, L1) {
    const blueGate = b1 / Math.sqrt(b1 * b1 + 0.015);
    return SP.shear2_c0 + SP.shear2_neg_b * blueGate + SP.shear2_L * (L1 - 0.5);
  }

  function shear3(a2, L1) {
    return SP.shear3_c0 + SP.shear3_L * (L1 - 0.5);
  }

  function radialFactors(u1, v1, L1) {
    const u2 = u1 * u1 - v1 * v1;
    const v2 = 2.0 * u1 * v1;
    const u3 = u1 * u2 - v1 * v2;
    const v3 = v1 * u2 + u1 * v2;
    const gamma = Math.max(0.50, Math.min(1.25,
      SP.gamma0 + SP.gamma_u * u1 + SP.gamma_v * v1 + SP.gamma_u2 * u2 + SP.gamma_v2 * v2
    ));
    const beta = SP.beta0 * Math.exp(
      SP.beta_u * u1 + SP.beta_v * v1 + SP.beta_u2 * u2 + SP.beta_v2 * v2
    );
    const G = Math.max(0.20,
      SP.G0 * (1.0 + SP.G_u * u1 + SP.G_v * v1 + SP.G_u2 * u2 + SP.G_v2 * v2 + SP.G_u3 * u3 + SP.G_v3 * v3 + SP.G_L * (L1 - 0.5))
    );
    return [gamma, beta, G];
  }

  function hkFactor(a, b) {
    const C = Math.hypot(a, b);
    const u1 = C > 1e-18 ? a / C : 0.0;
    const v1 = C > 1e-18 ? b / C : 0.0;
    const u2 = u1 * u1 - v1 * v1;
    const v2 = 2.0 * u1 * v1;
    const satC = C / (1.0 + SP.hk_sat * C);
    const rawK = satC * (SP.hk_weight + SP.hk_u * u1 + SP.hk_v * v1 + SP.hk_u2 * u2 + SP.hk_v2 * v2);
    const r = rawK / 0.35;
    return 0.35 * (rawK / Math.sqrt(1.0 + r * r));
  }

  function fromXYZ(XYZ) {
    const lms = matVec3(M1, XYZ);
    const lmsC = [psiFwd(lms[0]), psiFwd(lms[1]), psiFwd(lms[2])];
    const Lab0 = matVec3(M2, lmsC);
    const L0 = Lab0[0], a0 = Lab0[1], b0 = Lab0[2];
    const L1 = padeLightnessFwd(L0);
    const a1 = aStretchFwd(a0);
    const b1 = b0 + shear1(a1, L1) * a1;
    const a2 = a1 + shear2(b1, L1) * b1;
    const b2 = b1 + shear3(a2, L1) * a2;
    const C2 = Math.hypot(a2, b2);
    let a = 0.0, b = 0.0;
    if (C2 > 1e-18) {
      const u = a2 / C2;
      const v = b2 / C2;
      const [gamma, beta, G] = radialFactors(u, v, L1);
      const C2_pow = Math.pow(C2, gamma);
      const C = G * Math.log1p(beta * C2_pow) / beta;
      a = C * u;
      b = C * v;
    }
    const kHk = hkFactor(a, b);
    const L = L1 + kHk * L1 * (1.0 - L1);
    return [L, a, b];
  }

  function toXYZ(Lab) {
    const L = Lab[0], a = Lab[1], b = Lab[2];
    const kHk = hkFactor(a, b);
    const Bhk = 1.0 + kHk;
    const disc = Math.max(0.0, Bhk * Bhk - 4.0 * kHk * L);
    const L1 = (2.0 * L) / (Bhk + Math.sqrt(disc) + 1e-30);
    const C = Math.hypot(a, b);
    let a2 = 0.0, b2 = 0.0;
    if (C > 1e-18) {
      const u = a / C;
      const v = b / C;
      const [gamma, beta, G] = radialFactors(u, v, L1);
      const argExp = Math.min(700.0, beta * C / G);
      const C2_pow = Math.expm1(argExp) / beta;
      const C2 = Math.pow(Math.max(0.0, C2_pow), 1.0 / gamma);
      a2 = C2 * u;
      b2 = C2 * v;
    }
    const b1 = b2 - shear3(a2, L1) * a2;
    const a1 = a2 - shear2(b1, L1) * b1;
    const b0 = b1 - shear1(a1, L1) * a1;
    const a0 = aStretchInv(a1);
    const L0 = padeLightnessInv(L1);
    const lmsC = matVec3(M2_INV, [L0, a0, b0]);
    const lms = [psiInv(lmsC[0]), psiInv(lmsC[1]), psiInv(lmsC[2])];
    return matVec3(M1_INV, lms);
  }

  function fromSRGB(srgb) {
    return fromXYZ(sRGBToXYZ(srgb));
  }

  function toSRGB(Lab, clip = true) {
    const srgb = XYZToSRGB(toXYZ(Lab));
    if (!clip) return srgb;
    return [
      Math.max(0.0, Math.min(1.0, srgb[0])),
      Math.max(0.0, Math.min(1.0, srgb[1])),
      Math.max(0.0, Math.min(1.0, srgb[2]))
    ];
  }

  function fromHex(hex) {
    return fromSRGB(hexToSRGB(hex));
  }

  function gamutMap(Lab) {
    const L = Math.max(0.0, Math.min(1.0, Lab[0]));
    const a = Lab[1], b = Lab[2];
    const lin0 = matVec3(M_XYZ_TO_SRGB, toXYZ([L, a, b]));
    if (lin0[0] >= -1e-6 && lin0[0] <= 1.000001 &&
        lin0[1] >= -1e-6 && lin0[1] <= 1.000001 &&
        lin0[2] >= -1e-6 && lin0[2] <= 1.000001) {
      return [L, a, b];
    }
    let lo = 0.0, hi = 1.0;
    for (let i = 0; i < 8; i++) {
      const mid = 0.5 * (lo + hi);
      const lin = matVec3(M_XYZ_TO_SRGB, toXYZ([L, a * mid, b * mid]));
      if (lin[0] >= -1e-6 && lin[0] <= 1.000001 &&
          lin[1] >= -1e-6 && lin[1] <= 1.000001 &&
          lin[2] >= -1e-6 && lin[2] <= 1.000001) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return [L, a * lo, b * lo];
  }

  function toHex(Lab) {
    return sRGBToHex(toSRGB(gamutMap(Lab), true));
  }

  function toLCh(Lab) {
    const C = Math.hypot(Lab[1], Lab[2]);
    let h = (Math.atan2(Lab[2], Lab[1]) * 180.0 / Math.PI) % 360.0;
    if (h < 0) h += 360.0;
    if (C < 1e-12) h = 0.0;
    return [Lab[0], C, h];
  }

  function fromLCh(LCh) {
    const hr = LCh[2] * Math.PI / 180.0;
    return [LCh[0], LCh[1] * Math.cos(hr), LCh[1] * Math.sin(hr)];
  }

  function euclideanDistanceFromLab(Lab1, Lab2) {
    return Math.hypot(Lab2[0] - Lab1[0], Lab2[1] - Lab1[1], Lab2[2] - Lab1[2]);
  }

  function euclideanDistance(XYZ1, XYZ2) {
    return euclideanDistanceFromLab(fromXYZ(XYZ1), fromXYZ(XYZ2));
  }

  function distanceFromLab(Lab1, Lab2, opts = {}) {
    const L1 = Lab1[0], a1 = Lab1[1], b1 = Lab1[2];
    const L2 = Lab2[0], a2 = Lab2[1], b2 = Lab2[2];

    const dL = L2 - L1;
    const da = a2 - a1;
    const db = b2 - b1;

    const L_bar = 0.5 * (L1 + L2);
    const a_bar = 0.5 * (a1 + a2);
    const b_bar = 0.5 * (b1 + b2);
    const C_bar = Math.hypot(a_bar, b_bar);
    const C_safe = Math.max(C_bar, 1e-12);

    const u1 = C_bar > 1e-12 ? a_bar / C_safe : 1.0;
    const v1 = C_bar > 1e-12 ? b_bar / C_safe : 0.0;
    const u2 = u1 * u1 - v1 * v1;
    const v2 = 2.0 * u1 * v1;
    const u3 = u1 * u2 - v1 * v2;
    const v3 = v1 * u2 + u1 * v2;

    const dC_proj = u1 * da + v1 * db;
    const dH_proj = -v1 * da + u1 * db;

    const L_m = L_bar - 0.5;
    const SL = Math.max(0.20,
      MP[0] * (1.0 + MP[1] * (L_m * L_m) / Math.sqrt(0.04 + L_m * L_m) + MP[2] * L_m + MP[3] * C_bar)
    );

    const SC_dir = Math.max(0.30,
      1.0 + MP[6] * u1 + MP[7] * v1 + MP[8] * u2 + MP[9] * v2 + MP[10] * u3 + MP[11] * v3
    );
    const SC = Math.max(0.20, MP[4] * (1.0 + MP[5] * C_bar) * SC_dir);

    let SH;
    if (opts && opts.forceScEqSh) {
      SH = SC;
    } else {
      const SH_dir = Math.max(0.30,
        1.0 + MP[14] * u1 + MP[15] * v1 + MP[16] * u2 + MP[17] * v2 + MP[18] * u3 + MP[19] * v3
      );
      SH = Math.max(0.20, MP[12] * (1.0 + MP[13] * C_bar) * SH_dir);
    }

    let RT = 0.0;
    if (!(opts && opts.disableRt)) {
      const C2_bar = C_bar * C_bar;
      const C4 = C2_bar * C2_bar;
      const C0_4 = Math.pow(0.32, 4);
      const C_gate = C4 / (C0_4 + C4);
      const u_b0 = Math.cos(MP[21]);
      const v_b0 = Math.sin(MP[21]);
      const du_b = u1 - u_b0;
      const dv_b = v1 - v_b0;
      const blue_bell = Math.exp(-MP[22] * (du_b * du_b + dv_b * dv_b));
      RT = MP[20] * C_gate * blue_bell;
    }

    const tL = dL / SL;
    const tC = dC_proj / SC;
    const tH = dH_proj / SH;

    const ds2 = Math.max(0.0, tL * tL + tC * tC + tH * tH + RT * tC * tH);
    const ds = Math.sqrt(ds2);
    const usePowerLaw = !(opts && opts.usePowerLaw === false);
    return usePowerLaw ? Math.pow(ds, MP[23]) : ds;
  }

  function distance(XYZ1, XYZ2, opts = {}) {
    return distanceFromLab(fromXYZ(XYZ1), fromXYZ(XYZ2), opts);
  }

  function difference(c1, c2, opts = {}) {
    const x1 = typeof c1 === "string" ? sRGBToXYZ(hexToSRGB(c1)) : sRGBToXYZ(c1);
    const x2 = typeof c2 === "string" ? sRGBToXYZ(hexToSRGB(c2)) : sRGBToXYZ(c2);
    return distance(x1, x2, opts);
  }

  function riemannianArcInterpolate(l1, l2, uTargets, nCtrl = 32) {
    const uGrid = [];
    const pts = [];
    for (let i = 0; i <= nCtrl; i++) {
      const u = i / nCtrl;
      uGrid.push(u);
      pts.push([
        (1.0 - u) * l1[0] + u * l2[0],
        (1.0 - u) * l1[1] + u * l2[1],
        (1.0 - u) * l1[2] + u * l2[2]
      ]);
    }
    const cumS = [0.0];
    for (let i = 0; i < nCtrl; i++) {
      cumS.push(cumS[i] + distanceFromLab(pts[i], pts[i + 1], { usePowerLaw: false }));
    }
    const totalS = cumS[nCtrl];
    const mapU = (uTarget) => {
      if (totalS < 1e-12) return uTarget;
      const targetS = uTarget * totalS;
      if (targetS <= 0.0) return 0.0;
      if (targetS >= totalS) return 1.0;
      let idx = 0;
      while (idx < nCtrl - 1 && cumS[idx + 1] < targetS) idx++;
      const segLen = cumS[idx + 1] - cumS[idx];
      const frac = segLen > 1e-15 ? (targetS - cumS[idx]) / segLen : 0.0;
      return uGrid[idx] + frac * (uGrid[idx + 1] - uGrid[idx]);
    };
    if (typeof uTargets === "number") {
      const tm = mapU(uTargets);
      return [(1.0 - tm) * l1[0] + tm * l2[0], (1.0 - tm) * l1[1] + tm * l2[1], (1.0 - tm) * l1[2] + tm * l2[2]];
    }
    return uTargets.map((ut) => {
      const tm = mapU(ut);
      return [(1.0 - tm) * l1[0] + tm * l2[0], (1.0 - tm) * l1[1] + tm * l2[1], (1.0 - tm) * l1[2] + tm * l2[2]];
    });
  }

  function mix(c1, c2, t = 0.5, metricStep = true) {
    const l1 = typeof c1 === "string" ? fromHex(c1) : fromSRGB(c1);
    const l2 = typeof c2 === "string" ? fromHex(c2) : fromSRGB(c2);
    const lab = metricStep
      ? riemannianArcInterpolate(l1, l2, t)
      : [(1.0 - t) * l1[0] + t * l2[0], (1.0 - t) * l1[1] + t * l2[1], (1.0 - t) * l1[2] + t * l2[2]];
    return typeof c1 === "string" ? toHex(lab) : toSRGB(gamutMap(lab), true);
  }

  function gradient(c1, c2, steps = 16, metricStep = true) {
    const l1 = typeof c1 === "string" ? fromHex(c1) : fromSRGB(c1);
    const l2 = typeof c2 === "string" ? fromHex(c2) : fromSRGB(c2);
    const uTargets = [];
    for (let i = 0; i < steps; i++) {
      uTargets.push(steps <= 1 ? 0.0 : i / (steps - 1));
    }
    const labs = metricStep
      ? riemannianArcInterpolate(l1, l2, uTargets)
      : uTargets.map((t) => [(1.0 - t) * l1[0] + t * l2[0], (1.0 - t) * l1[1] + t * l2[1], (1.0 - t) * l1[2] + t * l2[2]]);
    return labs.map((lab) => typeof c1 === "string" ? toHex(lab) : toSRGB(gamutMap(lab), true));
  }

  return {
    version: "2.1.0",
    D65_WHITE,
    M1, M1_INV, M2, M2_INV, PADE, SP, MP,
    sRGBToXYZ, XYZToSRGB, hexToSRGB, sRGBToHex,
    fromXYZ, toXYZ, fromSRGB, toSRGB, fromHex, toHex,
    toLCh, fromLCh, gamutMap,
    euclideanDistanceFromLab, euclideanDistance,
    distanceFromLab, distance, difference, mix, gradient
  };
})();

export default AxiomLab;
