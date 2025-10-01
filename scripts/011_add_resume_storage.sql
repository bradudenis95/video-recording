-- Add resume storage bucket and update candidates table
-- Create resume storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-resumes', 'candidate-resumes', false);

-- Add RLS policies for resume bucket
CREATE POLICY "Users can upload their own resumes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'candidate-resumes');

CREATE POLICY "Users can view their own resumes" ON storage.objects
FOR SELECT USING (bucket_id = 'candidate-resumes');

CREATE POLICY "Users can update their own resumes" ON storage.objects
FOR UPDATE USING (bucket_id = 'candidate-resumes');

CREATE POLICY "Users can delete their own resumes" ON storage.objects
FOR DELETE USING (bucket_id = 'candidate-resumes');

-- Add resume_url column to candidates table
ALTER TABLE candidates ADD COLUMN resume_url TEXT;
