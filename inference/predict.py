"""
Single-image and paired bi-temporal semantic predictor.
CLI: python -m inference.predict --input path/to/image.png
"""

import argparse
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union
import numpy as np
from PIL import Image

from datasets.labels import decode_mask_to_rgb, NUM_CLASSES
from models.unet_resnet50 import ResNet50UNet
from preprocessing.normalization import ImageNormalizer
from utils.logging_utils import get_logger, setup_logging
from utils.paths import get_paths

logger = get_logger("GeoEcoAI.Predict")


class SemanticPredictor:
    """Performs neural semantic inference on remote sensing imagery."""

    def __init__(
        self,
        weights_path: Optional[Path] = None,
        num_classes: int = NUM_CLASSES,
    ):
        self.num_classes = num_classes
        self.normalizer = ImageNormalizer(method="minmax")
        self.model = ResNet50UNet(num_classes=num_classes)
        self.paths = get_paths()
        logger.info("Initialized SemanticPredictor with ResNet-50 + U-Net backbone.")

    def predict_image(self, image_input: Union[str, Path, np.ndarray]) -> Dict[str, np.ndarray]:
        """Predicts land-cover class map and RGB preview from input image."""
        if isinstance(image_input, (str, Path)):
            with Image.open(str(image_input)) as img:
                arr = np.array(img.convert("RGB"), dtype=np.float32)
        else:
            arr = image_input.astype(np.float32)

        norm_img = self.normalizer.normalize(arr)
        probs = self.model.forward(norm_img)
        class_mask = np.argmax(probs, axis=-1).astype(np.int32)
        rgb_vis = decode_mask_to_rgb(class_mask)

        return {
            "input_image": norm_img,
            "probabilities": probs,
            "class_mask": class_mask,
            "rgb_mask": rgb_vis,
        }

    def predict_temporal_pair(
        self,
        im1_input: Union[str, Path, np.ndarray],
        im2_input: Union[str, Path, np.ndarray],
    ) -> Dict[str, Any]:
        """Predicts semantic classification maps for both T1 and T2 temporal acquisitions."""
        t1_res = self.predict_image(im1_input)
        t2_res = self.predict_image(im2_input)

        return {
            "t1": t1_res,
            "t2": t2_res,
            "class_mask_t1": t1_res["class_mask"],
            "class_mask_t2": t2_res["class_mask"],
        }


def main():
    setup_logging()
    parser = argparse.ArgumentParser(description="GeoEcoAI Semantic Predictor CLI")
    parser.add_argument("--input", type=str, default=None, help="Input remote sensing image path")
    parser.add_argument("--output", type=str, default=None, help="Output classification mask path")
    args = parser.parse_args()

    predictor = SemanticPredictor()
    if args.input:
        res = predictor.predict_image(args.input)
        out_path = args.output or "outputs/predictions/classification_output.png"
        Image.fromarray(res["rgb_mask"]).save(out_path)
        logger.info(f"Saved classification mask to {out_path}")
    else:
        logger.info("No input specified. Run with --input <path> or launch the Streamlit app.")


if __name__ == "__main__":
    main()
