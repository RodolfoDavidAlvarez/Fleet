#!/bin/bash
# Script to apply Supabase migrations for Airtable import
# This applies all necessary schema changes to your Supabase database

set -e

echo "🚀 Supabase Migration Script"
echo "============================"
echo ""
echo "This script will apply the following migrations:"
echo "  1. Base schema (schema.sql)"
echo "  2. Enhanced data migration (migration_enhanced_data_fixed.sql)"
echo "  3. Additional fixes (RLS policies, etc.)"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Project not linked. Please run:"
    echo "   supabase link --project-ref kxcixjiafdohbpwijfmd"
    exit 1
fi

echo "✅ Supabase CLI found"
echo "✅ Project is linked"
echo ""

# Method 1: Using Supabase CLI (requires database password)
echo "📋 Method 1: Apply via Supabase CLI"
echo "-----------------------------------"
echo "You can apply migrations using:"
echo ""
echo "  supabase db push"
echo ""
echo "This requires your database password."
echo ""

# Method 2: Using SQL Editor (recommended)
echo "📋 Method 2: Apply via Supabase SQL Editor (Recommended)"
echo "--------------------------------------------------------"
echo "1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new"
echo "2. Copy and paste the SQL from each migration file in order:"
echo ""
echo "   Step 1: Run supabase/schema.sql"
echo "   Step 2: Run supabase/migration_enhanced_data_fixed.sql"
echo "   Step 3: Run supabase/fix_rls_policies.sql"
echo "   Step 4: Run supabase/add_vehicle_photos.sql (if needed)"
echo "   Step 5: Run supabase/add_repair_request_fields.sql (if needed)"
echo ""

# Method 3: Using API with service role key
echo "📋 Method 3: Apply via API (Automated)"
echo "--------------------------------------"
echo "If you have SUPABASE_SERVICE_ROLE_KEY set, you can use:"
echo ""
echo "  node apply-migrations-via-api.js"
echo ""

echo "✅ Setup complete! Choose a method above to apply migrations."
echo ""
echo "After applying migrations, you can:"
echo "  1. Run Airtable import at /admin/airtable-import"
echo "  2. Verify schema with: supabase db remote diff"





