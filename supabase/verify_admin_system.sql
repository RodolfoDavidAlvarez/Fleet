-- Verification Script: Check if Admin System is Properly Set Up
-- Run this to verify all tables, columns, and indexes are in place

-- Check if users table has new columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('approval_status', 'last_seen_at')
ORDER BY column_name;

-- Check if notifications table exists
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications') as column_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'notifications';

-- Check if notification_recipients table exists
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notification_recipients') as column_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'notification_recipients';

-- Check if indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_notifications_created_at',
    'idx_notifications_recipient_roles',
    'idx_notification_recipients_user_id',
    'idx_notification_recipients_notification_id',
    'idx_users_approval_status',
    'idx_users_last_seen_at'
  )
ORDER BY tablename, indexname;

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'update_notifications_updated_at';

-- Check RLS policies for notifications tables
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('notifications', 'notification_recipients')
ORDER BY tablename, policyname;

-- Summary
SELECT 
  'Users with approval_status' as check_item,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'approval_status'
UNION ALL
SELECT 
  'Users with last_seen_at' as check_item,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'last_seen_at'
UNION ALL
SELECT 
  'Notifications table exists' as check_item,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notifications'
UNION ALL
SELECT 
  'Notification recipients table exists' as check_item,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notification_recipients';




