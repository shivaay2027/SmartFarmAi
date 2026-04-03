# SmartFarm AI Training Pipelines & ML Architecture

This document describes the offline training, fine-tuning, and inference pipelines for the AI components.

## 1. Crop Health Detection (Computer Vision)
The system uses **YOLOv8** (You Only Look Once) for object detection and classification of leaf conditions.

### Training Pipeline
1. **Dataset**: PlantVillage Dataset + Custom annotated dataset of local crops.
2. **Preprocessing**: Image resizing (640x640), augmentations (rotation, flip, contrast, brightness) using Albumentations.
3. **Training**: PyTorch Lightning wrapper around YOLOv8. Trained on AWS EC2 (p4d instances) or GCP (A100 GPUs).
4. **Export**: Model exported to ONNX format (for fast backend inference) and TFLite (for offline mobile inference).

### Inference
- Model hosted via FastAPI or Triton Inference Server.
- Cloud detection returns bounding box coordinates and confidence probability.

## 2. Mandi Price Intelligence (Time-Series)
A sequence modeling approach using **LSTM (Long Short-Term Memory)** networks.

### Training Pipeline
1. **Dataset**: Historical data crawled from Agmarknet or local government APIs (5-10 years of data).
2. **Features**: Date, Crop ID, Market ID, Weather Variables (rainfall, temp), Fuel prices.
3. **Preprocessing**: Min-Max scaling, windowing (lookback = 30 days to predict next 7 days).
4. **Training**: TensorFlow/Keras.
5. **Evaluation**: RMSE, MAE.
6. **Deployment**: Saved Model format loaded into memory by FastAPI at startup.

## 3. Crop Recommendation (Tabular Machine Learning)
A classification model recommending the top N crops.

### Architecture
- **Model**: XGBoost or Random Forest Classifier.
- **Inputs**: N (Nitrogen), P (Phosphorus), K (Potassium), Temperature, Humidity, pH, Rainfall.
- **Output**: Probabilities of different crop classes.
- **Scikit-Learn Pipeline**: Imputer -> Scaler -> XGBoost.

## 4. Voice Assistant & Multilingual Support
Instead of training from scratch, we leverage foundation models with RAG (Retrieval-Augmented Generation).

### Pipeline
1. **Speech-to-Text (ASR)**: OpenAI Whisper (large-v3, deployed locally or via API) handles robust translation of dialects (Hindi, Marathi, Tamil, etc.) to English text, or native text.
2. **RAG Retrieval**: Retrieve relevant farm context from Pinecone (Vector DB).
3. **LLM Generation**: OpenAI GPT-4o or Llama 3 8B (via vLLM) generates the agricultural response.
4. **Text-to-Speech (TTS)**: Using cloud TTS (AWS Polly, Google TTS, or ElevenLabs) to convert text back to local audio.

## 5. Krishi Route Optimizer
Not purely ML, but uses combinatorial optimization (Routing algorithms).
- Integrates OSRM (Open Source Routing Machine) or Google Maps Directions API.
- Re-ranks routes by calculating `Profit = (Expected Mandi Price * Quantity) - (Fuel Cost) - (Tolls)`.
