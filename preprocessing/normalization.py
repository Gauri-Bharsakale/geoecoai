"""
Normalization and radiometric scaling routines for remote sensing arrays.
"""

from typing import Tuple
import numpy as np


class ImageNormalizer:
    """Configurable normalizer supporting min-max, z-score, and ImageNet statistics."""

    def __init__(self, method: str = "minmax", radiometric_scale: float = 1.0):
        self.method = method
        self.radiometric_scale = radiometric_scale

        # Standard ImageNet RGB statistics
        self.imagenet_mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.imagenet_std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def normalize(self, image: np.ndarray) -> np.ndarray:
        """Normalizes input image array according to chosen method."""
        img = image.astype(np.float32)

        # Scale down if in 8-bit or 16-bit range
        if np.max(img) > 1.0 and self.method != "zscore":
            img = img / 255.0

        if self.method == "minmax":
            # Values are clamped to [0.0, 1.0]
            return np.clip(img * self.radiometric_scale, 0.0, 1.0)

        elif self.method == "imagenet":
            if img.shape[-1] >= 3:
                # Apply ImageNet normalization to first 3 channels
                rgb = img[:, :, :3]
                norm_rgb = (rgb - self.imagenet_mean) / self.imagenet_std
                if img.shape[-1] > 3:
                    # Keep additional channels normalized to [0, 1]
                    extra = img[:, :, 3:]
                    return np.concatenate([norm_rgb, extra], axis=-1)
                return norm_rgb
            else:
                return (img - 0.5) / 0.5

        elif self.method == "zscore":
            mean = np.mean(img, axis=(0, 1), keepdims=True)
            std = np.std(img, axis=(0, 1), keepdims=True) + 1e-7
            return (img - mean) / std

        return img

    def denormalize_to_uint8(self, image: np.ndarray) -> np.ndarray:
        """Converts normalized float image back to uint8 [0, 255] for visual rendering."""
        img = image.copy()
        if self.method == "imagenet" and img.shape[-1] >= 3:
            img[:, :, :3] = (img[:, :, :3] * self.imagenet_std) + self.imagenet_mean
        elif self.method == "zscore":
            img = (img - img.min()) / (img.max() - img.min() + 1e-7)

        img = np.clip(img * 255.0, 0, 255).astype(np.uint8)
        return img
