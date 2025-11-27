# Supabase MCP Server Setup for Cursor

## ✅ Installation Complete

The `mcp-supabase-db` package has been installed globally on your system.

## 📋 Configuration Steps

### Option 1: Using Supabase Hosted MCP Server (Recommended - Simpler)

This is the easiest option and doesn't require managing connection strings.

1. **Go to your Supabase Dashboard:**
   - Navigate to: https://kxcixjiafdohbpwijfmd.supabase.co
   - Log in to your account

2. **Find the MCP Connection Tab:**
   - In your Supabase project dashboard, look for the "MCP" or "Model Context Protocol" section
   - This should be in Settings or a dedicated MCP tab

3. **Configure Cursor:**
   - The dashboard will provide you with a configuration URL or instructions
   - You'll be prompted to authenticate with your Supabase account

### Option 2: Self-Hosted MCP Server (More Control)

If you prefer to use the installed `mcp-supabase-db` package:

#### Step 1: Get Your PostgreSQL Connection String

1. Go to your Supabase Dashboard: https://kxcixjiafdohbpwijfmd.supabase.co
2. Navigate to: **Settings** → **Database**
3. Scroll down to **"Connection string"** section
4. Select **"URI"** format
5. Copy the connection string (it looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)
6. **Important**: Use the **"Non-pooling"** connection string for MCP (port 5432, not 6543)

#### Step 2: Get Your Service Role Key

1. In Supabase Dashboard, go to: **Settings** → **API**
2. Find the **"service_role"** key (NOT the anon key)
3. Click "Reveal" and copy the entire key

#### Step 3: Update Cursor MCP Configuration

✅ **Configuration file created!** Located at: `.cursor/mcp.json`

The file has been created with your Supabase URL. You need to add your credentials:

**Option A: Using PostgreSQL Connection String (Recommended for full database access)**

Edit `.cursor/mcp.json` and add the `POSTGRES_URL_NON_POOLING`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/Users/rodolfoalvarez/.npm-global/bin/supabase-db-mcp",
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres",
        "SUPABASE_URL": "https://kxcixjiafdohbpwijfmd.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key-here"
      }
    }
  }
}
```

**Option B: Using Supabase API Only (Simpler, but limited)**

If you only need Supabase API features (not direct SQL), you can use:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/Users/rodolfoalvarez/.npm-global/bin/supabase-db-mcp",
      "env": {
        "SUPABASE_URL": "https://kxcixjiafdohbpwijfmd.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key-here"
      }
    }
  }
}
```

**To get your credentials:**
1. **PostgreSQL Connection String**: Supabase Dashboard → Settings → Database → Connection string → URI (use non-pooling, port 5432)
2. **Service Role Key**: Supabase Dashboard → Settings → API → service_role key (click Reveal)

#### Step 4: Restart Cursor

After creating the configuration file, restart Cursor completely for the changes to take effect.

## 🧪 Verify Installation

After configuration, you can verify the MCP server is working by:

1. **In Cursor**, try asking me to:
   - "List all tables in the Supabase database"
   - "Show me the schema of the vehicles table"
   - "Query the users table"

2. **Check MCP Resources:**
   The MCP server should expose resources like:
   - Database tables
   - Table schemas
   - Query capabilities

## 🔒 Security Notes

- **Never commit** your `.cursor/mcp.json` file with real credentials to git
- The service role key has full database access - keep it secret
- Consider using environment variables instead of hardcoding values

## 📚 Available MCP Tools

Once configured, the MCP server provides 56+ tools including:

- `query` - Run SQL queries
- `listTables` - List all database tables
- `getTableSchema` - Get schema for a specific table
- `insertRow`, `updateRow`, `deleteRow` - Data operations
- `createBackup` - Create database backups
- `rag` - Retrieval Augmented Generation for AI queries
- And many more!

## 🆘 Troubleshooting

### MCP Server Not Found
- Make sure `mcp-supabase-db` is installed globally: `npm list -g mcp-supabase-db`
- If not found, reinstall: `npm install -g mcp-supabase-db`

### Connection Errors
- Verify your PostgreSQL connection string is correct
- Make sure you're using the **non-pooling** connection (port 5432)
- Check that your service role key is correct and complete

### Cursor Not Recognizing MCP
- Ensure `.cursor/mcp.json` is in the correct location
- Try restarting Cursor completely
- Check Cursor's MCP settings in Preferences/Settings

## 📖 Additional Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [mcp-supabase-db GitHub](https://github.com/DynamicEndpoints/supabase-mcp)
- [MCP Protocol Documentation](https://modelcontextprotocol.io)

