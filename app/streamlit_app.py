"""
GeoEcoAI - Multi-Temporal Remote Sensing Framework Streamlit Application.
Launch command: streamlit run app/streamlit_app.py
"""

import os
import sys
from pathlib import Path
import numpy as np
from PIL import Image

try:
    import streamlit as st
except ImportError:
    st = None

from analytics.decision_support import EcosystemDecisionSupportEngine
from analytics.environmental_analysis import RuleBasedEnvironmentalAnalyzer
from change_detection.post_classification import PostClassificationChangeDetector
from datasets.labels import CLASS_DEFINITIONS, NUM_CLASSES
from datasets.yang_dataset import SECONDYangDataset
from inference.predict import SemanticPredictor
from preprocessing.pipeline import PreprocessingPipeline
from reporting.pdf_generator import GeoEcoAIPDFReportGenerator
from utils.paths import get_paths


def main():
    if st is None:
        print("Streamlit is not installed. Install via pip install streamlit.")
        return

    st.set_page_config(
        page_title="GeoEcoAI - Remote Sensing Framework",
        page_icon="🌍",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    paths = get_paths()
    predictor = SemanticPredictor()
    detector = PostClassificationChangeDetector()
    env_analyzer = RuleBasedEnvironmentalAnalyzer()
    decision_engine = EcosystemDecisionSupportEngine()
    report_gen = GeoEcoAIPDFReportGenerator()

    st.sidebar.title("🌍 GeoEcoAI")
    st.sidebar.markdown(
        "**Deep Learning-Based Multi-Temporal Remote Sensing Framework for Dynamic Geo-Ecosystem Assessment**"
    )
    st.sidebar.markdown("---")

    menu = st.sidebar.radio(
        "Navigation",
        [
            "1. Dashboard Overview",
            "2. Dataset & Truth Verification",
            "3. Preprocessing & Alignment",
            "4. Semantic Classification (ResNet-50+U-Net)",
            "5. Change Detection (PCC)",
            "6. Transition Matrix & Area Statistics",
            "7. Visualizations & Charts",
            "8. Environmental AI Insights",
            "9. Decision Support & Policy Engine",
            "10. Automated PDF Report",
        ],
    )

    # -------------------------------------------------------------
    # 1. Dashboard Overview
    # -------------------------------------------------------------
    if menu == "1. Dashboard Overview":
        st.header("🛰️ GeoEcoAI Research Dashboard")
        st.info(
            "An end-to-end AI-powered geospatial ecosystem analysis platform using "
            "ResNet-50 + U-Net Semantic Segmentation and Post-Classification Comparison on the "
            "SEmantic Change detectiON Dataset (SECOND - Yang et al., IEEE TGRS 2021)."
        )

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Core Backbone", "ResNet-50 + U-Net", "Pretrained ImageNet")
        col2.metric("Change Detection", "Post-Classification (PCC)", "Pixel-level")
        col3.metric("Semantic Classes", "7 Classes", "SECOND Yang et al.")
        col4.metric("Nominal Resolution", "1.0 m / GSD", "0.5 - 3m Aerial")

        st.subheader("System Architecture & Workflow Pipeline")
        st.code(
            """
Remote Sensing Dataset (SECOND Yang et al.)
        ↓
Data Validation & Integrity Checks
        ↓
Preprocessing (Normalization, Registration, Tiling, Augmentation)
        ↓
ResNet-50 Encoder + Multi-scale U-Net Decoder
        ↓
Temporal Semantic Classification (T1 Map & T2 Map)
        ↓
Post-Classification Comparison (PCC)
        ↓
Binary & Semantic Change Map + Transition Matrix
        ↓
Area Statistics (Hectares, km², % Net Change)
        ↓
Rule-Based Environmental Assessment
        ↓
Configurable Decision Support Engine
        ↓
Automated Publication-Grade PDF Report
            """,
            language="text",
        )

    # -------------------------------------------------------------
    # 2. Dataset & Verification
    # -------------------------------------------------------------
    elif menu == "2. Dataset & Truth Verification":
        st.header("📋 Dataset Truth & Authoritative Verification")
        st.markdown(
            "**Verified Dataset:** SEmantic Change detectiON Dataset (SECOND) by Kunping Yang et al., IEEE TGRS 2021."
        )

        validation_result = SECONDYangDataset.validate()
        st.text_area("Validation Summary Output", validation_result["report_text"], height=300)

        st.subheader("Semantic Class Taxonomy")
        class_table = []
        for c in CLASS_DEFINITIONS:
            class_table.append({
                "Class ID": c["id"],
                "Semantic Category": c["name"],
                "Display Name": c["display_name"],
                "RGB Palette": str(c["color_rgb"]),
                "Hex Color": c["color_hex"],
            })
        st.table(class_table)

    # -------------------------------------------------------------
    # 3. Preprocessing
    # -------------------------------------------------------------
    elif menu == "3. Preprocessing & Alignment":
        st.header("⚙️ Remote Sensing Preprocessing Pipeline")
        st.markdown(
            "Includes radiometric scaling, spatial registration checking, 256x256 patch extraction, and rigid augmentations."
        )

        if st.button("Run Preprocessing Validation Routine"):
            pipeline = PreprocessingPipeline()
            result = pipeline.run()
            st.success(f"Preprocessing Pipeline Status: {result['status']}")
            st.json(result["report"])

    # -------------------------------------------------------------
    # 4. Semantic Classification
    # -------------------------------------------------------------
    elif menu == "4. Semantic Classification (ResNet-50+U-Net)":
        st.header("🧠 ResNet-50 + U-Net Semantic Classification")
        st.markdown("Upload or select remote sensing scene to generate semantic land cover predictions.")

        uploaded_file = st.file_uploader("Choose optical satellite / aerial image (PNG/TIFF)", type=["png", "jpg", "tif"])
        if uploaded_file is not None:
            img = Image.open(uploaded_file).convert("RGB")
            arr = np.array(img, dtype=np.float32)

            res = predictor.predict_image(arr)
            col1, col2 = st.columns(2)
            col1.image(img, caption="Input Remote Sensing Scene", use_container_width=True)
            col2.image(res["rgb_mask"], caption="ResNet-50 + U-Net Semantic Map", use_container_width=True)

    # -------------------------------------------------------------
    # 5. Change Detection (PCC)
    # -------------------------------------------------------------
    elif menu == "5. Change Detection (PCC)":
        st.header("🔄 Post-Classification Comparison (PCC)")
        st.markdown("Compares T1 and T2 classification maps to determine exact semantic conversions.")

        col1, col2 = st.columns(2)
        im1_file = col1.file_uploader("Upload Time 1 (T1) Image", type=["png", "jpg", "tif"], key="t1")
        im2_file = col2.file_uploader("Upload Time 2 (T2) Image", type=["png", "jpg", "tif"], key="t2")

        if im1_file and im2_file:
            im1 = np.array(Image.open(im1_file).convert("RGB"), dtype=np.float32)
            im2 = np.array(Image.open(im2_file).convert("RGB"), dtype=np.float32)

            pcc_res = detector.run_on_masks(
                predictor.predict_image(im1)["class_mask"],
                predictor.predict_image(im2)["class_mask"],
            )

            colA, colB = st.columns(2)
            colA.image(pcc_res["binary_rgb"], caption="Binary Change Map (Red = Changed)", use_container_width=True)
            colB.image(pcc_res["transition_rgb"], caption="Semantic Transition Trajectories", use_container_width=True)

    # -------------------------------------------------------------
    # 6. Transition Matrix & Statistics
    # -------------------------------------------------------------
    elif menu == "6. Transition Matrix & Area Statistics":
        st.header("📊 Transition Matrix & Area Dynamics")
        st.markdown("Quantitative measurements of unchanged vs converted land-cover areas in hectares and percentages.")

    # -------------------------------------------------------------
    # 7. Visualizations & Charts
    # -------------------------------------------------------------
    elif menu == "7. Visualizations & Charts":
        st.header("📈 Interactive Geospatial Analytics Charts")
        st.info("Visual representation of land-cover distributions, trajectories, and confusion metrics.")

    # -------------------------------------------------------------
    # 8. Environmental AI Insights
    # -------------------------------------------------------------
    elif menu == "8. Environmental AI Insights":
        st.header("🌱 Rule-Based Environmental Assessment")
        st.markdown("Calibrated, evidence-based environmental analysis of observed landscape shifts.")

    # -------------------------------------------------------------
    # 9. Decision Support & Policy Engine
    # -------------------------------------------------------------
    elif menu == "9. Decision Support & Policy Engine":
        st.header("🛡️ Ecosystem Decision Support & Actionable Alerts")
        st.markdown("Threshold-driven policy recommendations for conservation and sustainable spatial planning.")

    # -------------------------------------------------------------
    # 10. Automated PDF Report
    # -------------------------------------------------------------
    elif menu == "10. Automated PDF Report":
        st.header("📄 Automated PDF Research Report Generator")
        st.markdown("Generates and downloads a complete academic report summarizing all findings.")

        if st.button("Generate Comprehensive PDF Report"):
            pdf_path = report_gen.generate_report()
            st.success(f"Report compiled successfully to: {pdf_path}")


if __name__ == "__main__":
    main()
