# Airtable Import - Quick Start

## ✅ Setup Complete!

Your Airtable credentials have been configured:
- **API Key**: Added to `.env.local`
- **Base ID**: `appms3yBT9I2DEGl3`

## 🚀 Next Steps

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Discover Your Tables

Visit this URL in your browser to see all tables in your Airtable base:

```
http://localhost:3000/api/airtable/explore?action=tables
```

This will show you:
- All table names
- Field names in each table
- Field types

### 3. Explore a Specific Table

To see the structure and sample data for a specific table:

**Get table schema (field names and types):**
```
http://localhost:3000/api/airtable/explore?table=TableName&action=schema
```

**Get sample records:**
```
http://localhost:3000/api/airtable/explore?table=TableName&action=records
```

Replace `TableName` with your actual table name (e.g., "Vehicles", "Drivers", "Mechanics")

## 📋 What to Look For

Based on your fleet management system, you likely have tables for:

1. **Vehicles/Fleet** - Vehicle information
   - Look for: Make, Model, Year, VIN, License Plate, Mileage, Status
   - Driver phone numbers might be here or in a separate Drivers table

2. **Drivers** - Driver information
   - Look for: Name, Phone Number, Email
   - This is where we'll get driver phone numbers for SMS

3. **Mechanics** - Mechanic information
   - Look for: Name, Phone, Email, Specializations

4. **Bookings/Appointments** - Service bookings
   - Look for: Customer info, Service type, Date, Time, Status

## 🔍 Example Usage

Once you know your table names, here are some examples:

### Example 1: List all tables
```
http://localhost:3000/api/airtable/explore?action=tables
```

### Example 2: Explore "Vehicles" table
```
http://localhost:3000/api/airtable/explore?table=Vehicles&action=schema
```

### Example 3: See sample vehicle records
```
http://localhost:3000/api/airtable/explore?table=Vehicles&action=records
```

## 📞 Finding Driver Phone Numbers

Driver phone numbers could be in:
1. A "Drivers" table
2. A "Vehicles" table (if drivers are linked to vehicles)
3. A "Bookings" table (if customer phone is stored there)

Once you run the explore endpoint, we'll identify where the phone numbers are stored and create the appropriate import mapping.

## ⚡ Ready to Import?

After you've explored your tables and identified the field names, we can create the import mappings and start importing data!

---

**Start now**: Run `npm run dev` and visit `http://localhost:3000/api/airtable/explore?action=tables`




