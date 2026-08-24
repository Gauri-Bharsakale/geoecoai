"""
Comprehensive evaluation metrics for remote sensing multi-class semantic segmentation:
Accuracy, Precision, Recall, F1 Score, IoU, Dice Coefficient, and Confusion Matrix.
"""

from typing import Any, Dict, List, Optional
import numpy as np

from datasets.labels import CLASS_DEFINITIONS, NUM_CLASSES
from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.Metrics")


class SegmentationMetricsCalculator:
    """Computes overall and per-class semantic segmentation metrics from confusion matrix."""

    def __init__(self, num_classes: int = NUM_CLASSES):
        self.num_classes = num_classes
        self.confusion_matrix = np.zeros((num_classes, num_classes), dtype=np.int64)

    def reset(self) -> None:
        """Resets accumulated confusion matrix."""
        self.confusion_matrix.fill(0)

    def update(self, y_true: np.ndarray, y_pred: np.ndarray) -> None:
        """Accumulates pixel-wise true vs predicted pairings into confusion matrix."""
        if y_pred.ndim == y_true.ndim + 1:
            y_pred = np.argmax(y_pred, axis=-1)

        y_true_flat = y_true.flatten().astype(np.int64)
        y_pred_flat = y_pred.flatten().astype(np.int64)

        # Filter valid indices within [0, num_classes-1]
        valid_mask = (y_true_flat >= 0) & (y_true_flat < self.num_classes) & \
                     (y_pred_flat >= 0) & (y_pred_flat < self.num_classes)

        y_t = y_true_flat[valid_mask]
        y_p = y_pred_flat[valid_mask]

        # Fast bincount confusion matrix indexing: idx = true * num_classes + pred
        indices = y_t * self.num_classes + y_p
        counts = np.bincount(indices, minlength=self.num_classes ** 2)
        self.confusion_matrix += counts.reshape((self.num_classes, self.num_classes))

    def compute_metrics(self) -> Dict[str, Any]:
        """Calculates comprehensive metrics dictionary with overall and per-class scores."""
        cm = self.confusion_matrix
        total_pixels = cm.sum()

        if total_pixels == 0:
            return {
                "overall": {
                    "accuracy": 0.0,
                    "mean_precision": 0.0,
                    "mean_recall": 0.0,
                    "mean_f1": 0.0,
                    "mean_iou": 0.0,
                    "mean_dice": 0.0,
                },
                "per_class": {},
                "confusion_matrix": cm.tolist(),
            }

        # True Positives on diagonal
        tp = np.diag(cm).astype(np.float64)
        # False Positives: sum of column minus diagonal
        fp = cm.sum(axis=0).astype(np.float64) - tp
        # False Negatives: sum of row minus diagonal
        fn = cm.sum(axis=1).astype(np.float64) - tp

        # Overall Overall Pixel Accuracy
        overall_acc = tp.sum() / total_pixels

        per_class_metrics = {}
        precisions = []
        recalls = []
        f1s = []
        ious = []
        dices = []

        for c in range(self.num_classes):
            c_tp = tp[c]
            c_fp = fp[c]
            c_fn = fn[c]

            precision = c_tp / (c_tp + c_fp) if (c_tp + c_fp) > 0 else 0.0
            recall = c_tp / (c_tp + c_fn) if (c_tp + c_fn) > 0 else 0.0
            f1 = (2.0 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
            iou = c_tp / (c_tp + fp[c] + fn[c]) if (c_tp + fp[c] + fn[c]) > 0 else 0.0
            dice = (2.0 * c_tp) / (2.0 * c_tp + fp[c] + fn[c]) if (2.0 * c_tp + fp[c] + fn[c]) > 0 else 0.0

            class_name = CLASS_DEFINITIONS[c]["name"] if c < len(CLASS_DEFINITIONS) else f"class_{c}"
            per_class_metrics[class_name] = {
                "class_id": c,
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
                "iou": float(iou),
                "dice": float(dice),
                "pixel_count": int(cm[c, :].sum()),
            }

            precisions.append(precision)
            recalls.append(recall)
            f1s.append(f1)
            ious.append(iou)
            dices.append(dice)

        return {
            "overall": {
                "accuracy": float(overall_acc),
                "mean_precision": float(np.mean(precisions)),
                "mean_recall": float(np.mean(recalls)),
                "mean_f1": float(np.mean(f1s)),
                "mean_iou": float(np.mean(ious)),
                "mean_dice": float(np.mean(dices)),
                "total_pixels_evaluated": int(total_pixels),
            },
            "per_class": per_class_metrics,
            "confusion_matrix": cm.tolist(),
        }
