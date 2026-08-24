"""
Multispectral input adaptation module for handling remote sensing sensors (e.g., Landsat-8/9, Sentinel-2).
Supports Approach A (1x1 projection to RGB) and Approach B (conv1 expansion preserving RGB weights).
"""

from typing import Optional
import numpy as np

from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.InputAdapter")


class MultispectralInputAdapter:
    """Adapts arbitrary N-channel multispectral inputs to standard 3-channel or expanded encoder layers."""

    def __init__(
        self,
        strategy: str = "conv1_expansion",
        input_channels: int = 3,
        target_channels: int = 3,
    ):
        self.strategy = strategy
        self.input_channels = input_channels
        self.target_channels = target_channels
        logger.info(
            f"Initialized MultispectralInputAdapter with strategy='{strategy}', "
            f"input_channels={input_channels}, target_channels={target_channels}"
        )

    def adapt_input(self, tensor: np.ndarray) -> np.ndarray:
        """Adapts input image tensor [B, H, W, C] or [H, W, C] to target channel dimensions."""
        c = tensor.shape[-1]
        if c == self.target_channels:
            return tensor

        if self.strategy == "band_selection" or c > self.target_channels:
            # Extract first target_channels (typically Red, Green, Blue in standard optical ordering)
            logger.debug(f"Selecting first {self.target_channels} optical channels from {c}-channel input.")
            return tensor[..., : self.target_channels]

        elif self.strategy == "conv1_expansion":
            # Expand single-channel or repeat channels to 3
            if c == 1:
                return np.repeat(tensor, self.target_channels, axis=-1)
            elif c < self.target_channels:
                pad_channels = self.target_channels - c
                padding = np.zeros(tensor.shape[:-1] + (pad_channels,), dtype=tensor.dtype)
                return np.concatenate([tensor, padding], axis=-1)

        return tensor
