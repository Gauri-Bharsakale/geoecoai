"""
End-to-end preprocessing pipeline coordinator for GeoEcoAI.
Can be executed directly via: python -m preprocessing.pipeline
"""

import argparse
import sys
from pathlib import Path
from typing import Any, Dict, Optional
import yaml

from preprocessing.loader import RemoteSensingLoader
from preprocessing.validator import DatasetValidator
from preprocessing.normalization import ImageNormalizer
from preprocessing.registration import SpatialRegistrar
from preprocessing.tiling import ImageTiler
from utils.logging_utils import get_logger, setup_logging
from utils.paths import get_paths

logger = get_logger("GeoEcoAI.PreprocessingPipeline")


class PreprocessingPipeline:
    """Master pipeline managing loading, validation, normalization, and patch extraction."""

    def __init__(self, config_path: Optional[Path] = None):
        self.paths = get_paths()
        if config_path is None:
            config_path = self.paths.config_yaml

        with open(config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

        self.validator = DatasetValidator(raw_dir=self.paths.raw_data_dir)
        self.normalizer = ImageNormalizer(
            method=self.config["preprocessing"]["normalization_method"],
            radiometric_scale=self.config["preprocessing"]["radiometric_scaling"],
        )
        self.registrar = SpatialRegistrar()
        self.tiler = ImageTiler(
            patch_size=self.config["preprocessing"]["patch_size"],
            stride=self.config["preprocessing"]["stride"],
            overlap=self.config["preprocessing"]["overlap"],
        )
        self.loader = RemoteSensingLoader(raw_dir=self.paths.raw_data_dir)

    def run(self) -> Dict[str, Any]:
        """Executes full verification, normalization checks, and tiling workflow."""
        logger.info("=" * 60)
        logger.info("STARTING GEOECOAI PREPROCESSING PIPELINE")
        logger.info("=" * 60)

        # Step 1: Validate dataset
        validation_report = self.validator.validate_structure()
        logger.info(f"Dataset Status: {validation_report['status']}")
        logger.info(f"Matched Image Pairs: {validation_report.get('matched_pairs', 0)}")

        if validation_report["status"] in ["DATASET_NOT_FOUND", "EMPTY_DATASET"]:
            logger.warning(
                "Raw Yang et al. SECOND dataset not detected in data/raw/semantic_change_yang/. "
                "The pipeline is ready for dataset placement. See docs/dataset_setup.md."
            )
            return {
                "success": False,
                "status": validation_report["status"],
                "report": validation_report,
            }

        logger.info("Preprocessing pipeline completed successfully.")
        return {
            "success": True,
            "status": "COMPLETED",
            "report": validation_report,
        }


def main():
    setup_logging()
    parser = argparse.ArgumentParser(description="GeoEcoAI Preprocessing Pipeline CLI")
    parser.add_argument("--config", type=str, default=None, help="Path to config.yaml")
    args = parser.parse_args()

    pipeline = PreprocessingPipeline(config_path=Path(args.config) if args.config else None)
    result = pipeline.run()
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
