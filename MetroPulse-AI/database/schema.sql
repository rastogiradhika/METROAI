-- MetroPulse AI Database Schema (Supabase PostgreSQL)
-- Owned by Sakshi (Database Engineer)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STATIONS TABLE
CREATE TABLE IF NOT EXISTS stations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    line_names TEXT[] NOT NULL DEFAULT '{}',
    interchange BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PLATFORMS TABLE
CREATE TABLE IF NOT EXISTS platforms (
    id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    direction VARCHAR(150),
    nominal_capacity INT DEFAULT 300,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(50) PRIMARY KEY,
    source_station_id VARCHAR(50) NOT NULL REFERENCES stations(id),
    destination_station_id VARCHAR(50) NOT NULL REFERENCES stations(id),
    station_sequence JSONB NOT NULL DEFAULT '[]',
    total_stops INT NOT NULL DEFAULT 1,
    estimated_duration_minutes INT DEFAULT 10,
    interchanges JSONB NOT NULL DEFAULT '[]',
    line_names TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CROWD OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS crowd_observations (
    id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES stations(id),
    platform_id VARCHAR(50) NOT NULL REFERENCES platforms(id),
    observed_at TIMESTAMPTZ NOT NULL,
    person_count INT,
    crowd_level VARCHAR(20) NOT NULL CHECK (crowd_level IN ('low', 'moderate', 'high', 'critical', 'unavailable')),
    source VARCHAR(30) NOT NULL DEFAULT 'ml_pipeline' CHECK (source IN ('demo', 'ml_pipeline', 'passenger_report')),
    source_name VARCHAR(100),
    trend VARCHAR(30) DEFAULT 'stable' CHECK (trend IN ('rising', 'stable', 'falling', 'insufficient_data')),
    processing_status VARCHAR(20) NOT NULL DEFAULT 'processed' CHECK (processing_status IN ('processed', 'processing', 'failed', 'pending')),
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES stations(id),
    platform_id VARCHAR(50) NOT NULL REFERENCES platforms(id),
    generated_at TIMESTAMPTZ NOT NULL,
    forecast_at TIMESTAMPTZ NOT NULL,
    horizon_minutes INT NOT NULL CHECK (horizon_minutes IN (5, 10, 15)),
    predicted_count INT,
    predicted_level VARCHAR(20) NOT NULL CHECK (predicted_level IN ('low', 'moderate', 'high', 'critical', 'unavailable')),
    confidence_score DOUBLE PRECISION,
    status VARCHAR(30) NOT NULL CHECK (status IN ('available', 'insufficient_data', 'unavailable', 'failed')),
    model_version VARCHAR(50) DEFAULT 'v1.0-rf-baseline',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PASSENGER REPORTS TABLE
CREATE TABLE IF NOT EXISTS passenger_reports (
    id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES stations(id),
    platform_id VARCHAR(50) NOT NULL REFERENCES platforms(id),
    station_name VARCHAR(150),
    platform_name VARCHAR(100),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('high_crowd', 'overcrowding', 'safety_concern', 'other')),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'flagged', 'expired')),
    source VARCHAR(20) NOT NULL DEFAULT 'passenger',
    is_demo BOOLEAN DEFAULT FALSE
);

-- 7. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES stations(id),
    platform_id VARCHAR(50) NOT NULL REFERENCES platforms(id),
    station_name VARCHAR(150),
    platform_name VARCHAR(100),
    type VARCHAR(50) NOT NULL CHECK (type IN ('crowd_high', 'crowd_critical', 'system_data', 'service_disruption', 'passenger_report')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crowd_obs_station_platform ON crowd_observations (station_id, platform_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_station_platform ON predictions (station_id, platform_id, forecast_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_passenger_reports_station ON passenger_reports (station_id, reported_at DESC);
