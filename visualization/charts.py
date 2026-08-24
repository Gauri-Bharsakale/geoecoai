"""
Area distribution comparison bar charts and data formatters for Plotly / Matplotlib.
"""

from typing import Any, Dict, List, Optional
import matplotlib.pyplot as plt
import numpy as np


def plot_area_distribution_bar(
    comparison_data: Dict[str, Any],
    save_path: Optional[str] = None,
) -> plt.Figure:
    """Grouped bar chart comparing T1 vs T2 area coverage in hectares."""
    items = comparison_data.get("comparison", [])
    # Filter non-zero classes
    active_items = [item for item in items if item["class_id"] != 0]

    names = [item["display_name"] for item in active_items]
    t1_areas = [item["t1_area_ha"] for item in active_items]
    t2_areas = [item["t2_area_ha"] for item in active_items]

    x = np.arange(len(names))
    width = 0.35

    fig, ax = plt.subplots(figsize=(11, 6), dpi=300)
    bars1 = ax.bar(x - width/2, t1_areas, width, label="Time 1 (T1)", color="#64748B", edgecolor="#334155")
    bars2 = ax.bar(x + width/2, t2_areas, width, label="Time 2 (T2)", color="#0284C7", edgecolor="#0369A1")

    ax.set_ylabel("Class Area (Hectares)", fontsize=11, fontweight="bold")
    ax.set_title("Multi-Temporal Land Cover Area Comparison (T1 vs T2)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(names, rotation=25, ha="right", fontsize=10)
    ax.legend(frameon=True, fontsize=10)
    ax.grid(axis="y", linestyle="--", alpha=0.5)

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, bbox_inches="tight", dpi=300)
    return fig


def plot_transition_sankey_data(transition_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extracts node links for Plotly Sankey flow visualizer."""
    matrix = transition_data.get("matrix_counts", [])
    labels = ["Water", "Ground", "Low Veg", "Tree", "Building", "Playground"]

    source = []
    target = []
    value = []

    # Map indices 1..6
    for i in range(1, len(matrix)):
        for j in range(1, len(matrix[i])):
            cnt = matrix[i][j]
            if cnt > 0:
                source.append(i - 1)
                target.append(len(labels) + (j - 1))
                value.append(cnt)

    return {
        "labels": [f"T1: {l}" for l in labels] + [f"T2: {l}" for l in labels],
        "source": source,
        "target": target,
        "value": value,
    }
