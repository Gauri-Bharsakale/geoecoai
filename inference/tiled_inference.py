"""
Tiled inference engine for memory-efficient processing of ultra-high resolution or large spatial scenes.
"""

from typing import Dict, Optional, Tuple, Union
import numpy as np

from inference.predict import SemanticPredictor
from preprocessing.tiling import ImageTiler, reconstruct_from_tiles
from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.TiledInference")


class TiledPredictor:
    """Slices large rasters into overlapping patches, runs model inference, and stitches output seamless maps."""

    def __init__(
        self,
        predictor: Optional[SemanticPredictor] = None,
        patch_size: int = 256,
        overlap: int = 32,
    ):
        self.predictor = predictor or SemanticPredictor()
        self.tiler = ImageTiler(patch_size=patch_size, overlap=overlap)
        self.patch_size = patch_size

    def predict_large_scene(self, large_image: np.ndarray) -> np.ndarray:
        """Processes arbitrary-sized raster without GPU memory overflow."""
        h, w = large_image.shape[:2]
        patches, coordinates, _ = self.tiler.extract_patches(large_image)
        logger.info(f"Extracted {len(patches)} tiles of size {self.patch_size}x{self.patch_size} for inference.")

        predicted_patch_probs = []
        for p in patches:
            res = self.predictor.predict_image(p)
            predicted_patch_probs.append(res["probabilities"])

        stitched_mask = reconstruct_from_tiles(
            patches=predicted_patch_probs,
            coordinates=coordinates,
            original_shape=(h, w),
            num_classes=self.predictor.num_classes,
            mode="probabilities",
        )
        return stitched_mask
