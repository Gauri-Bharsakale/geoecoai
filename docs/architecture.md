# GeoEcoAI: Deep Learning System Architecture

## 1. High-Level Architectural Flow

```text
                        USER / ANALYST
                              │
                              ▼
                ┌───────────────────────────┐
                │   Streamlit / Web UI      │
                │ (Interactive Dashboards)  │
                └─────────────┬─────────────┘
                              │
                              ▼
                ┌───────────────────────────┐
                │     Application Layer     │
                │ (CLI & Async Controller)  │
                └─────────────┬─────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   Preprocessing         ML Pipeline        Change Detection
  (Normalization,       (ResNet-50 Encoder, (Post-Classification
  Tiling, Augment)       U-Net Decoder)      Comparison & Matrix)
         │                    │                    │
         ▼                    ▼                    ▼
   SECOND Dataset       Semantic Maps       Transition Analysis
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    Geospatial Analytics
                 (Area in ha/km², Net Shifts)
                              │
                              ▼
                    Visualization Engine
               (Discrete Color Maps & Heatmaps)
                              │
                              ▼
                    Environmental AI
               (Evidence-based Observations)
                              │
                              ▼
                    Decision Support
              (Threshold-driven Alert Rules)
                              │
                              ▼
                    PDF Research Report
```

---

## 2. ResNet-50 + U-Net Semantic Segmentation Backbone

The core deep learning network adopts a **ResNet-50 Feature Extractor Encoder** paired with a **Multi-Scale U-Net Decoder**:

```text
Input Scene (H x W x C)
       │
       ▼
[Multispectral Input Adapter]  ─── (Conv1 expansion or 3-channel projection)
       │
       ▼
[ResNet-50 Stage 1 (Stem)]     ─── (H/4, W/4, 64)   ──────┐ Skip 1
       │                                                   │
       ▼                                                   │
[ResNet-50 Stage 2 (Layer 1)]   ─── (H/4, W/4, 256)  ─────┼──┐ Skip 2
       │                                                   │  │
       ▼                                                   │  │
[ResNet-50 Stage 3 (Layer 2)]   ─── (H/8, W/8, 512)  ─────┼──┼──┐ Skip 3
       │                                                   │  │  │
       ▼                                                   │  │  │
[ResNet-50 Stage 4 (Layer 3)]   ─── (H/16, W/16, 1024) ───┼──┼──┼──┐ Skip 4
       │                                                   │  │  │  │
       ▼                                                   │  │  │  │
[ResNet-50 Stage 5 (Bottleneck)]─── (H/32, W/32, 2048)     │  │  │  │
       │                                                   │  │  │  │
       ▼                                                   │  │  │  │
[Decoder Block 1 (Upsample)]    <──────────────────────────┼──┼──┼──┘
       │ (H/16, W/16, 256)                                 │  │  │
       ▼                                                   │  │  │
[Decoder Block 2 (Upsample)]    <──────────────────────────┼──┼──┘
       │ (H/8, W/8, 128)                                   │  │
       ▼                                                   │  │
[Decoder Block 3 (Upsample)]    <──────────────────────────┼──┘
       │ (H/4, W/4, 64)                                    │
       ▼                                                   │
[Decoder Block 4 (Upsample)]    <──────────────────────────┘
       │ (H/2, W/2, 32)
       ▼
[Decoder Block 5 (Upsample)]    ─── (H, W, 16)
       │
       ▼
[1x1 Conv Segmentation Head]    ─── (H, W, 7) Softmax Class Probabilities
       │
       ▼
[Argmax Classifier]             ─── (H, W) Discrete Semantic Map (Classes 0..6)
```

---

## 3. Loss Function Formulation
To counter extreme class imbalance across dominant background and minority classes (such as water or sports playgrounds), the network optimizes a composite loss:

$$\mathcal{L}_{\text{total}} = \alpha \cdot \mathcal{L}_{\text{CE}} + \beta \cdot \mathcal{L}_{\text{Dice}}$$

Where:
- $\mathcal{L}_{\text{CE}} = - \frac{1}{N} \sum_{i=1}^N \sum_{c=1}^C y_{i,c} \log(\hat{y}_{i,c})$
- $\mathcal{L}_{\text{Dice}} = 1 - \frac{1}{C} \sum_{c=1}^C \frac{2 \sum_i y_{i,c} \hat{y}_{i,c} + \epsilon}{\sum_i y_{i,c} + \sum_i \hat{y}_{i,c} + \epsilon}$
- By default, $\alpha = 0.5$, $\beta = 0.5$, and $\epsilon = 1.0$.

---

## 4. Post-Classification Comparison (PCC) Engine
Change detection is performed through pixel-wise categorical cross-tabulation:

$$C(x, y) = \begin{cases} \text{Unchanged (Persistence)}, & \text{if } M_{T_1}(x, y) = M_{T_2}(x, y) \\ M_{T_1}(x, y) \to M_{T_2}(x, y), & \text{if } M_{T_1}(x, y) \neq M_{T_2}(x, y) \end{cases}$$

Transition trajectories are recorded in an $N \times N$ transition matrix $\mathbf{T}$, where cell $T_{i, j}$ represents the count of pixels converted from class $i$ to class $j$.
