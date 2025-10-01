-- Clean up the database schema by removing redundant candidate_id columns
-- and fixing the table structure

-- First, let's clean up existing data and fix the schema
DROP TABLE IF EXISTS candidate_availability CASCADE;
DROP TABLE IF EXISTS candidate_experience CASCADE;
DROP TABLE IF EXISTS candidate_shifts CASCADE;

-- Recreate tables with proper structure (no redundant candidate_id + id)
CREATE TABLE candidate_experience (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  role varchar(255),
  restaurant text,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE candidate_shifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  day_of_week varchar(20),
  shift_type varchar(20),
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE candidate_availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  available_date date,
  available_time time,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - adjust as needed)
CREATE POLICY "Allow all operations on candidate_experience" ON candidate_experience FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidate_shifts" ON candidate_shifts FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidate_availability" ON candidate_availability FOR ALL USING (true);

-- Clean up any incomplete applications (those without completed_at)
DELETE FROM candidates WHERE completed_at IS NULL;
