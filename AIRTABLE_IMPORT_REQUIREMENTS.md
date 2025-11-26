# Airtable Import Requirements

To access and import data from your Airtable, I need the following information:

## 🔑 Required Credentials

### 1. Airtable API Key (Personal Access Token) ⚠️ STILL NEEDED
- **What it is**: Your personal access token to authenticate with Airtable API
- **How to get it**: 
  1. Go to https://airtable.com/create/tokens
  2. Click "Create new token"
  3. Give it a name (e.g., "Fleet Management Import")
  4. Grant access to your base(s)
  5. Copy the token (starts with `pat...`)
- **Format**: `pat...` (Personal Access Token)
- **Security**: Keep this secret! We'll store it in `.env.local`

### 2. Base ID ✅ OBTAINED
- **Status**: ✅ Found from your URL
- **Base ID**: `appms3yBT9I2DEGl3`
- **URL**: https://airtable.com/appms3yBT9I2DEGl3/pagB99mw6tyMMvQSk?vy5AG=sfsYhqHA2rlATXMds

## 📊 Base Structure Information

### 3. Table Names or IDs
Please provide the names of the main tables in your Airtable base. Based on your system, we likely need:
- **Vehicles table** (vehicle/driver information)
- **Mechanics table** (mechanic information)
- **Bookings/Appointments table** (service bookings)
- **Drivers table** (if separate from vehicles)
- **Service Records table** (if exists)
- **Any other relevant tables**

### 4. Field Mapping Information
For each table, I need to understand the field structure. Please provide:

#### For Vehicles/Drivers Table:
- Driver name field
- Driver phone number field
- Vehicle make/model/year fields
- VIN field
- License plate field
- Status field
- Mileage field
- Any other relevant fields

#### For Mechanics Table:
- Name field
- Email field
- Phone number field
- Specializations field (if exists)
- Availability/status field
- Any other relevant fields

#### For Bookings Table:
- Customer name field
- Customer email field
- Customer phone field
- Service type field
- Date/time fields
- Status field
- Vehicle reference field
- Mechanic reference field
- Any other relevant fields

## 🔍 Optional but Helpful

### 5. Sample Data Export
- Export a few sample records from each table (CSV or screenshot)
- This helps me understand the exact data format and structure

### 6. Relationships/Dependencies
- How tables are linked (e.g., which field links bookings to vehicles)
- Any lookup fields or linked records

### 7. Data Validation Rules
- Any specific formats for phone numbers, dates, etc.
- Status values used in your Airtable

## 📝 Quick Checklist

- [ ] Airtable Personal Access Token (`pat...`)
- [ ] Base ID (`app...`)
- [ ] List of table names
- [ ] Field names for each table (especially phone numbers, emails, names)
- [ ] Understanding of how tables relate to each other

## 🚀 Next Steps

Once you provide this information, I will:
1. Install the Airtable API package
2. Create an import script to fetch data from Airtable
3. Map Airtable fields to your database schema
4. Create an import API endpoint or script
5. Handle data transformation and validation
6. Import the data into your Supabase database

## 🔒 Security Note

All credentials will be stored in `.env.local` (which is gitignored) and never committed to the repository.

---

**Ready to start?** Please provide:
1. Your Airtable Personal Access Token
2. Your Base ID
3. The table names in your base
4. Key field names (especially phone numbers, emails, names)

