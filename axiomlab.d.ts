export interface AxiomLabSpaceParams {
  M1: number[][];
  M2: number[][];
  pade: number[];
  g_a: number;
  kappa_a: number;
  shear1_c0: number;
  shear1_L: number;
  shear2_c0: number;
  shear2_neg_b: number;
  shear2_L: number;
  shear3_c0: number;
  shear3_L: number;
  gamma0: number;
  gamma_u: number;
  gamma_v: number;
  gamma_u2: number;
  gamma_v2: number;
  beta0: number;
  beta_u: number;
  beta_v: number;
  beta_u2: number;
  beta_v2: number;
  G0: number;
  G_u: number;
  G_v: number;
  G_u2: number;
  G_v2: number;
  G_u3: number;
  G_v3: number;
  G_L: number;
  hk_weight: number;
  hk_u: number;
  hk_v: number;
  hk_u2: number;
  hk_v2: number;
  hk_sat: number;
}

export interface DistanceOptions {
  disableRt?: boolean;
  forceScEqSh?: boolean;
  usePowerLaw?: boolean;
}

export declare const version: string;
export declare const D65_WHITE: [number, number, number];
export declare const M1: number[][];
export declare const M1_INV: number[][];
export declare const M2: number[][];
export declare const M2_INV: number[][];
export declare const PADE: number[];
export declare const SP: AxiomLabSpaceParams;
export declare const MP: number[];

export declare function sRGBToXYZ(srgb: number[]): [number, number, number];
export declare function XYZToSRGB(xyz: number[]): [number, number, number];
export declare function hexToSRGB(hex: string): [number, number, number];
export declare function sRGBToHex(srgb: number[]): string;

export declare function fromXYZ(XYZ: number[]): [number, number, number];
export declare function toXYZ(Lab: number[]): [number, number, number];
export declare function fromSRGB(srgb: number[]): [number, number, number];
export declare function toSRGB(Lab: number[], clip?: boolean): [number, number, number];
export declare function fromHex(hex: string): [number, number, number];
export declare function toHex(Lab: number[]): string;
export declare function toLCh(Lab: number[]): [number, number, number];
export declare function fromLCh(LCh: number[]): [number, number, number];
export declare function gamutMap(Lab: number[]): [number, number, number];

export declare function euclideanDistanceFromLab(Lab1: number[], Lab2: number[]): number;
export declare function euclideanDistance(XYZ1: number[], XYZ2: number[]): number;
export declare function distanceFromLab(Lab1: number[], Lab2: number[], opts?: DistanceOptions): number;
export declare function distance(XYZ1: number[], XYZ2: number[], opts?: DistanceOptions): number;
export declare function difference(c1: string | number[], c2: string | number[], opts?: DistanceOptions): number;
export declare function mix(c1: string, c2: string, t?: number, metricStep?: boolean): string;
export declare function mix(c1: number[], c2: number[], t?: number, metricStep?: boolean): [number, number, number];
export declare function gradient(c1: string, c2: string, steps?: number, metricStep?: boolean): string[];
export declare function gradient(c1: number[], c2: number[], steps?: number, metricStep?: boolean): [number, number, number][];
