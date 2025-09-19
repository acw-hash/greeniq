-- Update application statuses to support the new flow
-- Add new status: 'accepted_by_course' and 'accepted_by_professional'

-- First, update any existing 'accepted' applications to 'accepted_by_course'
UPDATE applications 
SET status = 'accepted_by_course' 
WHERE status = 'accepted';

-- Update the check constraint to include new statuses
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_status_check,
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('pending', 'accepted_by_course', 'accepted_by_professional', 'rejected'));

-- Update jobs table to only change status when professional accepts
-- Jobs should remain 'open' until professional accepts, then become 'in_progress'
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS jobs_status_check,
ADD CONSTRAINT jobs_status_check 
CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'confirmed'));

-- Add comment to clarify the flow
COMMENT ON COLUMN applications.status IS 'Application status: pending -> accepted_by_course -> accepted_by_professional -> (job becomes in_progress)';
COMMENT ON COLUMN jobs.status IS 'Job status: open -> in_progress (when professional accepts) -> completed';
