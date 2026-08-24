"""
Segmentation-safe data augmentation ensuring synchronous spatial transformation of images and masks.
"""

import random
from typing import Optional, Tuple
import numpy as np


class SegmentationAugmentor:
    """Rigid spatial transformations (D4 dihedral group) preserving pixel label integrity."""

    def __init__(
        self,
        horizontal_flip: bool = True,
        vertical_flip: bool = True,
        random_rotate90: bool = True,
    ):
        self.horizontal_flip = horizontal_flip
        self.vertical_flip = vertical_flip
        self.random_rotate90 = random_rotate90

    def augment(
        self,
        image: np.ndarray,
        mask: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """Applies randomized synchronous affine/flip/rotation transformations."""
        img = image.copy()
        m = mask.copy() if mask is not None else None

        # Horizontal flip (50% probability)
        if self.horizontal_flip and random.random() > 0.5:
            img = np.fliplr(img)
            if m is not None:
                m = np.fliplr(m)

        # Vertical flip (50% probability)
        if self.vertical_flip and random.random() > 0.5:
            img = np.flipud(img)
            if m is not None:
                m = np.flipud(m)

        # 90-degree orthogonal rotation (0, 90, 180, 270 deg)
        if self.random_rotate90:
            k = random.randint(0, 3)
            if k > 0:
                img = np.rot90(img, k=k, axes=(0, 1))
                if m is not None:
                    m = np.rot90(m, k=k, axes=(0, 1))

        return np.ascontiguousarray(img), np.ascontiguousarray(m) if m is not None else None
