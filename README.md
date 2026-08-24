# GeoEcoAI: Deep Learning-Based Multi-Temporal Remote Sensing Framework for Dynamic Geo-Ecosystem Assessment and Management

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Dataset: SECOND](https://img.shields.io/badge/Dataset-SECOND_(Yang_et_al._2021)-green.svg)](https://opendatalab.com/OpenDataLab/SECOND)
[![Model: ResNet50-UNet](https://img.shields.io/badge/Architecture-ResNet50+UNet-orange.svg)](https://github.com/your-org/GeoEcoAI)

**GeoEcoAI** is an end-to-end deep learning framework designed for multi-temporal remote sensing semantic segmentation, Post-Classification Comparison (PCC) change detection, quantitative land-cover transition accounting, and evidence-based environmental decision support.

---

## 🌟 Key Features
- **Authoritative Dataset Grounding:** Benchmarked on the **SECOND (SEmantic Change detectiON Dataset)** by Yang et al. (*IEEE TGRS*, 2021), featuring 4,662 bi-temporal aerial optical RGB pairs ($512 \times 512$ at $0.5 - 3.0\text{ m}$ GSD).
- **Multispectral Sensor Extensibility:** Includes a modular `MultispectralInputAdapter` capable of ingesting Landsat-8/9 (11-band) or Sentinel-2 (12-band) imagery via `conv1_expansion`.
- **Hybrid Neural Backbone:** ResNet-50 hierarchical feature extractor paired with a 5-stage U-Net decoder and composite Cross-Entropy + Dice loss for robust class-imbalanced segmentation.
- **Post-Classification Comparison (PCC):** High-precision change detection decoupled from seasonal illumination and radiometric drift.
- **Transition Matrix & Quantitative Statistics:** Physical ground area accounting in hectares ($\text{ha}$) and $\text{km}^2$, along with net gain/loss metrics.
- **Environmental & Decision Support Engine:** Scientifically grounded, rule-based environmental observations and threshold-triggered policy recommendations.
- **Automated Academic PDF Reports:** Automatically compiles structured research-grade PDF/HTML dossiers with tables, metrics, and ecological summaries.
- **Interactive Streamlit Web Dashboard:** 10-module interactive application for dataset verification, model inference, change analysis, and PDF generation.

---

## 📁 Repository Structure
```text
GeoEcoAI/
├── config/                  # Global system, model, and class configurations
│   ├── config.yaml
│   └── classes.yaml
├── datasets/                # SECOND dataset indexing, labels & data loaders
│   ├── labels.py
│   └── yang_dataset.py
├── preprocessing/           # Normalization, registration, tiling & augmentations
│   ├── normalization.py
│   ├── registration.py
│   ├── tiling.py
│   ├── augmentation.py
│   └── pipeline.py
├── models/                  # ResNet-50 encoder, input adapter, U-Net & losses
│   ├── input_adapter.py
│   ├── resnet50_encoder.py
│   ├── unet_resnet50.py
│   └── losses.py
├── training/                # Training engine, callbacks & evaluation metrics
│   ├── metrics.py
│   ├── callbacks.py
│   ├── train.py
│   └── evaluate.py
├── inference/               # Single-image and tiled large-scene predictors
│   ├── predict.py
│   ├── tiled_inference.py
│   └── georeference.py
├── change_detection/        # Post-classification comparison & transition matrix
│   ├── post_classification.py
│   ├── transition_matrix.py
│   ├── change_map.py
│   └── statistics.py
├── analytics/               # Area metrics, environmental AI & decision support
│   ├── area_analysis.py
│   ├── environmental_analysis.py
│   └── decision_support.py
├── visualization/           # Categorical map rendering, charts & confusion matrices
│   ├── landcover_maps.py
│   ├── change_maps.py
│   ├── charts.py
│   ├── confusion_matrix.py
│   └── training_curves.py
├── reporting/               # Automated academic PDF report generator
│   └── pdf_generator.py
├── app/                     # 10-module interactive Streamlit application
│   └── streamlit_app.py
├── tests/                   # 18 automated unit and integration tests
│   ├── test_dataset.py
│   ├── test_preprocessing.py
│   ├── test_model.py
│   ├── test_metrics.py
│   ├── test_change_detection.py
│   ├── test_statistics.py
│   └── test_pipeline_smoke.py
├── docs/                    # Complete research, architecture & viva documentation
│   ├── dataset.md
│   ├── dataset_setup.md
│   ├── architecture.md
│   ├── methodology.md
│   ├── installation.md
│   ├── testing.md
│   ├── deployment.md
│   ├── viva_questions.md    # 30+ comprehensive Q&A
│   ├── ppt_content.md       # 15-slide deck with speaker notes
│   └── research_paper.md    # Complete draft research paper
├── outputs/                 # Artifact storage (reports, logs, change maps)
├── requirements.txt
├── pyproject.toml
└── LICENSE
```

---

## 🚀 Quickstart Guide

### 1. Installation
```bash
git clone https://github.com/your-org/GeoEcoAI.git
cd GeoEcoAI
pip install -r requirements.txt
```

### 2. Verify Dataset
```bash
python -m datasets.yang_dataset --validate
```

### 3. Run Automated Tests
```bash
python -m unittest discover -s tests -p "test_*.py"
```

### 4. Run Preprocessing Pipeline
```bash
python -m preprocessing.pipeline
```

### 5. Launch Interactive Web App
```bash
streamlit run app/streamlit_app.py
```

### 6. Generate Academic PDF Report
```bash
python -m reporting.pdf_generator --output GeoEcoAI_Research_Report.pdf
```

---

## 🏷️ Semantic Class Taxonomy (SECOND Benchmark)
| ID | Class Name | Display Name | Color (RGB) | Hex Code |
|:--:|:---|:---|:---:|:---:|
| **0** | `unchanged_background` | Background / Unchanged | `(30, 30, 30)` | `#1E1E1E` |
| **1** | `water` | Water Bodies | `(37, 99, 235)` | `#2563EB` |
| **2** | `ground` | Ground / Bare Soil | `(148, 163, 184)` | `#94A3B8` |
| **3** | `low_vegetation` | Low Vegetation / Cropland | `(34, 197, 94)` | `#22C55E` |
| **4** | `tree` | Tree / Forest Canopy | `(21, 128, 61)` | `#15803D` |
| **5** | `building` | Building / Urban Built-up | `(220, 38, 38)` | `#DC2626` |
| **6** | `playground` | Playground / Sports Turf | `(234, 179, 8)` | `#EAB308` |

---

## 📄 Citation
If you use this framework or the SECOND dataset benchmark in your research, please cite:
```bibtex
@article{yang2021asymmetric,
  title={Asymmetric Siamese Networks for Semantic Change Detection in High-Resolution Remote Sensing Images},
  author={Yang, Kunping and Xia, Gui-Song and Liu, Zicheng and Du, Bo and Yang, Wambugu and Zhang, Liangpei},
  journal={IEEE Transactions on Geoscience and Remote Sensing},
  volume={60},
  pages={1--18},
  year={2021},
  publisher={IEEE}
}
```

---

## 📜 License
Released under the [MIT License](LICENSE).
