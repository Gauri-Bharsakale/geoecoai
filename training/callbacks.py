"""
Training callbacks for checkpointing, early stopping, and learning rate scheduling.
"""

from pathlib import Path
from typing import Any, Dict, Optional
import json

from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.Callbacks")


class ModelCheckpoint:
    """Saves model state when monitored metric improves."""

    def __init__(
        self,
        filepath: Path,
        monitor: str = "val_mean_iou",
        mode: str = "max",
        save_best_only: bool = True,
    ):
        self.filepath = Path(filepath)
        self.filepath.parent.mkdir(parents=True, exist_ok=True)
        self.monitor = monitor
        self.mode = mode
        self.save_best_only = save_best_only
        self.best_score = -float("inf") if mode == "max" else float("inf")

    def on_epoch_end(self, epoch: int, metrics: Dict[str, float], model_state: Any = None) -> bool:
        current = metrics.get(self.monitor)
        if current is None:
            return False

        improved = (current > self.best_score) if self.mode == "max" else (current < self.best_score)
        if improved:
            logger.info(
                f"Epoch {epoch}: {self.monitor} improved from {self.best_score:.4f} to {current:.4f}. "
                f"Saving checkpoint to {self.filepath}"
            )
            self.best_score = current
            # Save checkpoint metadata
            meta_path = self.filepath.with_suffix(".json")
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump({"epoch": epoch, "best_metric": self.monitor, "best_value": current}, f, indent=2)
            return True
        return False


class EarlyStopping:
    """Halts training when monitored metric stops improving after a patience threshold."""

    def __init__(self, monitor: str = "val_loss", patience: int = 10, mode: str = "min"):
        self.monitor = monitor
        self.patience = patience
        self.mode = mode
        self.wait = 0
        self.stopped_epoch = 0
        self.best_score = float("inf") if mode == "min" else -float("inf")

    def on_epoch_end(self, epoch: int, metrics: Dict[str, float]) -> bool:
        current = metrics.get(self.monitor)
        if current is None:
            return False

        improved = (current < self.best_score) if self.mode == "min" else (current > self.best_score)
        if improved:
            self.best_score = current
            self.wait = 0
        else:
            self.wait += 1
            if self.wait >= self.patience:
                self.stopped_epoch = epoch
                logger.info(f"Early stopping triggered at epoch {epoch}. Monitored {self.monitor} did not improve for {self.patience} epochs.")
                return True
        return False


class ReduceLROnPlateau:
    """Reduces learning rate when a metric has stopped improving."""

    def __init__(
        self,
        monitor: str = "val_loss",
        factor: float = 0.5,
        patience: int = 5,
        min_lr: float = 1e-6,
        mode: str = "min",
    ):
        self.monitor = monitor
        self.factor = factor
        self.patience = patience
        self.min_lr = min_lr
        self.mode = mode
        self.wait = 0
        self.best_score = float("inf") if mode == "min" else -float("inf")

    def on_epoch_end(self, epoch: int, current_lr: float, metrics: Dict[str, float]) -> float:
        current = metrics.get(self.monitor)
        if current is None:
            return current_lr

        improved = (current < self.best_score) if self.mode == "min" else (current > self.best_score)
        if improved:
            self.best_score = current
            self.wait = 0
        else:
            self.wait += 1
            if self.wait >= self.patience:
                new_lr = max(current_lr * self.factor, self.min_lr)
                logger.info(f"Epoch {epoch}: Reducing learning rate from {current_lr:.6f} to {new_lr:.6f}.")
                self.wait = 0
                return new_lr
        return current_lr


class TrainingLoggerCallback:
    """Logs epoch progress and persists metrics history to JSON."""

    def __init__(self, log_path: Path):
        self.log_path = Path(log_path)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self.history: List[Dict[str, Any]] = []

    def on_epoch_end(self, epoch: int, metrics: Dict[str, float]) -> None:
        record = {"epoch": epoch, **metrics}
        self.history.append(record)
        with open(self.log_path, "w", encoding="utf-8") as f:
            json.dump(self.history, f, indent=2)
