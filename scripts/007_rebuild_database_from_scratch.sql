-- Drop all existing tables and rebuild from scratch
DROP TABLE IF EXISTS candidate_availability CASCADE;
DROP TABLE IF EXISTS candidate_experience CASCADE;
DROP TABLE IF EXISTS candidate_shifts CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS skill_categories CASCADE;
DROP TABLE IF EXISTS positions CASCADE;

-- Create positions table
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skill categories table
CREATE TABLE skill_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES skill_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create main candidates table with 8 skills columns
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    position_id INTEGER REFERENCES positions(id),
    bio TEXT,
    headshot_url TEXT,
    skill_1 VARCHAR(100),
    skill_2 VARCHAR(100),
    skill_3 VARCHAR(100),
    skill_4 VARCHAR(100),
    skill_5 VARCHAR(100),
    skill_6 VARCHAR(100),
    skill_7 VARCHAR(100),
    skill_8 VARCHAR(100),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate_shifts table (NO ID column)
CREATE TABLE candidate_shifts (
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (candidate_id)
);

-- Create candidate_experience table (NO ID column)
CREATE TABLE candidate_experience (
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    experience_1_role VARCHAR(100),
    experience_1_restaurant TEXT,
    experience_1_start_date DATE,
    experience_1_end_date DATE,
    experience_2_role VARCHAR(100),
    experience_2_restaurant TEXT,
    experience_2_start_date DATE,
    experience_2_end_date DATE,
    experience_3_role VARCHAR(100),
    experience_3_restaurant TEXT,
    experience_3_start_date DATE,
    experience_3_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (candidate_id)
);

-- Create candidate_availability table (NO ID column)
CREATE TABLE candidate_availability (
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    interview_slot_1 TEXT,
    interview_slot_2 TEXT,
    interview_slot_3 TEXT,
    interview_slot_4 TEXT,
    interview_slot_5 TEXT,
    interview_slot_6 TEXT,
    interview_slot_7 TEXT,
    interview_slot_8 TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (candidate_id)
);

-- Create storage bucket for headshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate-headshots', 'candidate-headshots', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now)
CREATE POLICY "Allow all operations on candidates" ON candidates FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidate_shifts" ON candidate_shifts FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidate_experience" ON candidate_experience FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidate_availability" ON candidate_availability FOR ALL USING (true);
CREATE POLICY "Allow all operations on positions" ON positions FOR ALL USING (true);
CREATE POLICY "Allow all operations on skill_categories" ON skill_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on skills" ON skills FOR ALL USING (true);

-- Storage policies
CREATE POLICY "Allow public uploads to candidate-headshots" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'candidate-headshots');

CREATE POLICY "Allow public access to candidate-headshots" ON storage.objects 
FOR SELECT USING (bucket_id = 'candidate-headshots');

-- Insert sample data
INSERT INTO positions (name, display_order) VALUES
('Server', 1),
('Bartender', 2),
('Host/Hostess', 3),
('Kitchen Staff', 4),
('Manager', 5),
('Busser', 6);

INSERT INTO skill_categories (name, display_order) VALUES
('Front of House', 1),
('Back of House', 2),
('Management', 3);

INSERT INTO skills (name, category_id) VALUES
-- Front of House
('Customer Service', 1),
('POS Systems', 1),
('Wine Knowledge', 1),
('Cocktail Making', 1),
('Table Service', 1),
('Cash Handling', 1),
-- Back of House
('Food Preparation', 2),
('Cooking', 2),
('Food Safety', 2),
('Inventory Management', 2),
('Dishwashing', 2),
('Kitchen Equipment', 2),
-- Management
('Team Leadership', 3),
('Scheduling', 3),
('Training', 3),
('Conflict Resolution', 3),
('Budget Management', 3),
('Staff Development', 3);
