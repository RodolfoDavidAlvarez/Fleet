#!/bin/bash
# Script to apply repair request options migration to Supabase
# Updates division and vehicle_type field documentation

set -e

echo "🚀 Applying Repair Request Options Migration"
echo "============================================="
echo ""

MIGRATION_FILE="supabase/migrations/20251208000000_update_repair_request_options.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration file: $MIGRATION_FILE"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    echo ""
    echo "📋 Alternative: Apply via SQL Editor"
    echo "====================================="
    echo "1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new"
    echo "2. Copy and paste the SQL below:"
    echo ""
    echo "----------------------------------------"
    cat "$MIGRATION_FILE"
    echo "----------------------------------------"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  Project not linked to Supabase"
    echo ""
    echo "To link your project, run:"
    echo "  supabase link --project-ref kxcixjiafdohbpwijfmd"
    echo ""
    echo "📋 Alternative: Apply via SQL Editor (No Setup Needed)"
    echo "====================================================="
    echo "1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new"
    echo "2. Copy and paste the SQL below:"
    echo ""
    echo "----------------------------------------"
    cat "$MIGRATION_FILE"
    echo "----------------------------------------"
    echo ""
    echo "3. Click 'Run' (or press Cmd/Ctrl + Enter)"
    echo ""
    exit 0
fi

echo "✅ Project is linked"
echo ""

# Try to apply migration via CLI
echo "📋 Applying migration via Supabase CLI..."
echo ""

if supabase db push; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Verification:"
    echo "  The migration adds documentation comments to the division and vehicle_type columns."
    echo "  The new dropdown options are now enforced in the application layer."
else
    echo ""
    echo "⚠️  CLI push failed or requires database password"
    echo ""
    echo "📋 Alternative: Apply via SQL Editor"
    echo "====================================="
    echo "1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new"
    echo "2. Copy and paste the SQL below:"
    echo ""
    echo "----------------------------------------"
    cat "$MIGRATION_FILE"
    echo "----------------------------------------"
    echo ""
    echo "3. Click 'Run' (or press Cmd/Ctrl + Enter)"
fi
