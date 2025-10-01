-- Add position_name column to candidates table between last_name and email
ALTER TABLE candidates 
ADD COLUMN position_name character varying;

-- Populate the position_name column with data from positions table
UPDATE candidates 
SET position_name = positions.name 
FROM positions 
WHERE candidates.position_id = positions.id;

-- Create a function to automatically update position_name when position_id changes
CREATE OR REPLACE FUNCTION update_candidate_position_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Update position_name based on the new position_id
    SELECT name INTO NEW.position_name 
    FROM positions 
    WHERE id = NEW.position_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update position_name when position_id is inserted or updated
DROP TRIGGER IF EXISTS trigger_update_position_name ON candidates;
CREATE TRIGGER trigger_update_position_name
    BEFORE INSERT OR UPDATE OF position_id ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_candidate_position_name();
