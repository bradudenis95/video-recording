-- Reorder candidates table columns to place position_name between last_name and email

-- Step 1: Create new table with columns in desired order
CREATE TABLE candidates_new (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    headshot_url TEXT,
    position_id INTEGER REFERENCES positions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Copy all data from old table to new table
INSERT INTO candidates_new (
    id, first_name, last_name, position_name, email, phone, 
    address, headshot_url, position_id, created_at, updated_at
)
SELECT 
    id, first_name, last_name, position_name, email, phone,
    address, headshot_url, position_id, created_at, updated_at
FROM candidates;

-- Step 3: Update the sequence to continue from the current max ID
SELECT setval('candidates_new_id_seq', (SELECT COALESCE(MAX(id), 1) FROM candidates_new));

-- Step 4: Drop the old table
DROP TABLE candidates;

-- Step 5: Rename new table to original name
ALTER TABLE candidates_new RENAME TO candidates;

-- Step 6: Recreate the trigger for automatic position_name updates
CREATE OR REPLACE FUNCTION update_candidate_position_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Update position_name when position_id changes
    IF TG_OP = 'UPDATE' AND OLD.position_id IS DISTINCT FROM NEW.position_id THEN
        SELECT name INTO NEW.position_name 
        FROM positions 
        WHERE id = NEW.position_id;
    END IF;
    
    -- Set position_name for new records
    IF TG_OP = 'INSERT' AND NEW.position_id IS NOT NULL THEN
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

-- Step 7: Also recreate the trigger for when position names change in the positions table
CREATE OR REPLACE FUNCTION update_candidates_when_position_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all candidates with this position when position name changes
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        UPDATE candidates 
        SET position_name = NEW.name 
        WHERE position_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidates_when_position_changes
    AFTER UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_candidates_when_position_changes();
