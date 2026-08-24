"""
Land cover area statistics and temporal net change computations.
"""

from typing import Any, Dict, List, Tuple
import numpy as np

from datasets.labels import CLASS_DEFINITIONS, NUM_CLASSES
from utils.raster_utils import calculate_pixel_area_ha, calculate_pixel_area_km2


class ChangeStatisticsCalculator:
    """Calculates temporal land-cover class distributions, net change, and rate of transformation."""

    def __init__(self, resolution_m: float = 1.0):
        self.resolution_m = resolution_m

    def compute_single_temporal_stats(self, mask: np.ndarray) -> List[Dict[str, Any]]:
        """Calculates pixel count, hectares, km², and percentage for each land cover class."""
        total_pixels = mask.size
        stats = []

        for c in CLASS_DEFINITIONS:
            c_id = c["id"]
            cnt = int((mask == c_id).sum())
            ha = calculate_pixel_area_ha(cnt, self.resolution_m)
            km2 = calculate_pixel_area_km2(cnt, self.resolution_m)
            pct = (cnt / total_pixels) * 100.0 if total_pixels > 0 else 0.0

            stats.append({
                "class_id": c_id,
                "name": c["name"],
                "display_name": c["display_name"],
                "color_hex": c["color_hex"],
                "pixel_count": cnt,
                "area_ha": round(ha, 3),
                "area_km2": round(km2, 4),
                "percentage": round(pct, 2),
            })
        return stats

    def compute_temporal_comparison(
        self,
        mask_t1: np.ndarray,
        mask_t2: np.ndarray,
    ) -> Dict[str, Any]:
        """Calculates absolute difference, relative percentage change, and trend direction."""
        stats_t1 = self.compute_single_temporal_stats(mask_t1)
        stats_t2 = self.compute_single_temporal_stats(mask_t2)

        comparison_list = []
        for s1, s2 in zip(stats_t1, stats_t2):
            diff_pixels = s2["pixel_count"] - s1["pixel_count"]
            diff_ha = s2["area_ha"] - s1["area_ha"]
            diff_km2 = s2["area_km2"] - s1["area_km2"]

            # Relative percentage change
            if s1["pixel_count"] > 0:
                rel_change_pct = ((s2["pixel_count"] - s1["pixel_count"]) / s1["pixel_count"]) * 100.0
            else:
                rel_change_pct = 100.0 if s2["pixel_count"] > 0 else 0.0

            trend = "EXPANSION" if diff_pixels > 0 else ("REDUCTION" if diff_pixels < 0 else "STABLE")

            comparison_list.append({
                "class_id": s1["class_id"],
                "name": s1["name"],
                "display_name": s1["display_name"],
                "color_hex": s1["color_hex"],
                "t1_area_ha": s1["area_ha"],
                "t2_area_ha": s2["area_ha"],
                "t1_percentage": s1["percentage"],
                "t2_percentage": s2["percentage"],
                "net_change_ha": round(diff_ha, 3),
                "net_change_km2": round(diff_km2, 4),
                "net_change_pixels": diff_pixels,
                "relative_change_pct": round(rel_change_pct, 2),
                "trend": trend,
            })

        return {
            "t1_stats": stats_t1,
            "t2_stats": stats_t2,
            "comparison": comparison_list,
            "total_study_area_ha": round(calculate_pixel_area_ha(mask_t1.size, self.resolution_m), 3),
        }
