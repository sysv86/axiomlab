"""
test_axiomlab.py — Comprehensive Unit & Mathematical Property Test Suite for AxiomLab v2.1.0.
"""

import os
import sys
import unittest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import axiomlab as ax_mod
from axiomlab import AxiomLab


class TestAxiomLab(unittest.TestCase):
    def setUp(self):
        self.ax = AxiomLab()

    def test_d65_white_and_achromatic_neutrality(self):
        white_lab = self.ax.from_XYZ(ax_mod.D65_WHITE)
        np.testing.assert_allclose(white_lab, [1.0, 0.0, 0.0], atol=1e-13)
        white_hex_lab = self.ax.from_hex("#ffffff")
        np.testing.assert_allclose(white_hex_lab, [1.0, 0.0, 0.0], atol=1e-13)
        black_lab = self.ax.from_hex("#000000")
        np.testing.assert_allclose(black_lab, [0.0, 0.0, 0.0], atol=1e-15)

    def test_extended_srgb_round_trip(self):
        srgb_ext = np.array([[-0.35, 0.50, 1.40], [-0.01, -0.25, 0.85]], dtype=np.float64)
        xyz = ax_mod.sRGB_to_XYZ(srgb_ext)
        srgb_rec = ax_mod.XYZ_to_sRGB(xyz)
        np.testing.assert_allclose(srgb_rec, srgb_ext, atol=1e-14)

    def test_hdr_and_wide_gamut_invertibility(self):
        hdr_xyz = np.array([
            [0.0, 0.0, 0.0],
            [0.95047, 1.0, 1.08883],
            [4.5, 5.0, 6.0],
            [45.0, 50.0, 55.0],
            [95.0, 100.0, 108.883],
        ], dtype=np.float64)
        lab = self.ax.from_XYZ(hdr_xyz)
        xyz_rec = self.ax.to_XYZ(lab)
        np.testing.assert_allclose(xyz_rec, hdr_xyz, rtol=1e-13, atol=1e-13)

    def test_custom_space_params_respected(self):
        sp_custom = dict(ax_mod.SPACE_PARAMS)
        M1_scaled = (np.array(sp_custom["M1"], dtype=np.float64) * 1.05).tolist()
        sp_custom["M1"] = M1_scaled
        ax_c = AxiomLab(space_params=sp_custom)
        np.testing.assert_allclose(ax_c.M1, np.array(M1_scaled), atol=1e-15)
        np.testing.assert_allclose(ax_c.M1 @ ax_c.M1_inv, np.eye(3), atol=1e-15)

    def test_nd_tensor_gamut_map(self):
        img = np.random.default_rng(7).uniform(-0.4, 1.2, size=(4, 5, 3))
        mapped = self.ax.gamut_map(img)
        self.assertEqual(mapped.shape, (4, 5, 3))
        lin = self.ax.to_XYZ(mapped) @ ax_mod.M_XYZ_TO_SRGB.T
        self.assertTrue(np.all(lin >= -1e-4) and np.all(lin <= 1.0 + 1e-4))

    def test_batch_and_scalar_difference(self):
        d_scalar = self.ax.difference("#ff0000", "#00ff00")
        self.assertIsInstance(d_scalar, float)
        self.assertGreater(d_scalar, 0.0)
        c1_batch = np.array([[1.0, 0.0, 0.0], [0.0, 0.0, 1.0]])
        c2_batch = np.array([[0.0, 1.0, 0.0], [1.0, 1.0, 1.0]])
        d_batch = self.ax.difference(c1_batch, c2_batch)
        self.assertEqual(d_batch.shape, (2,))
        self.assertAlmostEqual(float(d_batch[0]), d_scalar, places=14)

    def test_homogeneous_riemannian_degree_one(self):
        l1 = self.ax.from_hex("#2060a0")
        dl = np.array([0.01, -0.005, 0.008])
        d1 = self.ax.distance_from_Lab(l1 - 0.5 * dl, l1 + 0.5 * dl, use_power_law=False)
        d2 = self.ax.distance_from_Lab(l1 - dl, l1 + dl, use_power_law=False)
        self.assertAlmostEqual(float(d2 / d1), 2.0, places=14)

    def test_module_level_exports(self):
        xyz = ax_mod.sRGB_to_XYZ([0.2, 0.4, 0.8])
        lab = ax_mod.from_XYZ(xyz)
        lch = ax_mod.to_LCh(lab)
        np.testing.assert_allclose(ax_mod.from_LCh(lch), lab, atol=1e-14)
        np.testing.assert_allclose(ax_mod.to_XYZ(lab), xyz, atol=1e-14)
        self.assertEqual(len(ax_mod.gradient("#000000", "#ffffff", steps=8)), 8)


if __name__ == "__main__":
    unittest.main()
