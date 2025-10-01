-- Adding Google Places API data fields to restaurant experience columns
-- Drop and recreate candidate_experience table with Google Places data
DROP TABLE IF EXISTS candidate_experience CASCADE;

CREATE TABLE candidate_experience (
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    
    -- Experience 1 (Most Recent) - Required
    exp1_role TEXT,
    exp1_start_month TEXT,
    exp1_start_year INTEGER,
    exp1_end_month TEXT,
    exp1_end_year INTEGER,
    exp1_restaurant_place_id TEXT,
    exp1_restaurant_name TEXT,
    exp1_restaurant_address TEXT,
    exp1_restaurant_price_level INTEGER,
    exp1_restaurant_types TEXT[], -- Array of place types
    exp1_restaurant_rating DECIMAL(2,1),
    exp1_restaurant_user_ratings_total INTEGER,
    
    -- Experience 2 (Other) - Optional
    exp2_role TEXT,
    exp2_start_month TEXT,
    exp2_start_year INTEGER,
    exp2_end_month TEXT,
    exp2_end_year INTEGER,
    exp2_restaurant_place_id TEXT,
    exp2_restaurant_name TEXT,
    exp2_restaurant_address TEXT,
    exp2_restaurant_price_level INTEGER,
    exp2_restaurant_types TEXT[],
    exp2_restaurant_rating DECIMAL(2,1),
    exp2_restaurant_user_ratings_total INTEGER,
    
    -- Experience 3 (Other) - Optional
    exp3_role TEXT,
    exp3_start_month TEXT,
    exp3_start_year INTEGER,
    exp3_end_month TEXT,
    exp3_end_year INTEGER,
    exp3_restaurant_place_id TEXT,
    exp3_restaurant_name TEXT,
    exp3_restaurant_address TEXT,
    exp3_restaurant_price_level INTEGER,
    exp3_restaurant_types TEXT[],
    exp3_restaurant_rating DECIMAL(2,1),
    exp3_restaurant_user_ratings_total INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE candidate_experience ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own experience data" ON candidate_experience
    FOR ALL USING (true);
