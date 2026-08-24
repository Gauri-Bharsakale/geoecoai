"""
Tests for ResNet-50 Encoder, Input Adaptation, and ResNet-50+U-Net forward pass.
"""

import unittest
import numpy as np

from models.input_adapter import MultispectralInputAdapter
from models.resnet50_encoder import ResNet50Encoder
from models.unet_resnet50 import ResNet50UNet
from models.losses import CombinedCrossEntropyDiceLoss, DiceLoss, CategoricalCrossEntropyLoss


class TestModel(unittest.TestCase):
    def test_multispectral_adapter(self):
        adapter = MultispectralInputAdapter(strategy="conv1_expansion", input_channels=4, target_channels=3)
        dummy_4band = np.zeros((32, 32, 4), dtype=np.float32)
        adapted = adapter.adapt_input(dummy_4band)
        self.assertEqual(adapted.shape, (32, 32, 3))

    def test_resnet50_encoder_stages(self):
        encoder = ResNet50Encoder(input_channels=3)
        dummy_input = np.zeros((1, 64, 64, 3), dtype=np.float32)
        stages = encoder.extract_features(dummy_input)
        self.assertEqual(len(stages), 5)

    def test_resnet50_unet_forward(self):
        model = ResNet50UNet(num_classes=7)
        dummy_img = np.random.uniform(0, 1, (32, 32, 3)).astype(np.float32)
        probs = model.forward(dummy_img)
        self.assertEqual(probs.shape, (32, 32, 7))
        # Softmax sum across class axis should be approx 1.0
        np.testing.assert_allclose(probs.sum(axis=-1), 1.0, atol=1e-4)

        mask = model.predict_mask(dummy_img)
        self.assertEqual(mask.shape, (32, 32))
        self.assertTrue(np.all(mask >= 0) and np.all(mask < 7))

    def test_losses(self):
        loss_fn = CombinedCrossEntropyDiceLoss(ce_weight=0.5, dice_weight=0.5)
        y_true = np.random.randint(0, 7, (16, 16)).astype(np.int32)
        y_pred = np.random.uniform(0.01, 0.99, (16, 16, 7)).astype(np.float32)
        y_pred = y_pred / y_pred.sum(axis=-1, keepdims=True)

        val = loss_fn(y_true, y_pred)
        self.assertIsInstance(val, float)
        self.assertGreater(val, 0.0)


if __name__ == "__main__":
    unittest.main()
