"""
Centralized logging for GeoEcoAI framework.
"""

import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional


def setup_logging(
    log_dir: str = "outputs/logs",
    log_level: int = logging.INFO,
    log_to_console: bool = True,
    log_to_file: bool = True,
    run_name: Optional[str] = None,
) -> logging.Logger:
    """Configures centralized root logging with file and console handlers."""
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = f"{run_name}_" if run_name else "geoecoai_"
    log_file = Path(log_dir) / f"{prefix}{timestamp}.log"

    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    logger = logging.getLogger("GeoEcoAI")
    logger.setLevel(log_level)
    logger.handlers.clear()

    if log_to_console:
        ch = logging.StreamHandler(sys.stdout)
        ch.setLevel(log_level)
        ch.setFormatter(formatter)
        logger.addHandler(ch)

    if log_to_file:
        fh = logging.FileHandler(str(log_file), encoding="utf-8")
        fh.setLevel(log_level)
        fh.setFormatter(formatter)
        logger.addHandler(fh)

    logger.propagate = False
    return logger


def get_logger(name: str = "GeoEcoAI") -> logging.Logger:
    """Retrieves or instantiates a logger with standardized formatting."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        setup_logging()
    return logger
