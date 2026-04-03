# SmartFarm AI - Agri Operating System

SmartFarm AI is a massive, unified, and scalable agricultural operating system designed to solve the fragmentation of modern farming. It provides farmers with a single platform for AI-powered disease diagnosis, IoT-driven irrigation, marketplace connectivity, and multilingual voice assistance.

## Project Structure

This monorepo contains the complete system architecture, database schemas, API specs, AI pipelines, and code scaffolding for all 12 modules requested.

```text
SmartFarm-AI/
├── docs/                     # Comprehensive System Documentation
│   ├── architecture.md       # High-level architecture, Offline-first strategy, Tech Stack
│   ├── database_schema.md    # SQL (Postgres), NoSQL (Mongo), Vector (Pinecone), caching (Redis)
│   ├── api_endpoints.md      # REST/MQTT Specifications for all 12 modules
│   └── ai_pipelines.md       # YOLOv8, LSTM, RAG Voice Assistant training details
├── backend/                  # Microservices Scaffolding
│   ├── ai-ml-service/        # FastAPI, PyTorch (Computer Vision, NLP RAG)
│   ├── core-service/         # Node/FastAPI (Users, Marketplace, Government Schemes, Routes)
│   └── iot-service/          # Node.js + MQTT (Digital Twin, Telemetry ingestion)
├── frontend/                 # Client Applications
│   ├── mobile-app/           # Flutter (Offline-first, TFLite on-device models)
│   └── web-dashboard/        # React/Next.js (Admin/Vendor dashboard)
├── k8s/                      # Kubernetes Orchestration
│   └── ai-service-deployment.yaml # GPU-enabled PyTorch pods
└── docker-compose.yml        # Local orchestration (Kong, Postgres, Mongo, Redis, EMQX, Services)
```

## The 12 Modules Implemented

1. **Farm Registration**: Geospatial (PostGIS) farm boundaries.
2. **Crop Health Detection (AI)**: YOLOv8 PyTorch pipeline for leaf diagnosis.
3. **IoT Precision Irrigation**: EMQX MQTT pipeline for LoRaWAN sensors.
4. **Crop Recommendation AI**: Factor-based ML tabular recommendation.
5. **Mandi Price Intelligence**: LSTM time-series prediction via TensorFlow.
6. **Krishi Route Optimizer**: Routing algorithm for optimal mandi profitability.
7. **Equipment Rental Marketplace**: Geospatial booking system.
8. **Agricultural Labor Marketplace**: Skill and location-based matchmaking.
9. **Input Marketplace**: Seed/fertilizer ecommerce.
10. **Voice AI Assistant**: Whisper (ASR) + RAG (Vector DB) + Text-to-Speech.
11. **Government Scheme Recommender**: Rules-based/ML matching engine.
12. **Farm Memory System**: Pinecone Vector DB for historical narrative retrieval.

## Getting Started

### Local Development
To spin up the entire infrastructure locally (Databases, API Gateway, MQTT, AI Services):
```bash
docker-compose up -d
```

### Documentation
Read the markdown files in the `/docs` folder for an in-depth understanding of the architecture and database patterns.
