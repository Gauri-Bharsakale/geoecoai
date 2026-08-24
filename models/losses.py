"""
Configurable segmentation loss functions addressing class imbalance in remote sensing datasets.
Implements Combined Cross-Entropy + Dice Loss, Dice Loss, Focal Loss, and IoU metric formulas.
"""

from typing import Optional, Tuple
import numpy as np


class CategoricalCrossEntropyLoss:
    """Standard multi-class categorical cross-entropy loss."""

    def __init__(self, epsilon: float = 1e-7):
        self.epsilon = epsilon

    def __call__(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculates mean cross-entropy loss between one-hot ground truth and predicted softmax."""
        y_pred = np.clip(y_pred, self.epsilon, 1.0 - self.epsilon)
        if y_true.ndim == y_pred.ndim - 1:
            # Convert integer label mask to one-hot
            num_classes = y_pred.shape[-1]
            y_true_one_hot = np.eye(num_classes)[y_true]
        else:
            y_true_one_hot = y_true

        ce = -np.sum(y_true_one_hot * np.log(y_pred), axis=-1)
        return float(np.mean(ce))


class DiceLoss:
    """Multi-class Dice loss measuring spatial overlap and robust to severe class imbalance."""

    def __init__(self, smooth: float = 1.0):
        self.smooth = smooth

    def __call__(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        num_classes = y_pred.shape[-1]
        if y_true.ndim == y_pred.ndim - 1:
            y_true = np.eye(num_classes)[y_true]

        dice_per_class = []
        for c in range(num_classes):
            intersection = np.sum(y_true[..., c] * y_pred[..., c])
            cardinality = np.sum(y_true[..., c]) + np.sum(y_pred[..., c])
            dice = (2.0 * intersection + self.smooth) / (cardinality + self.smooth)
            dice_per_class.append(dice)

        return float(1.0 - np.mean(dice_per_class))


class FocalLoss:
    """Focal Loss with focusing parameter gamma to downweight easy background examples."""

    def __init__(self, gamma: float = 2.0, alpha: float = 0.25, epsilon: float = 1e-7):
        self.gamma = gamma
        self.alpha = alpha
        self.epsilon = epsilon

    def __call__(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        num_classes = y_pred.shape[-1]
        if y_true.ndim == y_pred.ndim - 1:
            y_true = np.eye(num_classes)[y_true]

        y_pred = np.clip(y_pred, self.epsilon, 1.0 - self.epsilon)
        cross_entropy = -y_true * np.log(y_pred)
        weight = self.alpha * np.power(1.0 - y_pred, self.gamma)
        loss = np.sum(weight * cross_entropy, axis=-1)
        return float(np.mean(loss))


class CombinedCrossEntropyDiceLoss:
    """Weighted combination: L_total = alpha * L_CE + beta * L_Dice."""

    def __init__(self, ce_weight: float = 0.5, dice_weight: float = 0.5):
        self.ce_weight = ce_weight
        self.dice_weight = dice_weight
        self.ce_loss = CategoricalCrossEntropyLoss()
        self.dice_loss = DiceLoss()

    def __call__(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        ce = self.ce_loss(y_true, y_pred)
        dice = self.dice_loss(y_true, y_pred)
        return float(self.ce_weight * ce + self.dice_weight * dice)


def compute_dice_coefficient(y_true: np.ndarray, y_pred: np.ndarray, num_classes: int = 7) -> float:
    """Calculates overall mean Dice coefficient across all classes."""
    if y_pred.ndim == y_true.ndim + 1:
        y_pred = np.argmax(y_pred, axis=-1)

    dice_scores = []
    for c in range(num_classes):
        true_c = (y_true == c)
        pred_c = (y_pred == c)
        intersection = np.logical_and(true_c, pred_c).sum()
        total = true_c.sum() + pred_c.sum()
        if total == 0:
            dice_scores.append(1.0)
        else:
            dice_scores.append((2.0 * intersection) / float(total))

    return float(np.mean(dice_scores))


def compute_mean_iou(y_true: np.ndarray, y_pred: np.ndarray, num_classes: int = 7) -> float:
    """Calculates Mean Intersection over Union (mIoU) across all semantic classes."""
    if y_pred.ndim == y_true.ndim + 1:
        y_pred = np.argmax(y_pred, axis=-1)

    iou_scores = []
    for c in range(num_classes):
        true_c = (y_true == c)
        pred_c = (y_pred == c)
        intersection = np.logical_and(true_c, pred_c).sum()
        union = np.logical_or(true_c, pred_c).sum()
        if union == 0:
            iou_scores.append(1.0)
        else:
            iou_scores.append(float(intersection) / float(union))

    return float(np.mean(iou_scores))
