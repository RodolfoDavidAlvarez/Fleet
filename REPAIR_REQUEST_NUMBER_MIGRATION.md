# Repair Request Sequential Number Migration

## Overview

Changed repair request identifiers from long UUIDs (e.g., `#67d3aa8d-cbc1-4b2f-a3e1-0ca9a292751e`) to short sequential numbers (e.g., `#1`, `#2`, `#3`) for better readability in SMS and email notifications.

## Changes Made

### 1. Database Migration

**File:** `supabase/migrations/20250101000000_add_sequential_request_number.sql`

- Added `request_number` INTEGER column to `repair_requests` table
- Created `repair_request_number_seq` sequence for generating sequential numbers
- Created trigger `trigger_assign_repair_request_number` to automatically assign numbers on insert
- Populated existing records with sequential numbers (starting from 1)
- Created index on `request_number` for faster lookups

### 2. TypeScript Types

**File:** `types/index.ts`

- Added `requestNumber?: number` field to `RepairRequest` interface

### 3. Database Functions

**File:** `lib/db.ts`

- Updated `rowToRepairRequest()` to include `requestNumber` field
- Updated `repairRequestToRow()` to include `request_number` field
- Removed manual RPC call (now handled by database trigger)

### 4. SMS Notifications

**File:** `lib/twilio.ts`

- Updated `sendRepairSubmissionNotice()` to accept `requestNumber` parameter
- Changed message format to use `#${requestNumber}` instead of full UUID
- Falls back to last 8 characters of UUID if `requestNumber` is not available

### 5. Email Notifications

**File:** `lib/email.ts`

- Updated `sendRepairSubmissionEmail()` to accept `requestNumber` parameter
- Changed email subject and body to use `#${requestNumber}` instead of full UUID
- Falls back to last 8 characters of UUID if `requestNumber` is not available

### 6. API Routes

**File:** `app/api/repair-requests/route.ts`

- Updated SMS notification call to pass `requestNumber`
- Updated email notification call to pass `requestNumber`

## How It Works

1. **Automatic Assignment**: When a new repair request is created, the database trigger automatically assigns the next sequential number from the sequence.

2. **Display Format**:

   - New requests: `#1`, `#2`, `#3`, etc.
   - Old requests (if any): Will be assigned numbers starting from 1 based on creation date

3. **Backward Compatibility**:
   - Code falls back to showing last 8 characters of UUID if `requestNumber` is not available
   - UUID `id` field is still used internally for database relationships

## Migration Steps

1. **Run the migration**:

   ```sql
   -- Apply the migration file
   \i supabase/migrations/20250101000000_add_sequential_request_number.sql
   ```

2. **Verify the migration**:

   ```sql
   -- Check that the column exists
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'repair_requests' AND column_name = 'request_number';

   -- Check that existing records have numbers
   SELECT id, request_number, created_at
   FROM repair_requests
   ORDER BY created_at;

   -- Check the sequence
   SELECT last_value FROM repair_request_number_seq;
   ```

3. **Test a new repair request**:
   - Create a new repair request
   - Verify it gets a sequential number
   - Check SMS notification shows the short number
   - Check email notification shows the short number

## Example Output

**Before:**

```
Repair request received (#67d3aa8d-cbc1-4b2f-a3e1-0ca9a292751e). Your request has been submitted and will be reviewed soon.
```

**After:**

```
Repair request received (#1). Your request has been submitted and will be reviewed soon.
```

## Notes

- The UUID `id` field is still the primary key and used for all database relationships
- The `request_number` is only for display purposes in user-facing communications
- Sequential numbers start from 1 and increment automatically
- Existing records will be assigned numbers based on their creation date (oldest first)

