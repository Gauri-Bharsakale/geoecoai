# GeoEcoAI: Research Methodology

## 1. Research Objectives
1. **Semantic Land Cover Segmentation:** Accurate pixel-level semantic classification of multi-temporal aerial remote sensing scenes into 7 distinct categories.
2. **Post-Classification Comparison (PCC):** High-precision bi-temporal change detection decoupled from atmospheric and illumination variance across acquisition dates.
3. **Quantitative Transition Matrix Analysis:** Measurement of gross conversion dynamics, net area changes (hectares, $\text{km}^2$), and persistence rates.
4. **Evidence-Based Environmental Assessment:** Generation of objective ecological insights detailing deforestation, urban expansion, and water loss.
5. **Configurable Decision Support:** Threshold-driven policy recommendations for spatial zoning and environmental protection.
6. **Automated Academic Reporting:** Automated compilation of research-grade PDF/HTML evaluation dossiers.

---

## 2. Dataset Pipeline & Integrity
The framework operates on the **SECOND (SEmantic Change detectiON Dataset)** published by Yang et al. (IEEE TGRS 2021):
- **Raw Spatial Grid:** $512 \times 512$ RGB pixels at $0.5 - 3.0\text{ m}$ spatial resolution.
- **Data Preprocessing:**
  - Standard Min-Max / ImageNet channel normalization.
  - Subpixel spatial registration checks to guarantee geometric alignment.
  - Slicing into $256 \times 256$ tiles with configurable stride and boundary padding.
  - D4 dihedral group data augmentations (random horizontal/vertical flips and $90^\circ$ orthogonal rotations).

---

## 3. Deep Learning Classification Framework
- **Encoder Backbone:** ResNet-50 initialized with ImageNet pretraining, extracting multi-scale feature hierarchies across 5 spatial stages ($64, 256, 512, 1024, 2048$ feature channels).
- **Decoder Architecture:** 5-stage U-Net decoder utilizing transpose convolutions/bilinear upsampling and skip connection feature concatenation.
- **Optimization Strategy:** Adam optimizer ($\text{lr}=10^{-4}$, weight decay $10^{-4}$) minimizing combined Cross-Entropy and Dice Loss.
- **Dynamic Learning Rate:** `ReduceLROnPlateau` reducing learning rate by $0.5\times$ when validation loss plateaus for 5 epochs.

---

## 4. Post-Classification Comparison (PCC) Formulation
Let $M_1 \in \{0, \dots, 6\}^{H \times W}$ and $M_2 \in \{0, \dots, 6\}^{H \times W}$ represent the predicted semantic classification maps at Time $T_1$ and $T_2$ respectively.
- **Binary Change Indicator:** $B(x, y) = \mathbb{I}(M_1(x, y) \neq M_2(x, y))$
- **Transition Trajectory Encoding:** $E(x, y) = M_1(x, y) \times 7 + M_2(x, y)$
- **Area Calculation:** For Ground Sample Distance $GSD$ in meters, class area is computed as:
  $$\text{Area}_{\text{ha}}(c) = \frac{\sum_{x, y} \mathbb{I}(M(x, y) = c) \cdot GSD^2}{10\,000}$$

---

## 5. Environmental & Decision Support Engine
The framework translates computed transition statistics into categorized findings based on strict thresholds in `config/config.yaml`:
- **Forest Loss Alert:** Triggered when forest reduction exceeds warning threshold ($5\%$) or critical threshold ($15\%$).
- **Urban Encroachment Alert:** Triggered when built-up area expands $>10\%$.
- **Hydrological Desiccation Alert:** Triggered when surface water contracts $>3\%$.
