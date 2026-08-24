"""
Path definitions and directory management for GeoEcoAI.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Union


@dataclass
class ProjectPaths:
    """Strongly-typed directory and file path resolver."""
    root: Path

    @property
    def config_dir(self) -> Path:
        return self.root / "config"

    @property
    def config_yaml(self) -> Path:
        return self.config_dir / "config.yaml"

    @property
    def classes_yaml(self) -> Path:
        return self.config_dir / "classes.yaml"

    @property
    def raw_data_dir(self) -> Path:
        return self.root / "data" / "raw" / "semantic_change_yang"

    @property
    def processed_data_dir(self) -> Path:
        return self.root / "data" / "processed"

    @property
    def patches_dir(self) -> Path:
        return self.root / "data" / "patches"

    @property
    def splits_dir(self) -> Path:
        return self.root / "data" / "splits"

    @property
    def outputs_dir(self) -> Path:
        return self.root / "outputs"

    @property
    def models_dir(self) -> Path:
        return self.outputs_dir / "models"

    @property
    def predictions_dir(self) -> Path:
        return self.outputs_dir / "predictions"

    @property
    def maps_dir(self) -> Path:
        return self.outputs_dir / "maps"

    @property
    def statistics_dir(self) -> Path:
        return self.outputs_dir / "statistics"

    @property
    def figures_dir(self) -> Path:
        return self.outputs_dir / "figures"

    @property
    def reports_dir(self) -> Path:
        return self.outputs_dir / "reports"

    @property
    def logs_dir(self) -> Path:
        return self.outputs_dir / "logs"

    def ensure_directories(self) -> None:
        """Ensures all essential runtime output directories exist on disk."""
        dirs = [
            self.raw_data_dir,
            self.processed_data_dir,
            self.patches_dir,
            self.splits_dir,
            self.models_dir,
            self.predictions_dir,
            self.maps_dir,
            self.statistics_dir,
            self.figures_dir,
            self.reports_dir,
            self.logs_dir,
        ]
        for d in dirs:
            d.mkdir(parents=True, exist_ok=True)


def get_paths(root_dir: Union[str, Path, None] = None) -> ProjectPaths:
    """Returns initialized ProjectPaths object based on workspace root."""
    if root_dir is None:
        root_dir = Path(__file__).resolve().parent.parent
    else:
        root_dir = Path(root_dir).resolve()
    paths = ProjectPaths(root=root_dir)
    paths.ensure_directories()
    return paths
