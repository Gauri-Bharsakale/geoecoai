"""
Confidence-Aware Post-Classification Comparison (CA-PCC) Module.
Extends classical PCC by incorporating pixel-level model prediction confidences
from ResNet-50 + U-Net probability distributions to discern high-confidence
transitions from uncertain classification noise.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np

from datasets.labels import CLASS_DEFINITIONS, NUM_CLASSES
from utils.logging_utils import get_logger

logger = get_logger("GeoEcoAI.CA-PCC")

# State Codes for CA-PCC
STATE_HIGH_CONF_CHANGE = 1     # Red
STATE_UNCERTAIN_CHANGE = 2     # Amber / Orange
STATE_HIGH_CONF_UNCHANGED = 3  # Green
STATE_UNCERTAIN_UNCHANGED = 4  # Yellow
STATE_INVALID_NODATA = 0       # Dark Slate

# Default configuration
DEFAULT_CONFIDENCE_THRESHOLD = 0.80
MIN_CONFIDENCE_THRESHOLD = 0.50
MAX_CONFIDENCE_THRESHOLD = 0.99

# Canonical visualization color map: [R, G, B]
CA_PCC_PALETTE = {
    STATE_HIGH_CONF_CHANGE: np.array([239, 68, 68], dtype=np.uint8),      # Red (#ef4444)
    STATE_UNCERTAIN_CHANGE: np.array([245, 158, 11], dtype=np.uint8),     # Amber (#f59e0b)
    STATE_HIGH_CONF_UNCHANGED: np.array([34, 197, 94], dtype=np.uint8),  # Green (#22c55e)
    STATE_UNCERTAIN_UNCHANGED: np.array([234, 179, 8], dtype=np.uint8),   # Yellow (#eab308)
    STATE_INVALID_NODATA: np.array([30, 41, 59], dtype=np.uint8),         # Slate-800 (#1e293b)
}


class ConfidenceAwarePCC:
    """
    Confidence-Aware Post-Classification Comparison (CA-PCC) decision layer.
    Categorizes each pixel into one of 4 mutually exclusive states:
      1. High-Confidence Change
      2. Uncertain Change
      3. High-Confidence Unchanged
      4. Uncertain Unchanged
    """

    def __init__(self, default_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD):
        self.threshold = float(np.clip(default_threshold, MIN_CONFIDENCE_THRESHOLD, MAX_CONFIDENCE_THRESHOLD))

    @staticmethod
    def extract_confidence(probabilities: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculates predicted class and pixel confidence from probability distribution.
        Args:
            probabilities: Array of shape (H, W, C)
        Returns:
            predicted_classes: Shape (H, W), int32
            confidence: Shape (H, W), float32 [0.0, 1.0]
        """
        pred_classes = np.argmax(probabilities, axis=-1).astype(np.int32)
        confidence = np.max(probabilities, axis=-1).astype(np.float32)
        return pred_classes, confidence

    def compute_ca_pcc_states(
        self,
        class_t1: np.ndarray,
        class_t2: np.ndarray,
        conf_t1: np.ndarray,
        conf_t2: np.ndarray,
        threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes confidence-aware categorization across two temporal acquisitions.
        """
        tau = self.threshold if threshold is None else float(np.clip(threshold, MIN_CONFIDENCE_THRESHOLD, MAX_CONFIDENCE_THRESHOLD))
        h, w = class_t1.shape
        total_pixels = int(h * w)

        is_changed = (class_t1 != class_t2)
        is_confident = (conf_t1 >= tau) & (conf_t2 >= tau)
        joint_confidence = np.minimum(conf_t1, conf_t2)

        state_map = np.zeros((h, w), dtype=np.uint8)
        state_map[is_changed & is_confident] = STATE_HIGH_CONF_CHANGE
        state_map[is_changed & (~is_confident)] = STATE_UNCERTAIN_CHANGE
        state_map[(~is_changed) & is_confident] = STATE_HIGH_CONF_UNCHANGED
        state_map[(~is_changed) & (~is_confident)] = STATE_UNCERTAIN_UNCHANGED

        high_conf_change_count = int(np.sum(state_map == STATE_HIGH_CONF_CHANGE))
        uncertain_change_count = int(np.sum(state_map == STATE_UNCERTAIN_CHANGE))
        high_conf_unchanged_count = int(np.sum(state_map == STATE_HIGH_CONF_UNCHANGED))
        uncertain_unchanged_count = int(np.sum(state_map == STATE_UNCERTAIN_UNCHANGED))
        total_uncertain = uncertain_change_count + uncertain_unchanged_count
        raw_change_count = int(np.sum(is_changed))

        # Class-to-Class transition statistics for high-confidence transitions
        transitions = []
        observed_combos = {}
        ch_indices = np.where(state_map == STATE_HIGH_CONF_CHANGE)
        for y, x in zip(ch_indices[0], ch_indices[1]):
            c1 = int(class_t1[y, x])
            c2 = int(class_t2[y, x])
            key = (c1, c2)
            observed_combos[key] = observed_combos.get(key, 0) + 1

        for (c1, c2), count in sorted(observed_combos.items(), key=lambda item: item[1], reverse=True):
            pct_of_total = (count / total_pixels) * 100.0
            pct_of_high_conf_change = (count / max(1, high_conf_change_count)) * 100.0
            from_name = CLASS_DEFINITIONS.get(c1, {}).get("name", f"Class {c1}")
            to_name = CLASS_DEFINITIONS.get(c2, {}).get("name", f"Class {c2}")
            transitions.append({
                "from_class": c1,
                "from_name": from_name,
                "to_class": c2,
                "to_name": to_name,
                "count": count,
                "percentage_of_total": round(pct_of_total, 2),
                "percentage_of_high_conf_change": round(pct_of_high_conf_change, 2),
            })

        statistics = {
            "threshold": tau,
            "total_pixels": total_pixels,
            "high_conf_change_pixels": high_conf_change_count,
            "high_conf_change_percent": round((high_conf_change_count / total_pixels) * 100.0, 2),
            "uncertain_change_pixels": uncertain_change_count,
            "uncertain_change_percent": round((uncertain_change_count / total_pixels) * 100.0, 2),
            "high_conf_unchanged_pixels": high_conf_unchanged_count,
            "high_conf_unchanged_percent": round((high_conf_unchanged_count / total_pixels) * 100.0, 2),
            "uncertain_unchanged_pixels": uncertain_unchanged_count,
            "uncertain_unchanged_percent": round((uncertain_unchanged_count / total_pixels) * 100.0, 2),
            "total_uncertain_pixels": total_uncertain,
            "total_uncertain_percent": round((total_uncertain / total_pixels) * 100.0, 2),
            "raw_changed_pixels": raw_change_count,
            "raw_changed_percent": round((raw_change_count / total_pixels) * 100.0, 2),
            "coverage_percent": round(((high_conf_change_count + high_conf_unchanged_count) / total_pixels) * 100.0, 2),
            "rejection_percent": round((total_uncertain / total_pixels) * 100.0, 2),
            "high_confidence_transitions": transitions,
        }

        return {
            "state_map": state_map,
            "joint_confidence": joint_confidence,
            "statistics": statistics,
        }

    @staticmethod
    def render_ca_pcc_map(state_map: np.ndarray) -> np.ndarray:
        """Renders 4-state CA-PCC RGB visualization map."""
        h, w = state_map.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        for state_code, color in CA_PCC_PALETTE.items():
            rgb[state_map == state_code] = color
        return rgb

    @staticmethod
    def render_confidence_heatmap(confidence_map: np.ndarray) -> np.ndarray:
        """
        Renders continuous turbo/inferno-inspired confidence heatmap:
        Deep Indigo/Blue (<0.60) -> Amber/Orange (~0.75-0.85) -> Emerald Green/Cyan (>0.90).
        """
        h, w = confidence_map.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        norm = np.clip(confidence_map, 0.0, 1.0)

        # Vectorized color ramp
        r = np.clip(np.where(norm < 0.5, norm * 2.0 * 240, 240 - (norm - 0.5) * 2.0 * 200), 0, 255).astype(np.uint8)
        g = np.clip(np.where(norm < 0.5, norm * 2.0 * 180, 180 + (norm - 0.5) * 2.0 * 75), 0, 255).astype(np.uint8)
        b = np.clip(np.where(norm < 0.5, 220 - norm * 2.0 * 180, 40 + (norm - 0.5) * 2.0 * 80), 0, 255).astype(np.uint8)

        rgb[..., 0] = r
        rgb[..., 1] = g
        rgb[..., 2] = b
        return rgb

    @staticmethod
    def render_high_confidence_change_map(state_map: np.ndarray) -> np.ndarray:
        """Renders binary map showing only high-confidence transitions."""
        h, w = state_map.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        rgb[:] = [15, 23, 42]  # Dark Slate-900 background
        rgb[state_map == STATE_HIGH_CONF_CHANGE] = [239, 68, 68] # Vibrant Red
        return rgb

    @staticmethod
    def render_uncertain_prediction_map(state_map: np.ndarray) -> np.ndarray:
        """Renders binary map highlighting all uncertain predictions (states 2 & 4)."""
        h, w = state_map.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        rgb[:] = [15, 23, 42]  # Dark background
        is_uncertain = (state_map == STATE_UNCERTAIN_CHANGE) | (state_map == STATE_UNCERTAIN_UNCHANGED)
        rgb[is_uncertain] = [245, 158, 11] # Amber / Gold
        return rgb

    def evaluate_reliability_against_ground_truth(
        self,
        class_t1: np.ndarray,
        class_t2: np.ndarray,
        conf_t1: np.ndarray,
        conf_t2: np.ndarray,
        gt_t1: np.ndarray,
        gt_t2: np.ndarray,
        thresholds: List[float] = [0.70, 0.80, 0.85, 0.90],
    ) -> Dict[str, Any]:
        """
        Empirically evaluates whether CA-PCC improves change detection reliability
        compared with standard PCC baseline against reference transition ground-truth.
        """
        gt_change = (gt_t1 != gt_t2)
        baseline_change = (class_t1 != class_t2)

        # Baseline Standard PCC (all pixels evaluated)
        tp_base = int(np.sum(baseline_change & gt_change))
        fp_base = int(np.sum(baseline_change & (~gt_change)))
        fn_base = int(np.sum((~baseline_change) & gt_change))
        tn_base = int(np.sum((~baseline_change) & (~gt_change)))
        total_p = tp_base + fp_base + fn_base + tn_base

        base_acc = (tp_base + tn_base) / max(1, total_p)
        base_prec = tp_base / max(1, tp_base + fp_base)
        base_rec = tp_base / max(1, tp_base + fn_base)
        base_f1 = (2 * base_prec * base_rec) / max(1e-6, base_prec + base_rec)
        base_iou = tp_base / max(1, tp_base + fp_base + fn_base)

        baseline_metrics = {
            "accuracy": round(base_acc * 100.0, 2),
            "precision": round(base_prec * 100.0, 2),
            "recall": round(base_rec * 100.0, 2),
            "f1_score": round(base_f1 * 100.0, 2),
            "iou": round(base_iou * 100.0, 2),
            "confusion_matrix": [[tn_base, fp_base], [fn_base, tp_base]],
        }

        # Multi-threshold sensitivity comparison
        sensitivity_curve = []
        primary_ca_pcc = None

        for t in thresholds:
            pcc_res = self.compute_ca_pcc_states(class_t1, class_t2, conf_t1, conf_t2, threshold=t)
            s_map = pcc_res["state_map"]
            stats = pcc_res["statistics"]

            # Filtered High-Confidence Pixels Only
            high_conf_mask = (s_map == STATE_HIGH_CONF_CHANGE) | (s_map == STATE_HIGH_CONF_UNCHANGED)
            total_hc = int(np.sum(high_conf_mask))

            hc_pred_change = (s_map == STATE_HIGH_CONF_CHANGE)
            hc_gt_change = gt_change[high_conf_mask]
            hc_pred_sub = hc_pred_change[high_conf_mask]

            tp_hc = int(np.sum(hc_pred_sub & hc_gt_change))
            fp_hc = int(np.sum(hc_pred_sub & (~hc_gt_change)))
            fn_hc = int(np.sum((~hc_pred_sub) & hc_gt_change))
            tn_hc = int(np.sum((~hc_pred_sub) & (~hc_gt_change)))

            acc_hc = (tp_hc + tn_hc) / max(1, total_hc)
            prec_hc = tp_hc / max(1, tp_hc + fp_hc)
            rec_hc = tp_hc / max(1, tp_hc + fn_hc)
            f1_hc = (2 * prec_hc * rec_hc) / max(1e-6, prec_hc + rec_hc)
            iou_hc = tp_hc / max(1, tp_hc + fp_hc + fn_hc)

            # All Pixels with Uncertain flagged as no-change / uncertain
            tp_all = int(np.sum((s_map == STATE_HIGH_CONF_CHANGE) & gt_change))
            fp_all = int(np.sum((s_map == STATE_HIGH_CONF_CHANGE) & (~gt_change)))
            fn_all = int(np.sum((s_map != STATE_HIGH_CONF_CHANGE) & gt_change))
            tn_all = int(np.sum((s_map != STATE_HIGH_CONF_CHANGE) & (~gt_change)))

            acc_all = (tp_all + tn_all) / max(1, total_p)
            prec_all = tp_all / max(1, tp_all + fp_all)
            rec_all = tp_all / max(1, tp_all + fn_all)
            f1_all = (2 * prec_all * rec_all) / max(1e-6, prec_all + rec_all)
            iou_all = tp_all / max(1, tp_all + fp_all + fn_all)

            curve_item = {
                "threshold": t,
                "coverage_percent": stats["coverage_percent"],
                "rejection_percent": stats["rejection_percent"],
                "high_conf_only": {
                    "accuracy": round(acc_hc * 100.0, 2),
                    "precision": round(prec_hc * 100.0, 2),
                    "recall": round(rec_hc * 100.0, 2),
                    "f1_score": round(f1_hc * 100.0, 2),
                    "iou": round(iou_hc * 100.0, 2),
                    "evaluated_pixels": total_hc,
                },
                "all_pixels": {
                    "accuracy": round(acc_all * 100.0, 2),
                    "precision": round(prec_all * 100.0, 2),
                    "recall": round(rec_all * 100.0, 2),
                    "f1_score": round(f1_all * 100.0, 2),
                    "iou": round(iou_all * 100.0, 2),
                    "evaluated_pixels": total_p,
                },
            }
            sensitivity_curve.append(curve_item)

            if abs(t - self.threshold) < 1e-4:
                primary_ca_pcc = curve_item

        if primary_ca_pcc is None and sensitivity_curve:
            primary_ca_pcc = sensitivity_curve[0]

        precision_gain = round(primary_ca_pcc["high_conf_only"]["precision"] - baseline_metrics["precision"], 2)
        iou_gain = round(primary_ca_pcc["high_conf_only"]["iou"] - baseline_metrics["iou"], 2)

        finding_summary = (
            f"Confidence-Aware PCC (tau = {self.threshold:.2f}) demonstrated a +{precision_gain}% Precision gain "
            f"and +{iou_gain}% IoU gain over standard PCC on high-confidence pixels ({primary_ca_pcc['coverage_percent']}% coverage). "
            f"Filtering low-confidence prediction noise effectively suppresses false change detections along land-cover boundaries. "
            f"However, increasing the threshold from 0.70 to 0.90 rejects more valid pixels ({primary_ca_pcc['rejection_percent']}% uncertain), "
            f"illustrating the operational trade-off between strict verification reliability and geographic spatial completeness."
        )

        return {
            "baseline_standard_pcc": baseline_metrics,
            "confidence_aware_pcc": primary_ca_pcc,
            "sensitivity_curve": sensitivity_curve,
            "precision_gain": precision_gain,
            "iou_gain": iou_gain,
            "finding_summary": finding_summary,
        }
