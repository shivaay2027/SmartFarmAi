# SmartFarm AI Database Schema Design

This document outlines the distributed database schema across PostgreSQL, MongoDB, Pinecone, and Redis.

## 1. PostgreSQL Schema (Relational Data)
Used for structured, highly relational data requiring ACID compliance.

### Users & Farm Registration
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    language_preference VARCHAR(10) DEFAULT 'hi',
    role VARCHAR(20) DEFAULT 'FARMER', -- FARMER, LABORER, VENDOR
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(100),
    location GEOGRAPHY(POINT, 4326),
    boundary GEOGRAPHY(POLYGON, 4326),
    soil_type VARCHAR(50),
    total_area_hectares DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Marketplaces (Equipment, Labor, Input)
```sql
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    type VARCHAR(50), -- TRACTOR, DRONE, HARVESTER
    price_per_hour DECIMAL(10,2),
    location GEOGRAPHY(POINT, 4326),
    availability_status VARCHAR(20) DEFAULT 'AVAILABLE'
);

CREATE TABLE labor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    skills TEXT[], -- ['Spraying', 'Harvesting']
    daily_wage DECIMAL(10,2),
    location GEOGRAPHY(POINT, 4326),
    status VARCHAR(20) DEFAULT 'AVAILABLE'
);

-- Input Marketplace
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES users(id),
    category VARCHAR(50), -- SEED, FERTILIZER, PESTICIDE
    name VARCHAR(255),
    price DECIMAL(10,2),
    stock_quantity INT
);
```

### Mandi Prices & Routes
```sql
CREATE TABLE mandi_markets (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    location GEOGRAPHY(POINT, 4326)
);

CREATE TABLE historical_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID REFERENCES mandi_markets(id),
    crop_name VARCHAR(50),
    date DATE,
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    modal_price DECIMAL(10,2)
);
```

---

## 2. MongoDB Schema (Document Data)
Used for unstructured, highly variable document data.

### IoT Telemetry Data
```json
// Collection: iot_telemetry
{
    "_id": ObjectId("..."),
    "farm_id": "uuid-...",
    "sensor_id": "sen-001",
    "timestamp": ISODate("2024-03-05T10:00:00Z"),
    "readings": {
        "soil_moisture": 45.2,
        "temperature": 28.5,
        "ph": 6.8,
        "nitrogen": 120,
        "phosphorus": 40,
        "potassium": 80
    }
}
```

### Farm Memory Logs
```json
// Collection: farm_events
{
    "_id": ObjectId("..."),
    "farm_id": "uuid-...",
    "event_type": "DISEASE_DETECTED",
    "date": ISODate("2024-02-10T..."),
    "details": {
        "crop": "Tomato",
        "disease": "Early Blight",
        "severity": 0.85,
        "action_taken": "Sprayed Copper Fungicide",
        "image_url": "s3://..."
    }
}
```

---

## 3. Vector Database (Pinecone / Weaviate)
Used for semantic search and Retrieval-Augmented Generation (RAG).

### Farm Memory Vectors
- **Namespace**: `farm_memory`
- **Vector**: 1536-dimensional (OpenAI text-embedding-3-small) representing narrative farm history (e.g., "In August 2023, the tomato crop showed nitrogen deficiency. Ammonium nitrate was applied.").
- **Metadata**: `{ "farm_id": "uuid", "year": 2023, "crop": "Tomato" }`

### Voice Assistant RAG
- **Namespace**: `agri_knowledge`
- **Vector**: Embeddings of government policies, farming best practices, pest control manuals.

---

## 4. Redis Schema (Caching & Ephemeral)
- `mandi_prices:latest:<crop_id>:<market_id>` -> JSON string of today's prices
- `route_cache:<start_lat>_<start_lng>:<crop>` -> Cached optimal route to market
- `iot_latest:<sensor_id>` -> Hash of the absolute latest reading to avoid querying MongoDB for real-time dashboards
