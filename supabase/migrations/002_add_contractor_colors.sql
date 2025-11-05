-- Migration 002: Add default colors to contractors
-- This migration assigns default colors to existing contractors

-- Update colors for track contractors (6-track and 8-track stadium)
UPDATE contractors SET color = '#93c5fd' WHERE name = 'OKS SKRA'; -- blue-300
UPDATE contractors SET color = '#86efac' WHERE name = 'KS CZEMPION'; -- green-300
UPDATE contractors SET color = '#d8b4fe' WHERE name = 'AKL'; -- purple-300
UPDATE contractors SET color = '#fdba74' WHERE name = 'Kamil Żewłakow'; -- orange-300
UPDATE contractors SET color = '#fca5a5' WHERE name = 'SGH'; -- red-300
UPDATE contractors SET color = '#5eead4' WHERE name = 'Grupa biegowa Aktywna Warszawa'; -- teal-300
UPDATE contractors SET color = '#f9a8d4' WHERE name = 'ZabieganeDni'; -- pink-300
UPDATE contractors SET color = '#a5b4fc' WHERE name = 'Adidas Runners'; -- indigo-300
UPDATE contractors SET color = '#fde047' WHERE name = 'Sword Athletics Club'; -- yellow-300
UPDATE contractors SET color = '#67e8f9' WHERE name = 'Endless Pain'; -- cyan-300
UPDATE contractors SET color = '#bef264' WHERE name = 'Run Club'; -- lime-300

-- Update colors for rugby clubs
UPDATE contractors SET color = '#6ee7b7' WHERE name = 'Rugby Legia'; -- emerald-300
UPDATE contractors SET color = '#c4b5fd' WHERE name = 'FROGS'; -- violet-300
UPDATE contractors SET color = '#fda4af' WHERE name = 'UKS Montgomery'; -- rose-300

-- Update special system contractors
UPDATE contractors SET color = '#fbbf24' WHERE name = 'ZAMKNIĘTY'; -- amber-400
UPDATE contractors SET color = '#fbbf24' WHERE name = 'ZAMKNIETY'; -- amber-400 (alternative spelling)

-- Insert default contractors if they don't exist with proper colors
INSERT INTO contractors (name, category, color) VALUES
  ('OKS SKRA', 'Trening sportowy', '#93c5fd'),
  ('KS CZEMPION', 'Trening sportowy', '#86efac'),
  ('AKL', 'Trening sportowy', '#d8b4fe'),
  ('Kamil Żewłakow', 'Trening sportowy', '#fdba74'),
  ('SGH', 'Trening sportowy', '#fca5a5'),
  ('Grupa biegowa Aktywna Warszawa', 'Trening sportowy', '#5eead4'),
  ('ZabieganeDni', 'Trening sportowy', '#f9a8d4'),
  ('Adidas Runners', 'Trening sportowy', '#a5b4fc'),
  ('Sword Athletics Club', 'Trening sportowy', '#fde047'),
  ('Endless Pain', 'Trening sportowy', '#67e8f9'),
  ('Run Club', 'Trening sportowy', '#bef264'),
  ('Rugby Legia', 'Trening sportowy', '#6ee7b7'),
  ('FROGS', 'Trening sportowy', '#c4b5fd'),
  ('UKS Montgomery', 'Trening sportowy', '#fda4af'),
  ('ZAMKNIĘTY', 'closed', '#fbbf24'),
  ('ZAMKNIETY', 'closed', '#fbbf24')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;

-- Set default gray color for any contractors without a color
UPDATE contractors SET color = '#d1d5db' WHERE color IS NULL OR color = '' OR color = '#ffffff';

-- Add a comment explaining the color system
COMMENT ON COLUMN contractors.color IS 'Hex color code for contractor display (e.g., #93c5fd). Used in UI and PDF generation.';