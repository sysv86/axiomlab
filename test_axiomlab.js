"use strict";

const assert = require("assert");
const ax = require("./axiomlab.js");

function assertClose(a, b, tol = 1e-13, msg = "") {
  if (Array.isArray(a)) {
    assert.strictEqual(a.length, b.length, msg);
    for (let i = 0; i < a.length; i++) {
      assertClose(a[i], b[i], tol, `${msg} [${i}]`);
    }
  } else {
    assert.ok(Math.abs(a - b) <= tol, `${msg}: |${a} - ${b}| = ${Math.abs(a - b)} > ${tol}`);
  }
}

assertClose(ax.fromXYZ(ax.D65_WHITE), [1.0, 0.0, 0.0], 1e-13, "D65 white neutrality");
assertClose(ax.fromHex("#ffffff"), [1.0, 0.0, 0.0], 1e-13, "#ffffff neutrality");
assertClose(ax.fromHex("#000000"), [0.0, 0.0, 0.0], 1e-15, "#000000 neutrality");

const extRgb = [-0.25, 0.5, 1.35];
assertClose(ax.XYZToSRGB(ax.sRGBToXYZ(extRgb)), extRgb, 1e-14, "Extended sRGB round-trip");

for (const scale of [0.5, 1.0, 5.0, 25.0, 100.0]) {
  const hdrXyz = [0.95047 * scale, 1.0 * scale, 1.08883 * scale];
  const rec = ax.toXYZ(ax.fromXYZ(hdrXyz));
  assertClose(rec, hdrXyz, 1e-12 * scale, `HDR scale=${scale}`);
}

const labSample = ax.fromHex("#3b82f6");
assertClose(ax.fromLCh(ax.toLCh(labSample)), labSample, 1e-14, "LCh round-trip");

const lMid = ax.fromHex("#2060a0");
const dl = [0.01, -0.005, 0.008];
const d1 = ax.distanceFromLab(
  [lMid[0] - 0.5 * dl[0], lMid[1] - 0.5 * dl[1], lMid[2] - 0.5 * dl[2]],
  [lMid[0] + 0.5 * dl[0], lMid[1] + 0.5 * dl[1], lMid[2] + 0.5 * dl[2]],
  { usePowerLaw: false }
);
const d2 = ax.distanceFromLab(
  [lMid[0] - dl[0], lMid[1] - dl[1], lMid[2] - dl[2]],
  [lMid[0] + dl[0], lMid[1] + dl[1], lMid[2] + dl[2]],
  { usePowerLaw: false }
);
assertClose(d2 / d1, 2.0, 1e-14, "Homogeneous degree-1 scaling");

const grad = ax.gradient("#0000ff", "#ffffff", 8, true);
assert.strictEqual(grad.length, 8);
assert.strictEqual(grad[0], "#0000ff");
assert.strictEqual(grad[7], "#ffffff");

console.log("All JavaScript unit tests passed (v" + ax.version + ").");
