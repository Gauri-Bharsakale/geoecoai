"""
Ground-truth label definitions and colormaps for SECOND Yang et al. semantic classes.
"""

from typing import Dict, List, Tuple
import numpy as np

# Official 7 semantic indices of SECOND (0: non-change/background + 6 land-cover categories)
CLASS_DEFINITIONS = [
    {
        "id": 0,
        "name": "unchanged_background",
        "display_name": "Unchanged / Background",
        "color_rgb": (30, 30, 30),
        "color_hex": "#1E1E1E",
        "category": "Background",
    },
    {
        "id": 1,
        "name": "water",
        "display_name": "Water Bodies",
        "color_rgb": (37, 99, 235),
        "color_hex": "#2563EB",
        "category": "Hydrosphere",
    },
    {
        "id": 2,
        "name": "ground",
        "display_name": "Ground / Bare Soil",
        "color_rgb": (148, 163, 184),
        "color_hex": "#94A3B8",
        "category": "Lithosphere",
    },
    {
        "id": 3,
        "name": "low_vegetation",
        "display_name": "Low Vegetation / Agriculture",
        "color_rgb": (34, 197, 94),
        "color_hex": "#22C55E",
        "category": "Biosphere",
    },
    {
        "id": 4,
        "name": "tree",
        "display_name": "Tree / Forest Canopy",
        "color_rgb": (21, 128, 61),
        "color_hex": "#15803D",
        "category": "Biosphere",
    },
    {
        "id": 5,
        "name": "building",
        "display_name": "Building / Urban Infrastructure",
        "color_rgb": (220, 38, 38),
        "color_hex": "#DC2626",
        "category": "Anthroposphere",
    },
    {
        "id": 6,
        "name": "playground",
        "display_name": "Playground / Sports Ground",
        "color_rgb": (234, 179, 8),
        "color_hex": "#EAB308",
        "category": "Anthroposphere",
    },
]

NUM_CLASSES = len(CLASS_DEFINITIONS)
CLASS_ID_TO_NAME = {item["id"]: item["name"] for item in CLASS_DEFINITIONS}
CLASS_ID_TO_DISPLAY = {item["id"]: item["display_name"] for item in CLASS_DEFINITIONS}
CLASS_ID_TO_COLOR = {item["id"]: item["color_rgb"] for item in CLASS_DEFINITIONS}
CLASS_ID_TO_HEX = {item["id"]: item["color_hex"] for item in CLASS_DEFINITIONS}
CLASS_NAMES = [item["name"] for item in CLASS_DEFINITIONS]


def get_class_colormap() -> np.ndarray:
    """Returns an RGB lookup table array of shape (NUM_CLASSES, 3) in [0, 255]."""
    lut = np.zeros((NUM_CLASSES, 3), dtype=np.uint8)
    for c in CLASS_DEFINITIONS:
        lut[c["id"]] = c["color_rgb"]
    return lut


def decode_mask_to_rgb(mask: np.ndarray) -> np.ndarray:
    """Decodes 2D integer class mask into 3D RGB visual image."""
    lut = get_class_colormap()
    clamped_mask = np.clip(mask, 0, NUM_CLASSES - 1).astype(int)
    return lut[clamped_mask]
