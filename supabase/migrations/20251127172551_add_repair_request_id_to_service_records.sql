-- Link service records to repair requests for richer reporting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_records' AND column_name = 'repair_request_id'
  ) THEN
    ALTER TABLE service_records ADD COLUMN repair_request_id UUID REFERENCES repair_requests(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_records_repair_request_id ON service_records(repair_request_id);

