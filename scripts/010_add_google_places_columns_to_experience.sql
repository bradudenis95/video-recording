-- Add Google Places API data columns to candidate_experience table
ALTER TABLE candidate_experience 
ADD COLUMN restaurant_1_place_id TEXT,
ADD COLUMN restaurant_1_business_name TEXT,
ADD COLUMN restaurant_1_address TEXT,
ADD COLUMN restaurant_1_price_level INTEGER,
ADD COLUMN restaurant_1_types TEXT[], -- Array of place types
ADD COLUMN restaurant_1_rating DECIMAL(2,1),
ADD COLUMN restaurant_1_user_ratings_total INTEGER,

ADD COLUMN restaurant_2_place_id TEXT,
ADD COLUMN restaurant_2_business_name TEXT,
ADD COLUMN restaurant_2_address TEXT,
ADD COLUMN restaurant_2_price_level INTEGER,
ADD COLUMN restaurant_2_types TEXT[],
ADD COLUMN restaurant_2_rating DECIMAL(2,1),
ADD COLUMN restaurant_2_user_ratings_total INTEGER,

ADD COLUMN restaurant_3_place_id TEXT,
ADD COLUMN restaurant_3_business_name TEXT,
ADD COLUMN restaurant_3_address TEXT,
ADD COLUMN restaurant_3_price_level INTEGER,
ADD COLUMN restaurant_3_types TEXT[],
ADD COLUMN restaurant_3_rating DECIMAL(2,1),
ADD COLUMN restaurant_3_user_ratings_total INTEGER;

-- Add indexes for better query performance on place_id columns
CREATE INDEX IF NOT EXISTS idx_candidate_experience_restaurant_1_place_id ON candidate_experience(restaurant_1_place_id);
CREATE INDEX IF NOT EXISTS idx_candidate_experience_restaurant_2_place_id ON candidate_experience(restaurant_2_place_id);
CREATE INDEX IF NOT EXISTS idx_candidate_experience_restaurant_3_place_id ON candidate_experience(restaurant_3_place_id);
