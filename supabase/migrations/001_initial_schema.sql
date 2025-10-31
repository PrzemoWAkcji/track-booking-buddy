-- Track Booking Buddy Database Schema
-- Migration 001: Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONTRACTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_contractors_name ON contractors(name);
CREATE INDEX idx_contractors_category ON contractors(category);

-- =====================================================
-- 2. RESERVATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL, -- Denormalized for faster queries
  contractor_category TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  time_slot TEXT NOT NULL, -- Format: "HH:mm-HH:mm"
  facility_type TEXT NOT NULL CHECK (facility_type IN ('track-6', 'track-8', 'rugby')),
  tracks INTEGER[] NOT NULL DEFAULT '{}', -- Array of track numbers
  is_closed BOOLEAN DEFAULT FALSE,
  closed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_facility_type ON reservations(facility_type);
CREATE INDEX idx_reservations_contractor_id ON reservations(contractor_id);
CREATE INDEX idx_reservations_date_facility ON reservations(date, facility_type);

-- =====================================================
-- 3. WEEKLY ARCHIVE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS weekly_archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  facility_type TEXT NOT NULL CHECK (facility_type IN ('track-6', 'track-8', 'rugby')),
  archived_data JSONB NOT NULL, -- Store full week's data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for retrieving archives
CREATE INDEX idx_weekly_archive_dates ON weekly_archive(week_start, week_end);
CREATE INDEX idx_weekly_archive_facility ON weekly_archive(facility_type);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_archive ENABLE ROW LEVEL SECURITY;

-- For now: Allow all operations (will add authentication later)
-- TODO: Replace with proper authentication-based policies

CREATE POLICY "Allow public read access to contractors" ON contractors
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to contractors" ON contractors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to contractors" ON contractors
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from contractors" ON contractors
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to reservations" ON reservations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to reservations" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to reservations" ON reservations
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from reservations" ON reservations
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to weekly_archive" ON weekly_archive
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to weekly_archive" ON weekly_archive
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to weekly_archive" ON weekly_archive
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from weekly_archive" ON weekly_archive
  FOR DELETE USING (true);

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. SEED DATA (Optional - default contractors)
-- =====================================================

-- Insert default contractor categories
INSERT INTO contractors (name, category, color) VALUES
  ('Brak rezerwacji', 'free', '#ffffff'),
  ('ZAMKNIĘTY', 'closed', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE contractors IS 'Stores contractor information including name, category, and display color';
COMMENT ON TABLE reservations IS 'Main reservations table for track bookings';
COMMENT ON TABLE weekly_archive IS 'Archives of weekly schedules for historical record keeping';

COMMENT ON COLUMN reservations.tracks IS 'Array of track numbers (e.g., {1,2,3} for tracks 1, 2, and 3)';
COMMENT ON COLUMN reservations.time_slot IS 'Time range in format HH:mm-HH:mm (e.g., 08:00-09:00)';
COMMENT ON COLUMN reservations.facility_type IS 'Type of facility: track-6, track-8, or rugby';
COMMENT ON COLUMN reservations.is_closed IS 'Whether the facility is closed for this time slot';
COMMENT ON COLUMN weekly_archive.archived_data IS 'JSONB containing full week schedule data';