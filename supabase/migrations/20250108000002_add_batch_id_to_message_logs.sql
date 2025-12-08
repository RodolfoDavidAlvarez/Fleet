-- Add batch_id column to group messages from the same send operation
ALTER TABLE public.message_logs
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_subject TEXT;

-- Create index for efficient batch grouping
CREATE INDEX IF NOT EXISTS idx_message_logs_batch_id ON public.message_logs(batch_id);

-- Comment explaining the columns
COMMENT ON COLUMN public.message_logs.batch_id IS 'Groups messages sent together in a single announcement (e.g., to all drivers)';
COMMENT ON COLUMN public.message_logs.batch_subject IS 'Subject/title for the batch of messages';
