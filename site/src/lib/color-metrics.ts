/**
 * Browser-side color-difference helpers used by the playground.
 * AxiomLab comes from the repository's own zero-dependency implementation;
 * HelmLab from the npm package; CIEDE2000/OKLab/CIE76 are compact reference
 * implementations of the published formulae.
 */
import ax from '#lib/axiomlab.js';
import { Helmlab } from 'helmlab';

export const D65 = [0.95047, 1.0, 1.08883] as const;

export type XYZ = [number, number, number];
export type Lab = [number, number, number];

export const axiom = ax as unknown as {
	version: string;
	hexToSRGB(hex: string): [number, number, number];
	sRGBToHex(rgb: [number, number, number]): string;
	sRGBToXYZ(rgb: [number, number, number]): XYZ;
	XYZToSRGB(xyz: XYZ): [number, number, number];
	fromHex(hex: string): Lab;
	fromXYZ(xyz: XYZ): Lab;
	toHex(lab: Lab): string;
	toLCh(lab: Lab): [number, number, number];
	difference(a: string, b: string, opts?: { usePowerLaw?: boolean }): number;
	distance(a: XYZ, b: XYZ, opts?: { usePowerLaw?: boolean }): number;
	distanceFromLab(a: Lab, b: Lab, opts?: { usePowerLaw?: boolean }): number;
	euclideanDistance(a: XYZ, b: XYZ): number;
	gradient(a: string, b: string, steps?: number, metricStep?: boolean): string[];
	mix(a: string, b: string, t?: number, metricStep?: boolean): string;
	gamutMap(lab: Lab): Lab;
};

const hl = new Helmlab();

export function xyzOf(hex: string): XYZ {
	return axiom.sRGBToXYZ(axiom.hexToSRGB(hex));
}

export function helmDifference(hexA: string, hexB: string): number {
	return hl.metric.space.distance(xyzOf(hexA), xyzOf(hexB));
}

/** CIE XYZ → HelmLab MetricSpace Lab (for throughput tests). */
export function helmFromXyz(xyz: XYZ) {
	return hl.metric.space.fromXYZ(xyz);
}

/** Trained HelmLab distance on XYZ pairs (no hex parsing overhead). */
export function helmDistanceXyz(a: XYZ, b: XYZ): number {
	return hl.metric.space.distance(a, b);
}

export function helmGradient(a: string, b: string, steps = 12): string[] {
	const lab1 = hl.gen.space.fromXYZ(xyzOf(a));
	const lab2 = hl.gen.space.fromXYZ(xyzOf(b));
	const N = 160;
	const cum = [0];
	let prev = xyzToCielab(hl.gen.space.toXYZ(lab1));
	for (let i = 1; i <= N; i++) {
		const t = i / N;
		const lab = lab1.map((v: number, k: number) => v + (lab2[k] - v) * t) as Lab;
		const cie = xyzToCielab(hl.gen.space.toXYZ(lab));
		cum.push(cum[i - 1] + ciede2000(prev, cie));
		prev = cie;
	}
	const total = cum[N];
	return Array.from({ length: steps }, (_, s) => {
		const f = steps === 1 ? 0 : s / (steps - 1);
		const target = f * total;
		let lo = 0;
		let hi = N;
		while (lo < hi - 1) {
			const mid = (lo + hi) >> 1;
			if (cum[mid] < target) lo = mid;
			else hi = mid;
		}
		const span = cum[hi] - cum[lo];
		const frac = span > 1e-12 ? (target - cum[lo]) / span : 0;
		const t = (lo + frac) / N;
		const lab = lab1.map((v: number, k: number) => v + (lab2[k] - v) * t) as Lab;
		const xyz = hl.gen.space.toXYZ(lab);
		const srgb = axiom.XYZToSRGB(xyz);
		return axiom.sRGBToHex([
			Math.min(1, Math.max(0, srgb[0])),
			Math.min(1, Math.max(0, srgb[1])),
			Math.min(1, Math.max(0, srgb[2]))
		]);
	});
}

export function xyzToCielab(xyz: XYZ): Lab {
	const r = xyz.map((v, i) => v / D65[i]);
	const delta = 6 / 29;
	const f = r.map((v) => (v > delta ** 3 ? Math.cbrt(Math.max(v, 0)) : v / (3 * delta * delta) + 4 / 29));
	return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
}

export function ciede2000(lab1: Lab, lab2: Lab): number {
	const [L1, a1, b1] = lab1;
	const [L2, a2, b2] = lab2;
	const C1 = Math.hypot(a1, b1);
	const C2 = Math.hypot(a2, b2);
	const Cbar = 0.5 * (C1 + C2);
	const Cbar7 = Cbar ** 7;
	const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));
	const a1p = (1 + G) * a1;
	const a2p = (1 + G) * a2;
	const C1p = Math.hypot(a1p, b1);
	const C2p = Math.hypot(a2p, b2);
	const h1p = C1p < 1e-12 ? 0 : ((Math.atan2(b1, a1p) * 180) / Math.PI + 360) % 360;
	const h2p = C2p < 1e-12 ? 0 : ((Math.atan2(b2, a2p) * 180) / Math.PI + 360) % 360;
	const dLp = L2 - L1;
	const dCp = C2p - C1p;
	const dh = h2p - h1p;
	const dhp = C1p * C2p < 1e-12 ? 0 : dh > 180 ? dh - 360 : dh < -180 ? dh + 360 : dh;
	const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);
	const Lbar = 0.5 * (L1 + L2);
	const Cpbar = 0.5 * (C1p + C2p);
	const hsum = h1p + h2p;
	const hbar =
		C1p * C2p < 1e-12
			? hsum
			: Math.abs(h1p - h2p) <= 180
				? 0.5 * hsum
				: hsum < 360
					? 0.5 * (hsum + 360)
					: 0.5 * (hsum - 360);
	const rad = Math.PI / 180;
	const T =
		1 -
		0.17 * Math.cos((hbar - 30) * rad) +
		0.24 * Math.cos(2 * hbar * rad) +
		0.32 * Math.cos((3 * hbar + 6) * rad) -
		0.2 * Math.cos((4 * hbar - 63) * rad);
	const dTheta = 30 * Math.exp(-(((hbar - 275) / 25) ** 2));
	const Rc = 2 * Math.sqrt(Cpbar ** 7 / (Cpbar ** 7 + 25 ** 7));
	const Sl = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2);
	const Sc = 1 + 0.045 * Cpbar;
	const Sh = 1 + 0.015 * Cpbar * T;
	const Rt = -Math.sin(2 * dTheta * rad) * Rc;
	return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

export function ciede2000Hex(a: string, b: string): number {
	return ciede2000(xyzToCielab(xyzOf(a)), xyzToCielab(xyzOf(b)));
}

export function cie76Hex(a: string, b: string): number {
	const p = xyzToCielab(xyzOf(a));
	const q = xyzToCielab(xyzOf(b));
	return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
}

const M1 = [
	[0.8189330101, 0.3618667424, -0.1288597137],
	[0.0329845436, 0.9293118715, 0.0361456387],
	[0.0482003018, 0.2643662691, 0.633851707]
];
const M2 = [
	[0.2104542553, 0.793617785, -0.0040720468],
	[1.9779984951, -2.428592205, 0.4505937099],
	[0.0259040371, 0.7827717662, -0.808675766]
];

function mul(m: number[][], v: number[]) {
	return [
		m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
		m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
		m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
	];
}

export function oklabOf(hex: string): Lab {
	const lms = mul(M1, xyzOf(hex));
	return mul(
		M2,
		lms.map((v) => Math.cbrt(v))
	) as Lab;
}

const M1_INV = [
	[1.2270138511, -0.5577999807, 0.281256149],
	[-0.0405801784, 1.1122568696, -0.0716766787],
	[-0.0763812845, -0.4214819784, 1.5861632204]
];
const M2_INV = [
	[1, 0.3963377774, 0.2158037573],
	[1, -0.1055613458, -0.0638541728],
	[1, -0.0894841775, -1.291485548]
];

export function hexOfOklab(lab: Lab): string {
	const lmsC = mul(M2_INV, lab);
	const lms = lmsC.map((v) => v ** 3);
	const xyz = mul(M1_INV, lms);
	const srgb = axiom.XYZToSRGB(xyz as XYZ);
	return axiom.sRGBToHex(srgb.map((v) => Math.min(1, Math.max(0, v))) as [number, number, number]);
}

export function oklabGradient(a: string, b: string, steps = 12): string[] {
	const p = oklabOf(a);
	const q = oklabOf(b);
	return Array.from({ length: steps }, (_, i) => {
		const t = steps === 1 ? 0 : i / (steps - 1);
		return hexOfOklab(p.map((v, k) => v + (q[k] - v) * t) as Lab);
	});
}

export function linearGradient(a: string, b: string, steps = 12): string[] {
	const p = axiom.hexToSRGB(a);
	const q = axiom.hexToSRGB(b);
	return Array.from({ length: steps }, (_, i) => {
		const t = steps === 1 ? 0 : i / (steps - 1);
		return axiom.sRGBToHex(p.map((v, k) => v + (q[k] - v) * t) as [number, number, number]);
	});
}

export function oklabHex(a: string, b: string): number {
	const p = oklabOf(a);
	const q = oklabOf(b);
	return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
}
