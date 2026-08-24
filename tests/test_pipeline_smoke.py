"""
End-to-end smoke test validating full lifecycle from raw input to PDF report generation.
"""

import unittest
import numpy as np
from pathlib import Path

from analytics.decision_support import EcosystemDecisionSupportEngine
from analytics.environmental_analysis import RuleBasedEnvironmentalAnalyzer
from change_detection.post_classification import PostClassificationChangeDetector
from inference.predict import SemanticPredictor
from preprocessing.normalization import ImageNormalizer
from reporting.pdf_generator import GeoEcoAIPDFReportGenerator
from utils.paths import get_paths


class TestPipelineSmoke(unittest.TestCase):
    def test_full_smoke_pipeline(self):
        """Validates: Image -> Preprocessing -> Model -> PCC -> Statistics -> Environmental -> Decision -> Report."""
        paths = get_paths()

        # 1. Synthesize bi-temporal sample
        h, w = 64, 64
        t1_img = np.random.uniform(0.1, 0.9, (h, w, 3)).astype(np.float32)
        t2_img = np.random.uniform(0.1, 0.9, (h, w, 3)).astype(np.float32)

        # 2. Preprocessing
        norm = ImageNormalizer()
        t1_norm = norm.normalize(t1_img)
        t2_norm = norm.normalize(t2_img)

        # 3. Model Inference (ResNet-50 + U-Net)
        predictor = SemanticPredictor()
        res1 = predictor.predict_image(t1_norm)
        res2 = predictor.predict_image(t2_norm)

        mask1 = res1["class_mask"]
        mask2 = res2["class_mask"]

        self.assertEqual(mask1.shape, (h, w))
        self.assertEqual(mask2.shape, (h, w))

        # 4. Post-Classification Comparison
        detector = PostClassificationChangeDetector(resolution_m=1.0)
        pcc_results = detector.run_on_masks(mask1, mask2)

        self.assertIn("transition_analysis", pcc_results)
        self.assertIn("area_statistics", pcc_results)

        # 5. Environmental Analysis
        env_analyzer = RuleBasedEnvironmentalAnalyzer()
        findings = env_analyzer.generate_findings(pcc_results["area_statistics"])
        self.assertIsInstance(findings, list)

        # 6. Decision Support
        decision_engine = EcosystemDecisionSupportEngine()
        recommendations = decision_engine.generate_recommendations(
            pcc_results["area_statistics"],
            pcc_results["transition_analysis"],
        )
        self.assertIsInstance(recommendations, list)

        # 7. Automated Report
        report_gen = GeoEcoAIPDFReportGenerator()
        assessment_payload = {
            "dataset_name": "SECOND Smoke Test Pair",
            "comparison": pcc_results["area_statistics"]["comparison"],
            "environmental_findings": findings,
            "recommendations": recommendations,
        }
        report_path = report_gen.generate_report(assessment_payload, "smoke_test_report.pdf")
        self.assertTrue(report_path.parent.exists())


if __name__ == "__main__":
    unittest.main()
