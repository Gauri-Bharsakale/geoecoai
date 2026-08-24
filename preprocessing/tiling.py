"""
Patch extraction (tiling) and reconstruction for high-resolution remote sensing scenes.
"""

from typing import List, Tuple
import numpy as np


class ImageTiler:
    """Slices large remote sensing scenes into fixed-size training or inference patches."""

    def __init__(self, patch_size: int = 256, stride: int = 256, overlap: int = 0):
        self.patch_size = patch_size
        self.stride = patch_size - overlap if overlap > 0 else stride

    def extract_patches(
        self,
        image: np.ndarray,
        mask: np.ndarray = None,
    ) -> Tuple[List[np.ndarray], List[Tuple[int, int, int, int]], List[np.ndarray]]:
        """Extracts regular patches and coordinate bounding boxes (y1, y2, x1, x2)."""
        h, w = image.shape[:2]
        patches = []
        coordinates = []
        mask_patches = [] if mask is not None else None

        y_steps = range(0, h - self.patch_size + 1, self.stride)
        x_steps = range(0, w - self.patch_size + 1, self.stride)

        # Handle boundary cases if dimensions not divisible by stride
        y_list = list(y_steps)
        if len(y_list) == 0 or y_list[-1] + self.patch_size < h:
            y_list.append(max(0, h - self.patch_size))

        x_list = list(x_steps)
        if len(x_list) == 0 or x_list[-1] + self.patch_size < w:
            x_list.append(max(0, w - self.patch_size))

        for y in y_list:
            for x in x_list:
                y2 = min(y + self.patch_size, h)
                x2 = min(x + self.patch_size, w)
                y1 = y2 - self.patch_size
                x1 = x2 - self.patch_size

                patch = image[y1:y2, x1:x2]
                patches.append(patch)
                coordinates.append((y1, y2, x1, x2))

                if mask is not None:
                    m_patch = mask[y1:y2, x1:x2]
                    mask_patches.append(m_patch)

        return patches, coordinates, mask_patches


def reconstruct_from_tiles(
    patches: List[np.ndarray],
    coordinates: List[Tuple[int, int, int, int]],
    original_shape: Tuple[int, int],
    num_classes: int = 7,
    mode: str = "argmax",
) -> np.ndarray:
    """Reassembles predicted tile probabilities into a seamless full-scene classification map."""
    h, w = original_shape
    if mode == "probabilities" or (patches and patches[0].ndim == 3 and patches[0].shape[-1] == num_classes):
        # Accumulate probabilities
        prob_map = np.zeros((h, w, num_classes), dtype=np.float32)
        count_map = np.zeros((h, w, 1), dtype=np.float32)

        for patch, (y1, y2, x1, x2) in zip(patches, coordinates):
            prob_map[y1:y2, x1:x2, :] += patch
            count_map[y1:y2, x1:x2, :] += 1.0

        count_map = np.maximum(count_map, 1.0)
        avg_probs = prob_map / count_map
        return np.argmax(avg_probs, axis=-1).astype(np.int32)
    else:
        # Direct discrete label placement with latest overwrite
        result = np.zeros((h, w), dtype=np.int32)
        for patch, (y1, y2, x1, x2) in zip(patches, coordinates):
            if patch.ndim == 3:
                patch = np.argmax(patch, axis=-1)
            result[y1:y2, x1:x2] = patch
        return result
