"""
Deep Learning Model Architectures for Semantic Remote Sensing Segmentation.
ResNet-50 Encoder + U-Net Decoder with Multispectral Input Adaptation.
"""

from .input_adapter import MultispectralInputAdapter
from .resnet50_encoder import ResNet50Encoder
from .unet_resnet50 import ResNet50UNet
from .losses import (
    CombinedCrossEntropyDiceLoss,
    DiceLoss,
    FocalLoss,
    CategoricalCrossEntropyLoss,
    compute_dice_coefficient,
    compute_mean_iou,
)

__all__ = [
    "MultispectralInputAdapter",
    "ResNet50Encoder",
    "ResNet50UNet",
    "CombinedCrossEntropyDiceLoss",
    "DiceLoss",
    "FocalLoss",
    "CategoricalCrossEntropyLoss",
    "compute_dice_coefficient",
    "compute_mean_iou",
]
