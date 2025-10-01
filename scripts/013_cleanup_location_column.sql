-- Remove the old unstructured location column since we now have structured location data
-- The structured columns (location_route, location_locality, location_state, location_place_id, location_lat, location_lng) 
-- provide much better data for job matching and geographic queries

ALTER TABLE candidates DROP COLUMN IF EXISTS location;

-- Add a comment to document the structured location approach
COMMENT ON COLUMN candidates.location_route IS 'Street name without house number for privacy';
COMMENT ON COLUMN candidates.location_locality IS 'City name for job matching';
COMMENT ON COLUMN candidates.location_state IS 'State for regional job matching';
COMMENT ON COLUMN candidates.location_place_id IS 'Google Places ID for address verification';
COMMENT ON COLUMN candidates.location_lat IS 'Latitude for distance-based job matching';
COMMENT ON COLUMN candidates.location_lng IS 'Longitude for distance-based job matching';
