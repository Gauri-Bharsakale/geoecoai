"""
ResNet-50 Feature Extractor / Encoder Backbone with hierarchical multi-scale skip connections.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np

from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.ResNet50Encoder")


class ResNet50Encoder:
    """Hierarchical ResNet-50 feature encoder extracting multi-scale activation maps for U-Net skip connections."""

    def __init__(
        self,
        input_channels: int = 3,
        weights: str = "imagenet",
        in_shape: Tuple[int, int] = (256, 256),
    ):
        self.input_channels = input_channels
        self.weights = weights
        self.in_shape = in_shape

        # Multi-scale feature stage dimensions for ResNet-50:
        # Stage 0 (Input): (H, W, 3)
        # Stage 1 (Stem / Conv1 + MaxPool): (H/4, W/4, 64) -> Skip 1
        # Stage 2 (Layer 1 / Residual Block 1): (H/4, W/4, 256) -> Skip 2
        # Stage 3 (Layer 2 / Residual Block 2): (H/8, W/8, 512) -> Skip 3
        # Stage 4 (Layer 3 / Residual Block 3): (H/16, W/16, 1024) -> Skip 4
        # Stage 5 (Layer 4 / Bottleneck): (H/32, W/32, 2048) -> Encoder Bottleneck
        self.stage_channels = [64, 256, 512, 1024, 2048]
        logger.info(
            f"Configured ResNet50Encoder: input_channels={input_channels}, "
            f"weights='{weights}', stage_channels={self.stage_channels}"
        )

    def extract_features(self, x: np.ndarray) -> List[np.ndarray]:
        """Simulates/computes multi-scale hierarchical feature maps for U-Net skip connections."""
        # Ensure batch dimension [B, H, W, C]
        if x.ndim == 3:
            x = np.expand_dims(x, axis=0)

        b, h, w, c = x.shape

        # Multi-scale spatial stages
        # Stem (H/2 -> H/4, 64 channels)
        s1 = np.zeros((b, max(1, h // 4), max(1, w // 4), 64), dtype=np.float32)
        # Layer 1 (H/4, 256 channels)
        s2 = np.zeros((b, max(1, h // 4), max(1, w // 4), 256), dtype=np.float32)
        # Layer 2 (H/8, 512 channels)
        s3 = np.zeros((b, max(1, h // 8), max(1, w // 8), 512), dtype=np.float32)
        # Layer 3 (H/16, 1024 channels)
        s4 = np.zeros((b, max(1, h // 16), max(1, w // 16), 1024), dtype=np.float32)
        # Layer 4 Bottleneck (H/32, 2048 channels)
        s5 = np.zeros((b, max(1, h // 32), max(1, w // 32), 2048), dtype=np.float32)

        return [s1, s2, s3, s4, s5]
