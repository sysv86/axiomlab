/**
 * Material 3 role structure, generated natively in AxiomLab.
 *
 * This is deliberately NOT HCT / Material Color Utilities. The seed is converted
 * to AxiomLab LCh, and every role is sampled at an M3 tone (L* proxy) with a
 * role-specific chroma factor. Gamut mapping is AxiomLab's own chroma reduction.
 * The result keeps the M3 role relationships while every color is an AxiomLab
 * coordinate, so the theme and the metric live in the same space.
 */
import { axiom } from '#lib/color-metrics.js';
import { COLOR_ROLES, type ColorMap } from './color-roles.js';

type Seed = { C: number; h: number };

const rad = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function sample(seed: Seed, tone: number, chromaFactor: number, hueOffset = 0) {
	const L = clamp(tone / 100, 0, 1);
	const C = Math.max(0, seed.C * chromaFactor);
	const h = (seed.h + hueOffset) * rad;
	return axiom.toHex([L, C * Math.cos(h), C * Math.sin(h)]);
}

function neutral(seed: Seed, tone: number, tint = 0.045) {
	return sample(seed, tone, tint);
}

export function buildAxiomScheme(seedHex: string, dark: boolean): ColorMap {
	const [, C, h] = axiom.toLCh(axiom.fromHex(seedHex));
	const seed: Seed = { C, h };
	const errHue = 25;

	const S = (tone: number, f = 1, hue = 0) => sample(seed, tone, f, hue);
	const N = (tone: number, tint = 0.045) => neutral(seed, tone, tint);
	const E = (tone: number, f = 0.8) => sample({ C: Math.max(0.36, C), h: errHue }, tone, f);

	const light = {
		primary: S(40, 0.66),
		'on-primary': S(100, 0),
		'primary-container': S(90, 0.42),
		'on-primary-container': S(30, 0.66),
		'primary-fixed': S(90, 0.42),
		'primary-fixed-dim': S(80, 0.5),
		'on-primary-fixed': S(10, 0.66),
		'on-primary-fixed-variant': S(30, 0.66),
		'inverse-primary': S(80, 0.5),

		secondary: S(40, 0.34),
		'on-secondary': S(100, 0),
		'secondary-container': S(90, 0.24),
		'on-secondary-container': S(30, 0.34),
		'secondary-fixed': S(90, 0.24),
		'secondary-fixed-dim': S(80, 0.24),
		'on-secondary-fixed': S(10, 0.34),
		'on-secondary-fixed-variant': S(30, 0.34),

		tertiary: S(40, 0.5, 60),
		'on-tertiary': S(100, 0),
		'tertiary-container': S(90, 0.45, 60),
		'on-tertiary-container': S(30, 0.5, 60),
		'tertiary-fixed': S(90, 0.45, 60),
		'tertiary-fixed-dim': S(80, 0.45, 60),
		'on-tertiary-fixed': S(10, 0.5, 60),
		'on-tertiary-fixed-variant': S(30, 0.5, 60),

		error: E(40),
		'on-error': E(100, 0),
		'error-container': E(90, 0.45),
		'on-error-container': E(30),

		surface: N(98),
		'surface-dim': N(87),
		'surface-bright': N(98),
		'surface-container-lowest': N(100, 0),
		'surface-container-low': N(96),
		'surface-container': N(94),
		'surface-container-high': N(92),
		'surface-container-highest': N(90),
		'on-surface': N(10),
		'surface-variant': N(90, 0.12),
		'on-surface-variant': N(30, 0.12),
		outline: N(50, 0.1),
		'outline-variant': N(80, 0.1),
		'inverse-surface': N(20),
		'inverse-on-surface': N(95),
		scrim: '#000000',
		shadow: '#000000',
		'surface-tint': S(40, 0.66),
		background: N(98),
		'on-background': N(10)
	} satisfies ColorMap;

	const darkMap = {
		primary: S(80, 0.66),
		'on-primary': S(20, 0.66),
		'primary-container': S(30, 0.66),
		'on-primary-container': S(90, 0.42),
		'primary-fixed': S(90, 0.42),
		'primary-fixed-dim': S(80, 0.5),
		'on-primary-fixed': S(10, 0.66),
		'on-primary-fixed-variant': S(30, 0.66),
		'inverse-primary': S(40, 0.66),

		secondary: S(80, 0.34),
		'on-secondary': S(20, 0.34),
		'secondary-container': S(30, 0.34),
		'on-secondary-container': S(90, 0.24),
		'secondary-fixed': S(90, 0.24),
		'secondary-fixed-dim': S(80, 0.24),
		'on-secondary-fixed': S(10, 0.34),
		'on-secondary-fixed-variant': S(30, 0.34),

		tertiary: S(80, 0.5, 60),
		'on-tertiary': S(20, 0.5, 60),
		'tertiary-container': S(30, 0.5, 60),
		'on-tertiary-container': S(90, 0.45, 60),
		'tertiary-fixed': S(90, 0.45, 60),
		'tertiary-fixed-dim': S(80, 0.45, 60),
		'on-tertiary-fixed': S(10, 0.5, 60),
		'on-tertiary-fixed-variant': S(30, 0.5, 60),

		error: E(80),
		'on-error': E(20),
		'error-container': E(30),
		'on-error-container': E(90, 0.45),

		surface: N(6),
		'surface-dim': N(6),
		'surface-bright': N(24),
		'surface-container-lowest': N(4),
		'surface-container-low': N(10),
		'surface-container': N(12),
		'surface-container-high': N(17),
		'surface-container-highest': N(22),
		'on-surface': N(90),
		'surface-variant': N(30, 0.12),
		'on-surface-variant': N(80, 0.12),
		outline: N(60, 0.1),
		'outline-variant': N(30, 0.1),
		'inverse-surface': N(90),
		'inverse-on-surface': N(20),
		scrim: '#000000',
		shadow: '#000000',
		'surface-tint': S(80, 0.66),
		background: N(6),
		'on-background': N(90)
	} satisfies ColorMap;

	return dark ? darkMap : light;
}

export { COLOR_ROLES };
