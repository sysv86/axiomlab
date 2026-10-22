/**
 * M3 Expressive shape library + shape morphing.
 *
 * TypeScript port of androidx.graphics.shapes (RoundedPolygon, CornerRounding, circle/rectangle/star,
 * normalized, Morph incl. feature mapping) and androidx.compose.material3.MaterialShapes, taken from
 * docs/research/typography-shape.md §7 (all constants verbatim from MaterialShapes.kt).
 * Apache-2.0 (derived from AOSP). Coordinates are y-down (screen/SVG space), paths start at 3 o'clock.
 *
 * @example
 * <svg viewBox="0 0 100 100"><path d={shapePath('cookie9Sided')} /></svg>
 * <path d={morphPath('circle', 'square', progress)} />   // progress may overshoot (springs)
 */

const EPS = 1e-4; // DistanceEpsilon
const ANGLE_EPS = 1e-6; // AngleEpsilon

type Point = [number, number];
/** Cubic bezier: [x0, y0, c0x, c0y, c1x, c1y, x1, y1] */
export type Cubic = number[];

// ---------- point helpers ----------
const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Point, k: number): Point => [a[0] * k, a[1] * k];
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1];
const len = (a: Point) => Math.hypot(a[0], a[1]);
const dir = (a: Point): Point => {
	const d = len(a);
	if (!(d > 0)) throw new Error('zero-length vector');
	return [a[0] / d, a[1] / d];
};
const rot90 = (a: Point): Point => [-a[1], a[0]];
const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;
const lerpP = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const posMod = (n: number, m: number) => ((n % m) + m) % m;
const clockwise = (a: Point, b: Point) => a[0] * b[1] - a[1] * b[0] > 0;
const isConvex = (prev: Point, curr: Point, next: Point) => clockwise(sub(curr, prev), sub(next, curr));

// ---------- Cubic ----------
const straightLine = (x0: number, y0: number, x1: number, y1: number): Cubic => [
	x0,
	y0,
	lerp(x0, x1, 1 / 3),
	lerp(y0, y1, 1 / 3),
	lerp(x0, x1, 2 / 3),
	lerp(y0, y1, 2 / 3),
	x1,
	y1
];

function circularArc(cx: number, cy: number, x0: number, y0: number, x1: number, y1: number): Cubic {
	const p0d = dir([x0 - cx, y0 - cy]);
	const p1d = dir([x1 - cx, y1 - cy]);
	const r0 = rot90(p0d);
	const r1 = rot90(p1d);
	const cw = dot(r0, [x1 - cx, y1 - cy]) >= 0;
	const cosa = dot(p0d, p1d);
	if (cosa > 0.999) return straightLine(x0, y0, x1, y1);
	const k =
		((((len([x0 - cx, y0 - cy]) * 4) / 3) * (Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa))) /
			(1 - cosa)) *
		(cw ? 1 : -1);
	return [x0, y0, x0 + r0[0] * k, y0 + r0[1] * k, x1 - r1[0] * k, y1 - r1[1] * k, x1, y1];
}

function pointOnCurve(c: Cubic, t: number): Point {
	const u = 1 - t;
	return [
		c[0] * u * u * u + c[2] * 3 * t * u * u + c[4] * 3 * t * t * u + c[6] * t * t * t,
		c[1] * u * u * u + c[3] * 3 * t * u * u + c[5] * 3 * t * t * u + c[7] * t * t * t
	];
}
const zeroLength = (c: Cubic) => Math.abs(c[0] - c[6]) < EPS && Math.abs(c[1] - c[7]) < EPS;

function splitCubic(c: Cubic, t: number): [Cubic, Cubic] {
	const u = 1 - t;
	const p = pointOnCurve(c, t);
	return [
		[
			c[0],
			c[1],
			c[0] * u + c[2] * t,
			c[1] * u + c[3] * t,
			c[0] * u * u + c[2] * 2 * u * t + c[4] * t * t,
			c[1] * u * u + c[3] * 2 * u * t + c[5] * t * t,
			p[0],
			p[1]
		],
		[
			p[0],
			p[1],
			c[2] * u * u + c[4] * 2 * u * t + c[6] * t * t,
			c[3] * u * u + c[5] * 2 * u * t + c[7] * t * t,
			c[4] * u + c[6] * t,
			c[5] * u + c[7] * t,
			c[6],
			c[7]
		]
	];
}
const reverseCubic = (c: Cubic): Cubic => [c[6], c[7], c[4], c[5], c[2], c[3], c[0], c[1]];
type PointTransform = (x: number, y: number) => Point;
const transformCubic = (c: Cubic, f: PointTransform): Cubic => {
	const o: number[] = [];
	for (let i = 0; i < 8; i += 2) {
		const [x, y] = f(c[i], c[i + 1]);
		o.push(x, y);
	}
	return o;
};

// ---------- CornerRounding ----------
export interface CornerRounding {
	radius: number;
	smoothing: number;
}
export const rounding = (radius = 0, smoothing = 0): CornerRounding => ({ radius, smoothing });
export const UNROUNDED = rounding();

// ---------- RoundedCorner (private class in RoundedPolygon.kt) ----------
class RoundedCorner {
	p0: Point;
	p1: Point;
	p2: Point;
	d1: Point;
	d2: Point;
	cornerRadius: number;
	smoothing: number;
	cosAngle: number;
	sinAngle: number;
	expectedRoundCut: number;

	constructor(p0: Point, p1: Point, p2: Point, r: CornerRounding | null) {
		this.p0 = p0;
		this.p1 = p1;
		this.p2 = p2;
		const v01 = sub(p0, p1);
		const v21 = sub(p2, p1);
		const d01 = len(v01);
		const d21 = len(v21);
		if (d01 > 0 && d21 > 0) {
			this.d1 = mul(v01, 1 / d01);
			this.d2 = mul(v21, 1 / d21);
			this.cornerRadius = r?.radius ?? 0;
			this.smoothing = r?.smoothing ?? 0;
			this.cosAngle = dot(this.d1, this.d2);
			this.sinAngle = Math.sqrt(1 - this.cosAngle * this.cosAngle);
			this.expectedRoundCut =
				this.sinAngle > 1e-3 ? (this.cornerRadius * (this.cosAngle + 1)) / this.sinAngle : 0;
		} else {
			this.d1 = [0, 0];
			this.d2 = [0, 0];
			this.cornerRadius = 0;
			this.smoothing = 0;
			this.cosAngle = 0;
			this.sinAngle = 0;
			this.expectedRoundCut = 0;
		}
	}
	get expectedCut() {
		return (1 + this.smoothing) * this.expectedRoundCut;
	}
	actualSmoothing(allowedCut: number) {
		if (allowedCut > this.expectedCut) return this.smoothing;
		if (allowedCut > this.expectedRoundCut)
			return (
				(this.smoothing * (allowedCut - this.expectedRoundCut)) /
				(this.expectedCut - this.expectedRoundCut)
			);
		return 0;
	}
	getCubics(allowedCut0: number, allowedCut1 = allowedCut0): Cubic[] {
		const allowedCut = Math.min(allowedCut0, allowedCut1);
		const p1 = this.p1;
		if (this.expectedRoundCut < EPS || allowedCut < EPS || this.cornerRadius < EPS)
			return [straightLine(p1[0], p1[1], p1[0], p1[1])];
		const actualRoundCut = Math.min(allowedCut, this.expectedRoundCut);
		const s0 = this.actualSmoothing(allowedCut0);
		const s1 = this.actualSmoothing(allowedCut1);
		const actualR = (this.cornerRadius * actualRoundCut) / this.expectedRoundCut;
		const centerDistance = Math.sqrt(actualR * actualR + actualRoundCut * actualRoundCut);
		const center = add(p1, mul(dir(mul(add(this.d1, this.d2), 0.5)), centerDistance));
		const ci0 = add(p1, mul(this.d1, actualRoundCut));
		const ci2 = add(p1, mul(this.d2, actualRoundCut));
		const f0 = this.flanking(actualRoundCut, s0, p1, this.p0, ci0, ci2, center, actualR);
		const f2 = reverseCubic(this.flanking(actualRoundCut, s1, p1, this.p2, ci2, ci0, center, actualR));
		return [f0, circularArc(center[0], center[1], f0[6], f0[7], f2[0], f2[1]), f2];
	}
	flanking(
		actualRoundCut: number,
		smoothing: number,
		corner: Point,
		sideStart: Point,
		csi: Point,
		ocsi: Point,
		cc: Point,
		actualR: number
	): Cubic {
		const sideDir = dir(sub(sideStart, corner));
		const curveStart = add(corner, mul(sideDir, actualRoundCut * (1 + smoothing)));
		const p = lerpP(csi, mul(add(csi, ocsi), 0.5), smoothing);
		const curveEnd = add(cc, mul(dir(sub(p, cc)), actualR));
		const tangent = rot90(sub(curveEnd, cc));
		const anchorEnd = lineIntersection(sideStart, sideDir, curveEnd, tangent) ?? csi;
		const anchorStart = mul(add(curveStart, mul(anchorEnd, 2)), 1 / 3);
		return [...curveStart, ...anchorStart, ...anchorEnd, ...curveEnd];
	}
}

function lineIntersection(p0: Point, d0: Point, p1: Point, d1: Point): Point | null {
	const rd1 = rot90(d1);
	const den = dot(d0, rd1);
	if (Math.abs(den) < EPS) return null;
	const num = dot(sub(p1, p0), rd1);
	if (Math.abs(den) < EPS * Math.abs(num)) return null;
	return add(p0, mul(d0, num / den));
}

// ---------- RoundedPolygon ----------
export interface Feature {
	type: 'corner' | 'edge';
	convex?: boolean;
	cubics: Cubic[];
}

export class RoundedPolygon {
	features: Feature[];
	center: Point;
	cubics: Cubic[];

	constructor(features: Feature[], center: Point) {
		this.features = features;
		this.center = center;
		this.cubics = buildCubics(features, center);
	}
	transformed(f: PointTransform) {
		return new RoundedPolygon(
			this.features.map((ft) => ({ ...ft, cubics: ft.cubics.map((c) => transformCubic(c, f)) })),
			f(this.center[0], this.center[1])
		);
	}
	/** Same as Compose Matrix().rotateZ(deg) (y-down, so positive = clockwise on screen). */
	rotated(deg: number) {
		const r = (deg * Math.PI) / 180;
		const c = Math.cos(r);
		const s = Math.sin(r);
		return this.transformed((x, y) => [c * x - s * y, s * x + c * y]);
	}
	scaled(sx: number, sy = sx) {
		return this.transformed((x, y) => [x * sx, y * sy]);
	}
	calculateBounds(approximate = true): [number, number, number, number] {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = Number.MIN_VALUE; // mirrors Kotlin's Float.MIN_VALUE init
		let maxY = Number.MIN_VALUE;
		for (const c of this.cubics) {
			const b = cubicBounds(c, approximate);
			minX = Math.min(minX, b[0]);
			minY = Math.min(minY, b[1]);
			maxX = Math.max(maxX, b[2]);
			maxY = Math.max(maxY, b[3]);
		}
		return [minX, minY, maxX, maxY];
	}
	calculateMaxBounds(): [number, number, number, number] {
		let m = 0;
		const [cx, cy] = this.center;
		for (const c of this.cubics) {
			const mid = pointOnCurve(c, 0.5);
			m = Math.max(m, (c[0] - cx) ** 2 + (c[1] - cy) ** 2, (mid[0] - cx) ** 2 + (mid[1] - cy) ** 2);
		}
		const d = Math.sqrt(m);
		return [cx - d, cy - d, cx + d, cy + d];
	}
	/** Fit into the unit square [0,1]x[0,1], aspect preserved, centered (RoundedPolygon.normalized). */
	normalized() {
		const [l, t, r, b] = this.calculateBounds();
		const w = r - l;
		const h = b - t;
		const side = Math.max(w, h);
		const ox = (side - w) / 2 - l;
		const oy = (side - h) / 2 - t;
		return this.transformed((x, y) => [(x + ox) / side, (y + oy) / side]);
	}
}

function buildCubics(features: Feature[], center: Point): Cubic[] {
	const out: Cubic[] = [];
	let first: Cubic | null = null;
	let last: Cubic | null = null;
	let splitStart: Cubic[] | null = null;
	let splitEnd: Cubic[] | null = null;
	if (features.length > 0 && features[0].cubics.length === 3) {
		const [s, e] = splitCubic(features[0].cubics[1], 0.5);
		splitStart = [features[0].cubics[0], s];
		splitEnd = [e, features[0].cubics[2]];
	}
	for (let i = 0; i <= features.length; i++) {
		let fc: Cubic[];
		if (i === 0 && splitEnd) fc = splitEnd;
		else if (i === features.length) {
			if (splitStart) fc = splitStart;
			else break;
		} else fc = features[i].cubics;
		for (const c of fc) {
			if (!zeroLength(c)) {
				if (last) out.push(last);
				last = c;
				if (!first) first = c;
			} else if (last) {
				last = last.slice();
				last[6] = c[6];
				last[7] = c[7];
			}
		}
	}
	if (last && first) out.push([last[0], last[1], last[2], last[3], last[4], last[5], first[0], first[1]]);
	else out.push([center[0], center[1], center[0], center[1], center[0], center[1], center[0], center[1]]);
	return out;
}

function cubicBounds(c: Cubic, approximate: boolean): [number, number, number, number] {
	if (zeroLength(c)) return [c[0], c[1], c[0], c[1]];
	let minX = Math.min(c[0], c[6]);
	let minY = Math.min(c[1], c[7]);
	let maxX = Math.max(c[0], c[6]);
	let maxY = Math.max(c[1], c[7]);
	if (approximate) {
		return [
			Math.min(minX, c[2], c[4]),
			Math.min(minY, c[3], c[5]),
			Math.max(maxX, c[2], c[4]),
			Math.max(maxY, c[3], c[5])
		];
	}
	for (const axis of [0, 1]) {
		const a = -c[axis] + 3 * c[2 + axis] - 3 * c[4 + axis] + c[6 + axis];
		const b = 2 * c[axis] - 4 * c[2 + axis] + 2 * c[4 + axis];
		const k = -c[axis] + c[2 + axis];
		const ts: number[] = [];
		if (Math.abs(a) < EPS) {
			if (b !== 0) ts.push((2 * k) / (-2 * b));
		} else {
			const disc = b * b - 4 * a * k;
			if (disc >= 0) ts.push((-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a));
		}
		for (const t of ts) {
			if (t < 0 || t > 1) continue;
			const v = pointOnCurve(c, t)[axis];
			if (axis === 0) {
				minX = Math.min(minX, v);
				maxX = Math.max(maxX, v);
			} else {
				minY = Math.min(minY, v);
				maxY = Math.max(maxY, v);
			}
		}
	}
	return [minX, minY, maxX, maxY];
}

/** RoundedPolygon(vertices: FloatArray, rounding, perVertexRounding, centerX, centerY) */
export function polygonFromVertices(
	vertices: number[],
	round: CornerRounding = UNROUNDED,
	perVertex: CornerRounding[] | null = null,
	centerX?: number,
	centerY?: number
) {
	const n = vertices.length / 2;
	if (n < 3) throw new Error('Polygons must have at least 3 vertices');
	const V = (i: number): Point => [vertices[i * 2], vertices[i * 2 + 1]];
	const corners: RoundedCorner[] = [];
	for (let i = 0; i < n; i++)
		corners.push(new RoundedCorner(V((i + n - 1) % n), V(i), V((i + 1) % n), perVertex?.[i] ?? round));
	// Scale cuts down when two neighbouring corners want more of a side than is available.
	const cutAdjusts: [number, number][] = [];
	for (let ix = 0; ix < n; ix++) {
		const nx = (ix + 1) % n;
		const expectedRoundCut = corners[ix].expectedRoundCut + corners[nx].expectedRoundCut;
		const expectedCut = corners[ix].expectedCut + corners[nx].expectedCut;
		const side = len(sub(V(ix), V(nx)));
		if (expectedRoundCut > side) cutAdjusts.push([side / expectedRoundCut, 0]);
		else if (expectedCut > side)
			cutAdjusts.push([1, (side - expectedRoundCut) / (expectedCut - expectedRoundCut)]);
		else cutAdjusts.push([1, 1]);
	}
	const cornerCubics: Cubic[][] = [];
	for (let i = 0; i < n; i++) {
		const allowed = [0, 1].map((delta) => {
			const [roundCutRatio, cutRatio] = cutAdjusts[(i + n - 1 + delta) % n];
			return (
				corners[i].expectedRoundCut * roundCutRatio +
				(corners[i].expectedCut - corners[i].expectedRoundCut) * cutRatio
			);
		});
		cornerCubics.push(corners[i].getCubics(allowed[0], allowed[1]));
	}
	const features: Feature[] = [];
	for (let i = 0; i < n; i++) {
		const convex = isConvex(V((i + n - 1) % n), V(i), V((i + 1) % n));
		features.push({ type: 'corner', convex, cubics: cornerCubics[i] });
		const a = cornerCubics[i][cornerCubics[i].length - 1];
		const b = cornerCubics[(i + 1) % n][0];
		features.push({ type: 'edge', cubics: [straightLine(a[6], a[7], b[0], b[1])] });
	}
	let center: Point;
	if (centerX === undefined || centerY === undefined) {
		let sx = 0;
		let sy = 0;
		for (let i = 0; i < n; i++) {
			sx += vertices[2 * i];
			sy += vertices[2 * i + 1];
		}
		center = [sx / n, sy / n];
	} else center = [centerX, centerY];
	return new RoundedPolygon(features, center);
}

interface RegularPolygonOptions {
	radius?: number;
	centerX?: number;
	centerY?: number;
	rounding?: CornerRounding;
	perVertexRounding?: CornerRounding[] | null;
}

/** RoundedPolygon(numVertices, radius = 1, centerX = 0, centerY = 0, rounding, perVertexRounding) */
export function regularPolygon(
	numVertices: number,
	{ radius = 1, centerX = 0, centerY = 0, rounding: r = UNROUNDED, perVertexRounding = null }: RegularPolygonOptions = {}
) {
	const v: number[] = [];
	for (let i = 0; i < numVertices; i++) {
		const a = (Math.PI / numVertices) * 2 * i;
		v.push(Math.cos(a) * radius + centerX, Math.sin(a) * radius + centerY);
	}
	return polygonFromVertices(v, r, perVertexRounding, centerX, centerY);
}

/** RoundedPolygon.circle(numVertices = 8, radius = 1) */
export function circle(numVertices = 8, radius = 1, centerX = 0, centerY = 0) {
	return regularPolygon(numVertices, {
		radius: radius / Math.cos(Math.PI / numVertices),
		centerX,
		centerY,
		rounding: rounding(radius)
	});
}

interface RectangleOptions {
	width?: number;
	height?: number;
	rounding?: CornerRounding;
	perVertexRounding?: CornerRounding[] | null;
	centerX?: number;
	centerY?: number;
}

/** RoundedPolygon.rectangle(width = 2, height = 2, rounding, perVertexRounding) */
export function rectangle({
	width = 2,
	height = 2,
	rounding: r = UNROUNDED,
	perVertexRounding = null,
	centerX = 0,
	centerY = 0
}: RectangleOptions = {}) {
	const l = centerX - width / 2;
	const t = centerY - height / 2;
	const rr = centerX + width / 2;
	const b = centerY + height / 2;
	return polygonFromVertices([rr, b, l, b, l, t, rr, t], r, perVertexRounding, centerX, centerY);
}

interface StarOptions {
	radius?: number;
	innerRadius?: number;
	rounding?: CornerRounding;
	innerRounding?: CornerRounding | null;
	perVertexRounding?: CornerRounding[] | null;
	centerX?: number;
	centerY?: number;
}

/** RoundedPolygon.star(numVerticesPerRadius, radius = 1, innerRadius = .5, rounding, innerRounding, perVertexRounding) */
export function star(
	numVerticesPerRadius: number,
	{
		radius = 1,
		innerRadius = 0.5,
		rounding: r = UNROUNDED,
		innerRounding = null,
		perVertexRounding = null,
		centerX = 0,
		centerY = 0
	}: StarOptions = {}
) {
	let pv = perVertexRounding;
	if (!pv && innerRounding)
		pv = Array.from({ length: numVerticesPerRadius }, () => [r, innerRounding]).flat();
	const v: number[] = [];
	for (let i = 0; i < numVerticesPerRadius; i++) {
		let a = (Math.PI / numVerticesPerRadius) * 2 * i;
		v.push(Math.cos(a) * radius + centerX, Math.sin(a) * radius + centerY);
		a = (Math.PI / numVerticesPerRadius) * (2 * i + 1);
		v.push(Math.cos(a) * innerRadius + centerX, Math.sin(a) * innerRadius + centerY);
	}
	return polygonFromVertices(v, r, pv, centerX, centerY);
}

// ---------- SVG output ----------
const fmt = (n: number, d: number) => {
	const s = (+n.toFixed(d)).toString();
	return s === '-0' ? '0' : s;
};

export interface SvgPathOptions {
	/** Multiplies the unit-square coordinates (100 → viewBox "0 0 100 100"). */
	scale?: number;
	/** Decimal digits. */
	digits?: number;
}

/** Cubics -> SVG path "M..C..Z". */
export function cubicsToSvgPath(cubics: Cubic[], { scale = 1, digits = 3 }: SvgPathOptions = {}) {
	if (!cubics.length) return '';
	const p = (x: number, y: number) => `${fmt(x * scale, digits)} ${fmt(y * scale, digits)}`;
	let d = `M${p(cubics[0][0], cubics[0][1])}`;
	for (const c of cubics) d += `C${p(c[2], c[3])} ${p(c[4], c[5])} ${p(c[6], c[7])}`;
	return `${d}Z`;
}
export const toSvgPath = (polygon: RoundedPolygon, opts?: SvgPathOptions) => cubicsToSvgPath(polygon.cubics, opts);

// ---------- Morph (Morph.kt + FeatureMapping.kt + PolygonMeasure.kt + FloatMapping.kt) ----------
function closestProgressTo(c: Cubic, threshold: number): [number, number] {
	const segments = 3;
	let total = 0;
	let rem = threshold;
	let prev: Point = [c[0], c[1]];
	for (let i = 1; i <= segments; i++) {
		const t = i / segments;
		const pt = pointOnCurve(c, t);
		const seg = len(sub(pt, prev));
		if (seg >= rem) return [t - (1 - rem / seg) / segments, threshold];
		rem -= seg;
		total += seg;
		prev = pt;
	}
	return [1, total];
}
const measureCubic = (c: Cubic) => closestProgressTo(c, Infinity)[1];
const findCubicCutPoint = (c: Cubic, m: number) => closestProgressTo(c, m)[0];

class MeasuredCubic {
	cubic: Cubic;
	start: number;
	end: number;
	size: number;
	constructor(cubic: Cubic, start: number, end: number) {
		this.cubic = cubic;
		this.start = start;
		this.end = end;
		this.size = measureCubic(cubic);
	}
	cutAtProgress(p: number): [MeasuredCubic, MeasuredCubic] {
		const b = Math.min(Math.max(p, this.start), this.end);
		const rel = (b - this.start) / (this.end - this.start);
		const t = findCubicCutPoint(this.cubic, rel * this.size);
		const [c1, c2] = splitCubic(this.cubic, t);
		return [new MeasuredCubic(c1, this.start, b), new MeasuredCubic(c2, b, this.end)];
	}
}

interface ProgressableFeature {
	progress: number;
	feature: Feature;
}

class MeasuredPolygon {
	features: ProgressableFeature[];
	cubics: MeasuredCubic[];
	constructor(features: ProgressableFeature[], cubics: Cubic[], outline: number[]) {
		this.features = features;
		this.cubics = [];
		let start = 0;
		for (let i = 0; i < cubics.length; i++) {
			if (outline[i + 1] - outline[i] > EPS) {
				this.cubics.push(new MeasuredCubic(cubics[i], start, outline[i + 1]));
				start = outline[i + 1];
			}
		}
		this.cubics[this.cubics.length - 1].end = 1;
	}
	static measure(polygon: RoundedPolygon) {
		const cubics: Cubic[] = [];
		const f2c: [Feature, number][] = [];
		for (const f of polygon.features) {
			f.cubics.forEach((c, ci) => {
				if (f.type === 'corner' && ci === Math.floor(f.cubics.length / 2)) f2c.push([f, cubics.length]);
				cubics.push(c);
			});
		}
		const measures = [0];
		for (const c of cubics) measures.push(measures[measures.length - 1] + measureCubic(c));
		const total = measures[measures.length - 1];
		const outline = measures.map((m) => m / total);
		const features = f2c.map(([f, ix]) => ({
			progress: posMod((outline[ix] + outline[ix + 1]) / 2, 1),
			feature: f
		}));
		return new MeasuredPolygon(features, cubics, outline);
	}
	cutAndShift(cp: number): MeasuredPolygon {
		if (cp < EPS) return this;
		const ti = this.cubics.findIndex((c) => cp >= c.start && cp <= c.end);
		const [b1, b2] = this.cubics[ti].cutAtProgress(cp);
		const n = this.cubics.length;
		const cubics = [b2.cubic];
		for (let i = 1; i < n; i++) cubics.push(this.cubics[(i + ti) % n].cubic);
		cubics.push(b1.cubic);
		const outline: number[] = [];
		for (let i = 0; i < n + 2; i++)
			outline.push(i === 0 ? 0 : i === n + 1 ? 1 : posMod(this.cubics[(ti + i - 1) % n].end - cp, 1));
		const features = this.features.map((f) => ({ progress: posMod(f.progress - cp, 1), feature: f.feature }));
		return new MeasuredPolygon(features, cubics, outline);
	}
}

const progressInRange = (p: number, from: number, to: number) =>
	to >= from ? p >= from && p <= to : p >= from || p <= to;
const progressDistance = (a: number, b: number) => {
	const d = Math.abs(a - b);
	return Math.min(d, 1 - d);
};
function linearMap(xs: number[], ys: number[], x: number) {
	const n = xs.length;
	let s = 0;
	while (!progressInRange(x, xs[s], xs[(s + 1) % n])) s++;
	const e = (s + 1) % n;
	const sx = posMod(xs[e] - xs[s], 1);
	const sy = posMod(ys[e] - ys[s], 1);
	const pos = sx < 0.001 ? 0.5 : posMod(x - xs[s], 1) / sx;
	return posMod(ys[s] + sy * pos, 1);
}
const repPoint = (f: Feature): Point => {
	const a = f.cubics[0];
	const b = f.cubics[f.cubics.length - 1];
	return [(a[0] + b[6]) / 2, (a[1] + b[7]) / 2];
};
function featureMapper(f1s: ProgressableFeature[], f2s: ProgressableFeature[]) {
	const c1 = f1s.filter((f) => f.feature.type === 'corner');
	const c2 = f2s.filter((f) => f.feature.type === 'corner');
	const dv: { d: number; a: ProgressableFeature; b: ProgressableFeature }[] = [];
	for (const a of c1) {
		for (const b of c2) {
			if (a.feature.convex !== b.feature.convex) continue; // convex never maps to concave
			const d = sub(repPoint(a.feature), repPoint(b.feature));
			dv.push({ d: dot(d, d), a, b });
		}
	}
	dv.sort((x, y) => x.d - y.d);
	let mapping: [number, number][];
	if (dv.length === 0) mapping = [
		[0, 0],
		[0.5, 0.5]
	];
	else if (dv.length === 1) {
		const a = dv[0].a.progress;
		const b = dv[0].b.progress;
		mapping = [
			[a, b],
			[(a + 0.5) % 1, (b + 0.5) % 1]
		];
	} else {
		mapping = [];
		const used1 = new Set<ProgressableFeature>();
		const used2 = new Set<ProgressableFeature>();
		for (const { a, b } of dv) {
			if (used1.has(a) || used2.has(b)) continue;
			let ins = mapping.findIndex((m) => m[0] > a.progress);
			if (ins < 0) ins = mapping.length;
			const n = mapping.length;
			if (n >= 1) {
				const [bf1, bf2] = mapping[(ins + n - 1) % n];
				const [af1, af2] = mapping[ins % n];
				if (
					progressDistance(a.progress, bf1) < EPS ||
					progressDistance(a.progress, af1) < EPS ||
					progressDistance(b.progress, bf2) < EPS ||
					progressDistance(b.progress, af2) < EPS
				)
					continue;
				if (n > 1 && !progressInRange(b.progress, bf2, af2)) continue;
			}
			mapping.splice(ins, 0, [a.progress, b.progress]);
			used1.add(a);
			used2.add(b);
		}
	}
	const xs = mapping.map((m) => m[0]);
	const ys = mapping.map((m) => m[1]);
	return { map: (x: number) => linearMap(xs, ys, x), mapBack: (x: number) => linearMap(ys, xs, x) };
}

export class Morph {
	start: RoundedPolygon;
	end: RoundedPolygon;
	match: [Cubic, Cubic][];
	constructor(start: RoundedPolygon, end: RoundedPolygon) {
		this.start = start;
		this.end = end;
		this.match = Morph.match(start, end);
	}
	static match(p1: RoundedPolygon, p2: RoundedPolygon): [Cubic, Cubic][] {
		const m1 = MeasuredPolygon.measure(p1);
		const m2 = MeasuredPolygon.measure(p2);
		const mapper = featureMapper(m1.features, m2.features);
		const cut = mapper.map(0);
		const bs1 = m1.cubics;
		const bs2 = m2.cutAndShift(cut).cubics;
		const ret: [Cubic, Cubic][] = [];
		let i1 = 0;
		let i2 = 0;
		let b1: MeasuredCubic | undefined = bs1[i1++];
		let b2: MeasuredCubic | undefined = bs2[i2++];
		while (b1 && b2) {
			const b1a = i1 === bs1.length ? 1 : b1.end;
			const b2a = i2 === bs2.length ? 1 : mapper.mapBack(posMod(b2.end + cut, 1));
			const minb = Math.min(b1a, b2a);
			let seg1: MeasuredCubic;
			let seg2: MeasuredCubic;
			if (b1a > minb + ANGLE_EPS) [seg1, b1] = b1.cutAtProgress(minb);
			else {
				seg1 = b1;
				b1 = bs1[i1++];
			}
			if (b2a > minb + ANGLE_EPS) [seg2, b2] = b2.cutAtProgress(posMod(mapper.map(minb) - cut, 1));
			else {
				seg2 = b2;
				b2 = bs2[i2++];
			}
			ret.push([seg1.cubic, seg2.cubic]);
		}
		if (b1 || b2) throw new Error("Expected both Polygon's Cubic to be fully matched");
		return ret;
	}
	/** Interpolated cubics at progress (0 = start, 1 = end; values outside [0,1] overshoot, like springs). */
	asCubics(progress: number): Cubic[] {
		const out = this.match.map(([a, b]) => a.map((v, i) => lerp(v, b[i], progress)));
		if (out.length) {
			const l = out[out.length - 1];
			l[6] = out[0][0];
			l[7] = out[0][1];
		}
		return out;
	}
	toSvgPath(progress: number, opts?: SvgPathOptions) {
		return cubicsToSvgPath(this.asCubics(progress), opts);
	}
}

// ---------- MaterialShapes (androidx.compose.material3.MaterialShapes) ----------
const r15 = rounding(0.15);
const r20 = rounding(0.2);
const r30 = rounding(0.3);
const r50 = rounding(0.5);
const r100 = rounding(1);
interface PointNRound {
	o: Point;
	r: CornerRounding;
}
const P = (x: number, y: number, r: CornerRounding = UNROUNDED): PointNRound => ({ o: [x, y], r });
const R = (radius: number, smoothing = 0) => rounding(radius, smoothing);

function doRepeat(points: PointNRound[], reps: number, center: Point, mirroring: boolean): PointNRound[] {
	const out: PointNRound[] = [];
	if (mirroring) {
		const ang = points.map((p) => (Math.atan2(p.o[1] - center[1], p.o[0] - center[0]) * 180) / Math.PI);
		const dist = points.map((p) => len(sub(p.o, center)));
		const actual = reps * 2;
		const section = 360 / actual;
		for (let it = 0; it < actual; it++) {
			for (let index = 0; index < points.length; index++) {
				const i = it % 2 === 0 ? index : points.length - 1 - index;
				if (i > 0 || it % 2 === 0) {
					const a =
						((section * it + (it % 2 === 0 ? ang[i] : section - ang[i] + 2 * ang[0])) * Math.PI) / 180;
					out.push({ o: [Math.cos(a) * dist[i] + center[0], Math.sin(a) * dist[i] + center[1]], r: points[i].r });
				}
			}
		}
		return out;
	}
	const np = points.length;
	for (let it = 0; it < np * reps; it++) {
		const a = ((Math.floor(it / np) * 360) / reps) * (Math.PI / 180);
		const o = sub(points[it % np].o, center);
		out.push({
			o: [o[0] * Math.cos(a) - o[1] * Math.sin(a) + center[0], o[0] * Math.sin(a) + o[1] * Math.cos(a) + center[1]],
			r: points[it % np].r
		});
	}
	return out;
}

function customPolygon(
	pnr: PointNRound[],
	reps: number,
	{ center = [0.5, 0.5] as Point, mirroring = false }: { center?: Point; mirroring?: boolean } = {}
) {
	const pts = doRepeat(pnr, reps, center, mirroring);
	return polygonFromVertices(
		pts.flatMap((p) => p.o),
		UNROUNDED,
		pts.map((p) => p.r),
		center[0],
		center[1]
	);
}

/**
 * Raw (un-normalized) builders for all 35 M3 Expressive shapes; parameters copied verbatim from
 * MaterialShapes.kt. Use `materialShape(name)` for the normalized (unit-square) polygon.
 */
export const SHAPES = {
	circle: () => circle(10),
	square: () => rectangle({ width: 1, height: 1, rounding: r30 }),
	slanted: () => customPolygon([P(0.926, 0.97, R(0.189, 0.811)), P(-0.021, 0.967, R(0.187, 0.057))], 2),
	arch: () => regularPolygon(4, { perVertexRounding: [r100, r100, r20, r20] }).rotated(-135),
	fan: () =>
		customPolygon(
			[P(1.004, 1.0, R(0.148, 0.417)), P(0.0, 1.0, R(0.151)), P(0.0, -0.003, R(0.148)), P(0.978, 0.02, R(0.803))],
			1
		),
	arrow: () =>
		customPolygon(
			[P(0.5, 0.892, R(0.313)), P(-0.216, 1.05, R(0.207)), P(0.499, -0.16, R(0.215, 1.0)), P(1.225, 1.06, R(0.211))],
			1
		),
	semiCircle: () => rectangle({ width: 1.6, height: 1, perVertexRounding: [r20, r20, r100, r100] }),
	oval: () => circle().scaled(1, 0.64).rotated(-45),
	pill: () =>
		customPolygon([P(0.961, 0.039, R(0.426)), P(1.001, 0.428), P(1.0, 0.609, R(1.0))], 2, { mirroring: true }),
	triangle: () => regularPolygon(3, { rounding: r20 }).rotated(-90),
	diamond: () => customPolygon([P(0.5, 1.096, R(0.151, 0.524)), P(0.04, 0.5, R(0.159))], 2),
	clamShell: () => customPolygon([P(0.171, 0.841, R(0.159)), P(-0.02, 0.5, R(0.14)), P(0.17, 0.159, R(0.159))], 2),
	pentagon: () =>
		customPolygon([P(0.5, -0.009, R(0.172)), P(1.03, 0.365, R(0.164)), P(0.828, 0.97, R(0.169))], 1, {
			mirroring: true
		}),
	gem: () =>
		customPolygon(
			[P(0.499, 1.023, R(0.241, 0.778)), P(-0.005, 0.792, R(0.208)), P(0.073, 0.258, R(0.228)), P(0.433, -0.0, R(0.491))],
			1,
			{ mirroring: true }
		),
	sunny: () => star(8, { innerRadius: 0.8, rounding: r15 }),
	verySunny: () => customPolygon([P(0.5, 1.08, R(0.085)), P(0.358, 0.843, R(0.085))], 8),
	cookie4Sided: () => customPolygon([P(1.237, 1.236, R(0.258)), P(0.5, 0.918, R(0.233))], 4),
	cookie6Sided: () => customPolygon([P(0.723, 0.884, R(0.394)), P(0.5, 1.099, R(0.398))], 6),
	cookie7Sided: () => star(7, { innerRadius: 0.75, rounding: r50 }).rotated(-90),
	cookie9Sided: () => star(9, { innerRadius: 0.8, rounding: r50 }).rotated(-90),
	cookie12Sided: () => star(12, { innerRadius: 0.8, rounding: r50 }).rotated(-90),
	ghostish: () =>
		customPolygon(
			[P(0.5, 0, R(1)), P(1, 0, R(1)), P(1, 1.14, R(0.254, 0.106)), P(0.575, 0.906, R(0.253))],
			1,
			{ mirroring: true }
		),
	clover4Leaf: () => customPolygon([P(0.5, 0.074), P(0.725, -0.099, R(0.476))], 4, { mirroring: true }),
	clover8Leaf: () => customPolygon([P(0.5, 0.036), P(0.758, -0.101, R(0.209))], 8),
	burst: () => customPolygon([P(0.5, -0.006, R(0.006)), P(0.592, 0.158, R(0.006))], 12),
	softBurst: () => customPolygon([P(0.193, 0.277, R(0.053)), P(0.176, 0.055, R(0.053))], 10),
	boom: () => customPolygon([P(0.457, 0.296, R(0.007)), P(0.5, -0.051, R(0.007))], 15),
	softBoom: () =>
		customPolygon(
			[P(0.733, 0.454), P(0.839, 0.437, R(0.532)), P(0.949, 0.449, R(0.439, 1)), P(0.998, 0.478, R(0.174))],
			16,
			{ mirroring: true }
		),
	flower: () =>
		customPolygon([P(0.37, 0.187), P(0.416, 0.049, R(0.381)), P(0.479, 0.001, R(0.095))], 8, { mirroring: true }),
	puffy: () =>
		customPolygon(
			[
				P(0.5, 0.053),
				P(0.545, -0.04, R(0.405)),
				P(0.67, -0.035, R(0.426)),
				P(0.717, 0.066, R(0.574)),
				P(0.722, 0.128),
				P(0.777, 0.002, R(0.36)),
				P(0.914, 0.149, R(0.66)),
				P(0.926, 0.289, R(0.66)),
				P(0.881, 0.346),
				P(0.94, 0.344, R(0.126)),
				P(1.003, 0.437, R(0.255))
			],
			2,
			{ mirroring: true }
		).scaled(1, 0.742),
	puffyDiamond: () =>
		customPolygon([P(0.87, 0.13, R(0.146)), P(0.818, 0.357), P(1.0, 0.332, R(0.853))], 4, { mirroring: true }),
	pixelCircle: () =>
		customPolygon(
			[
				P(0.5, 0.0),
				P(0.704, 0.0),
				P(0.704, 0.065),
				P(0.843, 0.065),
				P(0.843, 0.148),
				P(0.926, 0.148),
				P(0.926, 0.296),
				P(1.0, 0.296)
			],
			2,
			{ mirroring: true }
		),
	pixelTriangle: () =>
		customPolygon(
			[
				P(0.11, 0.5),
				P(0.113, 0.0),
				P(0.287, 0.0),
				P(0.287, 0.087),
				P(0.421, 0.087),
				P(0.421, 0.17),
				P(0.56, 0.17),
				P(0.56, 0.265),
				P(0.674, 0.265),
				P(0.675, 0.344),
				P(0.789, 0.344),
				P(0.789, 0.439),
				P(0.888, 0.439)
			],
			1,
			{ mirroring: true }
		),
	bun: () =>
		customPolygon([P(0.796, 0.5), P(0.853, 0.518, R(1)), P(0.992, 0.631, R(1)), P(0.968, 1.0, R(1))], 2, {
			mirroring: true
		}),
	heart: () =>
		customPolygon(
			[P(0.5, 0.268, R(0.016)), P(0.792, -0.066, R(0.958)), P(1.064, 0.276, R(1)), P(0.501, 0.946, R(0.129))],
			1,
			{ mirroring: true }
		)
} satisfies Record<string, () => RoundedPolygon>;

/** One of the 35 M3 Expressive shape names (Compose `MaterialShapes.<Name>` in camelCase). */
export type ShapeName = keyof typeof SHAPES;

/** All 35 shape names in m3 library order. */
export const SHAPE_NAMES = Object.keys(SHAPES) as ShapeName[];

/** Display labels as used on m3.material.io. */
export const SHAPE_LABELS: Record<ShapeName, string> = {
	circle: 'Circle',
	square: 'Square',
	slanted: 'Slanted',
	arch: 'Arch',
	fan: 'Fan',
	arrow: 'Arrow',
	semiCircle: 'Semicircle',
	oval: 'Oval',
	pill: 'Pill',
	triangle: 'Triangle',
	diamond: 'Diamond',
	clamShell: 'Clamshell',
	pentagon: 'Pentagon',
	gem: 'Gem',
	sunny: 'Sunny',
	verySunny: 'Very sunny',
	cookie4Sided: '4-sided cookie',
	cookie6Sided: '6-sided cookie',
	cookie7Sided: '7-sided cookie',
	cookie9Sided: '9-sided cookie',
	cookie12Sided: '12-sided cookie',
	ghostish: 'Ghost-ish',
	clover4Leaf: '4-leaf clover',
	clover8Leaf: '8-leaf clover',
	burst: 'Burst',
	softBurst: 'Soft burst',
	boom: 'Boom',
	softBoom: 'Soft boom',
	flower: 'Flower',
	puffy: 'Puffy',
	puffyDiamond: 'Puffy diamond',
	pixelCircle: 'Pixel circle',
	pixelTriangle: 'Pixel triangle',
	bun: 'Bun',
	heart: 'Heart'
};

/** LoadingIndicatorDefaults.IndeterminateIndicatorPolygons, in order (typography-shape.md §6). */
export const LOADING_INDICATOR_SHAPES: readonly ShapeName[] = [
	'softBurst',
	'cookie9Sided',
	'pentagon',
	'pill',
	'sunny',
	'cookie4Sided',
	'oval'
];

const polygonCache = new Map<ShapeName, RoundedPolygon>();
/** Normalized (unit-square) polygon, cached. */
export function materialShape(name: ShapeName): RoundedPolygon {
	let p = polygonCache.get(name);
	if (!p) {
		p = SHAPES[name]().normalized();
		polygonCache.set(name, p);
	}
	return p;
}

const pathCache = new Map<string, string>();
/** SVG path `d` for a shape in a `0 0 size size` viewBox (default 100). Cached. */
export function shapePath(name: ShapeName, size = 100, digits = 2): string {
	const key = `${name}|${size}|${digits}`;
	let d = pathCache.get(key);
	if (d === undefined) {
		d = toSvgPath(materialShape(name), { scale: size, digits });
		pathCache.set(key, d);
	}
	return d;
}

const morphCache = new Map<string, Morph>();
/** Cached Morph between two library shapes. */
export function getMorph(a: ShapeName, b: ShapeName): Morph {
	const key = `${a}|${b}`;
	let m = morphCache.get(key);
	if (!m) {
		m = new Morph(materialShape(a), materialShape(b));
		morphCache.set(key, m);
	}
	return m;
}

/**
 * SVG path `d` interpolated between shape `a` (progress 0) and `b` (progress 1) in a `0 0 size size`
 * viewBox. Progress outside [0, 1] extrapolates (spring overshoot).
 */
export function morphPath(a: ShapeName, b: ShapeName, progress: number, size = 100, digits = 2): string {
	return getMorph(a, b).toSvgPath(progress, { scale: size, digits });
}
