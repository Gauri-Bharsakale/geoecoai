"""
Tests for SECOND Yang et al. dataset loading, labels, and validation routines.
"""

import unittest
import numpy as np
from pathlib import Path

from datasets.labels import (
    CLASS_DEFINITIONS,
    CLASS_ID_TO_NAME,
    NUM_CLASSES,
    decode_mask_to_rgb,
    get_class_colormap,
)
from datasets.yang_dataset import SECONDYangDataset


class TestDataset(unittest.TestCase):
    def test_class_definitions(self):
        self.assertEqual(NUM_CLASSES, 7)
        self.assertIn("water", CLASS_ID_TO_NAME.values())
        self.assertIn("tree", CLASS_ID_TO_NAME.values())
        self.assertIn("building", CLASS_ID_TO_NAME.values())

    def test_colormap_decoding(self):
        mask = np.zeros((32, 32), dtype=np.int32)
        mask[0:10, 0:10] = 1  # Water (Blue)
        rgb = decode_mask_to_rgb(mask)
        self.assertEqual(rgb.shape, (32, 32, 3))
        self.assertEqual(rgb.dtype, np.uint8)
        self.assertEqual(list(rgb[0, 0]), [37, 99, 235])

    def test_validator_runs_without_crash(self):
        report = SECONDYangDataset.validate()
        self.assertIn("status", report)
        self.assertIn("report_text", report)


if __name__ == "__main__":
    unittest.main()
