-- Create questionnaire responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Page 1: Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  location TEXT,
  position TEXT,
  
  -- Page 2: Bio and Skills
  bio TEXT CHECK (char_length(bio) <= 250),
  selected_skills JSONB DEFAULT '[]'::jsonb,
  
  -- Page 4: Availability
  shift_availability JSONB DEFAULT '{}'::jsonb,
  interview_slots JSONB DEFAULT '[]'::jsonb,
  
  -- Status tracking
  current_page INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Create previous experience table (Page 3)
CREATE TABLE IF NOT EXISTS previous_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID REFERENCES questionnaire_responses(id) ON DELETE CASCADE,
  experience_number INTEGER NOT NULL CHECK (experience_number BETWEEN 1 AND 3),
  role TEXT,
  start_date DATE,
  end_date DATE,
  restaurant TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills reference table
CREATE TABLE IF NOT EXISTS available_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create positions reference table
CREATE TABLE IF NOT EXISTS available_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample positions
INSERT INTO available_positions (position_name) VALUES
  ('Server'),
  ('Bartender'),
  ('Host/Hostess'),
  ('Kitchen Staff'),
  ('Manager'),
  ('Busser'),
  ('Chef'),
  ('Line Cook')
ON CONFLICT DO NOTHING;

-- Insert sample skills by category
INSERT INTO available_skills (category, skill_name) VALUES
  -- Customer Service Skills
  ('Customer Service', 'Excellent Communication'),
  ('Customer Service', 'Problem Solving'),
  ('Customer Service', 'Active Listening'),
  ('Customer Service', 'Patience'),
  ('Customer Service', 'Conflict Resolution'),
  ('Customer Service', 'Upselling'),
  ('Customer Service', 'Multi-tasking'),
  ('Customer Service', 'Team Collaboration'),
  
  -- Technical Skills
  ('Technical', 'POS Systems'),
  ('Technical', 'Cash Handling'),
  ('Technical', 'Inventory Management'),
  ('Technical', 'Food Safety Certification'),
  ('Technical', 'Wine Knowledge'),
  ('Technical', 'Cocktail Preparation'),
  ('Technical', 'Food Preparation'),
  ('Technical', 'Equipment Operation'),
  
  -- Personal Attributes
  ('Personal', 'Reliability'),
  ('Personal', 'Flexibility'),
  ('Personal', 'Leadership'),
  ('Personal', 'Time Management'),
  ('Personal', 'Attention to Detail'),
  ('Personal', 'Physical Stamina'),
  ('Personal', 'Stress Management'),
  ('Personal', 'Adaptability')
ON CONFLICT DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE previous_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public questionnaire)
-- Note: For a public questionnaire, we allow anyone to create and read their own responses
CREATE POLICY "Allow public insert on questionnaire_responses" 
  ON questionnaire_responses FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public select on questionnaire_responses" 
  ON questionnaire_responses FOR SELECT 
  USING (true);

CREATE POLICY "Allow public update on questionnaire_responses" 
  ON questionnaire_responses FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public insert on previous_experience" 
  ON previous_experience FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public select on previous_experience" 
  ON previous_experience FOR SELECT 
  USING (true);

CREATE POLICY "Allow public update on previous_experience" 
  ON previous_experience FOR UPDATE 
  USING (true);

-- Allow public read access to reference tables
CREATE POLICY "Allow public select on available_skills" 
  ON available_skills FOR SELECT 
  USING (true);

CREATE POLICY "Allow public select on available_positions" 
  ON available_positions FOR SELECT 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_created_at ON questionnaire_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_previous_experience_questionnaire_id ON previous_experience(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_available_skills_category ON available_skills(category);
