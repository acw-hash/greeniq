-- Job updates/progress reports
CREATE TABLE job_updates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  update_type text CHECK (update_type IN ('started', 'progress', 'completed', 'issue')) NOT NULL,
  title text NOT NULL,
  description text,
  photos text[] DEFAULT '{}',
  location point,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Job conversations (automatic when application accepted)
CREATE TABLE job_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  course_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(job_id)
);

-- Update jobs table to include more statuses
ALTER TABLE jobs 
  DROP CONSTRAINT IF EXISTS jobs_status_check,
  ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'confirmed'));

-- Add RLS policies
ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_conversations ENABLE ROW LEVEL SECURITY;

-- Job updates: Viewable by job participants, creatable by professional
CREATE POLICY "Job updates viewable by participants" ON job_updates
  FOR SELECT USING (
    professional_id = auth.uid() OR
    auth.uid() IN (SELECT course_id FROM jobs WHERE id = job_id)
  );

CREATE POLICY "Professionals can create job updates" ON job_updates
  FOR INSERT WITH CHECK (professional_id = auth.uid());

-- Job conversations: Viewable and manageable by participants
CREATE POLICY "Job conversations viewable by participants" ON job_conversations
  FOR SELECT USING (
    course_id = auth.uid() OR professional_id = auth.uid()
  );

CREATE POLICY "System can create job conversations" ON job_conversations
  FOR INSERT WITH CHECK (true);

-- Messages: Update to use job_conversations
ALTER TABLE messages ADD COLUMN conversation_id uuid REFERENCES job_conversations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_job_updates_job_id ON job_updates (job_id);
CREATE INDEX idx_job_updates_created_at ON job_updates (created_at DESC);
CREATE INDEX idx_job_conversations_job_id ON job_conversations (job_id);
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
