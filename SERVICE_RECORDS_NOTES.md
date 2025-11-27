# Service Records Notes

- New Service Records module: UI at `/service-records`, API at `app/api/service-records`.
- Import: `run-import-cli.ts` now pulls enriched service records from Airtable (cost, mileage, mechanic, status, classification, repair link when available).
- Migration to run: `supabase/add_service_record_links.sql` (adds `repair_request_id` to `service_records`). Run in Supabase SQL Editor, then rerun the CLI import to backfill links.
- Airtable access: Departments/Vehicles tables still return 403; grant access and rerun import to pull real departments and improve vehicle linking.
- Post-import counts (latest): vehicles 262, service_records 362, repair_requests 533.
