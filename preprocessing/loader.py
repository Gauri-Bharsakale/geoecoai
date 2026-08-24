"""
Image and mask loader for SECOND Yang et al. dataset and multispectral remote sensing data.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image

from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.Loader")


class RemoteSensingLoader:
    """Robust loader for bi-temporal remote sensing images and semantic label masks."""

    def __init__(self, raw_dir: Union[str, Path]):
        self.raw_dir = Path(raw_dir)

    def load_image(self, image_path: Union[str, Path]) -> np.ndarray:
        """Loads RGB or multispectral image array as float32 in [0, 255] or [0, 1]."""
        p = Path(image_path)
        if not p.exists():
            raise FileNotFoundError(f"Image not found at {p}")
        try:
            with Image.open(p) as img:
                arr = np.array(img.convert("RGB"), dtype=np.float32)
                return arr
        except Exception as e:
            logger.error(f"Failed loading image {p}: {str(e)}")
            raise

    def load_mask(self, mask_path: Union[str, Path]) -> np.ndarray:
        """Loads semantic segmentation label mask as integer 2D uint8/int32 array."""
        p = Path(mask_path)
        if not p.exists():
            raise FileNotFoundError(f"Mask not found at {p}")
        try:
            with Image.open(p) as img:
                arr = np.array(img, dtype=np.int32)
                if arr.ndim == 3:
                    # In some datasets, single-channel masks might be saved as 3 identical channels
                    arr = arr[:, :, 0]
                return arr
        except Exception as e:
            logger.error(f"Failed loading mask {p}: {str(e)}")
            raise

    def load_pair(
        self,
        im1_path: Union[str, Path],
        im2_path: Union[str, Path],
        label1_path: Optional[Union[str, Path]] = None,
        label2_path: Optional[Union[str, Path]] = None,
    ) -> Dict[str, np.ndarray]:
        """Loads a synchronized bi-temporal sample dictionary."""
        data = {
            "im1": self.load_image(im1_path),
            "im2": self.load_image(im2_path),
        }
        if label1_path and Path(label1_path).exists():
            data["label1"] = self.load_mask(label1_path)
        if label2_path and Path(label2_path).exists():
            data["label2"] = self.load_mask(label2_path)
        return data
