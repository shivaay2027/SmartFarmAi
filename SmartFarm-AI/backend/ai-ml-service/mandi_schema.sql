-- ============================================================
-- SmartFarm AI — Master Mandi Database Schema
-- Compatible with: PostgreSQL 14+ / SQLite 3.35+
-- ============================================================

-- Enable PostGIS for geo queries (PostgreSQL only)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ── States & Geo Hierarchy ─────────────────────────────────
CREATE TABLE states (
    state_id   SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL UNIQUE,
    state_code CHAR(2),        -- e.g. MP, MH, RJ
    region     VARCHAR(50)     -- North, South, East, West, Central
);

CREATE TABLE districts (
    district_id   SERIAL PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL,
    state_id      INT NOT NULL REFERENCES states(state_id),
    UNIQUE(district_name, state_id)
);

CREATE TABLE sub_districts (
    sub_district_id   SERIAL PRIMARY KEY,
    sub_district_name VARCHAR(100) NOT NULL,  -- Tehsil / Block / Taluk
    district_id       INT NOT NULL REFERENCES districts(district_id),
    UNIQUE(sub_district_name, district_id)
);

-- ── Master Mandi Table ─────────────────────────────────────
CREATE TABLE mandis (
    mandi_id       VARCHAR(20) PRIMARY KEY,  -- e.g. MP001
    mandi_name     VARCHAR(200) NOT NULL,
    state_id       INT NOT NULL REFERENCES states(state_id),
    district_id    INT NOT NULL REFERENCES districts(district_id),
    sub_district_id INT REFERENCES sub_districts(sub_district_id),

    -- Geo
    latitude       DECIMAL(9,6),
    longitude      DECIMAL(9,6),
    -- geom         GEOGRAPHY(POINT, 4326),  -- PostGIS (optional)

    source         VARCHAR(50) DEFAULT 'agmarknet'
                   CHECK (source IN ('agmarknet','state_portal','enam','scraped','estimated')),
    is_active      BOOLEAN DEFAULT TRUE,
    last_updated   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mandis_state   ON mandis(state_id);
CREATE INDEX idx_mandis_district ON mandis(district_id);
CREATE INDEX idx_mandis_latlon  ON mandis(latitude, longitude);

-- ── Commodities (Normalized) ───────────────────────────────
CREATE TABLE commodities (
    commodity_id     VARCHAR(30) PRIMARY KEY,  -- e.g. WHEAT, ONION
    display_name     VARCHAR(100) NOT NULL,     -- "Wheat (Gehun)"
    unit             VARCHAR(20) DEFAULT 'Quintal',
    msp_2024         DECIMAL(10,2),             -- Minimum Support Price
    category         VARCHAR(50),               -- Cereal, Vegetable, Pulse, Oilseed, Cash Crop, Fruit
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alias/normalization table maps variant names → commodity_id
CREATE TABLE commodity_aliases (
    alias_id     SERIAL PRIMARY KEY,
    alias        VARCHAR(100) NOT NULL UNIQUE,  -- e.g. "gehu", "gehun", "sharbati wheat"
    commodity_id VARCHAR(30) NOT NULL REFERENCES commodities(commodity_id),
    language     VARCHAR(20) DEFAULT 'en'       -- hi, mr, gu, pa, bn
);

CREATE INDEX idx_alias_name ON commodity_aliases(alias);

-- ── Price Logs (Time-series) ───────────────────────────────
CREATE TABLE mandi_price_logs (
    id               BIGSERIAL PRIMARY KEY,
    mandi_id         VARCHAR(20) NOT NULL REFERENCES mandis(mandi_id),
    commodity_id     VARCHAR(30) NOT NULL REFERENCES commodities(commodity_id),

    -- Prices in ₹/Quintal
    min_price        DECIMAL(10,2),
    max_price        DECIMAL(10,2),
    modal_price      DECIMAL(10,2) NOT NULL,

    arrival_qty_tonnes DECIMAL(12,2),           -- tonnes arrived at mandi
    timestamp        TIMESTAMP WITH TIME ZONE NOT NULL,
    source           VARCHAR(50) DEFAULT 'agmarknet',
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    raw_data         JSONB,                      -- original scraped row

    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Critical performance indexes for 10M+ records
CREATE INDEX idx_price_logs_mandi_ts   ON mandi_price_logs(mandi_id, timestamp DESC);
CREATE INDEX idx_price_logs_commodity  ON mandi_price_logs(commodity_id, timestamp DESC);
CREATE INDEX idx_price_logs_ts         ON mandi_price_logs(timestamp DESC);
CREATE INDEX idx_price_logs_modal      ON mandi_price_logs(modal_price);

-- Partial index: only today's data (most queried)
CREATE INDEX idx_price_logs_today ON mandi_price_logs(mandi_id, commodity_id)
    WHERE timestamp > NOW() - INTERVAL '24 hours';

-- ── AI Predictions ─────────────────────────────────────────
CREATE TABLE price_predictions (
    id               BIGSERIAL PRIMARY KEY,
    mandi_id         VARCHAR(20) NOT NULL REFERENCES mandis(mandi_id),
    commodity_id     VARCHAR(30) NOT NULL REFERENCES commodities(commodity_id),

    prediction_date  DATE NOT NULL,         -- date when prediction was made
    target_date      DATE NOT NULL,         -- date being predicted
    predicted_modal  DECIMAL(10,2) NOT NULL,
    lower_bound      DECIMAL(10,2),
    upper_bound      DECIMAL(10,2),

    recommendation   CHAR(4) CHECK (recommendation IN ('BUY','HOLD','SELL')),
    confidence       DECIMAL(3,2),
    model_version    VARCHAR(50) DEFAULT 'LSTM-v1',

    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_predictions_mandi_date ON price_predictions(mandi_id, commodity_id, prediction_date DESC);

-- ── Redis Cache Hint: TTLs ─────────────────────────────────
-- Key pattern                    | TTL
-- mandi:prices:{mandi_id}        | 3600s  (1 hour)
-- mandi:states                   | 86400s (24 hours)
-- mandi:districts:{state}        | 86400s
-- mandi:trend:{mandi}:{commodity}| 3600s
-- mandi:predict:{mandi}:{comm}   | 43200s (12 hours)

-- ── Useful Views ───────────────────────────────────────────
CREATE OR REPLACE VIEW v_latest_prices AS
SELECT DISTINCT ON (mpl.mandi_id, mpl.commodity_id)
    mpl.mandi_id,
    m.mandi_name,
    st.state_name,
    d.district_name,
    sd.sub_district_name,
    mpl.commodity_id,
    c.display_name      AS commodity_name,
    mpl.min_price,
    mpl.modal_price,
    mpl.max_price,
    mpl.confidence_score,
    mpl.source,
    mpl.timestamp
FROM mandi_price_logs mpl
JOIN mandis m            ON m.mandi_id = mpl.mandi_id
JOIN states st           ON st.state_id = m.state_id
JOIN districts d         ON d.district_id = m.district_id
LEFT JOIN sub_districts sd ON sd.sub_district_id = m.sub_district_id
JOIN commodities c       ON c.commodity_id = mpl.commodity_id
ORDER BY mpl.mandi_id, mpl.commodity_id, mpl.timestamp DESC;

-- Top gainers today
CREATE OR REPLACE VIEW v_top_gainers AS
SELECT
    l.commodity_name,
    l.mandi_name,
    l.state_name,
    l.modal_price,
    l.timestamp,
    ROUND(((l.modal_price - prev.modal_price) / prev.modal_price) * 100, 2) AS change_pct
FROM v_latest_prices l
JOIN LATERAL (
    SELECT modal_price FROM mandi_price_logs
    WHERE mandi_id = l.mandi_id AND commodity_id = l.commodity_id
      AND timestamp < NOW() - INTERVAL '20 hours'
    ORDER BY timestamp DESC LIMIT 1
) prev ON TRUE
WHERE prev.modal_price IS NOT NULL
ORDER BY change_pct DESC;
