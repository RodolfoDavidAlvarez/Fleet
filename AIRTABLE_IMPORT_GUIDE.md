# Airtable Import Guide

This guide will help you import data from your Airtable base into the Fleet Management System.

## ✅ What We Have

- **Base ID**: `appms3yBT9I2DEGl3` (extracted from your URL)
- **Airtable Package**: Installed and ready
- **Import Tools**: Created and ready to use

## 🔑 What You Need to Do

### Step 1: Get Your Airtable API Key

1. Go to https://airtable.com/create/tokens
2. Click **"Create new token"**
3. Name it: "Fleet Management Import"
4. Grant access to your base: `appms3yBT9I2DEGl3`
5. Copy the token (it starts with `pat...`)

### Step 2: Add API Key to Environment Variables

Add this to your `.env.local` file:

```env
# Airtable Configuration
AIRTABLE_API_KEY=pat...your_token_here
AIRTABLE_BASE_ID=appms3yBT9I2DEGl3
```

**Note**: The Base ID is already set in the code, but you can override it with this env variable.

### Step 3: Discover Your Table Structure

Once you have the API key set up, you can explore your Airtable base:

#### Option A: Use the API Endpoint (Recommended)

1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/airtable/explore?table=TableName&action=schema`
   - Replace `TableName` with your actual table name (e.g., "Vehicles", "Drivers", "Mechanics")

Example:
```
http://localhost:3000/api/airtable/explore?table=Vehicles&action=schema
```

This will show you:
- All field names in the table
- Field types
- Sample values

#### Option B: Get Sample Records

To see actual data:
```
http://localhost:3000/api/airtable/explore?table=Vehicles&action=records
```

## 📊 Common Table Names to Check

Based on your fleet management system, check for these tables:

1. **Vehicles** (or "Fleet", "Cars", "Trucks")
2. **Drivers** (or "Drivers List", "Employees")
3. **Mechanics** (or "Technicians", "Staff")
4. **Bookings** (or "Appointments", "Service Requests")
5. **Service Records** (or "Maintenance History")

## 🔄 Import Process

### Step 1: Map Fields

For each table you want to import, you need to create a field mapping. This tells the system which Airtable field maps to which database field.

Example for Vehicles:
```json
{
  "tableName": "Vehicles",
  "entityType": "vehicle",
  "fieldMapping": {
    "Make": "make",
    "Model": "model",
    "Year": "year",
    "VIN": "vin",
    "License Plate": "licensePlate",
    "Status": "status",
    "Mileage": "mileage",
    "Last Service": "lastServiceDate"
  }
}
```

### Step 2: Test Import (Dry Run)

Before importing, test with a dry run:

```bash
curl -X POST http://localhost:3000/api/airtable/import \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "Vehicles",
    "entityType": "vehicle",
    "fieldMapping": {
      "Make": "make",
      "Model": "model",
      "Year": "year",
      "VIN": "vin",
      "License Plate": "licensePlate"
    },
    "dryRun": true
  }'
```

### Step 3: Actual Import

Once you're confident with the mapping, remove `"dryRun": true`:

```bash
curl -X POST http://localhost:3000/api/airtable/import \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "Vehicles",
    "entityType": "vehicle",
    "fieldMapping": {
      "Make": "make",
      "Model": "model",
      "Year": "year",
      "VIN": "vin",
      "License Plate": "licensePlate"
    }
  }'
```

## 📋 Field Mapping Examples

### Vehicles Table

```json
{
  "tableName": "Vehicles",
  "entityType": "vehicle",
  "fieldMapping": {
    "Make": "make",
    "Model": "model",
    "Year": "year",
    "VIN Number": "vin",
    "License Plate": "licensePlate",
    "Status": "status",
    "Current Mileage": "mileage",
    "Last Service Date": "lastServiceDate",
    "Next Service Due": "nextServiceDue"
  }
}
```

### Mechanics Table

```json
{
  "tableName": "Mechanics",
  "entityType": "mechanic",
  "fieldMapping": {
    "Name": "name",
    "Email": "email",
    "Phone": "phone",
    "Specializations": "specializations",
    "Availability": "availability"
  }
}
```

### Drivers Table

If you have a separate drivers table, you might need to:
1. Import drivers as users (if they need system access)
2. Link drivers to vehicles
3. Store driver phone numbers for SMS notifications

### Bookings Table

```json
{
  "tableName": "Bookings",
  "entityType": "booking",
  "fieldMapping": {
    "Customer Name": "customerName",
    "Customer Email": "customerEmail",
    "Customer Phone": "customerPhone",
    "Service Type": "serviceType",
    "Scheduled Date": "scheduledDate",
    "Scheduled Time": "scheduledTime",
    "Status": "status",
    "Notes": "notes"
  }
}
```

## 🔍 Finding Field Names

1. Use the explore endpoint to see exact field names
2. Field names in Airtable are case-sensitive
3. Check for spaces, special characters, or different naming conventions

## ⚠️ Important Notes

1. **Phone Numbers**: The system will automatically normalize phone numbers (adds +1 for US numbers if missing)

2. **Status Values**: Make sure status values match:
   - Vehicles: `active`, `in_service`, `retired`
   - Bookings: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`
   - Mechanics: `available`, `busy`, `unavailable`

3. **Required Fields**:
   - Vehicles: `make`, `model`, `year`, `vin`, `licensePlate`
   - Mechanics: `name`, `email`, `phone`
   - Bookings: `customerName`, `customerEmail`, `customerPhone`, `serviceType`, `scheduledDate`, `scheduledTime`

4. **Linked Records**: If your Airtable uses linked records (e.g., Booking → Vehicle), you'll need to handle those relationships separately.

## 🚀 Quick Start Checklist

- [ ] Get Airtable API key from https://airtable.com/create/tokens
- [ ] Add `AIRTABLE_API_KEY` to `.env.local`
- [ ] Start dev server: `npm run dev`
- [ ] Explore your tables: Visit `/api/airtable/explore?table=TableName&action=schema`
- [ ] Create field mappings for each table
- [ ] Test import with `dryRun: true`
- [ ] Run actual import

## 📞 Need Help?

If you encounter issues:
1. Check that your API key is correct
2. Verify table names match exactly (case-sensitive)
3. Check field names match exactly
4. Review the error messages in the API response

---

**Next Steps**: Once you have your API key, we can start exploring your Airtable structure and create the exact field mappings needed!





