"""
Cross-tabulation transition matrix calculator for multi-temporal land cover transitions.
"""

from typing import Any, Dict, List, Tuple
import numpy as np

from datasets.labels import CLASS_DEFINITIONS, NUM_CLASSES
from utils.logging_utils import get_logger
from utils.raster_utils import calculate_pixel_area_ha, calculate_pixel_area_km2

logger = get_logger("GeoEcoAI.TransitionMatrix")


class TransitionMatrixAnalyzer:
    """Computes T1->T2 transition matrices, identifies dominant trajectories, unchanged vs changed dynamics."""

    def __init__(self, num_classes: int = NUM_CLASSES, resolution_m: float = 1.0):
        self.num_classes = num_classes
        self.resolution_m = resolution_m

    def compute_matrix(
        self,
        mask_t1: np.ndarray,
        mask_t2: np.ndarray,
        ignore_background: bool = True,
    ) -> Dict[str, Any]:
        """Calculates full NxN transition matrix (rows=T1, cols=T2)."""
        t1_flat = mask_t1.flatten().astype(np.int64)
        t2_flat = mask_t2.flatten().astype(np.int64)

        # Build NxN matrix
        matrix = np.zeros((self.num_classes, self.num_classes), dtype=np.int64)
        indices = t1_flat * self.num_classes + t2_flat
        counts = np.bincount(indices, minlength=self.num_classes ** 2)
        matrix = counts.reshape((self.num_classes, self.num_classes))

        total_pixels = int(matrix.sum())
        diagonal_pixels = int(np.trace(matrix))  # Unchanged pixels
        changed_pixels = int(total_pixels - diagonal_pixels)

        # Ignore class 0 if requested
        start_idx = 1 if ignore_background else 0
        active_submatrix = matrix[start_idx:, start_idx:]
        active_total = int(active_submatrix.sum())
        active_unchanged = int(np.trace(active_submatrix))
        active_changed = int(active_total - active_unchanged)

        # Transition list sorted by pixel count
        transitions = []
        for i in range(self.num_classes):
            for j in range(self.num_classes):
                cnt = int(matrix[i, j])
                if i != j and cnt > 0:
                    from_name = CLASS_DEFINITIONS[i]["display_name"]
                    to_name = CLASS_DEFINITIONS[j]["display_name"]
                    area_ha = calculate_pixel_area_ha(cnt, self.resolution_m)
                    pct_of_total = (cnt / total_pixels) * 100.0 if total_pixels > 0 else 0.0
                    transitions.append({
                        "from_id": i,
                        "to_id": j,
                        "from_class": from_name,
                        "to_class": to_name,
                        "transition_label": f"{from_name} → {to_name}",
                        "pixel_count": cnt,
                        "area_ha": round(area_ha, 3),
                        "area_km2": round(calculate_pixel_area_km2(cnt, self.resolution_m), 4),
                        "percentage_of_study_area": round(pct_of_total, 3),
                    })

        transitions_sorted = sorted(transitions, key=lambda x: x["pixel_count"], reverse=True)
        dominant_conversion = transitions_sorted[0] if transitions_sorted else None

        return {
            "matrix_counts": matrix.tolist(),
            "matrix_area_ha": [[round(calculate_pixel_area_ha(int(matrix[i, j]), self.resolution_m), 3) for j in range(self.num_classes)] for i in range(self.num_classes)],
            "total_pixels": total_pixels,
            "unchanged_pixels": diagonal_pixels,
            "changed_pixels": changed_pixels,
            "unchanged_percentage": round((diagonal_pixels / total_pixels) * 100.0, 2) if total_pixels > 0 else 0.0,
            "changed_percentage": round((changed_pixels / total_pixels) * 100.0, 2) if total_pixels > 0 else 0.0,
            "active_changed_percentage": round((active_changed / active_total) * 100.0, 2) if active_total > 0 else 0.0,
            "transitions": transitions_sorted,
            "dominant_conversion": dominant_conversion,
        }
