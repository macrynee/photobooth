-- ============================================================
-- SnapBox Photobooth System - PostgreSQL (psql) Schema
-- ============================================================

-- Enable pgcrypto / uuid extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Access Codes Table
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    note VARCHAR(255),
    max_uses INTEGER NOT NULL DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Photobooth Sessions Table
CREATE TABLE IF NOT EXISTS photo_sessions (
    id VARCHAR(64) PRIMARY KEY,
    access_code_id UUID REFERENCES access_codes(id) ON DELETE SET NULL,
    access_code VARCHAR(20),
    image_data TEXT NOT NULL,
    title VARCHAR(100),
    subtitle VARCHAR(100),
    layout VARCHAR(30),
    filter VARCHAR(30),
    frame_color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_code_id ON photo_sessions(access_code_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_created_at ON photo_sessions(created_at DESC);

-- Trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_admins_updated_at ON admins;
CREATE TRIGGER trigger_update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_access_codes_updated_at ON access_codes;
CREATE TRIGGER trigger_update_access_codes_updated_at
    BEFORE UPDATE ON access_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Default Initial Seed (Admin User: mac / Password: macqwerty)
-- ============================================================

INSERT INTO admins (username, email, password_hash, role)
VALUES (
    'mac',
    'mac@snapbox.local',
    '$2b$10$nc6/3rfwFGJayr923.fcc.373vfoDd6S1.rBrcCW2H60Yrh0srLNS', -- macqwerty
    'admin'
) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Initial demo access codes (5-digit single-use codes)
INSERT INTO access_codes (code, note, max_uses, current_uses, is_active)
VALUES 
    ('8K2M9', 'Single Session Pass', 1, 0, true),
    ('7B4X1', 'Single Session Pass', 1, 0, true),
    ('A59F2', 'Single Session Pass', 1, 0, true)
ON CONFLICT (code) DO NOTHING;
