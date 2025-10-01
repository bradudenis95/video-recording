-- Add structured location fields to candidates table
ALTER TABLE candidates 
ADD COLUMN location_route TEXT,
ADD COLUMN location_locality TEXT,
ADD COLUMN location_state TEXT,
ADD COLUMN location_place_id TEXT,
ADD COLUMN location_lat DECIMAL(10, 8),
ADD COLUMN location_lng DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX idx_candidates_location_coords ON candidates(location_lat, location_lng);
