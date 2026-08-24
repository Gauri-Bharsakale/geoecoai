"""
Post-Classification Comparison (PCC) change detection pipeline runner and CLI.
CLI: python -m change_detection.post_classification
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional
import numpy as np
from PIL import Image

from change_detection.change_map import ChangeMapGenerator
from change_detection.statistics import ChangeStatisticsCalculator
from change_detection.transition_matrix import TransitionMatrixAnalyzer
from inference.predict import SemanticPredictor
from utils.logging_utils import get_logger, setup_logging
from utils.paths import get_paths

logger = get_logger("GeoEcoAI.PCC")


class PostClassificationChangeDetector:
    """End-to-end coordinator for Post-Classification Comparison change analysis."""

    def __init__(self, resolution_m: float = 1.0):
        self.resolution_m = resolution_m
        self.predictor = SemanticPredictor()
        self.matrix_analyzer = TransitionMatrixAnalyzer(resolution_m=resolution_m)
        self.map_generator = ChangeMapGenerator()
        self.stats_calculator = ChangeStatisticsCalculator(resolution_m=resolution_m)
        self.paths = get_paths()

    def run_on_masks(
        self,
        mask_t1: np.ndarray,
        mask_t2: np.ndarray,
    ) -> Dict[str, Any]:
        """Executes PCC on two precomputed 2D classification maps."""
        binary_mask = self.map_generator.generate_binary_change_mask(mask_t1, mask_t2)
        binary_rgb, transition_rgb = self.map_generator.generate_rgb_change_visualization(mask_t1, mask_t2)
        trans_results = self.matrix_analyzer.compute_matrix(mask_t1, mask_t2)
        stats_results = self.stats_calculator.compute_temporal_comparison(mask_t1, mask_t2)

        return {
            "mask_t1": mask_t1,
            "mask_t2": mask_t2,
            "binary_mask": binary_mask,
            "binary_rgb": binary_rgb,
            "transition_rgb": transition_rgb,
            "transition_analysis": trans_results,
            "area_statistics": stats_results,
        }

    def run_on_images(
        self,
        im1_path: Path,
        im2_path: Path,
    ) -> Dict[str, Any]:
        """Runs neural semantic inference on raw images followed by PCC."""
        logger.info(f"Running Post-Classification Change Detection between {im1_path} and {im2_path}")
        res_t1 = self.predictor.predict_image(im1_path)
        res_t2 = self.predictor.predict_image(im2_path)

        pcc_output = self.run_on_masks(res_t1["class_mask"], res_t2["class_mask"])
        pcc_output["t1_image_vis"] = res_t1["rgb_mask"]
        pcc_output["t2_image_vis"] = res_t2["rgb_mask"]

        # Persist change maps to outputs
        out_change_png = self.paths.maps_dir / "change_map_latest.png"
        Image.fromarray(pcc_output["transition_rgb"]).save(out_change_png)
        logger.info(f"Saved transition change map to {out_change_png}")

        return pcc_output


def main():
    setup_logging()
    parser = argparse.ArgumentParser(description="GeoEcoAI Post-Classification Change Detection CLI")
    parser.add_argument("--im1", type=str, default=None, help="T1 input image path")
    parser.add_argument("--im2", type=str, default=None, help="T2 input image path")
    args = parser.parse_args()

    detector = PostClassificationChangeDetector()
    if args.im1 and args.im2:
        results = detector.run_on_images(Path(args.im1), Path(args.im2))
        print("\n--- CHANGE DETECTION SUMMARY ---")
        print(f"Total Changed Pixels: {results['transition_analysis']['changed_pixels']}")
        print(f"Study Area Changed: {results['transition_analysis']['changed_percentage']}%")
        print("--------------------------------\n")
    else:
        logger.info("Ready for input image paths or execution through Streamlit UI.")


if __name__ == "__main__":
    main()
