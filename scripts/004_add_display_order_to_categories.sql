-- Add display_order column to skill_categories table
ALTER TABLE skill_categories ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update existing categories with sequential order
UPDATE skill_categories 
SET display_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at) 
  FROM skill_categories sc2 
  WHERE sc2.id = skill_categories.id
);

-- Create index for better performance
CREATE INDEX idx_skill_categories_display_order ON skill_categories(display_order);
