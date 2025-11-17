-- Add conseiller fields to project_responses table

-- Add conseiller_status column (OK, Rappeler, No OK)
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS conseiller_status TEXT CHECK (conseiller_status IN ('OK', 'Rappeler', 'No OK'));

-- Add conseiller_comment column
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS conseiller_comment TEXT;

-- Add timestamp for when conseiller last updated
ALTER TABLE project_responses 
ADD COLUMN IF NOT EXISTS conseiller_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN project_responses.conseiller_status IS 'Status set by conseiller: OK, Rappeler, or No OK';
COMMENT ON COLUMN project_responses.conseiller_comment IS 'Comment added by conseiller, visible to agent and admin';
COMMENT ON COLUMN project_responses.conseiller_updated_at IS 'Timestamp when conseiller last updated status or comment';
