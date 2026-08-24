"""
Tests for area statistics calculations and temporal net change quantification.
"""

import unittest
import numpy as np

from change_detection.statistics import ChangeStatisticsCalculator
from analytics.area_analysis import GeospatialAreaAnalyzer


class TestStatistics(unittest.TestCase):
    def test_single_temporal_stats(self):
        calc = ChangeStatisticsCalculator(resolution_m=1.0)
        mask = np.zeros((100, 100), dtype=np.int32)
        mask[:50, :] = 1  # 5000 pixels of Water
        mask[50:, :] = 4  # 5000 pixels of Tree

        stats = calc.compute_single_temporal_stats(mask)
        water_stat = next(s for s in stats if s["class_id"] == 1)
        tree_stat = next(s for s in stats if s["class_id"] == 4)

        self.assertEqual(water_stat["pixel_count"], 5000)
        self.assertEqual(water_stat["percentage"], 50.0)
        self.assertEqual(water_stat["area_ha"], 0.5)  # 5000 sq m / 10000 = 0.5 ha

        self.assertEqual(tree_stat["pixel_count"], 5000)
        self.assertEqual(tree_stat["area_ha"], 0.5)

    def test_temporal_comparison(self):
        calc = ChangeStatisticsCalculator(resolution_m=1.0)
        m1 = np.full((10, 10), 4, dtype=np.int32)  # Tree
        m2 = np.full((10, 10), 5, dtype=np.int32)  # Building

        comp = calc.compute_temporal_comparison(m1, m2)
        self.assertEqual(comp["total_study_area_ha"], 0.01)

        tree_res = next(item for item in comp["comparison"] if item["class_id"] == 4)
        urban_res = next(item for item in comp["comparison"] if item["class_id"] == 5)

        self.assertEqual(tree_res["trend"], "REDUCTION")
        self.assertEqual(urban_res["trend"], "EXPANSION")


if __name__ == "__main__":
    unittest.main()
