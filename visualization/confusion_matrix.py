"""
Heatmap rendering for evaluation confusion matrix and transition matrix cross-tabulation.
"""

from typing import List, Optional
import matplotlib.pyplot as plt
import numpy as np

from datasets.labels import CLASS_DEFINITIONS


def plot_confusion_matrix(
    matrix: np.ndarray,
    class_names: Optional[List[str]] = None,
    title: str = "Semantic Segmentation Confusion Matrix",
    normalize: bool = True,
    save_path: Optional[str] = None,
) -> plt.Figure:
    """Renders normalized confusion matrix heatmap with percentage values."""
    if class_names is None:
        class_names = [c["display_name"] for c in CLASS_DEFINITIONS]

    cm = np.array(matrix, dtype=np.float64)
    if normalize:
        row_sums = cm.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        cm_norm = cm / row_sums
    else:
        cm_norm = cm

    fig, ax = plt.subplots(figsize=(9, 8), dpi=300)
    im = ax.imshow(cm_norm, interpolation="nearest", cmap="Blues")
    ax.figure.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=class_names,
        yticklabels=class_names,
        title=title,
        ylabel="Ground Truth Label",
        xlabel="Predicted Label",
    )

    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    thresh = cm_norm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val_str = f"{cm_norm[i, j]:.2f}" if normalize else f"{int(cm[i, j])}"
            ax.text(
                j, i, val_str,
                ha="center", va="center",
                color="white" if cm_norm[i, j] > thresh else "black",
                fontsize=9,
            )

    fig.tight_layout()
    if save_path:
        plt.savefig(save_path, bbox_inches="tight", dpi=300)
    return fig
