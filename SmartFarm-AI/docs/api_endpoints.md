# SmartFarm AI API Endpoints

This document outlines the core RESTful and WebSocket API endpoints for the SmartFarm AI platform microservices.

## User & Farm Profile Service (Node.js/Express or FastAPI)
- `POST /api/v1/auth/register`: Register farmer/laborer/vendor (JWT issue).
- `POST /api/v1/auth/login`: Issue JWT.
- `GET /api/v1/users/me`: Get current user profile.
- `POST /api/v1/farms`: Register a new farm (accepts GeoJSON boundary).
- `GET /api/v1/farms/{farmId}`: Get farm details.

## AI Crop Health Detection Service (FastAPI + PyTorch)
- `POST /api/v1/ai/vision/detect`: Upload leaf image (multipart/form-data). Returns bounding boxes, class (disease/pest), severity score, and treatment recommendations.
- `POST /api/v1/ai/vision/sync`: Sync offline detected results from mobile to cloud.

## IoT Precision Irrigation Service (Node.js + Python)
- `MQTT /farms/{farmId}/sensors/{sensorId}/tx`: Sensor telemetry publishing topic.
- `GET /api/v1/iot/farms/{farmId}/dashboard`: Get aggregated real-time sensor data from Redis.
- `GET /api/v1/ai/irrigation/predict/{farmId}`: Get irrigation schedule prediction based on moisture trends and weather forecast.

## Crop Recommendation AI Service (FastAPI)
- `POST /api/v1/ai/recommendation/crops`: 
  - Payload: `{ "soil_type": "loamy", "ph": 6.5, "farm_id": "uuid" }`
  - Returns: Top 3 crops with profitability score.

## Mandi Price & Route Intelligence Service (FastAPI)
- `GET /api/v1/markets/prices?crop={cropId}`: Get latest mandi prices (cached in Redis).
- `GET /api/v1/ai/prices/forecast?crop={cropId}&market={marketId}`: Get LSTM predicted prices for next 7/30 days.
- `POST /api/v1/ai/routes/optimize`:
  - Payload: `{ "origin": {"lat": ..., "lng": ...}, "crop_id": "uuid", "transport_type": "TRACTOR" }`
  - Returns: Most profitable mandi destination and routing vectors (Google Maps / OSRM format).

## Marketplaces Service (Node.js)
### Equipment
- `POST /api/v1/market/equipment`: List an equipment.
- `GET /api/v1/market/equipment/nearby?lat=...&lng=...`: Search geospacial equipments.
- `POST /api/v1/market/equipment/{id}/book`: Book an equipment.

### Labor
- `POST /api/v1/market/labor/register`: Register as labor.
- `GET /api/v1/market/labor/search?skills=spraying&lat=...&lng=...`: Find laborers.

### Inputs
- `GET /api/v1/market/inputs`: List inputs (seeds, fertilizers).
- `POST /api/v1/market/inputs/checkout`: Buy inputs (links to Stripe/Razorpay).

## Voice AI Assistant (FastAPI)
- `POST /api/v1/ai/voice/chat`:
  - Payload: Audio file (recorded by user) OR text.
  - Returns: Audio URL (TTS response) and Text transcription.

## Government Scheme Recommender (FastAPI)
- `GET /api/v1/ai/schemes/recommend?farmId={uuid}`: Returns list of relevant schemes based on farm size, crop type, and user demographics.

## Farm Memory System (FastAPI + Pinecone)
- `POST /api/v1/memory/query`:
  - Payload: `{ "query": "What fertilizer did I use for tomato blight last year?", "farm_id": "uuid" }`
  - Returns: Conversational answer based on vector DB retrieval.
