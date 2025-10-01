-- Add headshot_url column to questionnaire_responses table
ALTER TABLE questionnaire_responses 
ADD COLUMN headshot_url TEXT;

-- Create storage bucket for headshots if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('headshots', 'headshots', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for headshots bucket
CREATE POLICY "Anyone can upload headshots" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'headshots');

CREATE POLICY "Anyone can view headshots" ON storage.objects
FOR SELECT USING (bucket_id = 'headshots');

CREATE POLICY "Users can delete their own headshots" ON storage.objects
FOR DELETE USING (bucket_id = 'headshots');
