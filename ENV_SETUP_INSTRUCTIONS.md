# Environment Setup Instructions

## Quick Setup

Your Airtable API token has been received. To set it up, you have two options:

### Option 1: Use the Setup Script (Easiest)

Run this command in your terminal:

```bash
bash setup-airtable-env.sh
```

This will automatically add the Airtable credentials to your `.env.local` file.

### Option 2: Manual Setup

1. Create or edit `.env.local` in the project root
2. Add these lines:

```env
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
```

## Verify Setup

After adding the credentials:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Test the connection:**
   Visit: `http://localhost:3000/api/airtable/explore?action=tables`

   This should show you all tables in your Airtable base.

## Next Steps

Once the connection is working:

1. **Discover your tables** - Use the explore endpoint to see all tables
2. **Identify field names** - See what fields exist in each table
3. **Find driver phone numbers** - Locate where phone numbers are stored
4. **Create import mappings** - Map Airtable fields to your database
5. **Import the data** - Run the import process

## Troubleshooting

If you get an error about missing API key:
- Make sure `.env.local` exists in the project root
- Verify the API key is correct (starts with `pat...`)
- Restart the dev server after adding the env variables

---

**Your Airtable Token:**
```
Replace with your actual Airtable Personal Access Token
```

**Your Base ID:**
```
Replace with your actual Airtable Base ID
```

