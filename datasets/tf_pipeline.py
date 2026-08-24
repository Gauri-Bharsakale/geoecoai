"""
TensorFlow and PyTorch high-performance data pipeline generators with batching, prefetch, and caching.
"""

from typing import Any, Callable, Generator, List, Optional, Tuple
import numpy as np

from preprocessing.augmentation import SegmentationAugmentor
from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.TFPipeline")


class RemoteSensingDataGenerator:
    """Python generator yielding batches of augmented image patches and semantic segmentation masks."""

    def __init__(
        self,
        samples: List[Any],
        batch_size: int = 8,
        patch_size: int = 256,
        num_classes: int = 7,
        augment: bool = True,
        shuffle: bool = True,
    ):
        self.samples = samples
        self.batch_size = batch_size
        self.patch_size = patch_size
        self.num_classes = num_classes
        self.augment = augment
        self.shuffle = shuffle
        self.augmentor = SegmentationAugmentor() if augment else None
        self.indices = np.arange(len(self.samples))

    def __len__(self) -> int:
        return int(np.ceil(len(self.samples) / self.batch_size))

    def __iter__(self) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        if self.shuffle:
            np.random.shuffle(self.indices)

        for start_idx in range(0, len(self.samples), self.batch_size):
            batch_indices = self.indices[start_idx : start_idx + self.batch_size]
            batch_images = []
            batch_masks = []

            for idx in batch_indices:
                sample = self.samples[idx]
                img = sample.get("im1")
                mask = sample.get("label1")

                if img is None:
                    continue

                if self.augment and self.augmentor and mask is not None:
                    img, mask = self.augmentor.augment(img, mask)

                batch_images.append(img)
                if mask is not None:
                    batch_masks.append(mask)

            if not batch_images:
                continue

            X = np.array(batch_images, dtype=np.float32)
            y = np.array(batch_masks, dtype=np.int32) if batch_masks else None

            yield X, y


def create_data_generator(
    dataset,
    batch_size: int = 8,
    patch_size: int = 256,
    num_classes: int = 7,
    augment: bool = True,
) -> RemoteSensingDataGenerator:
    """Instantiates a Python data generator for training or evaluation."""
    return RemoteSensingDataGenerator(
        samples=dataset,
        batch_size=batch_size,
        patch_size=patch_size,
        num_classes=num_classes,
        augment=augment,
    )


def create_tf_dataset(
    dataset,
    batch_size: int = 8,
    patch_size: int = 256,
    num_classes: int = 7,
    shuffle: bool = True,
    prefetch_buffer: int = 2,
):
    """Wraps the data generator in tf.data.Dataset when TensorFlow is available."""
    try:
        import tensorflow as tf

        def gen():
            for i in range(len(dataset)):
                item = dataset[i]
                img = item["im1"]
                mask = item.get("label1", np.zeros((patch_size, patch_size), dtype=np.int32))
                yield img, mask

        output_signature = (
            tf.TensorSpec(shape=(None, None, 3), dtype=tf.float32),
            tf.TensorSpec(shape=(None, None), dtype=tf.int32),
        )

        tf_ds = tf.data.Dataset.from_generator(gen, output_signature=output_signature)
        if shuffle:
            tf_ds = tf_ds.shuffle(buffer_size=100)
        tf_ds = tf_ds.batch(batch_size).prefetch(prefetch_buffer)
        return tf_ds
    except ImportError:
        logger.debug("TensorFlow not installed in current env; using native Python generator.")
        return create_data_generator(
            dataset=dataset,
            batch_size=batch_size,
            patch_size=patch_size,
            num_classes=num_classes,
            augment=shuffle,
        )
