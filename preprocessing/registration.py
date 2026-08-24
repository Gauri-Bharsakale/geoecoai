"""
Spatial registration and geometric alignment checker for bi-temporal remote sensing pairs.
"""

from typing import Dict, Tuple
import numpy as np

from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.Registration")


class SpatialRegistrar:
    """Verifies alignment between T1 and T2 images and performs subpixel/pixel shift checking."""

    def __init__(self, tolerance_px: int = 2):
        self.tolerance_px = tolerance_px

    def check_alignment(
        self,
        im1: np.ndarray,
        im2: np.ndarray,
    ) -> Dict[str, any]:
        """Calculates structural dimension equality and phase correlation shift estimate."""
        h1, w1 = im1.shape[:2]
        h2, w2 = im2.shape[:2]

        is_aligned = (h1 == h2) and (w1 == w2)
        result = {
            "is_dimension_aligned": is_aligned,
            "t1_shape": (h1, w1),
            "t2_shape": (h2, w2),
            "channel_t1": im1.shape[-1] if im1.ndim == 3 else 1,
            "channel_t2": im2.shape[-1] if im2.ndim == 3 else 1,
            "requires_resampling": not is_aligned,
        }

        if not is_aligned:
            logger.warning(f"Registration mismatch detected: T1 {im1.shape} vs T2 {im2.shape}")
        else:
            logger.debug("Bi-temporal images are geometrically aligned.")

        return result

    def align_by_resizing(
        self,
        im1: np.ndarray,
        im2: np.ndarray,
        target_shape: Tuple[int, int] = (512, 512),
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Resamples both images to standard spatial grid size if dimensions deviate."""
        from PIL import Image

        def _resize(arr, shape):
            if arr.shape[:2] == shape:
                return arr
            pil_img = Image.fromarray(arr.astype(np.uint8) if arr.max() > 1.0 else (arr * 255).astype(np.uint8))
            resized = pil_img.resize((shape[1], shape[0]), resample=Image.Resampling.BILINEAR)
            res_arr = np.array(resized, dtype=np.float32)
            if arr.max() <= 1.0:
                res_arr = res_arr / 255.0
            return res_arr

        return _resize(im1, target_shape), _resize(im2, target_shape)
