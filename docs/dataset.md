# Dataset Specification & Authoritative Truth: SECOND (Yang et al., 2021)

## 1. Authoritative Dataset Identification
- **Official Dataset Name:** SECOND (SEmantic Change detectiON Dataset)
- **Original Research Paper:** *"Asymmetric Siamese Networks for Semantic Change Detection in High-Resolution Remote Sensing Images"*
- **Authors:** Kunping Yang, Gui-Song Xia, Zicheng Liu, Bo Du, Wambugu Yang, Liangpei Zhang
- **Publication Venue:** IEEE Transactions on Geoscience and Remote Sensing (IEEE TGRS), Vol. 60, pp. 1–18, 2021 / 2022.
- **Dataset Hosting / Source:** OpenDataLab / Wuhan University CAP-Lab (State Key Laboratory of Information Engineering in Surveying, Mapping and Remote Sensing).

---

## 2. Remote Sensing Imagery & Sensor Characteristics
- **Sensor Platform:** Aerial Optical Platforms (High-Resolution Airborne Digital Sensors)
- **Geographical Footprint:** Multiple major metropolitan and suburban regions across China (including Hangzhou, Chengdu, Shanghai, and Wuhan).
- **Spatial Resolution (GSD):** Very High Resolution ranging from **0.5 meters to 3.0 meters per pixel** (Nominal 1.0 m).
- **Image Dimensions:** Fixed scene patches of **$512 \times 512$ pixels**.
- **Spectral Bands:** **3 Optical Channels (Red, Green, Blue - RGB)**.
- **Image Format:** 24-bit Lossless PNG / GeoTIFF.
- **Total Bi-Temporal Image Pairs:** **4,662 bi-temporal image pairs** (9,324 individual scenes).

---

## 3. Landsat Condition & Scientific Honesty
- **Dataset Truth:** The SECOND dataset is **NOT based on Landsat-8 or Landsat-9 satellite imagery**. It consists of aerial optical RGB imagery acquired from high-altitude aircraft.
- **Methodological Extensibility:** While the primary experiments run on the actual SECOND aerial imagery, the `GeoEcoAI` software framework implements a modular **`MultispectralInputAdapter`** (`models/input_adapter.py`) capable of ingesting multispectral imagery (e.g., Landsat-8/9 OLI/TIRS 11-band or Sentinel-2 MSI 12-band products) via Conv1 weight expansion or optical spectral projection.
- **Scientific Integrity:** The research paper and documentation do not misrepresent the aerial dataset as satellite imagery.

---

## 4. Semantic Land Cover & Change Taxonomy
The SECOND dataset provides pixel-level annotations across **6 primary land-cover categories** plus an **unchanged / background** index (7 total indices):

| Class ID | Semantic Category | Description & Ecological Scope | Visual Palette (RGB) | Hex Code |
|:---:|:---|:---|:---:|:---:|
| **0** | `unchanged_background` | Unchanged areas or background pixels without primary categorization | $(30, 30, 30)$ | `#1E1E1E` |
| **1** | `water` | Rivers, lakes, reservoirs, urban canals, retention basins, and coastal water | $(37, 99, 235)$ | `#2563EB` |
| **2** | `ground` | Non-vegetated ground surface, bare soil, construction foundations, bare earth | $(148, 163, 184)$ | `#94A3B8` |
| **3** | `low_vegetation` | Agricultural cropland, grasslands, scrubland, lawns, and herbaceous canopy | $(34, 197, 94)$ | `#22C55E` |
| **4** | `tree` | Dense forest canopy, woodlands, orchard groves, and riparian tree stands | $(21, 128, 61)$ | `#15803D` |
| **5** | `building` | Residential structures, commercial blocks, industrial plants, urban built-up | $(220, 38, 38)$ | `#DC2626` |
| **6** | `playground` | Sports fields, athletic tracks, synthetic courts, and recreational stadiums | $(234, 179, 8)$ | `#EAB308` |

### Multi-Class Semantic Change Categories
The combination of from-class $(T_1)$ to to-class $(T_2)$ generates up to **30 valid non-trivial semantic change categories** (e.g., `Tree → Building` for urban deforestation, `Low Vegetation → Building` for urban encroachment, `Water → Ground` for wetland desiccation).

---

## 5. Dataset Split & Directory Hierarchy
To prevent spatial and temporal data leakage, samples are partitioned without spatial overlap:
- **Train Split (70%):** ~3,263 bi-temporal pairs
- **Validation Split (15%):** ~700 bi-temporal pairs
- **Test Split (15%):** ~699 bi-temporal pairs

### Expected Raw Directory Hierarchy
```text
data/raw/semantic_change_yang/
├── im1/          # 512x512 RGB optical images at Time 1 (T1)
│   ├── 00001.png
│   ├── 00002.png
│   └── ...
├── im2/          # 512x512 RGB optical images at Time 2 (T2)
│   ├── 00001.png
│   ├── 00002.png
│   └── ...
├── label1/       # 512x512 ground-truth semantic mask at Time 1 (values 0..6)
│   ├── 00001.png
│   └── ...
└── label2/       # 512x512 ground-truth semantic mask at Time 2 (values 0..6)
    ├── 00001.png
    └── ...
```
