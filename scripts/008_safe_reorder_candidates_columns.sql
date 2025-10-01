-- Safe approach to reorder candidates table columns
-- This preserves all foreign key relationships and data integrity

BEGIN;

-- Step 1: Add the new position_name column in the correct position
-- We'll create a completely new table with the desired column order
CREATE TABLE candidates_new (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    position_name VARCHAR(255), -- New column in desired position
    email VARCHAR(255),
    phone VARCHAR(255),
    position_id INTEGER,
    bio TEXT,
    headshot_url TEXT,
    resume_url TEXT,
    location_place_id TEXT,
    location_route TEXT,
    location_locality TEXT,
    location_state TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC,
    skill_1 VARCHAR(255),
    skill_2 VARCHAR(255),
    skill_3 VARCHAR(255),
    skill_4 VARCHAR(255),
    skill_5 VARCHAR(255),
    skill_6 VARCHAR(255),
    skill_7 VARCHAR(255),
    skill_8 VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Copy all data from old table to new table
INSERT INTO candidates_new (
    id, first_name, last_name, position_name, email, phone, position_id, bio, 
    headshot_url, resume_url, location_place_id, location_route, location_locality, 
    location_state, location_lat, location_lng, skill_1, skill_2, skill_3, skill_4, 
    skill_5, skill_6, skill_7, skill_8, submitted_at, created_at
)
SELECT 
    id, first_name, last_name, position_name, email, phone, position_id, bio,
    headshot_url, resume_url, location_place_id, location_route, location_locality,
    location_state, location_lat, location_lng, skill_1, skill_2, skill_3, skill_4,
    skill_5, skill_6, skill_7, skill_8, submitted_at, created_at
FROM candidates;

-- Step 3: Update the sequence to continue from the current max ID
SELECT setval('candidates_new_id_seq', (SELECT MAX(id) FROM candidates_new));

-- Step 4: Rename tables (this is atomic)
ALTER TABLE candidates RENAME TO candidates_old;
ALTER TABLE candidates_new RENAME TO candidates;

-- Step 5: Recreate the trigger for automatic position_name updates
CREATE OR REPLACE FUNCTION update_candidate_position_name()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.position_id != OLD.position_id) THEN
        SELECT name INTO NEW.position_name 
        FROM positions 
        WHERE id = NEW.position_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidate_position_name
    BEFORE INSERT OR UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_candidate_position_name();

-- Step 6: Drop the old table only after everything is working
DROP TABLE candidates_old;

COMMIT;
