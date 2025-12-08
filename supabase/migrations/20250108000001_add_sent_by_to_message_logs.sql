-- Add sent_by column to message_logs table
ALTER TABLE public.message_logs
ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES public.users(id);

-- Create index for sent_by
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_by ON public.message_logs(sent_by);
