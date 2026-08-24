"""
Tests for semantic segmentation evaluation metrics (Accuracy, IoU, Dice, Precision, Recall).
"""

import unittest
import numpy as np

from training.metrics import SegmentationMetricsCalculator
from models.losses import compute_mean_iou, compute_dice_coefficient


class TestMetrics(unittest.TestCase):
    def test_perfect_segmentation_metrics(self):
        calc = SegmentationMetricsCalculator(num_classes=7)
        mask = np.random.randint(0, 7, (32, 32)).astype(np.int32)
        calc.update(mask, mask)
        metrics = calc.compute_metrics()

        self.assertAlmostEqual(metrics["overall"]["accuracy"], 1.0, places=4)
        self.assertAlmostEqual(metrics["overall"]["mean_iou"], 1.0, places=4)
        self.assertAlmostEqual(metrics["overall"]["mean_dice"], 1.0, places=4)

    def test_standalone_iou_and_dice(self):
        y_true = np.zeros((10, 10), dtype=np.int32)
        y_pred = np.zeros((10, 10), dtype=np.int32)
        iou = compute_mean_iou(y_true, y_pred, num_classes=7)
        dice = compute_dice_coefficient(y_true, y_pred, num_classes=7)
        self.assertEqual(iou, 1.0)
        self.assertEqual(dice, 1.0)


if __name__ == "__main__":
    unittest.main()
