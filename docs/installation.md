# GeoEcoAI Installation & Environment Setup Guide

## 1. Prerequisites
- **Python Version:** Python 3.9, 3.10, or 3.11
- **OS Support:** Linux (Ubuntu/Debian/RHEL), macOS, or Windows (WSL2 recommended)
- **GPU Acceleration (Optional):** NVIDIA GPU with CUDA 11.8+ / 12.x for accelerated deep learning training and large-scene inference.

---

## 2. Clone the Repository
```bash
git clone https://github.com/your-org/GeoEcoAI.git
cd GeoEcoAI
```

---

## 3. Environment Creation
It is strongly recommended to use a virtual environment:

### Option A: Using Conda
```bash
conda create -n geoecoai python=3.10 -y
conda activate geoecoai
```

### Option B: Using Python `venv`
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

---

## 4. Install Dependencies
Install the required packages using `pip`:

```bash
pip install -r requirements.txt
```

To install in editable development mode:
```bash
pip install -e .
```

---

## 5. Verify Installation
Verify that all core modules and utilities load properly:

```bash
python -m datasets.yang_dataset --validate
python -m unittest discover -s tests -p "test_*.py"
```
