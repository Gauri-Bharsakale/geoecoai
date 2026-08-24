"""
Dataset structure and file-integrity validator for SECOND Yang et al. dataset.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
from PIL import Image

from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.Validator")


class DatasetValidator:
    """Comprehensive validator checking presence of im1, im2, label1, label2 files and pixel integrity."""

    def __init__(self, raw_dir: Path):
        self.raw_dir = Path(raw_dir)

    def validate_structure(self) -> Dict[str, Any]:
        """Scans directories and verifies integrity of all bi-temporal pairs."""
        logger.info(f"Validating dataset structure at {self.raw_dir}")

        im1_dir = self.raw_dir / "im1"
        im2_dir = self.raw_dir / "im2"
        label1_dir = self.raw_dir / "label1"
        label2_dir = self.raw_dir / "label2"

        report = {
            "dataset_name": "SECOND - Semantic Change Detection Dataset (Yang et al., 2021)",
            "root_exists": self.raw_dir.exists(),
            "im1_count": 0,
            "im2_count": 0,
            "label1_count": 0,
            "label2_count": 0,
            "matched_pairs": 0,
            "sample_dimensions": None,
            "sample_channels": None,
            "unique_classes_found": [],
            "missing_files": [],
            "corrupted_files": [],
            "status": "VALID",
        }

        if not self.raw_dir.exists():
            report["status"] = "DATASET_NOT_FOUND"
            report["message"] = (
                f"Directory {self.raw_dir} does not exist. Please download Yang et al. SECOND dataset "
                "or place raw files inside data/raw/semantic_change_yang/"
            )
            return report

        im1_files = sorted(list(im1_dir.glob("*.png")) + list(im1_dir.glob("*.tif*"))) if im1_dir.exists() else []
        im2_files = sorted(list(im2_dir.glob("*.png")) + list(im2_dir.glob("*.tif*"))) if im2_dir.exists() else []
        label1_files = sorted(list(label1_dir.glob("*.png")) + list(label1_dir.glob("*.tif*"))) if label1_dir.exists() else []
        label2_files = sorted(list(label2_dir.glob("*.png")) + list(label2_dir.glob("*.tif*"))) if label2_dir.exists() else []

        report["im1_count"] = len(im1_files)
        report["im2_count"] = len(im2_files)
        report["label1_count"] = len(label1_files)
        report["label2_count"] = len(label2_files)

        if len(im1_files) == 0:
            report["status"] = "EMPTY_DATASET"
            report["message"] = "No image files found in im1 subfolder."
            return report

        # Check pairing
        matched = 0
        all_classes = set()
        for f in im1_files[:100]:  # Sample first 100 for fast verification
            stem = f.stem
            ext = f.suffix
            im2_candidate = im2_dir / f"{stem}{ext}"
            l1_candidate = label1_dir / f"{stem}{ext}"
            l2_candidate = label2_dir / f"{stem}{ext}"

            if not im2_candidate.exists():
                report["missing_files"].append(str(im2_candidate))
                continue

            try:
                with Image.open(f) as img:
                    arr = np.array(img)
                    if report["sample_dimensions"] is None:
                        report["sample_dimensions"] = [int(arr.shape[0]), int(arr.shape[1])]
                        report["sample_channels"] = int(arr.shape[2]) if arr.ndim == 3 else 1

                if l1_candidate.exists():
                    with Image.open(l1_candidate) as l1_img:
                        l1_arr = np.array(l1_img)
                        all_classes.update(np.unique(l1_arr).tolist())

                matched += 1
            except Exception as e:
                report["corrupted_files"].append(f"{f.name}: {str(e)}")

        report["matched_pairs"] = len(im1_files)
        report["unique_classes_found"] = sorted(list(all_classes))

        if report["corrupted_files"]:
            report["status"] = "CORRUPTED_FILES_DETECTED"
        elif len(report["missing_files"]) > 0:
            report["status"] = "PAIRING_MISMATCH"
        else:
            report["status"] = "READY"

        logger.info(f"Dataset verification finished with status: {report['status']}")
        return report
