-- Drop existing tables and create new denormalized structure
DROP TABLE IF EXISTS candidate_experience CASCADE;
DROP TABLE IF EXISTS candidate_skills CASCADE; 
DROP TABLE IF EXISTS candidate_availability CASCADE;
DROP TABLE IF EXISTS candidate_shifts CASCADE;

-- Create denormalized candidate_skills table (one row per candidate, 8 skill columns)
CREATE TABLE candidate_skills (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    skill_1 VARCHAR(100),
    skill_2 VARCHAR(100),
    skill_3 VARCHAR(100),
    skill_4 VARCHAR(100),
    skill_5 VARCHAR(100),
    skill_6 VARCHAR(100),
    skill_7 VARCHAR(100),
    skill_8 VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create denormalized candidate_availability table (one row per candidate, 8 interview slot columns)
CREATE TABLE candidate_availability (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    interview_slot_1 VARCHAR(100),
    interview_slot_2 VARCHAR(100),
    interview_slot_3 VARCHAR(100),
    interview_slot_4 VARCHAR(100),
    interview_slot_5 VARCHAR(100),
    interview_slot_6 VARCHAR(100),
    interview_slot_7 VARCHAR(100),
    interview_slot_8 VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create denormalized candidate_shifts table (one row per candidate, boolean for each shift)
CREATE TABLE candidate_shifts (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    monday_lunch BOOLEAN DEFAULT FALSE,
    monday_dinner BOOLEAN DEFAULT FALSE,
    tuesday_lunch BOOLEAN DEFAULT FALSE,
    tuesday_dinner BOOLEAN DEFAULT FALSE,
    wednesday_lunch BOOLEAN DEFAULT FALSE,
    wednesday_dinner BOOLEAN DEFAULT FALSE,
    thursday_lunch BOOLEAN DEFAULT FALSE,
    thursday_dinner BOOLEAN DEFAULT FALSE,
    friday_lunch BOOLEAN DEFAULT FALSE,
    friday_dinner BOOLEAN DEFAULT FALSE,
    saturday_lunch BOOLEAN DEFAULT FALSE,
    saturday_dinner BOOLEAN DEFAULT FALSE,
    sunday_lunch BOOLEAN DEFAULT FALSE,
    sunday_dinner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keep candidate_experience as separate rows since work history is naturally multiple entries
CREATE TABLE candidate_experience (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(200),
    restaurant VARCHAR(300),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_experience ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - adjust based on your auth needs)
CREATE POLICY "Allow all operations on candidate_skills" ON candidate_skills FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidate_availability" ON candidate_availability FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidate_shifts" ON candidate_shifts FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidate_experience" ON candidate_experience FOR ALL USING (true);
