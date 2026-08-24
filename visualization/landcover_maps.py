"""
Plotting and rendering routines for 2D land cover classification maps with discrete categorical palettes.
"""

from typing import Optional, Tuple
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

from datasets.labels import CLASS_DEFINITIONS, decode_mask_to_rgb


def plot_landcover_map(
    mask: np.ndarray,
    title: str = "Semantic Land Cover Classification Map",
    figsize: Tuple[int, int] = (8, 8),
    save_path: Optional[str] = None,
) -> plt.Figure:
    """Renders single land cover classification map with legend."""
    rgb = decode_mask_to_rgb(mask)
    fig, ax = plt.subplots(figsize=figsize, dpi=300)
    ax.imshow(rgb, interpolation="nearest")
    ax.set_title(title, fontsize=14, fontweight="bold", pad=12)
    ax.axis("off")

    # Legend for present classes
    present_classes = np.unique(mask)
    legend_patches = []
    for c in CLASS_DEFINITIONS:
        if c["id"] in present_classes:
            r, g, b = [val / 255.0 for val in c["color_rgb"]]
            patch = mpatches.Patch(color=(r, g, b), label=c["display_name"])
            legend_patches.append(patch)

    if legend_patches:
        ax.legend(
            handles=legend_patches,
            loc="lower center",
            bbox_to_anchor=(0.5, -0.15),
            ncol=3,
            frameon=True,
            fontsize=10,
        )

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, bbox_inches="tight", dpi=300)
    return fig


def plot_bitemporal_comparison(
    im1: np.ndarray,
    im2: np.ndarray,
    mask1: np.ndarray,
    mask2: np.ndarray,
    title: str = "Multi-Temporal Land Cover Evolution (T1 vs T2)",
    save_path: Optional[str] = None,
) -> plt.Figure:
    """Side-by-side 2x2 multi-panel plot comparing raw RGB images and predicted semantic maps."""
    fig, axes = plt.subplots(2, 2, figsize=(12, 12), dpi=300)

    # T1 Optical
    axes[0, 0].imshow(im1 if im1.max() <= 1.0 else im1 / 255.0)
    axes[0, 0].set_title("Time 1 (T1) Optical Image", fontsize=12, fontweight="bold")
    axes[0, 0].axis("off")

    # T2 Optical
    axes[0, 1].imshow(im2 if im2.max() <= 1.0 else im2 / 255.0)
    axes[0, 1].set_title("Time 2 (T2) Optical Image", fontsize=12, fontweight="bold")
    axes[0, 1].axis("off")

    # T1 Semantic Map
    rgb1 = decode_mask_to_rgb(mask1)
    axes[1, 0].imshow(rgb1, interpolation="nearest")
    axes[1, 0].set_title("T1 ResNet-50+U-Net Classification", fontsize=12, fontweight="bold")
    axes[1, 0].axis("off")

    # T2 Semantic Map
    rgb2 = decode_mask_to_rgb(mask2)
    axes[1, 1].imshow(rgb2, interpolation="nearest")
    axes[1, 1].set_title("T2 ResNet-50+U-Net Classification", fontsize=12, fontweight="bold")
    axes[1, 1].axis("off")

    plt.suptitle(title, fontsize=16, fontweight="bold", y=0.98)
    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, bbox_inches="tight", dpi=300)
    return fig
