-- Add session_id column to candidates table for file tracking
ALTER TABLE candidates 
ADD COLUMN session_id VARCHAR(50);

-- Add comment to explain the column purpose
COMMENT ON COLUMN candidates.session_id IS 'Session ID used for file naming - links candidate to their uploaded files';
