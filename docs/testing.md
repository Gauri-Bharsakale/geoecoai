# GeoEcoAI Test Suite & Quality Assurance Guide

## 1. Overview
The GeoEcoAI test suite validates all critical pipeline stages:
- Dataset indexation and colormap encoding (`test_dataset.py`)
- Normalization, registration, patch tiling, and augmentation (`test_preprocessing.py`)
- ResNet-50 encoder, input adaptation, U-Net forward pass, and losses (`test_model.py`)
- Metric calculation including IoU, Dice, Precision, and Recall (`test_metrics.py`)
- Post-Classification Comparison and transition matrix logic (`test_change_detection.py`)
- Area accounting in hectares/$\text{km}^2$ and net shift calculations (`test_statistics.py`)
- End-to-end smoke test through PDF report generation (`test_pipeline_smoke.py`)

---

## 2. Running All Tests
To run all tests using Python's built-in `unittest` runner:

```bash
python -m unittest discover -s tests -p "test_*.py" -v
```

Or using `pytest`:
```bash
pytest tests/ -v
```

---

## 3. Running Specific Subsystem Tests
```bash
# Test dataset loading and label maps
python -m unittest tests/test_dataset.py

# Test ResNet-50 + U-Net architecture & losses
python -m unittest tests/test_model.py

# Test Post-Classification Comparison (PCC)
python -m unittest tests/test_change_detection.py

# Run full end-to-end smoke test
python -m unittest tests/test_pipeline_smoke.py
```
