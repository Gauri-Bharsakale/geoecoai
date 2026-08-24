# SECOND Yang et al. Dataset Setup Guide

This guide details how to acquire, extract, verify, and preprocess the **SECOND (SEmantic Change detectiON Dataset - Yang et al., IEEE TGRS 2021)** for GeoEcoAI.

---

## 1. Where to Obtain the Dataset
The SECOND dataset is openly available for academic and non-commercial research:
- **Official Paper:** *"Asymmetric Siamese Networks for Semantic Change Detection in High-Resolution Remote Sensing Images"*, Yang et al., IEEE TGRS 2021.
- **Repository / Benchmark Links:**
  - OpenDataLab: `https://opendatalab.com/OpenDataLab/SECOND`
  - Wuhan University CAP-Lab: `http://captain-whu.com/project/SCD/`
  - GitHub Project: `https://github.com/Bobholamovic/ASN`

---

## 2. Directory Structure Setup
Ensure the extracted dataset adheres to the following exact subfolder layout:

```text
GeoEcoAI/
└── data/
    └── raw/
        └── semantic_change_yang/
            ├── im1/
            │   ├── 00001.png
            │   ├── 00002.png
            │   └── ...
            ├── im2/
            │   ├── 00001.png
            │   ├── 00002.png
            │   └── ...
            ├── label1/
            │   ├── 00001.png
            │   ├── 00002.png
            │   └── ...
            └── label2/
                ├── 00001.png
                ├── 00002.png
                └── ...
```

---

## 3. Extraction Instructions
If you downloaded archive files (`SECOND_im1.zip`, `SECOND_im2.zip`, etc.):

```bash
# Navigate to project root
cd /path/to/GeoEcoAI

# Create destination directory
mkdir -p data/raw/semantic_change_yang

# Extract images and label masks
unzip SECOND_im1.zip -d data/raw/semantic_change_yang/
unzip SECOND_im2.zip -d data/raw/semantic_change_yang/
unzip SECOND_label1.zip -d data/raw/semantic_change_yang/
unzip SECOND_label2.zip -d data/raw/semantic_change_yang/
```

---

## 4. How to Verify the Dataset
Run the built-in dataset validator CLI:

```bash
python -m datasets.yang_dataset --validate
```

Expected Output:
```text
======================================================================
GEOECOAI DATASET VALIDATION REPORT
======================================================================
Dataset: SECOND - SEmantic Change detectiON Dataset (Yang et al., IEEE TGRS 2021)
Number of samples: 4662
Temporal pairs: 4662
Image dimensions: 512 x 512
Channels: 3 (RGB)
Classes: 7 (0: Background/Unchanged, 1: Water, 2: Ground, 3: Low Vegetation, 4: Tree, 5: Building, 6: Playground)
Train: 3263 pairs
Validation: 699 pairs
Test: 700 pairs
Missing files: 0
Invalid files: 0
Status: READY
======================================================================
```

---

## 5. Running the Preprocessing Pipeline
Once verified, execute the automated tiling and normalization pipeline:

```bash
python -m preprocessing.pipeline
```
This prepares $256 \times 256$ patches and stores index manifests in `data/patches/` and `data/splits/`.
