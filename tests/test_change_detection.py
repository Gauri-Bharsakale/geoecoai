"""
Tests for Post-Classification Comparison (PCC) and Transition Matrix logic.
"""

import unittest
import numpy as np

from change_detection.post_classification import PostClassificationChangeDetector
from change_detection.transition_matrix import TransitionMatrixAnalyzer
from change_detection.change_map import ChangeMapGenerator


class TestChangeDetection(unittest.TestCase):
    def test_binary_change_mask(self):
        gen = ChangeMapGenerator(num_classes=7)
        m1 = np.array([[1, 2], [3, 4]], dtype=np.int32)
        m2 = np.array([[1, 5], [3, 4]], dtype=np.int32)
        binary = gen.generate_binary_change_mask(m1, m2)
        expected = np.array([[0, 1], [0, 0]], dtype=np.uint8)
        np.testing.assert_array_equal(binary, expected)

    def test_transition_matrix_calculation(self):
        analyzer = TransitionMatrixAnalyzer(num_classes=7, resolution_m=1.0)
        m1 = np.full((10, 10), 4, dtype=np.int32)  # All Tree
        m2 = np.full((10, 10), 5, dtype=np.int32)  # Converted to Urban

        res = analyzer.compute_matrix(m1, m2)
        self.assertEqual(res["total_pixels"], 100)
        self.assertEqual(res["changed_pixels"], 100)
        self.assertEqual(res["unchanged_pixels"], 0)
        self.assertEqual(len(res["transitions"]), 1)
        self.assertEqual(res["transitions"][0]["from_id"], 4)
        self.assertEqual(res["transitions"][0]["to_id"], 5)
        self.assertEqual(res["transitions"][0]["pixel_count"], 100)


if __name__ == "__main__":
    unittest.main()
