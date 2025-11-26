# Airtable Data Import Plan

## ✅ Setup Complete

- [x] Airtable API package installed
- [x] API credentials configured in `.env.local`
- [x] Base ID identified: `appms3yBT9I2DEGl3`
- [x] Import tools created
- [x] Exploration API endpoints ready

## 📊 Data Import Strategy

### Phase 1: Discovery (Current Step)

**Goal**: Understand your Airtable structure

1. **List all tables**
   - Endpoint: `GET /api/airtable/explore?action=tables`
   - This shows all tables with their fields

2. **Identify key tables**
   - Vehicles/Fleet table
   - Drivers table (for phone numbers)
   - Mechanics table
   - Bookings/Appointments table
   - Service Records (if exists)

3. **Map field names**
   - Document exact field names from Airtable
   - Identify phone number fields
   - Identify email fields
   - Identify date/time fields

### Phase 2: Field Mapping

**Goal**: Create mappings from Airtable to your database

For each table, we'll create a mapping like:

```json
{
  "tableName": "Vehicles",
  "entityType": "vehicle",
  "fieldMapping": {
    "Airtable Field Name": "databaseFieldName"
  }
}
```

### Phase 3: Data Import

**Goal**: Import data into Supabase

1. **Test import** (dry run)
   - Validate mappings
   - Check for errors
   - Review sample data

2. **Actual import**
   - Import vehicles
   - Import mechanics
   - Import drivers (if separate table)
   - Import bookings
   - Import service records

### Phase 4: Data Validation

**Goal**: Verify imported data

1. Check record counts
2. Verify phone numbers format
3. Validate relationships
4. Test SMS functionality with imported phone numbers

## 🔍 Key Data Points to Extract

### Driver Phone Numbers
- **Priority**: High
- **Location**: Could be in:
  - Drivers table
  - Vehicles table (if driver linked to vehicle)
  - Bookings table (customer phone)
- **Format**: Will be normalized to `+1XXXXXXXXXX` format

### Mechanics
- Name
- Email
- Phone
- Specializations
- Availability status

### Vehicles
- Make, Model, Year
- VIN
- License Plate
- Status
- Mileage
- Service history

### Bookings
- Customer information (name, email, phone)
- Service type
- Scheduled date/time
- Status
- Linked vehicle
- Assigned mechanic

## 🚀 Next Steps

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Explore your Airtable base:**
   ```
   http://localhost:3000/api/airtable/explore?action=tables
   ```

3. **Share the results** so we can:
   - Identify table names
   - Create field mappings
   - Set up the import process

## 📝 Import Endpoints

### Explore Tables
```
GET /api/airtable/explore?action=tables
```
Returns all tables with their fields

### Explore Table Schema
```
GET /api/airtable/explore?table=TableName&action=schema
```
Returns field names and types for a specific table

### Get Sample Records
```
GET /api/airtable/explore?table=TableName&action=records
```
Returns first 10 records from a table

### Import Data
```
POST /api/airtable/import
Body: {
  "tableName": "TableName",
  "entityType": "vehicle" | "mechanic" | "booking",
  "fieldMapping": { ... },
  "dryRun": true  // optional, for testing
}
```

## 🔒 Security Notes

- API key is stored in `.env.local` (gitignored)
- Never commit `.env.local` to version control
- Token has read/write access to your base
- Keep token secure

## 📞 Support

If you encounter issues:
1. Check that the dev server is running
2. Verify API key in `.env.local`
3. Check browser console for errors
4. Review API response for error messages

---

**Status**: Ready to explore your Airtable base!
**Next Action**: Run `npm run dev` and visit the explore endpoint


