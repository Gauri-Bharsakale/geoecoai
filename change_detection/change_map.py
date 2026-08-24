"""
Binary change map and semantic multi-class transition map visualizer.
"""

from typing import Dict, List, Tuple
import numpy as np

from datasets.labels import CLASS_DEFINITIONS, NUM_CLASSES
from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.ChangeMap")


class ChangeMapGenerator:
    """Generates binary change mask and color-coded semantic transition overlays."""

    def __init__(self, num_classes: int = NUM_CLASSES):
        self.num_classes = num_classes

    def generate_binary_change_mask(
        self,
        mask_t1: np.ndarray,
        mask_t2: np.ndarray,
    ) -> np.ndarray:
        """Returns boolean/uint8 mask where 1 indicates change and 0 indicates persistence."""
        return (mask_t1 != mask_t2).astype(np.uint8)

    def generate_transition_code_map(
        self,
        mask_t1: np.ndarray,
        mask_t2: np.ndarray,
    ) -> np.ndarray:
        """Encodes each pixel's transition as: code = from_class * num_classes + to_class."""
        return (mask_t1.astype(np.int32) * self.num_classes) + mask_t2.astype(np.int32)

    def generate_rgb_change_visualization(
        self,
        mask_t1: np.ndarray,
        mask_t2: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Produces binary change visual (black=unchanged, white/cyan=changed) and transition RGB map."""
        h, w = mask_t1.shape
        binary_mask = self.generate_binary_change_mask(mask_t1, mask_t2)

        # Binary change RGB: Deep navy background for unchanged, bright red/amber for changed
        binary_rgb = np.zeros((h, w, 3), dtype=np.uint8)
        binary_rgb[binary_mask == 0] = [20, 24, 32]   # Unchanged dark gray-blue
        binary_rgb[binary_mask == 1] = [239, 68, 68]  # Changed vibrant red

        # Semantic transition RGB
        transition_rgb = np.zeros((h, w, 3), dtype=np.uint8)
        transition_rgb[binary_mask == 0] = [30, 30, 30]

        # Distinct color highlighting for primary ecological change trajectories
        for y in range(h):
            for x in range(w):
                if binary_mask[y, x] == 1:
                    c1 = mask_t1[y, x]
                    c2 = mask_t2[y, x]
                    # Deforestation: Tree (4) -> Urban/Ground (5, 2)
                    if c1 == 4 and c2 in [5, 2]:
                        transition_rgb[y, x] = [220, 38, 38]  # Red
                    # Urban expansion: Agriculture/LowVeg (3) -> Urban (5)
                    elif c1 == 3 and c2 == 5:
                        transition_rgb[y, x] = [249, 115, 22]  # Orange
                    # Water loss: Water (1) -> Ground/LowVeg (2, 3)
                    elif c1 == 1 and c2 in [2, 3]:
                        transition_rgb[y, x] = [168, 85, 247]  # Purple
                    # Afforestation / Regreening: Ground (2) -> Tree/Veg (4, 3)
                    elif c1 == 2 and c2 in [4, 3]:
                        transition_rgb[y, x] = [34, 197, 94]  # Emerald Green
                    else:
                        transition_rgb[y, x] = [234, 179, 8]  # Yellow / Other

        return binary_rgb, transition_rgb
