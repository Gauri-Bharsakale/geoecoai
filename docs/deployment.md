# GeoEcoAI Deployment & CLI Reference Manual

## 1. Interactive Web Application
Launch the interactive Streamlit dashboard:

```bash
streamlit run app/streamlit_app.py --server.port 8501
```

---

## 2. Command-Line Interface (CLI) Execution

### 2.1 Dataset Verification
```bash
python -m datasets.yang_dataset --validate
```

### 2.2 Data Preprocessing & Tiling
```bash
python -m preprocessing.pipeline
```

### 2.3 Model Training
```bash
python -m training.train --epochs 50 --batch-size 16 --lr 0.0001
```

### 2.4 Model Evaluation on Test Split
```bash
python -m training.evaluate --checkpoint outputs/checkpoints/best_model.pth
```

### 2.5 Single Scene Inference
```bash
python -m inference.predict --input path/to/image.png --output outputs/predictions/scene_mask.png
```

### 2.6 Tiled Large-Scene Inference (Gigapixel Rasters)
```bash
python -m inference.tiled_inference --input path/to/large_scene.tif --output outputs/predictions/large_mask.png --patch-size 256 --overlap 64
```

### 2.7 Post-Classification Change Detection (PCC)
```bash
python -m change_detection.post_classification --t1 path/to/t1_image.png --t2 path/to/t2_image.png --output-dir outputs/change_maps/
```

### 2.8 Automated Academic PDF Report Generation
```bash
python -m reporting.pdf_generator --output GeoEcoAI_Research_Report.pdf
```

---

## 3. Docker Containerization

### Build Docker Image
```bash
docker build -t geoecoai:latest .
```

### Run Container
```bash
docker run -p 8501:8501 -v $(pwd)/data:/app/data -v $(pwd)/outputs:/app/outputs geoecoai:latest
```
