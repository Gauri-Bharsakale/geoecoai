"""
Tests for Confidence-Aware Post-Classification Comparison (CA-PCC).
"""

import unittest
import numpy as np

from change_detection.confidence_aware_pcc import (
    ConfidenceAwarePCC,
    STATE_HIGH_CONF_CHANGE,
    STATE_UNCERTAIN_CHANGE,
    STATE_HIGH_CONF_UNCHANGED,
    STATE_UNCERTAIN_UNCHANGED,
    DEFAULT_CONFIDENCE_THRESHOLD,
)


class TestConfidenceAwarePCC(unittest.TestCase):
    def setUp(self):
        self.ca_pcc = ConfidenceAwarePCC(default_threshold=0.80)

    def test_extract_confidence(self):
        # 2x2 with 3 classes
        probs = np.array([
            [[0.1, 0.2, 0.7], [0.85, 0.1, 0.05]],
            [[0.3, 0.4, 0.3], [0.05, 0.90, 0.05]]
        ], dtype=np.float32)

        pred_classes, conf = self.ca_pcc.extract_confidence(probs)
        np.testing.assert_array_equal(pred_classes, [[2, 0], [1, 1]])
        np.testing.assert_almost_equal(conf, [[0.7, 0.85], [0.4, 0.90]], decimal=4)

    def test_four_states_mutually_exclusive_and_exhaustive(self):
        # Grid of 4 pixels demonstrating the four states with tau = 0.80
        # Pixel (0,0): T1=1, T2=2, conf1=0.85, conf2=0.90 -> High-Conf Change (State 1)
        # Pixel (0,1): T1=1, T2=2, conf1=0.75, conf2=0.90 -> Uncertain Change (State 2)
        # Pixel (1,0): T1=3, T2=3, conf1=0.82, conf2=0.88 -> High-Conf Unchanged (State 3)
        # Pixel (1,1): T1=3, T2=3, conf1=0.65, conf2=0.88 -> Uncertain Unchanged (State 4)
        c1 = np.array([[1, 1], [3, 3]], dtype=np.int32)
        c2 = np.array([[2, 2], [3, 3]], dtype=np.int32)
        conf1 = np.array([[0.85, 0.75], [0.82, 0.65]], dtype=np.float32)
        conf2 = np.array([[0.90, 0.90], [0.88, 0.88]], dtype=np.float32)

        res = self.ca_pcc.compute_ca_pcc_states(c1, c2, conf1, conf2, threshold=0.80)
        s_map = res["state_map"]
        stats = res["statistics"]

        expected_map = np.array([
            [STATE_HIGH_CONF_CHANGE, STATE_UNCERTAIN_CHANGE],
            [STATE_HIGH_CONF_UNCHANGED, STATE_UNCERTAIN_UNCHANGED]
        ], dtype=np.uint8)
        np.testing.assert_array_equal(s_map, expected_map)

        # Verification of sum and mutual exclusivity
        total = stats["total_pixels"]
        sum_cats = (
            stats["high_conf_change_pixels"]
            + stats["uncertain_change_pixels"]
            + stats["high_conf_unchanged_pixels"]
            + stats["uncertain_unchanged_pixels"]
        )
        self.assertEqual(total, 4)
        self.assertEqual(sum_cats, total)
        self.assertEqual(stats["high_conf_change_pixels"], 1)
        self.assertEqual(stats["uncertain_change_pixels"], 1)
        self.assertEqual(stats["high_conf_unchanged_pixels"], 1)
        self.assertEqual(stats["uncertain_unchanged_pixels"], 1)
        self.assertEqual(stats["total_uncertain_pixels"], 2)

    def test_threshold_adjustment(self):
        c1 = np.array([[1]], dtype=np.int32)
        c2 = np.array([[2]], dtype=np.int32)
        conf1 = np.array([[0.75]], dtype=np.float32)
        conf2 = np.array([[0.78]], dtype=np.float32)

        # At threshold 0.80, this change is uncertain
        res80 = self.ca_pcc.compute_ca_pcc_states(c1, c2, conf1, conf2, threshold=0.80)
        self.assertEqual(res80["state_map"][0, 0], STATE_UNCERTAIN_CHANGE)

        # At lower threshold 0.70, it becomes high-confidence change
        res70 = self.ca_pcc.compute_ca_pcc_states(c1, c2, conf1, conf2, threshold=0.70)
        self.assertEqual(res70["state_map"][0, 0], STATE_HIGH_CONF_CHANGE)

    def test_evaluate_reliability_against_ground_truth(self):
        # 10x10 synthetic data
        gt1 = np.full((10, 10), 1, dtype=np.int32)
        gt2 = np.full((10, 10), 1, dtype=np.int32)
        gt2[:5, :5] = 2  # 25 ground-truth changed pixels

        pred1 = gt1.copy()
        pred2 = gt2.copy()
        # introduce 5 boundary false positive changes with low confidence (0.60)
        pred2[5:7, 5:7] = 3
        # True changes have high confidence (0.92)
        conf1 = np.full((10, 10), 0.90, dtype=np.float32)
        conf2 = np.full((10, 10), 0.92, dtype=np.float32)
        conf2[5:7, 5:7] = 0.60  # Low confidence on false positives

        eval_res = self.ca_pcc.evaluate_reliability_against_ground_truth(
            pred1, pred2, conf1, conf2, gt1, gt2, thresholds=[0.70, 0.80, 0.90]
        )

        self.assertIn("baseline_standard_pcc", eval_res)
        self.assertIn("confidence_aware_pcc", eval_res)
        self.assertIn("sensitivity_curve", eval_res)
        # Precision on high confidence pixels should be higher than or equal to baseline
        hc_prec = eval_res["confidence_aware_pcc"]["high_conf_only"]["precision"]
        base_prec = eval_res["baseline_standard_pcc"]["precision"]
        self.assertGreaterEqual(hc_prec, base_prec)


if __name__ == "__main__":
    unittest.main()
