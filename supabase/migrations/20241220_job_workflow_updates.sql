-- Job Workflow Implementation Migration
-- This migration adds support for the complete job workflow from application acceptance through completion

-- 1. Update Job Status Enum
ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('open', 'accepted', 'confirmed', 'in_progress', 'awaiting_review', 'completed', 'cancelled'));

-- 2. Update Applications Table
-- Add confirmed_at and denied_at timestamps
ALTER TABLE applications ADD COLUMN confirmed_at timestamp with time zone;
ALTER TABLE applications ADD COLUMN denied_at timestamp with time zone;

-- Update status enum to include confirmed and denied
ALTER TABLE applications DROP CONSTRAINT applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check 
  CHECK (status IN ('pending', 'accepted', 'confirmed', 'denied', 'rejected'));

-- 3. Create Job Updates Table
CREATE TABLE job_updates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  update_type text CHECK (update_type IN ('milestone', 'text', 'photo', 'completion')) NOT NULL,
  milestone text CHECK (milestone IN ('started', 'in_progress', 'awaiting_review', 'completed')),
  content text,
  photo_urls text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on job_updates
ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Job participants can view updates
CREATE POLICY "Job updates viewable by participants" ON job_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_id 
      AND (j.course_id = auth.uid() OR auth.uid() = professional_id)
    )
  );

-- RLS Policy: Professionals can create updates for their jobs
CREATE POLICY "Professionals can create job updates" ON job_updates
  FOR INSERT WITH CHECK (auth.uid() = professional_id);

-- RLS Policy: Professionals can update their own updates
CREATE POLICY "Professionals can update own job updates" ON job_updates
  FOR UPDATE USING (auth.uid() = professional_id);

-- 4. Create indexes for performance
CREATE INDEX idx_job_updates_job_id ON job_updates (job_id);
CREATE INDEX idx_job_updates_professional_id ON job_updates (professional_id);
CREATE INDEX idx_job_updates_created_at ON job_updates (created_at DESC);
CREATE INDEX idx_applications_confirmed_at ON applications (confirmed_at);
CREATE INDEX idx_applications_denied_at ON applications (denied_at);

-- 5. Update the professional rating trigger to handle new job statuses
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE professional_profiles
  SET 
    rating = (
      SELECT AVG(overall_rating)::DECIMAL(3,2)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_jobs = (
      SELECT COUNT(*)
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.professional_id = NEW.reviewee_id
      AND j.status = 'completed'
      AND a.status = 'confirmed'
    )
  WHERE profile_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Add trigger for job_updates updated_at
CREATE TRIGGER update_job_updates_updated_at BEFORE UPDATE ON job_updates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Create function to get active jobs for a user
CREATE OR REPLACE FUNCTION get_active_jobs(user_id UUID)
RETURNS TABLE (
  job_id UUID,
  job_title TEXT,
  job_status TEXT,
  course_name TEXT,
  professional_name TEXT,
  latest_update_id UUID,
  latest_update_content TEXT,
  latest_update_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id as job_id,
    j.title as job_title,
    j.status as job_status,
    gcp.course_name,
    pp.full_name as professional_name,
    ju.id as latest_update_id,
    ju.content as latest_update_content,
    ju.created_at as latest_update_created_at
  FROM jobs j
  LEFT JOIN applications a ON j.id = a.job_id AND a.status = 'confirmed'
  LEFT JOIN golf_course_profiles gcp ON j.course_id = gcp.profile_id
  LEFT JOIN professional_profiles pp ON a.professional_id = pp.profile_id
  LEFT JOIN LATERAL (
    SELECT id, content, created_at
    FROM job_updates
    WHERE job_id = j.id
    ORDER BY created_at DESC
    LIMIT 1
  ) ju ON true
  WHERE j.status IN ('confirmed', 'in_progress', 'awaiting_review')
  AND (
    j.course_id = user_id OR 
    a.professional_id = user_id
  )
  ORDER BY j.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get job history for a user
CREATE OR REPLACE FUNCTION get_job_history(user_id UUID)
RETURNS TABLE (
  job_id UUID,
  job_title TEXT,
  job_status TEXT,
  course_name TEXT,
  professional_name TEXT,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id as job_id,
    j.title as job_title,
    j.status as job_status,
    gcp.course_name,
    pp.full_name as professional_name,
    j.updated_at as completed_at
  FROM jobs j
  LEFT JOIN applications a ON j.id = a.job_id AND a.status = 'confirmed'
  LEFT JOIN golf_course_profiles gcp ON j.course_id = gcp.profile_id
  LEFT JOIN professional_profiles pp ON a.professional_id = pp.profile_id
  WHERE j.status = 'completed'
  AND (
    j.course_id = user_id OR 
    a.professional_id = user_id
  )
  ORDER BY j.updated_at DESC;
END;
$$ LANGUAGE plpgsql;
