"""
Geospatial area metrics, unit conversions (meters², ha, km²), and landscape patch metrics.
"""

from typing import Any, Dict, List
import numpy as np

from datasets.labels import CLASS_DEFINITIONS
from utils.raster_utils import calculate_pixel_area_ha, calculate_pixel_area_km2


class GeospatialAreaAnalyzer:
    """Computes comprehensive landscape area distributions and fragmentation indicators."""

    def __init__(self, resolution_meters: float = 1.0):
        self.resolution_meters = resolution_meters

    def analyze_landscape_structure(self, mask: np.ndarray) -> Dict[str, Any]:
        """Calculates area coverage, relative share, and dominant ecosystem type."""
        total_pixels = mask.size
        total_ha = calculate_pixel_area_ha(total_pixels, self.resolution_meters)
        total_km2 = calculate_pixel_area_km2(total_pixels, self.resolution_meters)

        class_records = []
        for c in CLASS_DEFINITIONS:
            count = int((mask == c["id"]).sum())
            ha = calculate_pixel_area_ha(count, self.resolution_meters)
            pct = (count / total_pixels) * 100.0 if total_pixels > 0 else 0.0

            class_records.append({
                "id": c["id"],
                "name": c["name"],
                "display_name": c["display_name"],
                "category": c["category"],
                "color_hex": c["color_hex"],
                "pixels": count,
                "area_ha": round(ha, 3),
                "area_km2": round(calculate_pixel_area_km2(count, self.resolution_meters), 4),
                "percentage": round(pct, 2),
            })

        # Exclude background for determining dominant natural/built-up land cover
        active_classes = [r for r in class_records if r["id"] != 0]
        dominant = max(active_classes, key=lambda x: x["pixels"]) if active_classes else None

        return {
            "total_pixels": total_pixels,
            "total_area_ha": round(total_ha, 3),
            "total_area_km2": round(total_km2, 4),
            "spatial_resolution_m": self.resolution_meters,
            "classes": class_records,
            "dominant_land_cover": dominant,
        }
