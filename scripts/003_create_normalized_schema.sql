-- Create storage bucket for candidate headshots
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-headshots', 'candidate-headshots', true);

-- Create storage policy for headshots
CREATE POLICY "Anyone can view headshots" ON storage.objects FOR SELECT USING (bucket_id = 'candidate-headshots');
CREATE POLICY "Authenticated users can upload headshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'candidate-headshots' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own headshots" ON storage.objects FOR UPDATE USING (bucket_id = 'candidate-headshots' AND auth.role() = 'authenticated');

-- Create candidates table
CREATE TABLE candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    location TEXT,
    position VARCHAR(100),
    bio TEXT CHECK (char_length(bio) <= 250),
    skills JSONB, -- Store selected skills as JSON array
    headshot_url TEXT, -- URL to image in Supabase Storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create candidate_experience table
CREATE TABLE candidate_experience (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    restaurant TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate_shifts table (for shift availability)
CREATE TABLE candidate_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL, -- 'monday', 'tuesday', etc.
    shift_type VARCHAR(10) NOT NULL, -- 'lunch' or 'dinner'
    available BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate_availability table (for interview slots)
CREATE TABLE candidate_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    available_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reference tables for positions and skills
CREATE TABLE positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE skill_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES skill_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample positions
INSERT INTO positions (name) VALUES 
    ('Server'),
    ('Bartender'),
    ('Host/Hostess'),
    ('Kitchen Staff'),
    ('Manager'),
    ('Busser'),
    ('Food Runner'),
    ('Dishwasher');

-- Insert skill categories
INSERT INTO skill_categories (name) VALUES 
    ('Customer Service'),
    ('Kitchen Skills'),
    ('Technical Skills');

-- Insert sample skills
WITH categories AS (
    SELECT id, name FROM skill_categories
)
INSERT INTO skills (name, category_id) VALUES 
    -- Customer Service Skills
    ('Excellent Communication', (SELECT id FROM categories WHERE name = 'Customer Service')),
    ('Problem Solving', (SELECT id FROM categories WHERE name = 'Customer Service')),
    ('Team Collaboration', (SELECT id FROM categories WHERE name = 'Customer Service')),
    ('Conflict Resolution', (SELECT id FROM categories WHERE name = 'Customer Service')),
    ('Sales Experience', (SELECT id FROM categories WHERE name = 'Customer Service')),
    ('Multilingual', (SELECT id FROM categories WHERE name = 'Customer Service')),
    
    -- Kitchen Skills
    ('Food Preparation', (SELECT id FROM categories WHERE name = 'Kitchen Skills')),
    ('Cooking Techniques', (SELECT id FROM categories WHERE name = 'Kitchen Skills')),
    ('Food Safety', (SELECT id FROM categories WHERE name = 'Kitchen Skills')),
    ('Inventory Management', (SELECT id FROM categories WHERE name = 'Kitchen Skills')),
    ('Menu Knowledge', (SELECT id FROM categories WHERE name = 'Kitchen Skills')),
    ('Speed & Efficiency', (SELECT id FROM categories WHERE name = 'Kitchen Skills')),
    
    -- Technical Skills
    ('POS Systems', (SELECT id FROM categories WHERE name = 'Technical Skills')),
    ('Cash Handling', (SELECT id FROM categories WHERE name = 'Technical Skills')),
    ('Scheduling Software', (SELECT id FROM categories WHERE name = 'Technical Skills')),
    ('Social Media', (SELECT id FROM categories WHERE name = 'Technical Skills')),
    ('Basic Computer Skills', (SELECT id FROM categories WHERE name = 'Technical Skills')),
    ('Mobile Apps', (SELECT id FROM categories WHERE name = 'Technical Skills'));

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now, can be restricted later)
CREATE POLICY "Enable all operations for candidates" ON candidates FOR ALL USING (true);
CREATE POLICY "Enable all operations for candidate_experience" ON candidate_experience FOR ALL USING (true);
CREATE POLICY "Enable all operations for candidate_shifts" ON candidate_shifts FOR ALL USING (true);
CREATE POLICY "Enable all operations for candidate_availability" ON candidate_availability FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_phone ON candidates(phone_number);
CREATE INDEX idx_candidate_experience_candidate_id ON candidate_experience(candidate_id);
CREATE INDEX idx_candidate_shifts_candidate_id ON candidate_shifts(candidate_id);
CREATE INDEX idx_candidate_availability_candidate_id ON candidate_availability(candidate_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for candidates table
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
