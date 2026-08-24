"""
Tests for normalization, registration, tiling, and data augmentation.
"""

import unittest
import numpy as np

from preprocessing.normalization import ImageNormalizer
from preprocessing.registration import SpatialRegistrar
from preprocessing.tiling import ImageTiler, reconstruct_from_tiles
from preprocessing.augmentation import SegmentationAugmentor


class TestPreprocessing(unittest.TestCase):
    def test_minmax_normalization(self):
        norm = ImageNormalizer(method="minmax")
        raw_img = np.random.uniform(0, 255, (64, 64, 3)).astype(np.float32)
        norm_img = norm.normalize(raw_img)
        self.assertGreaterEqual(norm_img.min(), 0.0)
        self.assertLessEqual(norm_img.max(), 1.0)

    def test_spatial_registration_check(self):
        registrar = SpatialRegistrar()
        im1 = np.zeros((64, 64, 3), dtype=np.float32)
        im2 = np.zeros((64, 64, 3), dtype=np.float32)
        res = registrar.check_alignment(im1, im2)
        self.assertTrue(res["is_dimension_aligned"])

    def test_tiling_and_reconstruction(self):
        tiler = ImageTiler(patch_size=32, stride=32)
        img = np.random.uniform(0, 1, (64, 64, 3)).astype(np.float32)
        mask = np.random.randint(0, 7, (64, 64)).astype(np.int32)

        patches, coords, mask_patches = tiler.extract_patches(img, mask)
        self.assertEqual(len(patches), 4)
        self.assertEqual(patches[0].shape, (32, 32, 3))
        self.assertEqual(len(mask_patches), 4)

        # Test reconstruction
        reconstructed = reconstruct_from_tiles(mask_patches, coords, (64, 64), num_classes=7)
        self.assertEqual(reconstructed.shape, (64, 64))
        np.testing.assert_array_equal(reconstructed, mask)

    def test_synchronous_augmentation(self):
        aug = SegmentationAugmentor(horizontal_flip=True, vertical_flip=True, random_rotate90=True)
        img = np.ones((16, 16, 3), dtype=np.float32)
        mask = np.ones((16, 16), dtype=np.int32)
        aug_img, aug_mask = aug.augment(img, mask)
        self.assertEqual(aug_img.shape, img.shape)
        self.assertEqual(aug_mask.shape, mask.shape)


if __name__ == "__main__":
    unittest.main()
