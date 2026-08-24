"""
Geospatial and raster input/output utilities for remote sensing arrays.
"""

from pathlib import Path
from typing import Optional, Tuple, Union
import numpy as np


def calculate_pixel_area_ha(
    pixel_count: int,
    resolution_m: float = 1.0,
) -> float:
    """Calculates ground area in hectares (ha) given pixel count and ground sample distance (m)."""
    area_sq_m = pixel_count * (resolution_m ** 2)
    area_ha = area_sq_m / 10000.0  # 1 hectare = 10,000 sq meters
    return float(area_ha)


def calculate_pixel_area_km2(
    pixel_count: int,
    resolution_m: float = 1.0,
) -> float:
    """Calculates ground area in square kilometers (km²) given pixel count and GSD (m)."""
    area_sq_m = pixel_count * (resolution_m ** 2)
    area_km2 = area_sq_m / 1e6
    return float(area_km2)


def load_image_normalized(
    path: Union[str, Path],
    method: str = "minmax",
) -> np.ndarray:
    """Loads image from disk via PIL/OpenCV/numpy and normalizes pixel values to [0, 1]."""
    path_str = str(path)
    try:
        from PIL import Image
        img = Image.open(path_str).convert("RGB")
        arr = np.array(img, dtype=np.float32)
    except Exception:
        # Fallback to pure numpy or dummy generator if missing
        raise FileNotFoundError(f"Could not load image file from {path_str}")

    if method == "minmax":
        max_val = np.max(arr)
        if max_val > 1.0:
            arr = arr / 255.0
    elif method == "zscore":
        mean = np.mean(arr, axis=(0, 1), keepdims=True)
        std = np.std(arr, axis=(0, 1), keepdims=True) + 1e-7
        arr = (arr - mean) / std
    return arr


def save_geotiff(
    array: np.ndarray,
    output_path: Union[str, Path],
    crs: Optional[str] = "EPSG:3857",
    transform: Optional[Tuple] = None,
) -> None:
    """Saves 2D classification map or 3D image as GeoTIFF or standard PNG/TIFF."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        import rasterio
        from rasterio.transform import from_origin

        if array.ndim == 2:
            count = 1
            height, width = array.shape
            dtype = array.dtype
            bands_data = [array]
        elif array.ndim == 3:
            height, width, count = array.shape
            dtype = array.dtype
            bands_data = [array[:, :, i] for i in range(count)]
        else:
            raise ValueError(f"Unsupported array shape {array.shape} for GeoTIFF saving.")

        if transform is None:
            # Default fallback synthetic bounding transform
            transform = from_origin(0.0, 0.0, 1.0, 1.0)

        with rasterio.open(
            str(output_path),
            "w",
            driver="GTiff",
            height=height,
            width=width,
            count=count,
            dtype=dtype,
            crs=crs,
            transform=transform,
        ) as dst:
            for idx, band in enumerate(bands_data, start=1):
                dst.write(band, idx)
    except ImportError:
        # Fallback using PIL when rasterio is not available
        from PIL import Image
        if array.ndim == 2:
            img = Image.fromarray(array.astype(np.uint8))
        else:
            img = Image.fromarray((array * 255 if array.max() <= 1.0 else array).astype(np.uint8))
        img.save(str(output_path))
