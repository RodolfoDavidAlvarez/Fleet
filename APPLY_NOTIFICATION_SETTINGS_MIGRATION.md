# Apply Notification Settings Migration

## 🎯 What This Does

Creates two new tables to persist:
1. **Notification Assignments** - Which admins receive which notifications
2. **Message Templates** - Customizable message templates for driver notifications

## 🚀 Quick Apply (Recommended)

### Option 1: Supabase SQL Editor

1. **Go to SQL Editor:**
   - https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new

2. **Copy and paste this SQL:**

```sql
-- Migration: Notification Settings and Message Templates
-- Stores which admins are assigned to receive which notifications
-- Stores customizable message templates for driver notifications

-- Create notification_assignments table
CREATE TABLE IF NOT EXISTS notification_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
  admin_user_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_type)
);

-- Create notification_message_templates table
CREATE TABLE IF NOT EXISTS notification_message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL UNIQUE,
  message_en TEXT NOT NULL,
  message_es TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_assignments_type ON notification_assignments(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_message_templates(notification_type);

-- Create trigger for notification_assignments updated_at
DROP TRIGGER IF EXISTS update_notification_assignments_updated_at ON notification_assignments;
CREATE TRIGGER update_notification_assignments_updated_at
  BEFORE UPDATE ON notification_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for notification_message_templates updated_at
DROP TRIGGER IF EXISTS update_notification_message_templates_updated_at ON notification_message_templates;
CREATE TRIGGER update_notification_message_templates_updated_at
  BEFORE UPDATE ON notification_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

3. **Click "Run"**

4. **Verify Success:**
   You should see: "Success. No rows returned"

## ✅ Verify Migration

Run this query to confirm the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notification_assignments', 'notification_message_templates');
```

You should see both tables listed.

## 📊 What Gets Created

### Table 1: `notification_assignments`
- `id` - UUID primary key
- `notification_type` - e.g., "email_admin_new_repair", "sms_admin_new_repair"
- `admin_user_ids` - Array of admin user IDs who should receive this notification
- `created_at`, `updated_at` - Timestamps

### Table 2: `notification_message_templates`
- `id` - UUID primary key
- `notification_type` - e.g., "sms_repair_submission", "email_repair_booking_link"
- `message_en` - English message template
- `message_es` - Spanish message template
- `created_at`, `updated_at` - Timestamps

## 🔄 After Migration

Once this migration is applied:
1. ✅ Admin notification assignments will persist across page refreshes
2. ✅ Driver message templates will be saved and loaded correctly
3. ✅ All changes in the Settings page will be stored in the database

## 🆘 Troubleshooting

### If you see "function update_updated_at_column() does not exist"

Run this first:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

Then run the migration again.

### If you see "relation already exists"

That's OK! It means the tables are already there. The migration uses `IF NOT EXISTS` to be safe.


