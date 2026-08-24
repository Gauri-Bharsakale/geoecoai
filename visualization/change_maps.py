"""
Plotting utilities for binary change detection and semantic transition maps.
"""

from typing import Optional
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

from change_detection.change_map import ChangeMapGenerator


def plot_change_map(
    mask_t1: np.ndarray,
    mask_t2: np.ndarray,
    title: str = "Post-Classification Comparison (PCC) Change Map",
    save_path: Optional[str] = None,
) -> plt.Figure:
    """Generates dual panel containing Binary Change Map and Semantic Transition Map."""
    generator = ChangeMapGenerator()
    binary_rgb, transition_rgb = generator.generate_rgb_change_visualization(mask_t1, mask_t2)

    fig, axes = plt.subplots(1, 2, figsize=(14, 7), dpi=300)

    # Binary Change
    axes[0].imshow(binary_rgb, interpolation="nearest")
    axes[0].set_title("Binary Change Detection (Unchanged vs Changed)", fontsize=12, fontweight="bold")
    axes[0].axis("off")
    p_unchanged = mpatches.Patch(color=(20/255, 24/255, 32/255), label="No Change / Persistent")
    p_changed = mpatches.Patch(color=(239/255, 68/255, 68/255), label="Detected Land Cover Change")
    axes[0].legend(handles=[p_unchanged, p_changed], loc="lower center", bbox_to_anchor=(0.5, -0.15), frameon=True)

    # Semantic Transition
    axes[1].imshow(transition_rgb, interpolation="nearest")
    axes[1].set_title("Semantic Transition Trajectories", fontsize=12, fontweight="bold")
    axes[1].axis("off")

    p_deforest = mpatches.Patch(color=(220/255, 38/255, 38/255), label="Tree → Built-up/Ground")
    p_urban = mpatches.Patch(color=(249/255, 115/255, 22/255), label="Low Veg → Built-up")
    p_water = mpatches.Patch(color=(168/255, 85/255, 247/255), label="Water → Ground/Veg")
    p_regreen = mpatches.Patch(color=(34/255, 197/255, 94/255), label="Ground → Vegetation")
    p_other = mpatches.Patch(color=(234/255, 179/255, 8/255), label="Other Conversions")

    axes[1].legend(
        handles=[p_deforest, p_urban, p_water, p_regreen, p_other],
        loc="lower center",
        bbox_to_anchor=(0.5, -0.18),
        ncol=3,
        frameon=True,
    )

    plt.suptitle(title, fontsize=15, fontweight="bold", y=0.98)
    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, bbox_inches="tight", dpi=300)
    return fig


def plot_transition_breakdown(
    transitions: list,
    top_n: int = 8,
    save_path: Optional[str] = None,
) -> plt.Figure:
    """Horizontal bar chart showing the most dominant land cover conversion trajectories."""
    top_trans = transitions[:top_n]
    if not top_trans:
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, "No transitions detected", ha="center", va="center")
        return fig

    labels = [t["transition_label"] for t in reversed(top_trans)]
    areas_ha = [t["area_ha"] for t in reversed(top_trans)]

    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    bars = ax.barh(labels, areas_ha, color="#3B82F6", edgecolor="#1E40AF", height=0.6)

    ax.set_xlabel("Transition Area (Hectares)", fontsize=11, fontweight="bold")
    ax.set_title(f"Top {len(top_trans)} Land Cover Transition Trajectories", fontsize=13, fontweight="bold", pad=12)
    ax.grid(axis="x", linestyle="--", alpha=0.5)

    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.05 * max(areas_ha), bar.get_y() + bar.get_height() / 2, f"{width:.2f} ha",
                va="center", ha="left", fontsize=9, fontweight="bold", color="#1E293B")

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, bbox_inches="tight", dpi=300)
    return fig
