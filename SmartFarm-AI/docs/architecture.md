# SmartFarm AI System Architecture

This document describes the high-level architecture for **SmartFarm AI**, a highly scalable, offline-first agricultural operating system integrating IoT, AI, marketplace, and rural logistics.

## High-Level Component Diagram

```mermaid
graph TD
    %% Frontend Clients
    subgraph Clients["Frontend Clients"]
        Web[React Next.js Web Dashboard]
        Mobile[Flutter Mobile App - Offline First]
        Voice[Multilingual Voice Assistant]
    end

    %% API Gateway & Auth
    subgraph Gateway["API Gateway & Identity"]
        Kong[Kong/Nginx API Gateway]
        Auth[Keycloak / Custom JWT Auth Service]
    end

    %% Microservices
    subgraph Microservices["Backend Microservices (FastAPI & Node.js)"]
        UserSvc[User & Farm Profile Service]
        MarketSvc[Marketplace Service - Equip, Labor, Input]
        AgriSvc[Agri Intelligence Service - Crop Rec, Price]
        IoTProxy[IoT Telemetry & Digital Twin Service]
        GovSvc[Gov Scheme Recommender]
        RouteSvc[Krishi Route Optimizer]
    end

    %% AI & ML Services (GPU Enabled)
    subgraph AIServices["AI / ML Serving (PyTorch/TensorFlow)"]
        VisionSvc[YOLOv8 Pest/Disease Inference]
        PriceSvc[LSTM Price Prediction]
        LLMSvc[Whisper + LLM Voice Processing]
    end

    %% Databases
    subgraph DataLayer["Data Layer"]
        PG[(PostgreSQL - Relational)]
        Mongo[(MongoDB - Farm Logs & IoT Docs)]
        Redis[(Redis - Caching/Rates)]
        Vector[(Pinecone/Weaviate - Farm Memory)]
    end

    %% IoT Edge Network
    subgraph IoT["IoT Edge"]
        Sensors[Soil, Weather, NPK Sensors]
        LoRa[LoRaWAN Gateway]
        MQTT[MQTT Broker - EMQX]
    end

    %% Connections
    Mobile <--> |REST/GraphQL/WSS| Kong
    Web <--> |REST/GraphQL| Kong
    Voice <--> Kong

    Kong <--> Auth
    Kong <--> Microservices

    UserSvc <--> PG
    MarketSvc <--> PG
    AgriSvc <--> PG
    AgriSvc <--> Mongo
    GovSvc <--> PG

    Microservices <--> Redis
    Microservices <--> AIServices

    VisionSvc <--> Vector
    LLMSvc <--> Vector

    Sensors --> LoRa
    LoRa --> MQTT
    MQTT --> IoTProxy
    IoTProxy --> Mongo
```

## Technology Stack

### Frontend
- **Mobile**: Flutter (Dart) with `sqflite` for local caching and offline-first capabilities.
- **Web**: React (Next.js) with Tailwind CSS and Redux Toolkit.

### Backend Microservices
- **Core APIs (Marketplace, Users)**: Node.js (Express/NestJS) or Python (FastAPI).
- **AI & Data Heavy Services**: Python (FastAPI).
- **Routing**: Python (with NetworkX/OSRM integration).

### AI & Machine Learning
- **Computer Vision**: PyTorch, YOLOv8 (Pest, Disease, Deficiency detection).
- **Time-Series Prediction**: TensorFlow/Keras LSTM (Mandi prices).
- **Voice AI**: OpenAI Whisper (Speech-to-text), multilingual LLM prompt chains (LangChain/LlamaIndex).
- **Geospatial Processing**: PostGIS, GeoPandas.

### Databases
- **PostgreSQL**: Users, Locations, Marketplaces, Financial Transactions, Routes.
- **MongoDB**: Schema-less farm logs, massive IoT telemetry, historical weather.
- **Redis**: Real-time mandi price caching, active sessions, API rate-limiting.
- **Vector DB (Pinecone/Weaviate)**: Farm Memory System (semantic search over disease histories, voice queries).

### DevOps & Cloud
- **Cloud Agnostic**: EKS/GKE/AKS.
- **Containerization**: Docker.
- **Orchestration**: Kubernetes with Helm.
- **CI/CD**: GitHub Actions or GitLab CI.

## Offline-First Strategy
The mobile application (Flutter) uses a Local-First architecture:
1. **Local DB**: SQLite stores user profile, downloaded scheme details, and latest cached prices.
2. **On-Device ML**: Lightweight TFLite models for pest detection when internet is completely down.
3. **Optimistic UI**: Form submissions (like labor requests or equipment booking) are saved locally and pushed via a background queue (`workmanager`) when the connection is restored.
