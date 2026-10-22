import raw from './data/benchmarks.json';

export type MethodRow = Record<string, number>;

export interface Bench {
	version: string;
	axiomlab_suite: { pairs: number; methods: Record<string, MethodRow> };
	combvd_suite: {
		pairs: number;
		raw: Record<string, number>;
		bradford_cat: Record<string, number>;
	} | null;
	helm_published: {
		combvd_stress_raw: number;
		combvd_stress_bradford_cat: number;
		ciede2000_combvd: number;
		source: string;
		note: string;
	};
	gradients: {
		steps: number;
		pairs: Array<{
			from: string;
			to: string;
			methods: Record<string, { ramp: string[]; cv_axiom: number; cv_ciede2000: number }>;
		}>;
	};
	blue_white_midpoint: Record<string, string>;
	speed_python: Record<string, number | string>;
	caveats: string[];
}

export const bench = raw as Bench;
export const DATASETS = ['MacAdam74', 'OSA-Atlas', 'MacAdam42', 'Munsell-V', 'Munsell-C', 'Munsell-H', 'CIE-TC147'];
export const DATASET_LABELS: Record<string, string> = {
	MacAdam74: 'MacAdam 1974',
	'OSA-Atlas': 'OSA-UCS Atlas',
	MacAdam42: 'MacAdam 1942',
	'Munsell-V': 'Munsell Value',
	'Munsell-C': 'Munsell Chroma',
	'Munsell-H': 'Munsell Hue',
	'CIE-TC147': 'CIE TC 1-47'
};
