-- Update candidate_experience table to use month/year format instead of full dates
ALTER TABLE candidate_experience 
DROP COLUMN IF EXISTS experience_1_start_date,
DROP COLUMN IF EXISTS experience_1_end_date,
DROP COLUMN IF EXISTS experience_2_start_date,
DROP COLUMN IF EXISTS experience_2_end_date,
DROP COLUMN IF EXISTS experience_3_start_date,
DROP COLUMN IF EXISTS experience_3_end_date;

ALTER TABLE candidate_experience 
ADD COLUMN experience_1_start_month VARCHAR(20),
ADD COLUMN experience_1_start_year INTEGER,
ADD COLUMN experience_1_end_month VARCHAR(20),
ADD COLUMN experience_1_end_year INTEGER,
ADD COLUMN experience_2_start_month VARCHAR(20),
ADD COLUMN experience_2_start_year INTEGER,
ADD COLUMN experience_2_end_month VARCHAR(20),
ADD COLUMN experience_2_end_year INTEGER,
ADD COLUMN experience_3_start_month VARCHAR(20),
ADD COLUMN experience_3_start_year INTEGER,
ADD COLUMN experience_3_end_month VARCHAR(20),
ADD COLUMN experience_3_end_year INTEGER;
