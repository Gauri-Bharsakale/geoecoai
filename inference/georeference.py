"""
Geospatial coordinate reference system and GeoTIFF export wrapper.
"""

from pathlib import Path
from typing import Optional, Tuple, Union
import numpy as np

from utils.logging_utils import get_logger
from utils.raster_utils import save_geotiff

logger = get_logger("GeoEcoAI.Georeference")


def export_georeferenced_classification(
    class_mask: np.ndarray,
    output_path: Union[str, Path],
    crs: str = "EPSG:3857",
    transform: Optional[Tuple] = None,
) -> Path:
    """Exports a 2D integer semantic classification mask as a standard GeoTIFF."""
    out_p = Path(output_path)
    save_geotiff(
        array=class_mask.astype(np.uint8),
        output_path=out_p,
        crs=crs,
        transform=transform,
    )
    logger.info(f"Successfully exported georeferenced GeoTIFF classification map to {out_p}")
    return out_p
