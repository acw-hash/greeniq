-- =============================================================================
-- Job Lifecycle Management System - Database Migration
-- =============================================================================
-- This migration adds all necessary tables and columns for the job lifecycle
-- management system including job updates, conversations, and enhanced messaging.

-- Add completion_notes column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_notes text;

-- Update jobs table status constraint to include new statuses
ALTER TABLE jobs 
  DROP CONSTRAINT IF EXISTS jobs_status_check,
  ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'confirmed'));

-- Create job_conversations table
CREATE TABLE IF NOT EXISTS job_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  course_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(job_id)
);

-- Create job_updates table
CREATE TABLE IF NOT EXISTS job_updates (
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

-- Add conversation_id column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES job_conversations(id) ON DELETE CASCADE;

-- Enable Row Level Security on new tables
ALTER TABLE job_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;

-- Job conversations policies
CREATE POLICY IF NOT EXISTS "Job conversations viewable by participants" ON job_conversations
  FOR SELECT USING (
    course_id = auth.uid() OR professional_id = auth.uid()
  );

CREATE POLICY IF NOT EXISTS "System can create job conversations" ON job_conversations
  FOR INSERT WITH CHECK (true);

-- Job updates policies
CREATE POLICY IF NOT EXISTS "Job updates viewable by participants" ON job_updates
  FOR SELECT USING (
    professional_id = auth.uid() OR
    auth.uid() IN (SELECT course_id FROM jobs WHERE id = job_id)
  );

CREATE POLICY IF NOT EXISTS "Professionals can create job updates" ON job_updates
  FOR INSERT WITH CHECK (professional_id = auth.uid());

-- Update messages policies to include conversation-based access
DROP POLICY IF EXISTS "Messages viewable by job participants" ON messages;
CREATE POLICY "Messages viewable by job participants" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() IN (
      SELECT course_id FROM jobs WHERE id = job_id
      UNION
      SELECT professional_id FROM applications WHERE job_id = messages.job_id AND status = 'accepted'
    ) OR
    auth.uid() IN (
      SELECT course_id FROM job_conversations WHERE id = conversation_id
      UNION
      SELECT professional_id FROM job_conversations WHERE id = conversation_id
    )
  );

DROP POLICY IF EXISTS "Job participants can send messages" ON messages;
CREATE POLICY "Job participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    (auth.uid() IN (
      SELECT course_id FROM jobs WHERE id = job_id
      UNION
      SELECT professional_id FROM applications WHERE job_id = messages.job_id AND status = 'accepted'
    ) OR
    auth.uid() IN (
      SELECT course_id FROM job_conversations WHERE id = conversation_id
      UNION
      SELECT professional_id FROM job_conversations WHERE id = conversation_id
    ))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_updates_job_id ON job_updates (job_id);
CREATE INDEX IF NOT EXISTS idx_job_updates_created_at ON job_updates (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_conversations_job_id ON job_conversations (job_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);

-- Create function to automatically create job conversation when application is accepted
CREATE OR REPLACE FUNCTION create_job_conversation_on_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create conversation when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Insert job conversation
    INSERT INTO job_conversations (job_id, course_id, professional_id)
    SELECT 
      NEW.job_id,
      j.course_id,
      NEW.professional_id
    FROM jobs j
    WHERE j.id = NEW.job_id
    ON CONFLICT (job_id) DO NOTHING;
    
    -- Send welcome message
    INSERT INTO messages (conversation_id, job_id, sender_id, content, message_type)
    SELECT 
      jc.id,
      NEW.job_id,
      j.course_id,
      'Welcome! Your application has been accepted. Please coordinate the job details and start when ready.',
      'text'
    FROM job_conversations jc
    JOIN jobs j ON j.id = jc.job_id
    WHERE jc.job_id = NEW.job_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic conversation creation
DROP TRIGGER IF EXISTS trigger_create_job_conversation ON applications;
CREATE TRIGGER trigger_create_job_conversation
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_job_conversation_on_acceptance();

-- Create function to update job status when updates are created
CREATE OR REPLACE FUNCTION update_job_status_from_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update job status based on update type
  IF NEW.update_type = 'completed' THEN
    UPDATE jobs 
    SET status = 'completed', updated_at = now()
    WHERE id = NEW.job_id;
  ELSIF NEW.update_type = 'started' AND (SELECT status FROM jobs WHERE id = NEW.job_id) = 'in_progress' THEN
    -- Job is already in progress, no change needed
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic job status updates
DROP TRIGGER IF EXISTS trigger_update_job_status ON job_updates;
CREATE TRIGGER trigger_update_job_status
  AFTER INSERT ON job_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_job_status_from_updates();

-- Create function to send notifications for job updates
CREATE OR REPLACE FUNCTION notify_job_update()
RETURNS TRIGGER AS $$
DECLARE
  job_course_id uuid;
  update_title text;
  update_message text;
BEGIN
  -- Get the course_id for the job
  SELECT course_id INTO job_course_id
  FROM jobs
  WHERE id = NEW.job_id;
  
  -- Create notification message based on update type
  CASE NEW.update_type
    WHEN 'started' THEN
      update_title := 'Job Started';
      update_message := 'Your professional has started working on the job.';
    WHEN 'completed' THEN
      update_title := 'Job Completed';
      update_message := 'Your professional has completed the job.';
    WHEN 'progress' THEN
      update_title := 'Job Progress Update';
      update_message := 'Your professional has provided a progress update.';
    WHEN 'issue' THEN
      update_title := 'Job Issue Reported';
      update_message := 'Your professional has reported an issue with the job.';
    ELSE
      update_title := 'Job Update';
      update_message := 'Your professional has provided an update on the job.';
  END CASE;
  
  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    job_course_id,
    'job_update',
    update_title,
    update_message,
    jsonb_build_object(
      'job_id', NEW.job_id,
      'update_id', NEW.id,
      'update_type', NEW.update_type
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job update notifications
DROP TRIGGER IF EXISTS trigger_notify_job_update ON job_updates;
CREATE TRIGGER trigger_notify_job_update
  AFTER INSERT ON job_updates
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_update();

-- Create function to send notifications for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
BEGIN
  -- Determine recipient (the other participant in the conversation)
  IF NEW.conversation_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN course_id = NEW.sender_id THEN professional_id
        ELSE course_id
      END,
      p.full_name
    INTO recipient_id, sender_name
    FROM job_conversations jc
    JOIN profiles p ON p.id = NEW.sender_id
    WHERE jc.id = NEW.conversation_id;
    
    -- Insert notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      recipient_id,
      'message',
      'New Message',
      COALESCE(sender_name, 'Someone') || ' sent you a message.',
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'job_id', NEW.job_id,
        'sender_id', NEW.sender_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- The job lifecycle management system is now fully configured with:
-- 1. Job updates table for progress tracking
-- 2. Job conversations table for automatic messaging
-- 3. Enhanced messages table with conversation support
-- 4. Automatic triggers for conversation creation and notifications
-- 5. Proper RLS policies for security
-- 6. Performance indexes for optimal queries
-- =============================================================================
