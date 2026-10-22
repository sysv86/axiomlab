/**
 * JS mirrors of the M3 motion tokens in src/routes/layout.css (docs/research/motion.md).
 * Prefer the CSS utilities (`ease-spring-fast-spatial duration-spring-fast-spatial`) for
 * non-interruptible transitions; use `animateSpring` for interruptible / gesture-driven motion.
 */

/** md.sys.motion.duration.* in ms (motion.md §1.1). */
export const DURATION = {
	short1: 50,
	short2: 100,
	short3: 150,
	short4: 200,
	medium1: 250,
	medium2: 300,
	medium3: 350,
	medium4: 400,
	long1: 450,
	long2: 500,
	long3: 550,
	long4: 600,
	extraLong1: 700,
	extraLong2: 800,
	extraLong3: 900,
	extraLong4: 1000
} as const;

/** md.sys.motion.easing.* as CSS easing strings (motion.md §1.2). `emphasized` is the exact linear() path. */
export const EASING = {
	standard: 'cubic-bezier(0.2, 0, 0, 1)',
	standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
	standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
	emphasized:
		'linear(0, 0.0082 3.2%, 0.0329 6.25%, 0.0723 8.95%, 0.098 10.2%, 0.1269 11.35%, 0.1572 12.35%, 0.1917 13.3%, 0.2286 14.15%, 0.2704 14.95%, 0.3079 15.55%, 0.3486 16.1%, 0.479 17.5%, 0.5452 18.35%, 0.6074 19.4%, 0.66 20.6%, 0.6893 21.45%, 0.7167 22.4%, 0.7655 24.6%, 0.8078 27.25%, 0.8445 30.4%, 0.8833 35.05%, 0.9154 40.6%, 0.9419 47.2%, 0.9632 54.95%, 0.9795 64%, 0.9909 74.4%, 0.9977 86.35%, 1)',
	emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
	emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
	linear: 'cubic-bezier(0, 0, 1, 1)',
	legacy: 'cubic-bezier(0.4, 0, 0.2, 1)',
	legacyAccelerate: 'cubic-bezier(0.4, 0, 1, 1)',
	legacyDecelerate: 'cubic-bezier(0, 0, 0.2, 1)'
} as const;

/** Spring step-response curves as CSS linear(); the shape depends only on the damping ratio (motion.md §3.2). */
export const SPRING_CURVES = {
	d60: 'linear(0, 0.0077 1.25%, 0.0313 2.6%, 0.0698 4%, 0.1254 5.55%, 0.18 6.85%, 0.2493 8.35%, 0.5292 13.95%, 0.6478 16.45%, 0.7586 19.05%, 0.8487 21.5%, 0.9236 23.95%, 0.9832 26.4%, 1.0298 28.95%, 1.0633 31.6%, 1.0788 33.45%, 1.0888 35.35%, 1.094 37.4%, 1.0943 39.65%, 1.0809 44.7%, 1.0188 58.8%, 0.9979 67.1%, 0.991 78%, 1)',
	d80: 'linear(0, 0.0062 1.35%, 0.0248 2.8%, 0.0557 4.35%, 0.1011 6.1%, 0.1994 9.2%, 0.4298 15.7%, 0.5342 18.8%, 0.6331 22.05%, 0.7167 25.2%, 0.7855 28.25%, 0.8444 31.4%, 0.8931 34.65%, 0.9325 38.05%, 0.9639 41.75%, 0.9871 45.75%, 1.003 50.2%, 1.012 55.25%, 1.0147 64.85%, 1)',
	d90: 'linear(0, 0.0056 1.3%, 0.0223 2.7%, 0.0501 4.2%, 0.0909 5.9%, 0.1785 8.9%, 0.3935 15.5%, 0.4924 18.7%, 0.5874 22.1%, 0.6681 25.4%, 0.7361 28.65%, 0.7939 31.95%, 0.8433 35.4%, 0.8848 39.05%, 0.9214 43.3%, 0.9501 47.95%, 0.9714 53.1%, 0.9862 58.95%, 0.9951 65.45%, 0.9999 73.45%, 1)',
	d100: 'linear(0, 0.0048 1.1%, 0.0196 2.3%, 0.0444 3.6%, 0.0815 5.1%, 0.1596 7.7%, 0.3639 13.8%, 0.4621 16.9%, 0.5561 20.2%, 0.6367 23.45%, 0.7064 26.75%, 0.766 30.15%, 0.8175 33.75%, 0.8605 37.55%, 0.899 42%, 0.9298 46.9%, 0.9535 52.35%, 0.9713 58.6%, 0.9833 65.5%, 0.9914 73.8%, 1)'
} as const;

export type MotionScheme = 'expressive' | 'standard';
export type SpringSpeed = 'fast' | 'default' | 'slow';
export type SpringType = 'spatial' | 'effects';
/** Token name as used in CSS vars / utilities: `fast-spatial`, `default-effects`, … */
export type SpringToken = `${SpringSpeed}-${SpringType}`;

export interface SpringParams {
	/** ζ. < 1 overshoots (spatial), 1 = critically damped (effects). */
	dampingRatio: number;
	/** k with mass = 1 (Compose / MDC units). */
	stiffness: number;
}

export interface SpringSpec extends SpringParams {
	/** Settle time (|x−1| < 0.001), used as the CSS duration. */
	durationMs: number;
	/** CSS linear() step response for that damping ratio. */
	css: string;
}

export const SPRING_TOKENS: readonly SpringToken[] = [
	'fast-spatial',
	'default-spatial',
	'slow-spatial',
	'fast-effects',
	'default-effects',
	'slow-effects'
];

/** md.sys.motion.spring.* for both schemes (motion.md §2.2 values, §3.2 settle durations). */
export const SPRINGS: Record<MotionScheme, Record<SpringToken, SpringSpec>> = {
	expressive: {
		'fast-spatial': { dampingRatio: 0.6, stiffness: 800, durationMs: 359, css: SPRING_CURVES.d60 },
		'default-spatial': { dampingRatio: 0.8, stiffness: 380, durationMs: 435, css: SPRING_CURVES.d80 },
		'slow-spatial': { dampingRatio: 0.8, stiffness: 200, durationMs: 599, css: SPRING_CURVES.d80 },
		'fast-effects': { dampingRatio: 1, stiffness: 3800, durationMs: 150, css: SPRING_CURVES.d100 },
		'default-effects': { dampingRatio: 1, stiffness: 1600, durationMs: 231, css: SPRING_CURVES.d100 },
		'slow-effects': { dampingRatio: 1, stiffness: 800, durationMs: 326, css: SPRING_CURVES.d100 }
	},
	standard: {
		'fast-spatial': { dampingRatio: 0.9, stiffness: 1400, durationMs: 224, css: SPRING_CURVES.d90 },
		'default-spatial': { dampingRatio: 0.9, stiffness: 700, durationMs: 317, css: SPRING_CURVES.d90 },
		'slow-spatial': { dampingRatio: 0.9, stiffness: 300, durationMs: 484, css: SPRING_CURVES.d90 },
		'fast-effects': { dampingRatio: 1, stiffness: 3800, durationMs: 150, css: SPRING_CURVES.d100 },
		'default-effects': { dampingRatio: 1, stiffness: 1600, durationMs: 231, css: SPRING_CURVES.d100 },
		'slow-effects': { dampingRatio: 1, stiffness: 800, durationMs: 326, css: SPRING_CURVES.d100 }
	}
};

/**
 * CSS var references for a spring token — they follow the active motion scheme
 * (`data-motion-scheme`) and reduced-motion automatically.
 * @example el.style.transition = `transform ${springCss('fast-spatial').transition}`
 */
export function springCss(token: SpringToken) {
	const easing = `var(--md-sys-motion-spring-${token}-easing)`;
	const duration = `var(--md-sys-motion-spring-${token}-duration)`;
	return { easing, duration, transition: `${duration} ${easing}` };
}

/** `"<property> <duration> <easing>"` list for `style:transition`, e.g. springTransition('fast-spatial', 'transform', 'border-radius'). */
export function springTransition(token: SpringToken, ...properties: string[]) {
	const { transition } = springCss(token);
	return properties.map((p) => `${p} ${transition}`).join(', ');
}

/** Resolve the active scheme's spring for `el` (reads `data-motion-scheme` from the closest ancestor). */
export function activeSpring(token: SpringToken, el: Element | null = null): SpringSpec {
	const host = el ?? (typeof document !== 'undefined' ? document.documentElement : null);
	const scheme = host?.closest('[data-motion-scheme]')?.getAttribute('data-motion-scheme');
	return SPRINGS[scheme === 'standard' ? 'standard' : 'expressive'][token];
}

/**
 * Analytic damped-spring displacement (mass = 1), frame-rate independent.
 * Returns the remaining offset from the target at time `t` (seconds) for an initial
 * displacement `x0 = from − to` and initial velocity `v0` (units/s). (motion.md §3.4)
 */
export function springAt(t: number, x0: number, v0: number, { dampingRatio: zeta, stiffness }: SpringParams) {
	const w0 = Math.sqrt(stiffness);
	if (zeta < 1) {
		const wd = w0 * Math.sqrt(1 - zeta * zeta);
		const e = Math.exp(-zeta * w0 * t);
		return e * (x0 * Math.cos(wd * t) + ((v0 + zeta * w0 * x0) / wd) * Math.sin(wd * t));
	}
	if (zeta === 1) return Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t);
	// overdamped (not used by M3 tokens, kept for completeness)
	const s = w0 * Math.sqrt(zeta * zeta - 1);
	const r1 = -zeta * w0 + s;
	const r2 = -zeta * w0 - s;
	const c2 = (v0 - r1 * x0) / (r2 - r1);
	const c1 = x0 - c2;
	return c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
}

/**
 * Value of a spring animating `from → to` after `t` seconds (default 0 → 1, at rest initially).
 * `springValue(t, SPRINGS.expressive['fast-spatial'])` is the unit step response (overshoots to ~1.094).
 */
export function springValue(t: number, spring: SpringParams, from = 0, to = 1, velocity = 0) {
	return to + springAt(t, from - to, velocity, spring);
}

/** Velocity (units/s) of the spring at time t (numeric derivative). */
export function springVelocity(t: number, spring: SpringParams, from = 0, to = 1, velocity = 0) {
	const h = 1e-4;
	return (springValue(t + h, spring, from, to, velocity) - springValue(t, spring, from, to, velocity)) / h;
}

export interface AnimateSpringOptions {
	/** Initial velocity in units/s. Pass the velocity reported by a previous onFrame to retarget smoothly. */
	velocity?: number;
	/** Stop when |offset| and |velocity| fall below this (in the animated units). Default: 0.001 × |to − from| (min 1e-4). */
	threshold?: number;
	/** Jump straight to `to` (e.g. `prefersReducedMotion.current`). Default: reads `(prefers-reduced-motion: reduce)`. */
	reducedMotion?: boolean;
	onComplete?: () => void;
}

function systemReducedMotion() {
	return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Drive `onFrame(value, velocity)` with requestAnimationFrame along an analytic spring.
 * Returns a cancel function. Interruptible: cancel, then start a new `animateSpring` from the
 * last reported value with `{ velocity }` to retarget without a velocity discontinuity.
 *
 * @example
 * let cancel = animateSpring(0, 1, SPRINGS.expressive['fast-spatial'], (v) => (progress = v));
 */
export function animateSpring(
	from: number,
	to: number,
	spring: SpringParams,
	onFrame: (value: number, velocity: number) => void,
	options: AnimateSpringOptions = {}
): () => void {
	const { velocity = 0, onComplete } = options;
	const reduced = options.reducedMotion ?? systemReducedMotion();
	const threshold = options.threshold ?? Math.max(Math.abs(to - from) * 0.001, 1e-4);
	if (reduced || typeof requestAnimationFrame === 'undefined' || (from === to && velocity === 0)) {
		onFrame(to, 0);
		onComplete?.();
		return () => {};
	}
	let raf = 0;
	let start: number | null = null;
	const tick = (now: number) => {
		start ??= now;
		const t = (now - start) / 1000;
		const value = springValue(t, spring, from, to, velocity);
		const v = springVelocity(t, spring, from, to, velocity);
		if (Math.abs(value - to) < threshold && Math.abs(v) < threshold * 10) {
			onFrame(to, 0);
			onComplete?.();
			return;
		}
		onFrame(value, v);
		raf = requestAnimationFrame(tick);
	};
	raf = requestAnimationFrame(tick);
	return () => cancelAnimationFrame(raf);
}
