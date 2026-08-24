"""
Matplotlib line plotting for loss, accuracy, Mean IoU, and Dice score progression over epochs.
"""

from typing import Any, Dict, List, Optional
import matplotlib.pyplot as plt


def plot_training_history(
    history: List[Dict[str, Any]],
    save_path: Optional[str] = None,
) -> plt.Figure:
    """Multi-panel line plots of Loss, Pixel Accuracy, Mean IoU, and Dice Coefficient."""
    if not history:
        fig, ax = plt.subplots(figsize=(6, 4))
        ax.text(0.5, 0.5, "Training history not yet generated", ha="center", va="center")
        return fig

    epochs = [h["epoch"] for h in history]
    train_loss = [h.get("train_loss", 0.0) for h in history]
    val_loss = [h.get("val_loss", 0.0) for h in history]
    train_acc = [h.get("train_accuracy", 0.0) for h in history]
    val_acc = [h.get("val_accuracy", 0.0) for h in history]
    val_iou = [h.get("val_mean_iou", 0.0) for h in history]
    val_dice = [h.get("val_mean_dice", 0.0) for h in history]

    fig, axes = plt.subplots(2, 2, figsize=(12, 9), dpi=300)

    # Loss curve
    axes[0, 0].plot(epochs, train_loss, "b-o", label="Train Loss", linewidth=2)
    axes[0, 0].plot(epochs, val_loss, "r--s", label="Val Loss", linewidth=2)
    axes[0, 0].set_title("Cross-Entropy + Dice Loss Progression", fontsize=11, fontweight="bold")
    axes[0, 0].set_xlabel("Epoch")
    axes[0, 0].set_ylabel("Loss")
    axes[0, 0].grid(True, linestyle="--", alpha=0.5)
    axes[0, 0].legend()

    # Accuracy curve
    axes[0, 1].plot(epochs, train_acc, "b-o", label="Train Accuracy", linewidth=2)
    axes[0, 1].plot(epochs, val_acc, "r--s", label="Val Accuracy", linewidth=2)
    axes[0, 1].set_title("Overall Pixel Accuracy", fontsize=11, fontweight="bold")
    axes[0, 1].set_xlabel("Epoch")
    axes[0, 1].set_ylabel("Accuracy")
    axes[0, 1].grid(True, linestyle="--", alpha=0.5)
    axes[0, 1].legend()

    # Validation mIoU curve
    axes[1, 0].plot(epochs, val_iou, "g-^", label="Validation mIoU", linewidth=2)
    axes[1, 0].set_title("Mean Intersection over Union (mIoU)", fontsize=11, fontweight="bold")
    axes[1, 0].set_xlabel("Epoch")
    axes[1, 0].set_ylabel("mIoU Score")
    axes[1, 0].grid(True, linestyle="--", alpha=0.5)
    axes[1, 0].legend()

    # Validation Dice curve
    axes[1, 1].plot(epochs, val_dice, "m-d", label="Validation Dice", linewidth=2)
    axes[1, 1].set_title("Mean Dice Coefficient (F1)", fontsize=11, fontweight="bold")
    axes[1, 1].set_xlabel("Epoch")
    axes[1, 1].set_ylabel("Dice Score")
    axes[1, 1].grid(True, linestyle="--", alpha=0.5)
    axes[1, 1].legend()

    plt.suptitle("ResNet-50 + U-Net Training Dynamics", fontsize=15, fontweight="bold", y=0.98)
    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, bbox_inches="tight", dpi=300)
    return fig
