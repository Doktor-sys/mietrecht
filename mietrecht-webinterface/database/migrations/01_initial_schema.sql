-- Migration: Create initial tables for Mietrecht Webinterface
-- Date: 2025-11-26

-- Create lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    law_firm VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lawyer_preferences table
CREATE TABLE IF NOT EXISTS lawyer_preferences (
    id SERIAL PRIMARY KEY,
    lawyer_id INTEGER REFERENCES lawyers(id) ON DELETE CASCADE,
    court_levels TEXT[],
    topics TEXT[],
    frequency VARCHAR(50) DEFAULT 'weekly',
    regions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court_decisions table
CREATE TABLE IF NOT EXISTS court_decisions (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(255) NOT NULL,
    court VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    date DATE,
    summary TEXT,
    content TEXT,
    importance VARCHAR(50) DEFAULT 'medium',
    topics TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
    id SERIAL PRIMARY KEY,
    lawyer_id INTEGER REFERENCES lawyers(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    content TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lawyers_email ON lawyers(email);
CREATE INDEX IF NOT EXISTS idx_court_decisions_case_number ON court_decisions(case_number);
CREATE INDEX IF NOT EXISTS idx_court_decisions_date ON court_decisions(date);
CREATE INDEX IF NOT EXISTS idx_court_decisions_importance ON court_decisions(importance);