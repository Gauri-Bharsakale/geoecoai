"""
Validation and data sanity check functions for remote sensing datasets.
"""

from typing import Dict, List, Tuple
import numpy as np


def validate_image_pair(
    img_t1: np.ndarray,
    img_t2: np.ndarray,
) -> Tuple[bool, List[str]]:
    """Validates spatial dimensions, channels, and value range consistency between temporal pairs."""
    errors = []
    if img_t1.shape != img_t2.shape:
        errors.append(f"Shape mismatch: T1 has shape {img_t1.shape} while T2 has {img_t2.shape}")

    if np.isnan(img_t1).any() or np.isinf(img_t1).any():
        errors.append("T1 image contains NaN or Inf values")

    if np.isnan(img_t2).any() or np.isinf(img_t2).any():
        errors.append("T2 image contains NaN or Inf values")

    is_valid = len(errors) == 0
    return is_valid, errors


def validate_class_mask(
    mask: np.ndarray,
    num_classes: int = 7,
) -> Tuple[bool, List[str]]:
    """Validates semantic segmentation class mask labels against expected class boundaries."""
    errors = []
    if mask.ndim != 2:
        errors.append(f"Mask must be 2D array, received {mask.ndim}D shape {mask.shape}")

    unique_vals = np.unique(mask)
    invalid_vals = [v for v in unique_vals if v < 0 or v >= num_classes]
    if invalid_vals:
        errors.append(f"Mask contains invalid class IDs outside [0, {num_classes-1}]: {invalid_vals}")

    is_valid = len(errors) == 0
    return is_valid, errors
